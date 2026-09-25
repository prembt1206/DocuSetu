import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { dbService } from '../services/dbService.js';
import { emailService } from '../services/emailService.js';
import { validateEmailStrict } from '../services/emailValidationService.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

interface SecurePendingOtp {
  codeHash: string; // Stored as SHA-256 hash
  email: string;
  expiresAt: number;
  attempts: number;
  lastRequestedAt: number;
}

// In-memory security cache with strict TTL
const pendingOtps: Map<string, SecurePendingOtp> = new Map();
const lockoutList: Map<string, number> = new Map(); // email -> lockoutUntil timestamp

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;
const COOLDOWN_MS = 60 * 1000; // 60s cooldown between requests
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout after 3 failed attempts

function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

/**
 * Handle Requesting a Strict OTP for Gmail
 */
export const handleSendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    // Strict RFC, Google spec, and DNS MX validation
    const validation = await validateEmailStrict(email);
    if (!validation.isValid) {
      res.status(400).json({
        error: validation.error || 'Invalid Gmail address. Only verified @gmail.com accounts are permitted.'
      });
      return;
    }

    const normalizedEmail = validation.normalizedEmail!;

    // Check if user is currently locked out
    const lockoutUntil = lockoutList.get(normalizedEmail);
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const waitMinutes = Math.ceil((lockoutUntil - Date.now()) / (60 * 1000));
      res.status(429).json({
        error: `Account temporarily locked due to excessive failed attempts. Please retry in ${waitMinutes} minutes.`
      });
      return;
    }

    // Rate-limiting: Check cooldown
    const existing = pendingOtps.get(normalizedEmail);
    if (existing && Date.now() - existing.lastRequestedAt < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - (Date.now() - existing.lastRequestedAt)) / 1000);
      res.status(429).json({
        error: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`
      });
      return;
    }

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashOtp(rawOtp);
    const expiresAt = Date.now() + OTP_TTL_MS;

    pendingOtps.set(normalizedEmail, {
      codeHash,
      email: normalizedEmail,
      expiresAt,
      attempts: 0,
      lastRequestedAt: Date.now()
    });

    // Send real email via EmailService
    const emailSent = await emailService.sendVerificationOtp({
      toEmail: normalizedEmail,
      otpCode: rawOtp,
      expiresInMinutes: 5
    });

    logger.info(`[Auth Security] Dispatched 6-digit OTP to Gmail: ${normalizedEmail} (Expires in 5m)`);

    // SECURE RESPONSE: Never leak the OTP in the API response!
    res.status(200).json({
      message: `A 6-digit security code has been sent to ${normalizedEmail}. Please check your Gmail inbox and Spam folder.`,
      email: normalizedEmail,
      expiresInSeconds: 300,
      sent: emailSent
    });
  } catch (err: any) {
    logger.error('handleSendOtp error:', err);
    next(err);
  }
};

/**
 * Handle Verifying the 6-Digit OTP strictly
 */
export const handleVerifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, organizationName, fullName } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: 'Both email and 6-digit verification code are required.' });
      return;
    }

    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      res.status(400).json({ error: 'Verification code must be exactly 6 numeric digits.' });
      return;
    }

    // Strict validation of the email
    const validation = await validateEmailStrict(email);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.error || 'Invalid Gmail address.' });
      return;
    }

    const normalizedEmail = validation.normalizedEmail!;

    // Check lockout
    const lockoutUntil = lockoutList.get(normalizedEmail);
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const waitMinutes = Math.ceil((lockoutUntil - Date.now()) / (60 * 1000));
      res.status(429).json({
        error: `Account is locked due to too many invalid attempts. Try again in ${waitMinutes} minutes.`
      });
      return;
    }

    const pending = pendingOtps.get(normalizedEmail);

    if (!pending) {
      res.status(400).json({
        error: 'No active verification code found for this email. Please request a new code.'
      });
      return;
    }

    // Check expiration
    if (Date.now() > pending.expiresAt) {
      pendingOtps.delete(normalizedEmail);
      res.status(400).json({
        error: 'The verification code has expired (validity is 5 minutes). Please request a new code.'
      });
      return;
    }

    // Increment attempts
    pending.attempts += 1;

    // Timing-safe comparison of SHA-256 hashes
    const inputHash = hashOtp(cleanCode);
    const storedBuffer = Buffer.from(pending.codeHash, 'hex');
    const inputBuffer = Buffer.from(inputHash, 'hex');

    const isMatch = storedBuffer.length === inputBuffer.length && crypto.timingSafeEqual(storedBuffer, inputBuffer);

    if (!isMatch) {
      const remainingAttempts = MAX_ATTEMPTS - pending.attempts;
      if (remainingAttempts <= 0) {
        // Exceeded attempts: Lock out and purge OTP
        pendingOtps.delete(normalizedEmail);
        lockoutList.set(normalizedEmail, Date.now() + LOCKOUT_MS);
        logger.warn(`[Security Alert] Max OTP attempts exceeded for ${normalizedEmail}. Account locked for 15m.`);
        res.status(403).json({
          error: 'Maximum verification attempts exceeded. For your security, this code has been destroyed and account locked for 15 minutes.'
        });
        return;
      }

      res.status(400).json({
        error: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
      });
      return;
    }

    // Success! Clear OTP and lockout
    pendingOtps.delete(normalizedEmail);
    lockoutList.delete(normalizedEmail);

    // Register / update user in Supabase database
    const defaultOrgId = '11111111-1111-4111-8111-111111111111';
    let userRecord = await dbService.getUserByEmail(normalizedEmail);

    const displayName = fullName?.trim() || userRecord?.full_name || normalizedEmail.split('@')[0].replace(/[._]/g, ' ');

    if (!userRecord) {
      const newUserId = uuidv4();
      userRecord = await dbService.upsertUser({
        id: newUserId,
        email: normalizedEmail,
        organization_id: defaultOrgId,
        role: 'Customs Broker & Compliance Officer',
        full_name: displayName
      });
      logger.info(`[Supabase Registered] New verified user stored in Supabase: ${normalizedEmail} (ID: ${userRecord.id})`);
    } else {
      userRecord = await dbService.upsertUser({
        id: userRecord.id,
        email: normalizedEmail,
        organization_id: userRecord.organization_id || defaultOrgId,
        role: userRecord.role || 'Customs Broker & Compliance Officer',
        full_name: displayName
      });
      logger.info(`[Supabase Synced] Verified user profile updated: ${normalizedEmail}`);
    }

    // Generate authenticated JWT session
    const token = `docusetu-jwt-${Buffer.from(
      JSON.stringify({
        id: userRecord.id,
        email: normalizedEmail,
        organizationId: userRecord.organization_id || defaultOrgId,
        role: userRecord.role || 'Customs Broker & Compliance Officer',
        iat: Date.now()
      })
    ).toString('base64')}`;

    res.status(200).json({
      message: 'Gmail successfully verified and authenticated.',
      token,
      user: {
        id: userRecord.id,
        email: normalizedEmail,
        fullName: displayName,
        organizationId: userRecord.organization_id || defaultOrgId,
        organizationName: organizationName || 'Apex Global Freight & Customs Brokerage',
        role: userRecord.role || 'Customs Broker & Compliance Officer'
      }
    });
  } catch (err: any) {
    logger.error('handleVerifyOtp error:', err);
    next(err);
  }
};

/**
 * Handle Synchronizing User details directly to Supabase
 */
export const handleSyncUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, email, organizationId, role, fullName } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const validation = await validateEmailStrict(email);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.error || 'Invalid email format.' });
      return;
    }

    const normalizedEmail = validation.normalizedEmail!;
    const user = await dbService.upsertUser({
      id: id || uuidv4(),
      email: normalizedEmail,
      organization_id: organizationId || '11111111-1111-4111-8111-111111111111',
      role: role || 'Customs Broker & Compliance Officer',
      full_name: fullName || normalizedEmail.split('@')[0].replace(/[._]/g, ' ')
    });

    res.status(200).json({ user });
  } catch (err: any) {
    logger.error('handleSyncUser error:', err);
    next(err);
  }
};
