import { pendingOtps, registeredUsers, hashPassword, createToken } from '../_lib/authStore.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, fullName, password, code } = req.body || {};
    if (!email || !fullName || !password) {
      res.status(400).json({ error: 'All fields (email, full name, password) are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP state
    const pending = pendingOtps.get(normalizedEmail);
    if (!pending || (!pending.verified && pending.code !== code?.trim())) {
      res.status(400).json({ error: 'Please verify your email address using the one-time passcode first.' });
      return;
    }

    // Password criteria check
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const passwordHash = hashPassword(password);
    const userId = crypto.randomUUID();

    const user = {
      id: userId,
      email: normalizedEmail,
      fullName: fullName.trim(),
      role: 'Compliance Officer',
      organizationId: '11111111-1111-4111-8111-111111111111',
      passwordHash,
      createdAt: new Date().toISOString()
    };

    registeredUsers.set(normalizedEmail, user);
    pendingOtps.delete(normalizedEmail);

    const token = createToken(user);

    res.status(200).json({
      success: true,
      message: 'Account created successfully in secure database.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
