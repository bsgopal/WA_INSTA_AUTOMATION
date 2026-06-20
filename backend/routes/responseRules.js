// renic-automation-backend/routes/responseRules.js
const express = require('express');
const router = express.Router();
const ResponseRule = require('../models/ResponseRule');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const parsePdfText = require('../utils/parsePdfText');

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        let textContent = '';
        results.forEach((row, index) => {
          const rowFacts = Object.entries(row)
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ');
          textContent += `Item #${index + 1}: ${rowFacts}\n`;
        });
        resolve(textContent);
      })
      .on('error', (err) => reject(err));
  });
};

// PROPER CSV Parser that handles multiline quoted fields
const parseCSVContent = (fileContent) => {
  const rows = [];
  let currentField = '';
  let currentRow = [];
  let insideQuotes = false;
  
  for (let i = 0; i < fileContent.length; i++) {
    const char = fileContent[i];
    const nextChar = fileContent[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Field separator
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      // Row separator
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f)) {  // Only add non-empty rows
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      }
      // Skip \r\n combination
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }
  
  // Add last field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f)) {
      rows.push(currentRow);
    }
  }
  
  return rows;
};

// Detect and parse template CSV format for bulk rule creation
const findHeaderIndex = (headers, aliases) => headers.findIndex(header => aliases.some(alias => header.includes(alias)));

const detectAndParseTemplateCSV = (fileContent) => {
  try {
    console.log('?? CSV Detection Function Called for Rules');

    const rows = parseCSVContent(fileContent);
    console.log(`  Total rows (after proper CSV parsing): ${rows.length}`);
    if (rows.length === 0) {
      console.log('  ? No rows found');
      return null;
    }

    const headerRow = rows[0];
    const headerLower = headerRow.map(h => String(h || '').trim().toLowerCase());
    console.log(`  Parsed headers: [${headerRow.join(', ')}]`);

    const nameIndex = findHeaderIndex(headerLower, ['name', 'question', 'title', 'key']);
    const contentIndex = findHeaderIndex(headerLower, ['content', 'answer', 'response', 'message', 'body']);
    const keywordsIndex = findHeaderIndex(headerLower, ['keywords', 'keyword', 'trigger', 'triggervalue']);
    const categoryIndex = findHeaderIndex(headerLower, ['category']);

    console.log(`  Column indices - name: ${nameIndex}, content: ${contentIndex}, keywords: ${keywordsIndex}, category: ${categoryIndex}`);

    if (nameIndex < 0 && contentIndex < 0 && keywordsIndex < 0) {
      console.log('  ? CSV structure NOT detected');
      return null;
    }

    const templates = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) {
        console.log(`  Row ${i}: ? Skipped (empty row)`);
        continue;
      }

      const name = (row[nameIndex] || row[keywordsIndex] || '').trim();
      const content = (row[contentIndex] || '').trim();
      const keywords = (row[keywordsIndex] || '').trim();
      const category = normalizeCategory(categoryIndex >= 0 ? row[categoryIndex] : 'CUSTOM');

      if (name && content) {
        templates.push({
          name,
          content,
          keywords,
          triggerValue: keywords || name,
          category,
          type: 'TEXT',
          description: '',
          format: 'QA',
          sourceType: 'TEMPLATE_CSV'
        });
        console.log(`  Row ${i}: ? Added - "${name.substring(0, 40)}${name.length > 40 ? '...' : ''}"`);
      } else {
        console.log(`  Row ${i}: ? Skipped (missing name or content)`);
      }
    }

    console.log(`  ?? Total templates parsed: ${templates.length}`);
    return templates.length > 0 ? templates : null;
  } catch (error) {
    console.error('? CSV detection error:', error);
    return null;
  }
};

const parsePDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  return parsePdfText(dataBuffer);
};

const parseTXT = (filePath) => {
  return fs.readFileSync(filePath, 'utf8');
};

const createFallbackRuleFromContent = (content, fileName = 'uploaded file') => {
  const cleanContent = String(content || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const firstLine = cleanContent.split('\n').find(line => line.trim()) || fileName;
  const keywords = firstLine
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 8)
    .join(',');

  return {
    name: firstLine.substring(0, 80) || `Rule from ${fileName}`,
    triggerType: 'KEYWORD',
    triggerValue: keywords || fileName.replace(/\.[^.]+$/, '').toLowerCase(),
    messageBlocks: [
      {
        type: 'TEXT',
        config: {
          text: cleanContent.substring(0, 3500)
        }
      }
    ],
    mode: 'SINGLE_RULE_FROM_FILE',
    generatedBy: 'LOCAL_FALLBACK'
  };
};

