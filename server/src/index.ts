import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend Vite client
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads serving
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DocuSetu IDP Engine',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.GEMINI_API_KEY ? '@google/genai (Gemini 2.5 Pro)' : 'Autonomous Heuristic Trade Extractor'
  });
});

// Mount API v1
app.use('/api/v1', apiRouter);

// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  logger.info(`=======================================================`);
  logger.info(`🚀 DocuSetu IDP Server running on port ${PORT}`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
  logger.info(`📦 API Base URL: http://localhost:${PORT}/api/v1`);
  logger.info(`🤖 AI Engine: @google/genai (gemini-2.5-pro)`);
  logger.info(`=======================================================`);
});
