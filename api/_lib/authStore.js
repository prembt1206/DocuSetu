import crypto from 'crypto';

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

export { pendingOtps, registeredUsers };
