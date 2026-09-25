import dns from 'dns';
import { logger } from '../utils/logger.js';

export interface EmailStrictValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail?: string;
}

// Known disposable email domains to block outright
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'getairmail.com'
]);

/**
 * Strict Email & Gmail Validator
 * Enforces Google's official account specifications and verifies DNS MX records.
 */
export async function validateEmailStrict(email: string): Promise<EmailStrictValidationResult> {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required and cannot be empty.' };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic RFC syntax check
  const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcRegex.test(trimmed)) {
    return { isValid: false, error: 'Email format violates international RFC standard.' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Email must contain exactly one "@" separator.' };
  }

  const [username, domain] = parts;

  // Strict domain check: Only genuine Google/Gmail domains accepted
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') {
    return {
      isValid: false,
      error: `Invalid email domain "@${domain}". Only genuine @gmail.com accounts are permitted on this portal.`
    };
  }

  // Block disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { isValid: false, error: 'Disposable or temporary email providers are strictly prohibited.' };
  }

  // Google Official Username Specifications:
  // 1. Length: 6 to 30 characters
  if (username.length < 6) {
    return { isValid: false, error: 'Gmail username must be at least 6 characters long.' };
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Gmail username cannot exceed 30 characters.' };
  }

  // 2. Allowed characters: a-z, 0-9, and period (.)
  const allowedChars = /^[a-z0-9.]+$/;
  if (!allowedChars.test(username)) {
    return { isValid: false, error: 'Gmail usernames may only contain letters (a-z), numbers (0-9), and periods (.).' };
  }

  // 3. Periods cannot be first or last character
  if (username.startsWith('.') || username.endsWith('.')) {
    return { isValid: false, error: 'Gmail username cannot start or end with a period.' };
  }

  // 4. No consecutive periods
  if (username.includes('..')) {
    return { isValid: false, error: 'Gmail username cannot contain consecutive periods (..).' };
  }

  // Verify domain MX records via DNS to guarantee mail route exists
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { isValid: false, error: `Domain @${domain} has no valid MX records to receive email.` };
    }
  } catch (dnsErr: any) {
    logger.warn(`[DNS MX Lookup] Could not resolve MX for ${domain}:`, dnsErr.message);
    // If local offline or DNS timeout, proceed if domain is explicitly gmail.com
    if (domain !== 'gmail.com' && domain !== 'googlemail.com') {
      return { isValid: false, error: `Failed DNS verification for domain @${domain}.` };
    }
  }

  return {
    isValid: true,
    normalizedEmail: `${username}@${domain}`
  };
}
