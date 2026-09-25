import { Request, Response, NextFunction } from 'express';
import { dbService } from '../services/dbService.js';
import { logger } from '../utils/logger.js';

export const handleGetDashboardInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';
    const insights = await dbService.getInsights(orgId);
    res.status(200).json(insights);
  } catch (err: any) {
    logger.error('handleGetDashboardInsights error:', err);
    next(err);
  }
};