const extractExplicitQAFromText = (content) => {
  const qa = [];
  const seen = new Set();
  const normalized = String(content || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return qa;

  const parseLabeledBlock = (block) => {
    const entry = {};
    block.split('\n').map(line => line.trim()).filter(Boolean).forEach(line => {
      const match = line.match(/^(key|keyword|keywords|name|question|q|answer|a|content|response|category)\s*[:=-]\s*(.+)$/i);
      if (!match) return;
      const field = match[1].toLowerCase();
      const value = match[2].trim();
      if (!value) return;

      if (field === 'key' || field === 'keyword' || field === 'keywords') {
        entry.keywords = entry.keywords || value;
      } else if (field === 'name' || field === 'question' || field === 'q') {
        entry.question = entry.question || value;
      } else if (field === 'answer' || field === 'a' || field === 'content' || field === 'response') {
        entry.answer = entry.answer ? `${entry.answer}\n${value}` : value;
      } else if (field === 'category') {
        entry.category = entry.category || value;
      }
    });
    return entry;
  };

  const blocks = normalized.split(/\n{2,}/).map(part => part.trim()).filter(Boolean);
  for (const block of blocks) {
    const entry = parseLabeledBlock(block);
    if (entry.question || entry.answer || entry.keywords || entry.category) {
      const key = `${entry.keywords || ''}__${entry.question || ''}__${entry.answer || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        qa.push(entry);
      }
    }
  }
  if (qa.length) return qa;

  const patterns = [
    /(?:^|\n)\s*Q(?:uestion)?\s*\d*\s*[:.)-]?\s*(.+?)(?:\n\s*A(?:nswer)?\s*\d*\s*[:.)-]?\s*)([\s\S]*?)(?=\n\s*Q(?:uestion)?\s*\d*\s*[:.)-]?\s*|$)/gis,
    /(?:^|\n)\s*Q(?:uestion)?\s*\d*\s*[:.)-]?\s*(.+?)\n([\s\S]*?)(?=\n\s*Q(?:uestion)?\s*\d*\s*[:.)-]?\s*|$)/gis
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(normalized)) !== null) {
      const question = match[1].trim().replace(/\s+/g, ' ');
      const answer = match[2].trim().replace(/^\s*A(?:nswer)?\s*\d*\s*[:.)-]?\s*/i, '');
      const key = `${question}__${answer}`;
      if (question && answer && !seen.has(key)) {
        seen.add(key);
        qa.push({ question, answer, category: 'CUSTOM' });
      }
    }
    if (qa.length) return qa;
  }

  return qa;
};

const templatesFromQA = rows => {
  return rows
    .filter(row => row.question || row.answer || row.keywords)
    .map((row, index) => {
      const name = row.keywords || row.question || row.key || `Imported item ${index + 1}`;
      const content = row.answer || row.content || row.text || '';
      const triggerValue = row.keywords || row.key || row.question || name;

      return {
        name,
        content: content || row.question || '',
        keywords: row.keywords || row.key || '',
        triggerValue,
        category: normalizeCategory(row.category),
        type: 'TEXT',
        description: row.question ? `Q: ${row.question.substring(0, 50)}${row.question.length > 50 ? '...' : ''}` : '',
        format: 'QA'
      };
    });
};

const buildRuleDraftWithAI = async (parsedContent, fileName = 'uploaded file') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return createFallbackRuleFromContent(parsedContent, fileName);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

  const systemPrompt = `You are an expert conversational AI designer. Generate a structured JSON response matching a WhatsApp/Instagram chatbot rule configuration based on the uploaded document facts/policies below.
Here is the document content:
"${parsedContent.substring(0, 4000)}"

Generate a valid JSON object matching the following structure:
{
  "name": "Short descriptive rule name matching the document topic",
  "triggerType": "INTENT" | "KEYWORD" | "EXACT_MATCH",
  "triggerValue": "lowercase intent or keywords related to this document content",
  "messageBlocks": [
    {
      "type": "TEXT",
      "config": { "text": "Warm, polite message content matching the facts in the document. Personalize with {{firstName}} if relevant." }
    },
    {
      "type": "CARD",
      "config": { 
        "title": "Card Bold Title", 
        "description": "Item description details based on document", 
        "imageUrl": "",
        "buttons": [
          { "label": "Check Price", "type": "QUICK_REPLY", "actionValue": "price_check" }
        ]
      }
    }
  ]
}

Return ONLY the raw JSON object. Do not wrap it in markdown backticks, code blocks, or include any explanatory text outside the JSON. Ensure it is valid, parseable JSON.`;

  try {
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().trim();

    const cleanJson = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim();

    const draftedRule = JSON.parse(cleanJson);
    return {
      ...draftedRule,
      mode: 'SINGLE_RULE_FROM_FILE',
      generatedBy: 'GEMINI'
    };
  } catch (error) {
    console.error('AI rule drafting fallback activated:', error.message);
    return createFallbackRuleFromContent(parsedContent, fileName);
  }
};

// ============ GET ALL RULES ============
router.get('/', async (req, res) => {
  try {
    const rules = await ResponseRule.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    console.log(`📋 GET /response-rules: Fetching ${rules.length} rules for user ${req.user.id}`);
    rules.forEach((rule, idx) => {
      console.log(`  Rule ${idx + 1}: "${rule.name}" | Blocks: ${rule.messageBlocks?.length || 0}`);
      if (rule.messageBlocks && rule.messageBlocks.length > 0) {
        console.log(`    ✓ First block type: ${rule.messageBlocks[0].type}`);
      }
    });

    res.json(rules);
  } catch (error) {
    console.error('Get Rules Error:', error);
    res.status(500).json({ error: 'Failed to fetch response rules' });
  }
});

// ============ GET RULE BY ID ============
router.get('/:id', async (req, res) => {
  try {
    const rule = await ResponseRule.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!rule) {
      return res.status(404).json({ error: 'Response rule not found' });
    }
    res.json(rule);
  } catch (error) {
    console.error('Get Rule Error:', error);
    res.status(500).json({ error: 'Failed to fetch response rule' });
  }
});

// ============ CREATE RULE ============
router.post('/', [
  body('name').notEmpty().trim(),
  body('triggerType').isIn(['INTENT', 'KEYWORD', 'EXACT_MATCH']),
  body('triggerValue').notEmpty().trim(),
  body('messageBlocks').isArray(),
  body('actionType').optional().isIn(['SEND_TEXT', 'SEND_TEMPLATE', 'TRIGGER_WORKFLOW', 'HUMAN_HANDOVER']),
  body('templateId').optional().custom((val) => val === '' || val === null || require('mongoose').Types.ObjectId.isValid(val)),
  body('workflowId').optional().custom((val) => val === '' || val === null || require('mongoose').Types.ObjectId.isValid(val))
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Convert empty string IDs to undefined/null so Mongoose doesn't fail parsing ObjectIds
    const bodyData = { ...req.body };
    if (bodyData.templateId === '' || bodyData.templateId === null) delete bodyData.templateId;
    if (bodyData.workflowId === '' || bodyData.workflowId === null) delete bodyData.workflowId;

    const rule = new ResponseRule({
      ...bodyData,
      userId: req.user.id
    });

    await rule.save();
    res.status(201).json(rule);
  } catch (error) {
    console.error('Create Rule Error:', error);
    res.status(500).json({ error: 'Failed to create response rule' });
  }
});

// ============ UPDATE RULE ============
router.put('/:id', [
  body('name').notEmpty().trim(),
  body('triggerType').isIn(['INTENT', 'KEYWORD', 'EXACT_MATCH']),
  body('triggerValue').notEmpty().trim(),
  body('messageBlocks').isArray(),
  body('actionType').optional().isIn(['SEND_TEXT', 'SEND_TEMPLATE', 'TRIGGER_WORKFLOW', 'HUMAN_HANDOVER']),
  body('templateId').optional().custom((val) => val === '' || val === null || require('mongoose').Types.ObjectId.isValid(val)),
  body('workflowId').optional().custom((val) => val === '' || val === null || require('mongoose').Types.ObjectId.isValid(val))
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bodyData = { ...req.body };
    if (bodyData.templateId === '' || bodyData.templateId === null) bodyData.templateId = null;
    if (bodyData.workflowId === '' || bodyData.workflowId === null) bodyData.workflowId = null;

    const rule = await ResponseRule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...bodyData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!rule) {
      return res.status(404).json({ error: 'Response rule not found' });
    }

    res.json(rule);
  } catch (error) {
    console.error('Update Rule Error:', error);
    res.status(500).json({ error: 'Failed to update response rule' });
  }
});

// ============ DELETE RULE ============
router.delete('/:id', async (req, res) => {
  try {
    const rule = await ResponseRule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!rule) {
      return res.status(404).json({ error: 'Response rule not found' });
    }

    res.json({ message: 'Response rule deleted successfully' });
  } catch (error) {
    console.error('Delete Rule Error:', error);
    res.status(500).json({ error: 'Failed to delete response rule' });
  }
});

// ============ AI DRAFT RULE (Gemini assistant) ============
router.post('/ai/draft', [
  body('prompt').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key is not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const systemPrompt = `You are an expert conversational AI designer. Generate a structured JSON response matching a WhatsApp/Instagram chatbot rule configuration.
The user wants to configure this flow: "${prompt}"

Generate a valid JSON object matching the following structure:
{
  "name": "Short descriptive rule name (e.g., Kundan Necklace Price Inquiry)",
  "triggerType": "INTENT" | "KEYWORD" | "EXACT_MATCH",
  "triggerValue": "a lowercase intent category (general_inquiry, purchase_intent, customization, delivery_query, complaint) OR comma-separated keywords (e.g. price,cost,discount) OR exact phrase (e.g. show location)",
  "messageBlocks": [
    {
      "type": "TEXT",
      "config": { "text": "Warm, polite message text with emojis. Can use personalization placeholders like {{firstName}} if needed." }
    },
    {
      "type": "CARD",
      "config": { "title": "Card Bold Title", "description": "Jewelry or item description details", "imageUrl": "" }
    },
    {
      "type": "BUTTONS",
      "config": { 
        "buttons": [ 
          { "label": "Check Catalog", "value": "catalog" },
          { "label": "Talk to Human", "value": "support" }
        ] 
      }
    },
    {
      "type": "RELATED_QUESTIONS",
      "config": { 
        "questions": [ 
          "What is the gold rate today?",
          "How can I customize jewelry?"
        ] 
      }
    }
  ]
}

Return ONLY the raw JSON object. Do not wrap it in markdown backticks, code blocks, or include any explanatory text outside the JSON. Ensure it is valid, parseable JSON. Use jewelry shop contexts where relevant.`;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().trim();
    
    // Clean code block markers if generated
    const cleanJson = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim();

    const draftedRule = JSON.parse(cleanJson);
    res.json(draftedRule);
  } catch (error) {
    console.error('AI Draft Rule Error:', error);
    res.status(500).json({ error: 'Failed to auto-draft rule with AI', details: error.message });
  }
});

// ============ AI DRAFT RULE FROM FILE ============
router.post('/ai/draft-from-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.originalname;
    const fileExt = path.extname(fileName).toLowerCase().replace('.', '');
    const tempPath = req.file.path;

    if (fileExt !== 'csv') {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(400).json({ error: 'Unsupported file type. Please upload a .csv template file only' });
    }

    try {
      const fileContent = fs.readFileSync(tempPath, 'utf8');
      const templates = detectAndParseTemplateCSV(fileContent);

      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

      if (templates && templates.length > 0) {
        console.log(`? DETECTED TEMPLATE CSV with ${templates.length} templates`);
        return res.json({
          success: true,
          count: templates.length,
          templates,
          mode: 'BULK_RULES_FROM_TEMPLATES',
          message: `Successfully parsed ${templates.length} templates. You can now create rules from each template.`
        });
      }

      return res.status(400).json({
        error: 'CSV format must include question/name and answer/content columns with at least one valid row'
      });
    } catch (csvError) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.error('CSV template detection failed:', csvError);
      return res.status(400).json({ error: 'Failed to parse CSV template file' });
    }
  } catch (error) {
    console.error('AI Draft From File Error:', error);
    res.status(500).json({ error: 'Failed to auto-draft rule with AI from file', details: error.message });
  }
});

// ============ BULK CREATE RULES FROM TEMPLATES ============
router.post('/bulk-create-from-templates', async (req, res) => {
  try {
    const { templates } = req.body;

    if (!Array.isArray(templates) || templates.length === 0) {
      return res.status(400).json({ error: 'Templates array required' });
    }

    console.log('='.repeat(60));
    console.log('?? BULK CREATE RULES FROM TEMPLATES - DEBUG LOG');
    console.log('='.repeat(60));
    console.log(`Creating ${templates.length} rules from templates...`);

    const userId = req.user.id;
    const createdRules = [];
    const failedRules = [];

    for (const template of templates) {
      try {
        const triggerValue = (template.triggerValue || template.keywords || template.name || '')
          .toString()
          .trim()
          .toLowerCase();

        const newRule = new ResponseRule({
          name: template.name,
          triggerType: template.triggerType || (triggerValue.includes(',') ? 'KEYWORD' : 'EXACT_MATCH'),
          triggerValue: triggerValue || template.name.toLowerCase(),
          messageBlocks: template.messageBlocks && template.messageBlocks.length > 0
            ? template.messageBlocks
            : [
                {
                  type: 'TEXT',
                  config: { text: template.content }
                }
              ],
          isActive: true,
          userId: userId
        });

        const saved = await newRule.save();
        createdRules.push(saved);
        console.log(`  ? Created rule: "${template.name}"`);
      } catch (err) {
        console.error('Rule creation error:', template.name, err);
        failedRules.push({
          name: template.name,
          error: err.message
        });
      }
    }

    console.log(`? Created ${createdRules.length} rules, ${failedRules.length} failed`);
    console.log('='.repeat(60));

    res.json({
      success: true,
      created: createdRules.length,
      failed: failedRules.length,
      rules: createdRules,
      errors: failedRules.length > 0 ? failedRules : undefined
    });
  } catch (error) {
    console.error('Bulk Create Rules Error:', error);
    res.status(500).json({ error: 'Failed to create rules', details: error.message });
  }
});

module.exports = router;
