import { Request, Response, NextFunction } from 'express';
import { dbService } from '../services/dbService.js';
import { PdfService } from '../services/pdfService.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

// Store text caches in-memory for extraction
export const documentTextCache: Map<string, { fullText: string; pages: { pageNumber: number; text: string }[] }> = new Map();

export const handleUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded. Please upload a PDF or ZIP file.' });
      return;
    }

    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';
    let shipmentId = req.body.shipmentId;

    // If no shipmentId provided, generate or link a new shipment
    if (!shipmentId) {
      const generatedRef = 'SHP-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const newShipment = await dbService.createShipment({
        organization_id: orgId,
        reference_number: generatedRef,
        port_of_loading: 'Port of Shenzhen, CN',
        port_of_discharge: 'Port of Rotterdam, NL'
      });
      shipmentId = newShipment.id;
    }

    // Save physical file locally as well for persistent URL access
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    const safeFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);
    fs.writeFileSync(filePath, file.buffer);

    const fileUrl = `/uploads/${safeFilename}`;

    // OCR / Text Pre-processing
    logger.info(`Pre-processing OCR & text parsing for ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)...`);
    const parsedPdf = await PdfService.extractPdfContent(file.buffer);

    // Create document record in database
    const document = await dbService.createDocument({
      shipment_id: shipmentId,
      file_url: fileUrl,
      original_filename: file.originalname,
      document_type: 'unknown',
      page_start: 1,
      page_end: parsedPdf.numPages,
      status: 'uploaded'
    });

    // Cache parsed text for the processing pipeline
    documentTextCache.set(document.id, {
      fullText: parsedPdf.fullText,
      pages: parsedPdf.pages
    });

    res.status(201).json({
      message: 'File ingested successfully with background OCR pre-processing',
      document,
      shipmentId,
      pageCount: parsedPdf.numPages
    });
  } catch (err: any) {
    logger.error('handleUpload error:', err);
    next(err);
  }
};
