// renic-automation-backend/routes/templates.js
const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const GeminiService = require('../services/GeminiService');
const VariableInterpolationService = require('../services/VariableInterpolationService');
const { body, validationResult } = require('express-validator');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const VALID_CATEGORIES = [
  'WELCOME',
  'ORDER_CONFIRMATION',
  'SHIPPING_UPDATE',
  'DELIVERY_NOTIFICATION',
  'PRODUCT_RECOMMENDATION',
  'DISCOUNT_OFFER',
  'BIRTHDAY_WISH',
  'RE_ENGAGEMENT',
  'FEEDBACK_REQUEST',
  'CART_ABANDONMENT',
  'CUSTOM'
];

const VALID_TEMPLATE_TYPES = ['TEXT', 'IMAGE', 'VIDEO', 'QA_BLOCKS', 'INTERACTIVE'];

function isValidTemplateType(type) {
  return VALID_TEMPLATE_TYPES.includes(String(type || '').toUpperCase());
}

function normalizeTemplateType(type) {
  const normalized = String(type || 'TEXT').toUpperCase();
  return isValidTemplateType(normalized) ? normalized : 'TEXT';
}

function normalizeCategory(category) {
  const normalized = String(category || 'CUSTOM').toUpperCase();
  return VALID_CATEGORIES.includes(normalized) ? normalized : 'CUSTOM';
}

function parseCSVContent(fileContent) {
  const rows = [];
  let currentField = '';
  let currentRow = [];
  let insideQuotes = false;

  for (let i = 0; i < fileContent.length; i++) {
    const char = fileContent[i];
    const nextChar = fileContent[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(Boolean)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(Boolean)) rows.push(currentRow);
  }

  return rows;
}

function detectAndParseTemplateCSV(fileContent) {
  const rows = parseCSVContent(fileContent);
  if (rows.length < 2) return null;

  const headers = rows[0].map(header => header.trim().toLowerCase());
  const nameIndex = headers.findIndex(header => header.includes('name') || header.includes('question'));
  const contentIndex = headers.findIndex(header => header.includes('content') || header.includes('answer'));
  const typeIndex = headers.findIndex(header => header.includes('type'));
  const categoryIndex = headers.findIndex(header => header.includes('category'));

  if (nameIndex < 0 || contentIndex < 0) return null;

  const templates = rows.slice(1).map(row => {
    const name = row[nameIndex]?.trim();
    const content = row[contentIndex]?.trim();
    if (!name || !content) return null;

    return {
      name,
      content,
      type: normalizeTemplateType(typeIndex >= 0 ? row[typeIndex] : 'TEXT'),
      category: normalizeCategory(categoryIndex >= 0 ? row[categoryIndex] : 'CUSTOM'),
      description: '',
      format: headers[contentIndex].includes('answer') ? 'QA' : 'TEXT',
      sourceType: 'TEMPLATE_CSV'
    };
  }).filter(Boolean);

  return templates.length ? templates : null;
}

async function extractUploadedFileContent(req) {
  if (req.file) {
    const fileName = req.file.originalname || 'uploaded_file';
    const fileExt = fileName.split('.').pop().toLowerCase();

    if (fileExt !== 'csv') {
      const err = new Error('Unsupported file type. Please upload .csv only');
      err.statusCode = 400;
      throw err;
    }

    return { fileContent: req.file.buffer.toString('utf8'), fileName, fileExt };
  }

  const { csvContent, fileContent, fileName = 'uploaded.csv' } = req.body;
  const finalContent = csvContent || fileContent;
  if (!finalContent) {
    const err = new Error('CSV content required');
    err.statusCode = 400;
    throw err;
  }

  const fileExt = String(fileName).split('.').pop().toLowerCase();
  if (fileExt !== 'csv') {
    const err = new Error('Unsupported file type. Please upload .csv only');
    err.statusCode = 400;
    throw err;
  }

  return { fileContent: finalContent, fileName, fileExt };
}

