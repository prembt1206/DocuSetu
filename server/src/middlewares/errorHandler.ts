import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error(`Unhandled error on ${req.method} ${req.url}:`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Data Validation Error',
      details: err.errors
    });
    return;
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'File size limit exceeded. Maximum allowable size is 15MB.'
      });
      return;
    }
    res.status(400).json({ error: `File upload error: ${err.message}` });
    return;
  }

  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
};
