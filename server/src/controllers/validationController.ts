import { Request, Response, NextFunction } from 'express';
import { RuleEngineService } from '../services/ruleEngineService.js';
import { dbService } from '../services/dbService.js';
import { logger } from '../utils/logger.js';

export const handleValidateShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shipmentId = String(req.params.shipmentId);
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';

    const shipment = await dbService.getShipmentById(shipmentId, orgId);
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found or unauthorized' });
      return;
    }

    const anomalies = await RuleEngineService.validateShipment(shipmentId, orgId);
    const updatedShipment = await dbService.getShipmentById(shipmentId, orgId);

    res.status(200).json({
      message: 'Cross-document validation completed successfully',
      shipment: updatedShipment,
      anomaliesCount: anomalies.length,
      anomalies
    });
  } catch (err: any) {
    logger.error('handleValidateShipment error:', err);
    next(err);
  }
};

export const handleResolveAnomaly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const anomalyId = String(req.params.anomalyId);
    await dbService.resolveAnomaly(anomalyId);
    res.status(200).json({ message: 'Anomaly marked as resolved' });
  } catch (err: any) {
    logger.error('handleResolveAnomaly error:', err);
    next(err);
  }
};