async function analyzeContent(fileContent, fileName) {
  const startTime = Date.now();
  const csvTemplates = detectAndParseTemplateCSV(fileContent);

  if (!csvTemplates?.length) {
    const err = new Error('CSV format must include name and content columns with at least one valid row');
    err.statusCode = 400;
    throw err;
  }

  return {
    success: true,
    count: csvTemplates.length,
    templates: csvTemplates,
    fileName,
    detectionMethod: 'DIRECT_CSV_PARSE',
    timeMs: Date.now() - startTime
  };
}

// ============ STATIC/SPECIAL TEMPLATE ROUTES ============
router.get('/variables/available', async (req, res) => {
  try {
    const userId = req.userId || req.user._id;
    const availableVariables = await VariableInterpolationService.getAvailableVariables(userId);

    res.json({
      success: true,
      variables: availableVariables,
      totalCategories: Object.keys(availableVariables).length,
      usage: {
        format: '{{variable_name}}',
        example: 'Today 22K gold rate is {{gold_rate_22k}} per gram',
        output: 'Today 22K gold rate is Rs. 7,200 per gram'
      }
    });
  } catch (error) {
    console.error('Get Variables Error:', error);
    res.status(500).json({ error: 'Failed to fetch variables' });
  }
});

router.post('/validate-variables', [
  body('templateContent').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = req.userId || req.user._id;
    const validation = await VariableInterpolationService.validateTemplate(req.body.templateContent, userId);

    res.json({
      ...validation,
      message: validation.isValid ? 'All variables are valid!' : `Found ${validation.unknownVariables.length} unknown variables`
    });
  } catch (error) {
    console.error('Validation Error:', error);
    res.status(500).json({ error: 'Failed to validate template' });
  }
});

router.post('/preview-with-variables', [
  body('templateContent').notEmpty().trim(),
  body('contextData').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = req.userId || req.user._id;
    const { templateContent, contextData } = req.body;
    const preview = await VariableInterpolationService.interpolateVariables(templateContent, userId, contextData || {});

    res.json({
      success: true,
      originalTemplate: templateContent,
      previewWithVariables: preview,
      usedVariables: (templateContent.match(/{{[^}]+}}/g) || []).length,
      dataUsed: contextData || 'Sample data (default)'
    });
  } catch (error) {
    console.error('Preview Error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

router.post('/sample-output', [
  body('templateContent').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = req.userId || req.user._id;
    const sampleOutput = await VariableInterpolationService.getSampleOutput(req.body.templateContent, userId);

    res.json({
      success: true,
      originalTemplate: req.body.templateContent,
      sampleOutput,
      note: 'This is how your template will look with real customer data'
    });
  } catch (error) {
    console.error('Sample Output Error:', error);
    res.status(500).json({ error: 'Failed to generate sample output' });
  }
});

router.post('/ai/analyze-file', upload.single('file'), async (req, res) => {
  try {
    const { fileContent, fileName } = await extractUploadedFileContent(req);
    const result = await analyzeContent(fileContent, fileName);
    res.json(result);
  } catch (error) {
    console.error('File Analysis Error:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to analyze file' });
  }
});

router.post('/ai/generate-from-csv', async (req, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) return res.status(400).json({ error: 'CSV content required' });

    const result = await analyzeContent(csvContent, 'uploaded.csv');
    res.json(result);
  } catch (error) {
    console.error('CSV Processing Error:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to process CSV' });
  }
});

router.post('/bulk-create', async (req, res) => {
  try {
    const { templates } = req.body;
    if (!Array.isArray(templates) || templates.length === 0) {
      return res.status(400).json({ error: 'Templates array required' });
    }

    const userId = req.userId || req.user._id;
    const templateDocs = templates.map(template => ({
      name: template.name,
      content: template.content,
      category: normalizeCategory(template.category),
      type: normalizeTemplateType(template.type),
      supportedChannels: template.supportedChannels || ['whatsapp', 'instagram'],
      userId,
      description: template.description || '',
      format: ['TEXT', 'QA', 'RICH'].includes(template.format) ? template.format : 'TEXT',
      messageBlocks: template.messageBlocks || [],
      isActive: true,
      isPublished: false
    }));

    const createdTemplates = await Template.insertMany(templateDocs, { ordered: false });
    res.json({
      success: true,
      created: createdTemplates.length,
      failed: 0,
      templates: createdTemplates
    });
  } catch (error) {
    console.error('Bulk Create Error:', error);
    res.status(500).json({ error: 'Failed to create templates', details: error.message });
  }
});

