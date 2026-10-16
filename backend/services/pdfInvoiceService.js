// backend/services/pdfInvoiceService.js
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Generates an official Tax Invoice PDF for a customer and writes it to uploads/invoices
 * @param {Object} invoiceData
 * @returns {Promise<{ filePath: string, fileUrl: string, fileName: string, billNumber: string, grandTotal: number }>}
 */
function generateInvoicePDF(invoiceData = {}) {
  return new Promise((resolve, reject) => {
    try {
      let invoicesDir = path.join(__dirname, '..', 'uploads', 'invoices');
      try {
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }
      } catch (e) {
        invoicesDir = path.join(process.env.TEMP || process.env.TMPDIR || '/tmp', 'uploads', 'invoices');
        try { fs.mkdirSync(invoicesDir, { recursive: true }); } catch (err) {}
      }

      const {
        billNumber = `RN-${Math.floor(100000 + Math.random() * 900000)}`,
        date = new Date(),
        customer = {},
        items = [
          { name: 'Standard Commercial Package / Service', quantity: 1, price: 2500, discount: 0, total: 2500 }
        ],
        subtotal = 2500,
        taxAmount = 450,
        discountAmount = 0,
        grandTotal = 2950,
        paymentMethod = 'UPI / Online',
        shopName = process.env.SHOP_NAME || 'RENIC TECH & AUTOMATION HUB',
        shopAddress = process.env.SHOP_ADDRESS || 'Commercial Complex, Tech Boulevard, Tamil Nadu',
        shopPhone = process.env.SHOP_PHONE || '+91 93455 78103',
        gstin = process.env.SHOP_GSTIN || '33AAAAA0000A1Z5'
      } = invoiceData;

      const fileName = `TaxInvoice_${billNumber}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true
      });

      doc.pipe(writeStream);

      const pageWidth = doc.page.width - 72; // 523.28pt
      const primaryColor = '#0f172a'; // Obsidian Slate
      const accentColor = '#10b981'; // Renic Emerald
      const mutedColor = '#64748b';

      // ── Header Banner ──
      doc.rect(36, 36, pageWidth, 64).fill(primaryColor);

      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text(shopName, 50, 48);

      doc.fontSize(8.5).font('Helvetica').fillColor('#94a3b8')
        .text(`${shopAddress} · Ph: ${shopPhone}`, 50, 70);

      doc.fillColor(accentColor).fontSize(11).font('Helvetica-Bold')
        .text('TAX INVOICE', pageWidth - 80, 52, { align: 'right' });

      doc.fontSize(8).font('Helvetica').fillColor('#cbd5e1')
        .text(`GSTIN: ${gstin}`, pageWidth - 80, 70, { align: 'right' });

      // ── Invoice Meta Bar ──
      doc.rect(36, 110, pageWidth, 52).fill('#f8fafc');
      doc.rect(36, 110, pageWidth, 52).stroke('#e2e8f0');

      doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
        .text('INVOICE NO:', 48, 118)
        .fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold')
        .text(billNumber, 48, 130);

      const formattedDate = new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
        .text('BILL DATE & TIME:', 160, 118)
        .fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold')
        .text(formattedDate, 160, 130);

      doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
        .text('BILLED TO (CUSTOMER):', 310, 118)
        .fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold')
        .text(customer.name || customer.firstName || 'Valued Client', 310, 130)
        .fontSize(8).font('Helvetica').fillColor(mutedColor)
        .text(`Ph: ${customer.phone || customer.whatsappNumber || 'Registered Mobile'}`, 310, 144);

      doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
        .text('PAYMENT MODE:', 445, 118)
        .fillColor('#0284c7').fontSize(9).font('Helvetica-Bold')
        .text(paymentMethod, 445, 130);

      // ── Item Table Header ──
      const tableTop = 175;
      doc.rect(36, tableTop, pageWidth, 24).fill('#f1f5f9');

      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold')
        .text('#', 44, tableTop + 7)
        .text('ITEM DESCRIPTION', 65, tableTop + 7)
        .text('QTY', 280, tableTop + 7, { width: 35, align: 'center' })
        .text('RATE (₹)', 330, tableTop + 7, { width: 60, align: 'right' })
        .text('DISCOUNT (₹)', 400, tableTop + 7, { width: 60, align: 'right' })
        .text('TOTAL (₹)', 470, tableTop + 7, { width: 65, align: 'right' });

      let currentY = tableTop + 24;
      items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#fafafa';
        doc.rect(36, currentY, pageWidth, 22).fill(rowBg);

        const itemQty = item.quantity || 1;
        const itemPrice = item.price || 0;
        const itemDiscount = item.discount || 0;
        const itemTotal = item.total || (itemQty * itemPrice - itemDiscount);

        doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica')
          .text(String(index + 1), 44, currentY + 6)
          .font('Helvetica-Bold').text(item.name || item.productName || 'Item', 65, currentY + 6, { width: 205, ellipsis: true })
          .font('Helvetica')
          .text(String(itemQty), 280, currentY + 6, { width: 35, align: 'center' })
          .text(`₹${Number(itemPrice).toLocaleString('en-IN')}`, 330, currentY + 6, { width: 60, align: 'right' })
          .text(itemDiscount > 0 ? `-₹${Number(itemDiscount).toLocaleString('en-IN')}` : '₹0', 400, currentY + 6, { width: 60, align: 'right' })
          .font('Helvetica-Bold')
          .text(`₹${Number(itemTotal).toLocaleString('en-IN')}`, 470, currentY + 6, { width: 65, align: 'right' });

        currentY += 22;
      });

      // ── Horizontal Rule ──
      doc.moveTo(36, currentY + 4).lineTo(36 + pageWidth, currentY + 4).strokeColor('#e2e8f0').stroke();
      currentY += 12;

      // ── Summary Box ──
      const summaryLeft = 320;
      const summaryWidth = pageWidth - (summaryLeft - 36);

      const addSummaryRow = (label, value, isBold = false, color = primaryColor, isLarge = false) => {
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(isLarge ? 11 : 8.5)
          .fillColor(color)
          .text(label, summaryLeft, currentY)
          .text(value, summaryLeft, currentY, { width: summaryWidth, align: 'right' });
        currentY += isLarge ? 18 : 14;
      };

      addSummaryRow('Subtotal:', `₹${Number(subtotal).toLocaleString('en-IN')}`, false, mutedColor);
      if (discountAmount > 0) {
        addSummaryRow('Discount Savings:', `-₹${Number(discountAmount).toLocaleString('en-IN')}`, false, '#ef4444');
      }
      addSummaryRow('GST / Tax:', `+₹${Number(taxAmount).toLocaleString('en-IN')}`, false, mutedColor);

      // Grand Total Highlight
      currentY += 2;
      doc.rect(summaryLeft - 10, currentY, summaryWidth + 10, 26).fill('#ecfdf5');
      doc.rect(summaryLeft - 10, currentY, summaryWidth + 10, 26).stroke('#a7f3d0');
      currentY += 6;
      addSummaryRow('GRAND TOTAL:', `₹${Number(grandTotal).toLocaleString('en-IN')}`, true, '#065f46', true);

      currentY += 30;

      // ── Footer & Stamp ──
      doc.rect(36, currentY, pageWidth, 42).fill('#f8fafc');
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
        .text('• This is a computer-generated tax invoice verified by Renic WhatsApp Flow Engine.', 48, currentY + 8)
        .text('• Questions or support? Reach out directly to our customer care via this WhatsApp chat.', 48, currentY + 22);

      doc.end();

      writeStream.on('finish', () => {
        const backendBase = process.env.BACKEND_URL || 'http://localhost:5000';
        const fileUrl = `${backendBase}/uploads/invoices/${fileName}`;
        resolve({
          filePath,
          fileUrl,
          fileName,
          billNumber,
          grandTotal
        });
      });

      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateInvoicePDF
};
