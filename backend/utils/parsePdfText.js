// renic-automation-backend/utils/parsePdfText.js

// Polyfill DOMMatrix for serverless runtimes
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}

let pdfParse = null;

async function parsePdfText(buffer) {
  if (!pdfParse) {
    try {
      pdfParse = require('pdf-parse');
    } catch (e) {
      console.warn('⚠️ pdf-parse could not be loaded:', e.message);
      return '';
    }
  }

  if (typeof pdfParse === 'function') {
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  }

  if (pdfParse && pdfParse.PDFParse) {
    const parser = new pdfParse.PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy?.();
    return parsed.text || '';
  }

  return '';
}

module.exports = parsePdfText;