router.post('/ai/generate', [
  body('prompt').notEmpty().trim(),
  body('type').optional().isIn(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'INTERACTIVE']),
  body('tone').optional().isIn(['professional', 'friendly', 'casual', 'formal', 'persuasive']),
  body('language').optional().isIn(['en', 'hi', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { prompt, type = 'TEXT', tone = 'friendly', language = 'en' } = req.body;
    const result = await GeminiService.generateMessage('CUSTOM', language, { prompt, tone });
    res.json({
      content: result.success ? result.content : result.content,
      type,
      tone,
      language
    });
  } catch (error) {
    console.error('AI Generate Error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

router.post('/ai/optimize', [
  body('content').notEmpty().trim(),
  body('goal').optional().isIn(['engagement', 'conversion', 'retention', 'awareness'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { content, goal = 'engagement' } = req.body;
    const result = await GeminiService.generateMessage('CUSTOM', 'en', { content, goal });
    res.json({
      original: content,
      optimized: result.success ? result.content : result.content,
      goal
    });
  } catch (error) {
    console.error('AI Optimize Error:', error);
    res.status(500).json({ error: 'Failed to optimize template' });
  }
});

// ============ CRUD ============
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find({ userId: req.userId || req.user._id }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error('Get Templates Error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/', [
  body('name').notEmpty().trim(),
  body('content').notEmpty(),
  body('category').optional().isIn(VALID_CATEGORIES)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const template = new Template({
      name: req.body.name,
      content: req.body.content,
      category: normalizeCategory(req.body.category),
      supportedChannels: req.body.supportedChannels || ['whatsapp', 'instagram'],
      userId: req.userId || req.user._id,
      description: req.body.description || '',
      type: normalizeTemplateType(req.body.type),
      format: req.body.format || 'TEXT',
      messageBlocks: req.body.messageBlocks || []
    });

    await template.save();
    res.status(201).json(template);
  } catch (error) {
    console.error('Create Template Error:', error);
    res.status(500).json({ error: 'Failed to create template', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.userId || req.user._id
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    console.error('Get Template Error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const update = { ...req.body, updatedAt: Date.now() };
    if (update.category) update.category = normalizeCategory(update.category);
    if (update.type) update.type = normalizeTemplateType(update.type);

    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId || req.user._id },
      update,
      { new: true, runValidators: true }
    );

    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    console.error('Update Template Error:', error);
    res.status(500).json({ error: 'Failed to update template', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId || req.user._id
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete Template Error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

router.post('/:id/preview', [
  body('customerData').optional().isObject()
], async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.userId || req.user._id
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });

    const customerData = req.body.customerData || {
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+91 98765 43210',
      city: 'Chennai'
    };

    const preview = await VariableInterpolationService.interpolateVariables(
      template.content,
      req.userId || req.user._id,
      { customer: customerData }
    );

    res.json({
      preview,
      template: template.content,
      placeholders: Object.keys(customerData)
    });
  } catch (error) {
    console.error('Preview Error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

router.post('/:id/interpolate', [
  body('contextData').optional().isObject()
], async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.userId || req.user._id
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });

    const userId = req.userId || req.user._id;
    const contextData = req.body.contextData || {};
    const interpolatedContent = await VariableInterpolationService.interpolateVariables(template.content, userId, contextData);

    res.json({
      success: true,
      templateName: template.name,
      originalContent: template.content,
      interpolatedContent,
      contextDataUsed: contextData
    });
  } catch (error) {
    console.error('Interpolation Error:', error);
    res.status(500).json({ error: 'Failed to interpolate template' });
  }
});

module.exports = router;
