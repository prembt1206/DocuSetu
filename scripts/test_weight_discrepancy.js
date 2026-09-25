import fs from 'fs';
import path from 'path';

async function testWeightDiscrepancyPipeline() {
  const shipmentId = '4b5d1d8a-4e00-4715-b838-18f136105fb6';
  const filePath = path.resolve('sample_docs', 'Bill_Of_Lading_5500kg.pdf');
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: 'application/pdf' });

  const formData = new FormData();
  formData.append('file', blob, 'Bill_Of_Lading_5500kg.pdf');
  formData.append('shipmentId', shipmentId);

  console.log('1. Uploading BoL (5,500 kg) to existing shipment...');
  const uploadRes = await fetch('http://localhost:5000/api/v1/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer mock-token' },
    body: formData
  });
  const uploadData = await uploadRes.json();
  console.log('Upload status:', uploadRes.status, 'BoL Doc ID:', uploadData.document?.id);

  console.log('2. Processing BoL through AI pipeline...');
  const processRes = await fetch('http://localhost:5000/api/v1/process/' + uploadData.document.id, {
    method: 'POST',
    headers: { Authorization: 'Bearer mock-token' }
  });
  const processData = await processRes.json();
  console.log('BoL Classification:', processData.classification?.documentType);
  console.log('BoL Total Weight:', processData.extractedData?.raw_json?.totalWeightKg, 'KG');

  console.log('\n3. Inspecting Cross-Document Rule Engine anomalies generated:');
  console.log('Anomalies count:', processData.anomalies.length);
  for (const a of processData.anomalies) {
    console.log(`- [${a.severity.toUpperCase()}] (${a.rule_type}): ${a.description}`);
  }

  // Fetch shipment status
  const shpRes = await (await fetch('http://localhost:5000/api/v1/shipments/' + shipmentId, {
    headers: { Authorization: 'Bearer mock-token' }
  })).json();
  console.log('\nShipment final status:', shpRes.shipment.status);
  console.log('Shipment documents count:', shpRes.documents.length);
  console.log('Shipment active critical anomalies:', shpRes.anomalies.filter(a => a.severity === 'critical').length);
}

testWeightDiscrepancyPipeline().catch(console.error);
