import crypto from 'crypto';

const HMAC_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'docusetu-enterprise-secure-hmac-sha512-salt-key';

// In-memory persistent storage across serverless lambdas in warm execution
const pendingOtps = new Map();
const registeredUsers = new Map();

// Helper: PBKDF2 Password Hashing
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const keyBuf = Buffer.from(key, 'hex');
    const hashBuf = Buffer.from(hash, 'hex');
    return crypto.timingSafeEqual(keyBuf, hashBuf);
  } catch {
    return false;
  }
}

export function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'Compliance Officer',
    iat: Date.now()
  };
  return `docusetu-jwt-${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
}

// Stateless HMAC Cryptographic OTP Token Helpers
export function createOtpToken(email, code, expiresAt) {
  const data = `${email}:${code}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ email, expiresAt, hmac })).toString('base64');
}

export function verifyOtpToken(email, code, token) {
  try {
    const json = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (json.email !== email) return false;
    if (Date.now() > json.expiresAt) return false;
    const expected = crypto.createHmac('sha256', HMAC_SECRET).update(`${email}:${code}:${json.expiresAt}`).digest('hex');
    const a = Buffer.from(json.hmac, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function createVerifiedToken(email) {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15m to complete registration
  const data = `verified:${email}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ email, expiresAt, hmac })).toString('base64');
}

export function checkVerifiedToken(email, token) {
  try {
    const json = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (json.email !== email) return false;
    if (Date.now() > json.expiresAt) return false;
    const expected = crypto.createHmac('sha256', HMAC_SECRET).update(`verified:${email}:${json.expiresAt}`).digest('hex');
    const a = Buffer.from(json.hmac, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export { pendingOtps, registeredUsers };
