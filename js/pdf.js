/* ═══════════════════════════════════════════════════════════════
   NOON GC INC. — Professional PDF Generator
   Uses jsPDF + jsPDF-AutoTable
   Generates bilingual FR/EN quotes and invoices with QC taxes
═══════════════════════════════════════════════════════════════ */

function generatePDF(type) {
  const { jsPDF } = window.jspdf;
  const isQuote = type === 'quote';
  const prefix  = isQuote ? 'q' : 'i';

  /* ── Collect form data ── */
  const clientName    = document.getElementById(`${prefix}-name`)?.value.trim()     || '';
  const clientPhone   = document.getElementById(`${prefix}-phone`)?.value.trim()    || '';
  const clientAddr    = document.getElementById(`${prefix}-addr`)?.value.trim()     || '';
  const docDate       = document.getElementById(`${prefix}-date`)?.value            || '';
  const docNum        = document.getElementById(`${prefix}-num`)?.value.trim()      || '';
  const contractNum   = !isQuote ? (document.getElementById('i-contract')?.value.trim() || '') : '';
  const notes         = document.getElementById(`${prefix}-notes`)?.value.trim()    || '';
  const items         = getItems(prefix);

  /* ── Calculations ── */
  const subtotal = items.reduce((s, it) => s + it.total, 0);
  const gst      = subtotal * 0.05;
  const qst      = subtotal * 0.09975;
  const total    = subtotal + gst + qst;

  /* ── Labels by language ── */
  const isFr    = lang === 'fr';
  const docType = isQuote
    ? (isFr ? 'DEVIS / ESTIMATE' : 'ESTIMATE / DEVIS')
    : (isFr ? 'FACTURE / INVOICE' : 'INVOICE / FACTURE');
  const labels = {
    docNumLabel:  isQuote ? (isFr ? 'N° Devis' : 'Estimate #') : (isFr ? 'N° Facture' : 'Invoice #'),
    dateLabel:    isFr ? 'Date' : 'Date',
    clientLabel:  isFr ? 'Client' : 'Client',
    addrLabel:    isFr ? 'Adresse des travaux' : 'Work address',
    phoneLabel:   isFr ? 'Téléphone' : 'Phone',
    contLabel:    isFr ? 'N° Contrat' : 'Contract #',
    descLabel:    isFr ? 'DESCRIPTION' : 'DESCRIPTION',
    qtyLabel:     isFr ? 'QTÉ' : 'QTY',
    unitLabel:    isFr ? 'PRIX UNIT.' : 'UNIT PRICE',
    totalLabel:   isFr ? 'TOTAL' : 'TOTAL',
    subtotalLabel:isFr ? 'Sous-total' : 'Subtotal',
    gstLabel:     isFr ? 'TPS / GST (5%)' : 'GST / TPS (5%)',
    qstLabel:     isFr ? 'TVQ / QST (9.975%)' : 'QST / TVQ (9.975%)',
    grandTotal:   isFr ? 'TOTAL' : 'TOTAL',
    notesLabel:   isFr ? 'Notes / Remarques' : 'Notes / Remarks',
    thanksLabel:  isFr ? 'MERCI POUR VOTRE CONFIANCE !' : 'THANK YOU FOR YOUR BUSINESS!',
    paymentNote:  isFr
      ? 'Paiement Interac au Tel: 514 651-5159 ou Email: mahmudsanad@icloud.com'
      : 'Interac payment to Tel: 514 651-5159 or Email: mahmudsanad@icloud.com',
    jobType:      isFr ? 'TRAVAUX ÉLECTRIQUES' : 'ELECTRIC WORKS',
  };

  /* ── Format date ── */
  let displayDate = docDate;
  if (docDate) {
    const d = new Date(docDate + 'T00:00:00');
    displayDate = d.toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* ══════════ Create PDF ══════════ */
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();  // 215.9
  const H = doc.internal.pageSize.getHeight(); // 279.4
  const navy  = [13,  27,  42];
  const gold  = [244,196,  48];
  const white = [255,255,255];
  const light = [244,246,249];
  const gray  = [108,117,125];

  let y = 0;

  /* ── Header background ── */
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 52, 'F');

  /* ── Gold accent bar ── */
  doc.setFillColor(...gold);
  doc.rect(0, 52, W, 4, 'F');

  /* ── Company name ── */
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('NOON GC INC.', 14, 18);

  /* ── Bolt emoji workaround: yellow rectangle as accent ── */
  doc.setFillColor(...gold);
  doc.roundedRect(14, 22, 3, 3, 0.5, 0.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.text('Corporation des Maîtres Électriciens du Québec — CMEQ', 20, 26);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(7.5);
  doc.text('Sanad Muhmud', 14, 32);
  doc.text('4390 Kingston, Pierrefonds, QC  H9A 2S9', 14, 37);
  doc.text('Tel: 514 651-5159  |  514 998-7787', 14, 42);
  doc.text('mahmudsanad@icloud.com', 14, 47);

  /* ── RBQ / Tax box ── */
  doc.setFillColor(255,255,255,30);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.roundedRect(130, 8, 72, 40, 2, 2, 'S');

  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RBQ : 5686-2097', 134, 16);
  doc.text('TPS/GST : 720 366 731 RT 0001', 134, 22);
  doc.text('TVQ/QST : 228 829 681 TQ 0001', 134, 28);

  doc.setTextColor(160, 160, 160);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Protège le public · Protects the public', 134, 38);
  doc.text('www.rbq.gouv.qc.ca', 134, 43);

  y = 62;

  /* ── Document type title ── */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...navy);
  doc.text(docType, 14, y);

  /* ── Doc info box (right) ── */
  const infoX = 130;
  doc.setFillColor(...light);
  doc.roundedRect(infoX, y - 8, 72, isQuote ? 30 : 38, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(...gray);

  let infoY = y - 2;
  const addInfoRow = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text(label + ':', infoX + 3, infoY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(value || '—', infoX + 36, infoY);
    infoY += 7;
  };
  addInfoRow(labels.docNumLabel, docNum);
  addInfoRow(labels.dateLabel,   displayDate);
  if (!isQuote) addInfoRow(labels.contLabel, contractNum);

  /* ── Job type tag ── */
  doc.setFillColor(...gold);
  doc.roundedRect(14, y + 5, 60, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...navy);
  doc.text(labels.jobType, 16, y + 10);

  y += 22;

  /* ── Divider ── */
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(14, y, W - 14, y);
  y += 7;

  /* ── Client info section ── */
  doc.setFillColor(...light);
  doc.roundedRect(14, y, 90, clientAddr ? 28 : 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...gold);
  doc.text(labels.clientLabel.toUpperCase(), 18, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...navy);
  doc.text(clientName || '—', 18, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  if (clientPhone) doc.text(labels.phoneLabel + ': ' + clientPhone, 18, y + 19);
  if (clientAddr)  doc.text(clientAddr, 18, y + 25, { maxWidth: 82 });

  y += (clientAddr ? 34 : 28);

  /* ══ Items Table ══ */
  const tableBody = items.map(it => [
    it.num,
    it.desc,
    it.qty.toString(),
    `$${it.price.toFixed(2)}`,
    `$${it.total.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: y,
    head: [[
      { content: '#',                styles: { halign: 'center' } },
      { content: labels.descLabel,   styles: { halign: 'left' } },
      { content: labels.qtyLabel,    styles: { halign: 'center' } },
      { content: labels.unitLabel,   styles: { halign: 'right' } },
      { content: labels.totalLabel,  styles: { halign: 'right' } },
    ]],
    body: tableBody.length > 0 ? tableBody : [['', isFr ? 'Aucun article' : 'No items', '', '', '$0.00']],
    theme: 'plain',
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
    },
    headStyles: {
      fillColor: navy,
      textColor: gold,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      textColor: [30, 30, 40],
    },
    alternateRowStyles: { fillColor: light },
    didDrawPage: () => {},
  });

  y = doc.lastAutoTable.finalY + 6;

  /* ══ Totals box ══ */
  const totW = 90;
  const totX = W - 14 - totW;

  const drawTotRow = (label, value, isBold, bgColor) => {
    if (bgColor) {
      doc.setFillColor(...bgColor);
      doc.rect(totX, y, totW, 9, 'F');
    }
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9 : 8.5);
    doc.setTextColor(...(isBold ? white : gray));
    if (isBold && bgColor) doc.setTextColor(...white);
    doc.text(label, totX + 4, y + 6.3);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...(isBold ? white : navy));
    doc.text(value, totX + totW - 4, y + 6.3, { align: 'right' });
    y += 9;
  };

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);

  drawTotRow(labels.subtotalLabel, `$${subtotal.toFixed(2)}`, false, null);
  doc.line(totX, y, totX + totW, y);
  drawTotRow(labels.gstLabel,      `$${gst.toFixed(2)}`,      false, null);
  drawTotRow(labels.qstLabel,      `$${qst.toFixed(2)}`,      false, null);
  doc.line(totX, y, totX + totW, y);
  y += 1;
  drawTotRow(labels.grandTotal,    `$${total.toFixed(2)}`,    true,  navy);

  y += 8;

  /* ── Payment note ── */
  doc.setFillColor(...light);
  doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F');
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.line(14, y, 14, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...navy);
  doc.text(isFr ? 'Paiement / Payment:' : 'Payment:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(labels.paymentNote, 18, y + 11);

  y += 20;

  /* ── Notes ── */
  if (notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...navy);
    doc.text(labels.notesLabel + ':', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    const noteLines = doc.splitTextToSize(notes, W - 28);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 5;
  }

  /* ── Footer bar ── */
  const footY = H - 20;
  doc.setFillColor(...navy);
  doc.rect(0, footY, W, 20, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, footY, W, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gold);
  doc.text(labels.thanksLabel, W / 2, footY + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 180, 180);
  doc.text('NOON GC INC.  ·  514 651-5159  ·  mahmudsanad@icloud.com  ·  RBQ : 5686-2097', W / 2, footY + 15, { align: 'center' });

  /* ── Save ── */
  const filename = isQuote
    ? `Devis_${docNum || 'NOON'}_${clientName.replace(/\s+/g,'_') || 'Client'}.pdf`
    : `Facture_${docNum || 'NOON'}_${clientName.replace(/\s+/g,'_') || 'Client'}.pdf`;

  doc.save(filename);
}
