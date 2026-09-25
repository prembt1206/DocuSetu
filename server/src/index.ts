import app from './app.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`=======================================================`);
  logger.info(`🛡️ DocuSetu Enterprise IDP Server running on port ${PORT}`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
  logger.info(`📦 API Base URL: http://localhost:${PORT}/api/v1`);
  logger.info(`🔒 Security: Helmet, RateLimiter, Anti-BruteForce OTP Active`);
  logger.info(`=======================================================`);
});

export default app;
export { app };
