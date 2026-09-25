export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    securityShield: 'Active (Helmet + RateLimiter + TimingSafeEqual)',
    service: 'DocuSetu IDP Engine',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.GEMINI_API_KEY ? '@google/genai (Gemini 2.5 Pro)' : 'Autonomous Heuristic Trade Extractor'
  });
}
