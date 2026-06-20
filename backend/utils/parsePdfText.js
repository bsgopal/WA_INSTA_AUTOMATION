const pdfParse = require('pdf-parse');

async function parsePdfText(buffer) {
  if (typeof pdfParse === 'function') {
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  }

  if (pdfParse.PDFParse) {
    const parser = new pdfParse.PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy?.();
    return parsed.text || '';
  }

  throw new Error('Unsupported pdf-parse export format');
}

module.exports = parsePdfText;
