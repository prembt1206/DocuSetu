import { Request, Response, NextFunction } from 'express';
import { dbService } from '../services/dbService.js';
import { AdvisorySettingsSchema } from '../../../shared/validations.js';
import { logger } from '../utils/logger.js';

export const handleGetSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';
    const settings = await dbService.getSettings(orgId);
    res.status(200).json({ settings });
  } catch (err: any) {
    logger.error('handleGetSettings error:', err);
    next(err);
  }
};

export const handleUpdateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';
    const parsed = AdvisorySettingsSchema.parse(req.body);

    const updated = await dbService.updateSettings(orgId, parsed);
    res.status(200).json({
      message: 'Advisory settings and validation tolerances updated successfully',
      settings: updated
    });
  } catch (err: any) {
    logger.error('handleUpdateSettings error:', err);
    next(err);
  }
};
