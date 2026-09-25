import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure uploads directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage for immediate buffer access for OCR / Gemini processing
const storage = multer.memoryStorage();

// File filter: strict 15MB limit and PDF/ZIP MIME types
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 Megabytes
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream' // Some browsers send zip as octet-stream
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedExt = ext === '.pdf' || ext === '.zip';

    if (allowedMimes.includes(file.mimetype) || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only application/pdf and application/zip are accepted.`));
    }
  }
});
