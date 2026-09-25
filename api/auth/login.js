import { getStoredUsers, verifyPassword, createToken } from '../_lib/authStore.js';

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
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Both email and password are required to log in.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const user = users.get(normalizedEmail);

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials. No registered account found with this email. Please create an account first.' });
      return;
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Incorrect password. Please verify your credentials and try again.' });
      return;
    }

    const token = createToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
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
    console.error('login error:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
