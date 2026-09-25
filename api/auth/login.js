import { getStoredUsers, saveUser, verifyPassword, createToken } from '../_lib/authStore.js';
import { getSupabase } from '../_lib/supabaseClient.js';

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
    let user = users.get(normalizedEmail);

    // If user is not in serverless lambda memory, query remote Supabase database
    if (!user) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: supaUser, error: supaErr } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (supaUser && !supaErr) {
            user = {
              id: supaUser.id,
              email: supaUser.email,
              fullName: supaUser.full_name || supaUser.fullName || normalizedEmail.split('@')[0],
              role: supaUser.role || 'Compliance Officer',
              organizationId: supaUser.organization_id || '11111111-1111-4111-8111-111111111111',
              passwordHash: supaUser.password_hash,
              createdAt: supaUser.created_at
            };
            saveUser(normalizedEmail, user);
          }
        } catch (dbErr) {
          console.warn('Supabase login check note:', dbErr.message);
        }
      }
    }

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials. No registered account found with this email. Please create an account first.' });
      return;
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Incorrect password. Please verify your credentials and try again.' });
      return;
    }

    // Update last_login_at in remote Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('email', normalizedEmail);
      } catch {
        // Non-blocking update
      }
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
