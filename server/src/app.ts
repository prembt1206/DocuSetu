import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimitMiddleware.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const app = express();

// Trust proxy for secure headers & accurate rate limiting behind reverse proxies (Vercel/Cloudflare)
app.set('trust proxy', 1);

// ==========================================
// 🛡️ Enterprise Security Hardening (Helmet)
// ==========================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
);

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

// Static uploads serving (safe if directory does not exist)
try {
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));
} catch {
  // Ignore in serverless environments
}

// Health check endpoint
app.get(['/health', '/api/health', '/api/v1/health'], (req, res) => {
  res.json({
    status: 'healthy',
    securityShield: 'Active (Helmet + RateLimiter + TimingSafeEqual)',
    service: 'DocuSetu IDP Engine',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.GEMINI_API_KEY ? '@google/genai (Gemini 2.5 Pro)' : 'Autonomous Heuristic Trade Extractor'
  });
});

// Mount API router across /api, /api/v1, and /v1
app.use(['/api/v1', '/api', '/v1'], apiRouter);

// Root api handler
app.get(['/', '/api'], (req, res) => {
  res.json({
    service: 'DocuSetu IDP API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
export { app };
