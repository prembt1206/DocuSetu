import rateLimit from 'express-rate-limit';

// Global API Limiter (300 requests / 15 mins)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP address. Please retry after 15 minutes.' }
});

// Strict OTP Send Limiter: Max 8 OTP requests per 15 minutes per IP
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification code requests from this device. Please wait 15 minutes before retrying.' }
});

// Strict OTP Verify Limiter: Max 12 verification attempts per 15 minutes per IP
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts from this IP address. For your security, access is temporarily paused for 15 minutes.' }
});
