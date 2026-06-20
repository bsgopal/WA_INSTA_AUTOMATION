// renic-automation-backend/routes/knowledgeDocuments.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const parsePdfText = require('../utils/parsePdfText');
const KnowledgeDocument = require('../models/KnowledgeDocument');

// Configure multer to store temporary uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper: Parse CSV rows into plain text facts
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

// Helper: Parse PDF buffer into plain text
const parsePDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  return parsePdfText(dataBuffer);
};

// Helper: Read TXT plain text
const parseTXT = (filePath) => {
  return fs.readFileSync(filePath, 'utf8');
};

// ============ GET ALL DOCUMENTS ============
router.get('/', async (req, res) => {
  try {
    const docs = await KnowledgeDocument.find({ userId: req.user.id })
      .select('-content') // Skip sending large content blocks to list overview
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error('Get Documents Error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge documents' });
  }
});

// ============ UPLOAD & PROCESS DOCUMENT ============
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.originalname;
    const fileExt = path.extname(fileName).toLowerCase().replace('.', '');
    const tempPath = req.file.path;

    if (!['txt', 'pdf', 'csv'].includes(fileExt)) {
      fs.unlinkSync(tempPath); // Clean up temp file
      return res.status(400).json({ error: 'Unsupported file type. Please upload .txt, .pdf, or .csv' });
    }

    console.log(`[KnowledgeBase] Uploaded file: ${fileName}, Extension: ${fileExt}`);

    let parsedContent = '';
    
    try {
      if (fileExt === 'txt') {
        parsedContent = parseTXT(tempPath);
      } else if (fileExt === 'csv') {
        parsedContent = await parseCSV(tempPath);
      } else if (fileExt === 'pdf') {
        parsedContent = await parsePDF(tempPath);
      }
    } catch (parseErr) {
      console.error(`[KnowledgeBase] Failed to parse file ${fileName}:`, parseErr.message);
      fs.unlinkSync(tempPath);
      return res.status(500).json({ error: `Parsing failed: ${parseErr.message}` });
    }

    // Clean up uploaded temp file
    fs.unlinkSync(tempPath);

    if (!parsedContent || !parsedContent.trim()) {
      return res.status(400).json({ error: 'Extracted file content is empty or unreadable.' });
    }

    // Save extracted text to MongoDB
    const doc = new KnowledgeDocument({
      userId: req.user.id,
      fileName,
      fileType: fileExt,
      content: parsedContent.trim(),
      status: 'ACTIVE'
    });

    await doc.save();
    
    // Return document (exclude large content to keep response fast)
    const responseDoc = doc.toObject();
    delete responseDoc.content;

    res.status(201).json(responseDoc);
  } catch (error) {
    console.error('Upload Document Error:', error);
    res.status(500).json({ error: 'Failed to upload and process knowledge document' });
  }
});

// ============ DELETE DOCUMENT ============
router.delete('/:id', async (req, res) => {
  try {
    const doc = await KnowledgeDocument.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!doc) {
      return res.status(404).json({ error: 'Knowledge document not found' });
    }

    res.json({ message: 'Knowledge document deleted successfully' });
  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({ error: 'Failed to delete knowledge document' });
  }
});

module.exports = router;
