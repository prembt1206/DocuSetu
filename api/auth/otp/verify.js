import { pendingOtps } from '../../_lib/authStore.js';

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
    const { email, code } = req.body || {};
    if (!email || !code) {
      res.status(400).json({ error: 'Both email and 6-digit verification code are required.' });
      return;
    }

    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      res.status(400).json({ error: 'Verification code must be exactly 6 numeric digits.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pending = pendingOtps.get(normalizedEmail);

    if (!pending) {
      res.status(400).json({ error: 'No active verification code found for this email. Please request a new code.' });
      return;
    }

    if (Date.now() > pending.expiresAt) {
      pendingOtps.delete(normalizedEmail);
      res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      return;
    }

    if (pending.code !== cleanCode) {
      pending.attempts = (pending.attempts || 0) + 1;
      if (pending.attempts >= 3) {
        pendingOtps.delete(normalizedEmail);
        res.status(429).json({ error: 'Maximum verification attempts exceeded. Please request a new code.' });
        return;
      }
      res.status(400).json({ error: `Invalid verification code. ${3 - pending.attempts} attempts remaining.` });
      return;
    }

    pending.verified = true;
    res.status(200).json({
      success: true,
      verified: true,
      message: 'Email verified successfully! You may now set your secure account password.',
      email: normalizedEmail
    });
  } catch (err) {
    console.error('verify OTP error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
