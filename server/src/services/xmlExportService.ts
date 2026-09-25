import { DbShipment, DbDocument, DbExtractedData } from './dbService.js';

export class XmlExportService {
  /**
   * Generate standard World Customs Organization (WCO Data Model v3) compliant XML.
   */
  static generateCustomsXml(
    shipment: DbShipment,
    docDataList: { document: DbDocument; data: DbExtractedData | null }[]
  ): string {
    let invoiceData: any = null;
    let bolData: any = null;
    let packingData: any = null;

    for (const item of docDataList) {
      if (!item.data || !item.data.raw_json) continue;
      if (item.document.document_type === 'commercial_invoice') invoiceData = item.data.raw_json;
      if (item.document.document_type === 'bill_of_lading') bolData = item.data.raw_json;
      if (item.document.document_type === 'packing_list') packingData = item.data.raw_json;
    }

    const exporterName = invoiceData?.shipperName || bolData?.shipperName || 'GLOBAL EXPORTER CORP';
    const importerName = invoiceData?.consigneeName || bolData?.consigneeName || 'LICENSED IMPORTER LLC';
    const bolNumber = bolData?.bolNumber || shipment.reference_number;
    const invoiceNumber = invoiceData?.invoiceNumber || `INV-${shipment.reference_number}`;
    const portOfLoading = shipment.port_of_loading || bolData?.portOfLoading || 'CN SZX';
    const portOfDischarge = shipment.port_of_discharge || bolData?.portOfDischarge || 'NL RTM';
    const totalWeight = invoiceData?.totalWeightKg || bolData?.totalWeightKg || packingData?.totalGrossWeightKg || 5000.0;
    const currency = invoiceData?.currency || 'USD';
    const invoiceAmount = invoiceData?.totalInvoiceAmount || 250000.0;
    const incoterm = invoiceData?.incoterms || 'FOB';
    const hsCodes: string[] = invoiceData?.hsCodes || ['85423190'];

    const itemsXml = hsCodes
      .map(
        (code, idx) => `
    <GovernmentAgencyGoodsItem>
      <SequenceNumeric>${idx + 1}</SequenceNumeric>
      <Commodity>
        <TariffClassificationCode>${code}</TariffClassificationCode>
        <Description>${invoiceData?.lineItems?.[idx]?.description || 'Commercial Freight Merchandises'}</Description>
        <DutyTaxFee>
          <TypeCode>DUTY</TypeCode>
          <DeductionAmount currencyID="${currency}">0.00</DeductionAmount>
        </DutyTaxFee>
      </Commodity>
      <GoodsMeasure>
        <GrossMassMeasure unitCode="KGM">${(totalWeight / hsCodes.length).toFixed(2)}</GrossMassMeasure>
        <NetNetWeightMeasure unitCode="KGM">${((totalWeight * 0.95) / hsCodes.length).toFixed(2)}</NetNetWeightMeasure>
      </GoodsMeasure>
      <InvoiceLine>
        <ItemChargeAmount currencyID="${currency}">${((invoiceAmount / hsCodes.length)).toFixed(2)}</ItemChargeAmount>
      </InvoiceLine>
    </GovernmentAgencyGoodsItem>`
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- DocuSetu Automated Customs Declaration Output -->
<!-- Standard: WCO Data Model 3.0 / WCO Customs Declaration (GOVCBR) -->
<Declaration xmlns="urn:wco:datamodel:WCO:Declaration:1"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="urn:wco:datamodel:WCO:Declaration:1 WCO_DS_3.xsd">
  <DeclarationOfficeID>${portOfDischarge.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}</DeclarationOfficeID>
  <FunctionCode>9</FunctionCode> <!-- Original Customs Filing -->
  <ID>DOCUSETU-DEC-${shipment.reference_number}</ID>
  <IssueDateTime>${new Date().toISOString()}</IssueDateTime>
  <TypeCode>IM4</TypeCode> <!-- Standard Import for Home Use -->

  <Agent>
    <Name>Apex Global Freight &amp; Customs Brokerage</Name>
    <RoleCode>CB</RoleCode> <!-- Customs Broker -->
  </Agent>

  <Exporter>
    <Name>${XmlExportService.escapeXml(exporterName)}</Name>
    <Address>
      <CountryCode>${portOfLoading.includes('CN') ? 'CN' : portOfLoading.includes('JP') ? 'JP' : 'IN'}</CountryCode>
    </Address>
  </Exporter>

  <Importer>
    <Name>${XmlExportService.escapeXml(importerName)}</Name>
    <Address>
      <CountryCode>${portOfDischarge.includes('NL') ? 'NL' : portOfDischarge.includes('US') ? 'US' : 'BE'}</CountryCode>
    </Address>
  </Importer>

  <TradeTerms>
    <ConditionCode>${incoterm}</ConditionCode>
  </TradeTerms>

  <BorderTransportMeans>
    <ID>${bolData?.vesselName || 'OCEAN VESSEL CARRIER'}</ID>
    <IdentificationTypeCode>11</IdentificationTypeCode>
    <RegistrationNationalityCode>NL</RegistrationNationalityCode>
  </BorderTransportMeans>

  <Consignment>
    <TransportContractDocument>
      <ID>${XmlExportService.escapeXml(bolNumber)}</ID>
      <TypeCode>705</TypeCode> <!-- Bill of Lading -->
    </TransportContractDocument>
    <LoadingLocation>
      <Name>${XmlExportService.escapeXml(portOfLoading)}</Name>
    </LoadingLocation>
    <UnloadingLocation>
      <Name>${XmlExportService.escapeXml(portOfDischarge)}</Name>
    </UnloadingLocation>
    <TotalGrossMassMeasure unitCode="KGM">${totalWeight.toFixed(2)}</TotalGrossMassMeasure>
    <Invoice>
      <ID>${XmlExportService.escapeXml(invoiceNumber)}</ID>
      <IssueDateTime>${invoiceData?.invoiceDate || new Date().toISOString().split('T')[0]}</IssueDateTime>
      <LineNumeric>${hsCodes.length}</LineNumeric>
    </Invoice>
    ${itemsXml}
  </Consignment>
</Declaration>`;
  }

  private static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
