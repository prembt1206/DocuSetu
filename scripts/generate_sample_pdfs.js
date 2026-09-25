import fs from 'fs';
import path from 'path';

function createSimplePdf(lines) {
  // Construct a minimal valid PDF-1.4 with text stream
  const content = lines
    .map((line, idx) => `BT /F1 11 Tf 50 ${750 - idx * 16} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n');

  const streamLength = Buffer.byteLength(content);

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj`,
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`,
    `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${content}\nendstream\nendobj`
  ];

  let body = '%PDF-1.4\n';
  const xref = [0];

  for (const obj of objects) {
    xref.push(body.length);
    body += obj + '\n';
  }

  const xrefOffset = body.length;
  body += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    body += String(xref[i]).padStart(10, '0') + ' 00000 n \n';
  }

  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body, 'binary');
}

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

const targetDir = path.resolve(process.cwd(), 'sample_docs');
const uploadsDir = path.resolve(process.cwd(), 'server', 'uploads');

if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// 1. Commercial Invoice (5,000 kg)
const invoiceLines = [
  'COMMERCIAL INVOICE',
  'Invoice No: INV-SZ-2026-9901          Date: 2026-09-20',
  'Shipper: Shenzhen MicroTech Electronic Devices Co., Ltd',
  'Consignee: EuroSupply Chain Logistics B.V., Rotterdam, NL',
  'Port of Loading: Port of Shenzhen, CN',
  'Port of Discharge: Port of Rotterdam, NL',
  'Terms of Sale: FOB Shenzhen',
  'Currency: EUR',
  'Gross Weight: 5000.00 KG',
  '',
  'Line Items:',
  'Item 1: High-Density Microcontrollers 64-bit | HS: 85423190 | Qty: 10,000 | 185,000.00 EUR',
  'Item 2: Enterprise NVMe Solid State Drives 2TB | HS: 84717050 | Qty: 995 | 99,500.00 EUR',
  'Total Invoice Amount: 284,500.00 EUR'
];
const invPdf = createSimplePdf(invoiceLines);
fs.writeFileSync(path.join(targetDir, 'Commercial_Invoice_5000kg.pdf'), invPdf);
fs.writeFileSync(path.join(uploadsDir, 'SHP-8841-Commercial-Invoice.pdf'), invPdf);

// 2. Bill of Lading (5,500 kg - Weight Mismatch!)
const bolLines = [
  'OCEAN BILL OF LADING',
  'B/L No: MAEU9921448291          Issued Date: 2026-09-22',
  'Carrier: Maersk Line Global     Vessel: MAERSK MC-KINNEY MOLLER',
  'Shipper: Shenzhen MicroTech Electronic Devices Co., Ltd',
  'Consignee: EuroSupply Chain Logistics B.V.',
  'Notify Party: Rotterdam Gateway Customs Brokers',
  'Port of Loading: Port of Shenzhen, CN',
  'Port of Discharge: Port of Rotterdam, NL',
  'Gross Weight: 5500.00 KG',
  'Measurement: 28.40 CBM',
  'Containers: MSKU7829104, MSKU7829110',
  'Description: 2x40HQ Electronic Microcontrollers & NVMe Storage Modules'
];
const bolPdf = createSimplePdf(bolLines);
fs.writeFileSync(path.join(targetDir, 'Bill_Of_Lading_5500kg.pdf'), bolPdf);
fs.writeFileSync(path.join(uploadsDir, 'SHP-8841-Bill-of-Lading.pdf'), bolPdf);

// 3. Multi-page packet
const multiLines = [
  'SHIPPING PACKET & TRADE DOSSIER',
  'Commercial Invoice & Ocean Bill of Lading Combination',
  'Shipper: Shenzhen MicroTech Electronic Devices Co., Ltd',
  'Consignee: EuroSupply Chain Logistics B.V.',
  'Commercial Invoice Weight: 5000.00 KG',
  'Bill of Lading Gross Weight: 5500.00 KG',
  'HS Codes: 85423190, 84717050',
  'Incoterms: FOB',
  'Port of Loading: Port of Shenzhen, CN',
  'Port of Discharge: Port of Rotterdam, NL'
];
const multiPdf = createSimplePdf(multiLines);
fs.writeFileSync(path.join(targetDir, 'MultiPage_Trade_Dossier.pdf'), multiPdf);

console.log('Sample trade PDFs successfully generated in sample_docs/ and server/uploads/');
