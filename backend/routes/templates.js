// renic-automation-backend/routes/templates.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');
const GeminiService = require('../services/GeminiService');
const VariableInterpolationService = require('../services/VariableInterpolationService');
const MetaService = require('../services/MetaService');
const { body, validationResult } = require('express-validator');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

let templateUploadsDir = path.join(__dirname, '..', 'uploads', 'templates');
try {
  if (!fs.existsSync(templateUploadsDir)) {
    fs.mkdirSync(templateUploadsDir, { recursive: true });
  }
} catch (e) {
  templateUploadsDir = path.join(process.env.TEMP || process.env.TMPDIR || '/tmp', 'uploads', 'templates');
  try {
    fs.mkdirSync(templateUploadsDir, { recursive: true });
  } catch (err) {}
}

const templateMediaStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, templateUploadsDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path.basename(file.originalname || 'template-media', ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 40);
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const templateMediaUpload = multer({
  storage: templateMediaStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (isImage || isVideo || file.mimetype === 'application/pdf') {
      return cb(null, true);
    }
    cb(new Error('Unsupported file type. Please upload an image, video, or PDF file.'));
  }
});

// ============ UPLOAD TEMPLATE MEDIA ============
router.post('/media/upload', templateMediaUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' });
    }

    const mediaType = req.file.mimetype === 'application/pdf'
      ? 'document'
      : req.file.mimetype.startsWith('video/')
        ? 'video'
        : 'image';

    const uploadedBuffer = fs.readFileSync(req.file.path);
    const base64Data = uploadedBuffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativeUrl = `/uploads/templates/${req.file.filename}`;

    res.json({
      success: true,
      mediaType,
      mediaUrl: `${baseUrl}${relativeUrl}`,
      mediaPreviewData: dataUrl,
      mediaMimeType: req.file.mimetype,
      mediaFileName: req.file.originalname,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Template Media Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload template media' });
  }
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

router.post('/translate', [
  body('text').notEmpty().withMessage('Source text is required').trim(),
  body('targetLanguages').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { text, targetLanguages = ['hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'or', 'as', 'ur'] } = req.body;
    const result = await GeminiService.translateText(text, targetLanguages);
    res.json(result);
  } catch (error) {
    console.error('Template Translate Error:', error);
    res.status(500).json({ error: 'Failed to translate template content' });
  }
});

// ============ CRUD ============
router.get('/', async (req, res) => {
  try {
    const userId = req.userId || req.user._id;
    const templates = await Template.find({ userId }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error('Get Templates Error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/meta', async (req, res) => {
  try {
    const userId = req.userId || req.user._id;
    const templates = await MetaService.listWhatsAppTemplates(userId);
    res.json(templates);
  } catch (error) {
    console.error('Get Meta Templates Error:', error);
    res.status(500).json({ error: 'Failed to fetch Meta templates' });
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
      language: req.body.language || 'en',
      translations: req.body.translations || {},
      category: normalizeCategory(req.body.category),
      supportedChannels: req.body.supportedChannels || ['whatsapp', 'instagram'],
      userId: req.userId || req.user._id,
      description: req.body.description || '',
      type: normalizeTemplateType(req.body.type),
      format: req.body.format || 'TEXT',
      messageBlocks: req.body.messageBlocks || [],
      mediaUrl: req.body.mediaUrl || '',
      mediaType: req.body.mediaType || (normalizeTemplateType(req.body.type) === 'IMAGE' ? 'image' : ''),
      mediaPreviewData: req.body.mediaPreviewData || '',
      mediaMimeType: req.body.mediaMimeType || '',
      mediaFileName: req.body.mediaFileName || ''
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

// ============ GET TEMPLATE USAGE TRACKING ============
router.get('/:id/usage', async (req, res) => {
  try {
    const templateId = req.params.id;
    const userId = req.userId || req.user._id;

    const Template = require('../models/Template');
    const Campaign = require('../models/Campaign');
    const Workflow = require('../models/Workflow');
    const ResponseRule = require('../models/ResponseRule');
    const QuickReply = require('../models/QuickReply');

    const template = await Template.findById(templateId);
    const templateName = template?.name || '';

    // 1. Search in Campaigns
    const campaignOrConditions = [
      { messageTemplate: templateId },
      { 'messageTemplate._id': templateId },
      { templateId: templateId }
    ];
    if (templateName) {
      campaignOrConditions.push({ metaTemplateName: templateName });
    }

    const campaigns = await Campaign.find({
      userId,
      $or: campaignOrConditions
    }).select('name type status targetAudience createdAt').lean();

    // 2. Search in Workflows
    const workflowOrConditions = [
      { 'steps.config.templateId': templateId },
      { 'steps.config.template': templateId },
      { 'nodes.config.templateId': templateId }
    ];
    if (templateName) {
      workflowOrConditions.push(
        { 'steps.config.templateName': templateName },
        { 'nodes.config.templateName': templateName }
      );
    }

    const workflows = await Workflow.find({
      userId,
      $or: workflowOrConditions
    }).select('name status trigger triggerType createdAt').lean();

    // 3. Search in Response Rules
    const ruleOrConditions = [
      { templateId: templateId },
      { responseTemplate: templateId },
      { 'actionPayload.templateId': templateId }
    ];
    if (templateName) {
      ruleOrConditions.push(
        { 'actionPayload.templateName': templateName },
        { templateName: templateName }
      );
    }

    const responseRules = await ResponseRule.find({
      userId,
      $or: ruleOrConditions
    }).select('name trigger keywords matchType isActive').lean();

    // 4. Search in Quick Replies
    const quickReplies = await QuickReply.find({
      userId,
      $or: [
        { templateId: templateId },
        ...(templateName ? [{ templateName: templateName }] : [])
      ]
    }).select('text shortcut category').lean();

    const totalUsages = campaigns.length + workflows.length + responseRules.length + quickReplies.length;

    res.json({
      success: true,
      templateId,
      templateName,
      inUse: totalUsages > 0,
      totalUsages,
      usages: {
        campaigns,
        workflows,
        responseRules,
        quickReplies
      }
    });
  } catch (error) {
    console.error('Get Template Usage Error:', error);
    res.status(500).json({ error: 'Failed to check template usage', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const templateId = req.params.id;
    const userId = req.userId || req.user._id;
    const cascade = req.query.cascade === 'true' || req.body.cascade === true;

    const template = await Template.findOneAndDelete({
      _id: templateId,
      userId
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });

    let cleanedStats = { campaigns: 0, workflows: 0, responseRules: 0, quickReplies: 0 };

    // Cascade remove or nullify references across associated resources
    try {
      const Campaign = require('../models/Campaign');
      const Workflow = require('../models/Workflow');
      const ResponseRule = require('../models/ResponseRule');
      const QuickReply = require('../models/QuickReply');

      const campRes = await Campaign.updateMany(
        { userId, $or: [{ messageTemplate: templateId }, { templateId: templateId }] },
        { $unset: { messageTemplate: 1, templateId: 1 } }
      );
      cleanedStats.campaigns = campRes.modifiedCount || 0;

      const wfRes = await Workflow.updateMany(
        { userId, 'steps.config.templateId': templateId },
        { $unset: { 'steps.$[elem].config.templateId': 1 } },
        { arrayFilters: [{ 'elem.config.templateId': templateId }] }
      );
      cleanedStats.workflows = wfRes.modifiedCount || 0;

      const ruleRes = await ResponseRule.updateMany(
        { userId, $or: [{ templateId: templateId }, { responseTemplate: templateId }] },
        { $unset: { templateId: 1, responseTemplate: 1 } }
      );
      cleanedStats.responseRules = ruleRes.modifiedCount || 0;

      const qrRes = await QuickReply.updateMany(
        { userId, templateId: templateId },
        { $unset: { templateId: 1 } }
      );
      cleanedStats.quickReplies = qrRes.modifiedCount || 0;
    } catch (cleanErr) {
      console.warn('Cascade template references cleanup note:', cleanErr.message);
    }

    res.json({
      success: true,
      message: 'Template deleted and cleaned up from references successfully',
      cleanedStats
    });
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

// ============ TEMPLATE DELIVERY LOGS & RESEND ============

// GET /api/templates/:id/logs - Get all messages sent using this template
router.get('/:id/logs', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;
    const templateId = req.params.id;

    let template = await Template.findOne({ _id: templateId, userId });
    if (!template) {
      template = await Template.findById(templateId);
    }

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    require('../models/Customer');
    const Campaign = require('../models/Campaign');
    const Message = require('../models/Message');

    // Find all campaigns that use this template
    const campaigns = await Campaign.find({
      $or: [
        { messageTemplate: templateId },
        { messageTemplate: String(templateId) },
        { 'messageTemplate._id': templateId },
        { templateId: templateId },
        { 'messageTemplate.name': template.name },
        { messageContent: template.content },
        { 'messageTemplate.content': template.content },
        { name: template.name }
      ]
    }).select('_id name');

    const campaignIds = campaigns.map(c => c._id);

    // Find messages sent via these campaigns OR directly referencing this template
    const query = {
      $or: [
        { campaignId: { $in: campaignIds } },
        { templateId: templateId },
        { templateId: String(templateId) },
        { 'template._id': templateId },
        { originalContent: template.content },
        ...(template.mediaUrl ? [{ mediaUrl: template.mediaUrl }] : [])
      ]
    };

    const messages = await Message.find(query)
      .populate('customerId', 'firstName lastName phone whatsappNumber email rfmSegment')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .limit(200);

    const totalSent = messages.filter(m => m.status === 'SENT' || m.status === 'DELIVERED' || m.status === 'READ').length;
    const totalFailed = messages.filter(m => m.status === 'FAILED').length;
    const totalDelivered = messages.filter(m => m.status === 'DELIVERED' || m.status === 'READ').length;

    res.json({
      success: true,
      template: {
        _id: template._id,
        name: template.name,
        category: template.category,
        type: template.type,
        content: template.content,
        mediaUrl: template.mediaUrl,
        mediaType: template.mediaType
      },
      stats: {
        total: messages.length,
        sent: totalSent,
        delivered: totalDelivered,
        failed: totalFailed
      },
      logs: messages.map(m => {
        const cust = m.customerId || {};
        const destPhone = cust.whatsappNumber || cust.phone || m.businessPhoneNumber || '—';
        const custName = `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || destPhone;
        return {
          _id: m._id,
          messageId: m._id,
          customerId: cust._id || null,
          customerName: custName,
          phoneNumber: destPhone,
          rfmSegment: cust.rfmSegment || 'GENERAL',
          campaignName: m.campaignId?.name || 'Direct / Broadcast',
          content: m.content || m.originalContent || template.content,
          status: m.status,
          failureReason: m.failureReason || null,
          mediaUrl: m.mediaUrl || null,
          mediaType: m.mediaType || null,
          sentAt: m.sentAt || m.createdAt,
          createdAt: m.createdAt
        };
      })
    });
  } catch (error) {
    console.error('Fetch Template Logs Error:', error);
    res.status(500).json({ error: 'Failed to fetch template delivery logs' });
  }
});

// POST /api/templates/:id/resend-customer/:customerId - Resend template to a single customer
router.post('/:id/resend-customer/:customerId', async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.user?._id;
    const { id: templateId, customerId } = req.params;

    const template = await Template.findOne({ _id: templateId, userId });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const Customer = require('../models/Customer');
    const customer = await Customer.findOne({ _id: customerId, userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const destinationNumber = customer.whatsappNumber || customer.phone;
    if (!destinationNumber) {
      return res.status(400).json({ error: 'Customer does not have a valid phone number' });
    }

    const finalContent = await VariableInterpolationService.interpolateVariables(
      template.content,
      userId,
      { customer }
    );

    const ShopConfig = require('../models/ShopConfig');
    const shop = await ShopConfig.findOne({ userId }) || await ShopConfig.findOne({});
    const senderMode = (shop?.whatsappSenderMode || (shop?.metaApiEnabled ? 'META' : 'DOCKER')).toUpperCase();
    const isDockerMode = senderMode === 'DOCKER';

    const sendOptions = {
      userId,
      forceMeta: !isDockerMode,
      forceWaha: isDockerMode,
      mediaUrl: template.mediaUrl || null,
      mediaType: template.mediaType || null,
      mediaPreviewData: template.mediaPreviewData || null,
      mediaFileName: template.mediaFileName || 'template-media'
    };

    const WhatsAppService = require('../services/WhatsAppService');
    const result = await WhatsAppService.sendMessage(destinationNumber, finalContent, sendOptions);

    const Message = require('../models/Message');
    const displayNum = shop?.metaDisplayPhoneNumber || shop?.contactPhone || '';

    const newMsg = new Message({
      userId,
      customerId: customer._id,
      content: finalContent,
      originalContent: template.content,
      channel: 'whatsapp',
      status: result?.status || (result?.success ? 'SENT' : 'FAILED'),
      sentAt: result?.success ? new Date() : null,
      failureReason: result?.failureReason || result?.error || null,
      externalMessageId: result?.externalMessageId || null,
      businessPhoneNumber: displayNum,
      messageType: 'MANUAL',
      mediaUrl: template.mediaUrl || null,
      mediaType: template.mediaType || null
    });
    await newMsg.save();

    if (result && result.success) {
      customer.lastMessageSentDate = new Date();
      customer.messagesSentCount = (customer.messagesSentCount || 0) + 1;
      await customer.save();

      // Log conversation thread
      try {
        const aiChatHandler = require('../services/aiChatHandler');
        await aiChatHandler.logOutboundMessage(
          userId,
          customer._id,
          finalContent,
          'whatsapp',
          result.externalMessageId,
          template.mediaUrl,
          { businessPhoneNumber: displayNum }
        );
      } catch (logErr) {
        console.warn('Failed to log conversation for resend:', logErr.message);
      }
    }

    res.json({
      success: result?.success || false,
      message: result?.success ? 'Message resent successfully!' : `Resend failed: ${result?.error || result?.failureReason}`,
      status: result?.success ? 'SENT' : 'FAILED',
      error: result?.error || result?.failureReason || null
    });
  } catch (error) {
    console.error('Template Resend Customer Error:', error);
    res.status(500).json({ error: error.message || 'Failed to resend message' });
  }
});

module.exports = router;
