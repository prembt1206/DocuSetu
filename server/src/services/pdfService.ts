import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger.js';

export interface ParsedPdfResult {
  numPages: number;
  fullText: string;
  pages: {
    pageNumber: number;
    text: string;
  }[];
}

export class PdfService {
  /**
   * Parse PDF buffer into full text and separate pages.
   */
  static async extractPdfContent(buffer: Buffer): Promise<ParsedPdfResult> {
    try {
      const data = await pdfParse(buffer);
      const fullText = data.text || '';
      const numPages = Math.max(1, data.numpages || 1);

      // PDF text often delimits pages with form feed character \f
      const rawPages = fullText.split('\f');
      const pages: { pageNumber: number; text: string }[] = [];

      if (rawPages.length > 1) {
        rawPages.forEach((pageText, idx) => {
          if (pageText.trim().length > 0 || idx < numPages) {
            pages.push({
              pageNumber: idx + 1,
              text: pageText.trim()
            });
          }
        });
      } else {
        // If no form-feed breaks, split by approximate page chunks or keep as single page
        const lines = fullText.split('\n');
        const linesPerPage = Math.max(20, Math.ceil(lines.length / numPages));
        for (let i = 0; i < numPages; i++) {
          const slice = lines.slice(i * linesPerPage, (i + 1) * linesPerPage).join('\n');
          pages.push({
            pageNumber: i + 1,
            text: slice.trim() || `[Page ${i + 1} Content]`
          });
        }
      }

      logger.info(`Successfully parsed PDF: ${numPages} page(s), ${fullText.length} characters.`);
      return {
        numPages,
        fullText,
        pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: fullText }]
      };
    } catch (err: any) {
      logger.warn(`pdf-parse failed or file is plain text/image buffer: ${err.message}. Treating as raw text.`);
      const text = buffer.toString('utf-8');
      return {
        numPages: 1,
        fullText: text,
        pages: [{ pageNumber: 1, text }]
      };
    }
  }
}
