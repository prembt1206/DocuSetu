import dns from 'dns';
import { logger } from '../utils/logger.js';

export interface EmailStrictValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail?: string;
}

// Known disposable email domains to block outright for maximum security
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'getairmail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'dispostable.com',
  'guerrillamailblock.com',
  'fakemailgenerator.com'
]);

/**
 * Strict Email Validator
 * Enforces RFC 5322 compliance, eliminates disposable/throwaway domains,
 * verifies DNS MX records when reachable, and normalizes email.
 */
export async function validateEmailStrict(email: string): Promise<EmailStrictValidationResult> {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required and cannot be empty.' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length < 5) {
    return { isValid: false, error: 'Email address is too short.' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email address exceeds maximum length of 254 characters.' };
  }

  // Basic RFC syntax check
  const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com).' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Email must contain exactly one "@" separator.' };
  }

  const [username, domain] = parts;

  // Block disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { isValid: false, error: 'Disposable or temporary email providers are strictly prohibited.' };
  }

  // Username validation
  if (!username || username.length === 0) {
    return { isValid: false, error: 'Email username cannot be empty.' };
  }

  if (username.startsWith('.') || username.endsWith('.')) {
    return { isValid: false, error: 'Email username cannot start or end with a period.' };
  }

  if (username.includes('..')) {
    return { isValid: false, error: 'Email username cannot contain consecutive periods (..).' };
  }

  // Domain structure checks
  if (!domain || !domain.includes('.')) {
    return { isValid: false, error: 'Email must contain a valid domain with an extension (e.g. .com).' };
  }

  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return { isValid: false, error: 'Email domain extension must be at least 2 characters.' };
  }

  // Optional: Verify domain MX records via DNS if network is available
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { isValid: false, error: `Domain @${domain} has no active mail servers (MX records).` };
    }
  } catch (dnsErr: any) {
    // If DNS query fails due to offline or local network restrictions, log and permit if format is valid
    logger.info(`[DNS MX Lookup] Note for ${domain}: ${dnsErr.message}`);
  }

  return {
    isValid: true,
    normalizedEmail: `${username}@${domain}`
  };
}

