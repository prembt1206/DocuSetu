import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { uploadMiddleware } from '../middlewares/uploadMiddleware.js';
import { handleUpload } from '../controllers/uploadController.js';
import { handleProcessDocument, handleLoadSampleDossier } from '../controllers/processController.js';
import { handleValidateShipment, handleResolveAnomaly } from '../controllers/validationController.js';
import {
  handleGetShipments,
  handleGetShipmentById,
  handleCreateShipment,
  handleApproveShipment,
  handleExportCustomsXml,
  handleGetShipmentInsights
} from '../controllers/shipmentController.js';
import { handleGetSettings, handleUpdateSettings } from '../controllers/settingsController.js';
import { handleGetDashboardInsights } from '../controllers/insightsController.js';
import { handleSendOtp, handleVerifyOtp, handleSyncUser } from '../controllers/authController.js';
import { otpSendLimiter, otpVerifyLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

// ==========================================
// Public Auth Endpoints (Exempt from authMiddleware)
// ==========================================
router.post('/auth/otp/send', otpSendLimiter, handleSendOtp);
router.post('/auth/otp/verify', otpVerifyLimiter, handleVerifyOtp);
router.post('/auth/user', handleSyncUser);

// Apply Auth Middleware to all protected API v1 routes
router.use(authMiddleware);


// Omnichannel Ingestion
router.post('/upload', uploadMiddleware.single('file'), handleUpload);
router.post('/documents/sample', handleLoadSampleDossier);

// AI Processing & Classification
router.post('/process/:documentId', handleProcessDocument);

// Cross-Document Validation Engine
router.post('/validate/:shipmentId', handleValidateShipment);
router.post('/anomalies/:anomalyId/resolve', handleResolveAnomaly);

// Shipments
router.get('/shipments', handleGetShipments);
router.post('/shipments', handleCreateShipment);
router.get('/shipments/:id', handleGetShipmentById);
router.post('/shipments/:id/approve', handleApproveShipment);
router.get('/shipments/:id/export-xml', handleExportCustomsXml);
router.get('/shipments/:id/insights', handleGetShipmentInsights);

// Settings & Advisory Thresholds
router.get('/settings', handleGetSettings);
router.put('/settings', handleUpdateSettings);

// Knowledge Discovery Dashboard
router.get('/insights', handleGetDashboardInsights);

export default router;
