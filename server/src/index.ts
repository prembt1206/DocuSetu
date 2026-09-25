import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// Trust proxy for secure headers & accurate rate limiting behind reverse proxies (Vercel/Cloudflare)
app.set('trust proxy', 1);

// ==========================================
// 🛡️ Enterprise Security Hardening (Helmet)
// ==========================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // API endpoints serve JSON; SPA handled on client
    frameguard: { action: 'deny' }, // Anti-Clickjacking
    noSniff: true, // Anti-MIME sniffing
    xssFilter: true, // XSS Auditor
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
);

import { globalLimiter } from './middlewares/rateLimitMiddleware.js';

app.use('/api', globalLimiter);

// ==========================================
// CORS Configuration
// ==========================================
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Payload size limits (Prevents Large Payload DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    securityShield: 'Active (Helmet + RateLimiter + TimingSafeEqual)',
    service: 'DocuSetu IDP Engine',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.GEMINI_API_KEY ? '@google/genai (Gemini 2.5 Pro)' : 'Autonomous Heuristic Trade Extractor'
  });
});

// Mount API v1
app.use('/api/v1', apiRouter);

// Error Handling Middleware
app.use(errorHandler);

// Start Server if not in serverless runtime
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    logger.info(`=======================================================`);
    logger.info(`🛡️ DocuSetu Enterprise IDP Server running on port ${PORT}`);
    logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
    logger.info(`📦 API Base URL: http://localhost:${PORT}/api/v1`);
    logger.info(`🔒 Security: Helmet, RateLimiter, Anti-BruteForce OTP Active`);
    logger.info(`=======================================================`);
  });
}

export default app;
export { app };

