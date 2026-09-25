import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Authentication token is required. Please log in.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim().length === 0) {
      res.status(401).json({ error: 'Unauthorized: Empty token provided.' });
      return;
    }

    // Verify DocuSetu JWT session token
    if (token.startsWith('docusetu-jwt-')) {
      try {
        const payloadBase64 = token.replace('docusetu-jwt-', '');
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));

        if (!payload.id || !payload.email) {
          res.status(401).json({ error: 'Unauthorized: Malformed session token.' });
          return;
        }

        req.user = {
          id: payload.id,
          organizationId: payload.organizationId || '11111111-1111-4111-8111-111111111111',
          email: payload.email,
          role: payload.role || 'Customs Broker & Compliance Officer'
        };
        return next();
      } catch (e) {
        logger.warn('Failed to parse docusetu-jwt token:', e);
        res.status(401).json({ error: 'Unauthorized: Invalid session token signature.' });
        return;
      }
    }

    // If Supabase remote client is available, verify Supabase access token
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('mock-supabase')) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        res.status(401).json({ error: 'Unauthorized: Invalid Supabase authentication token.' });
        return;
      }

      // Fetch user's organization from DB
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      req.user = {
        id: user.id,
        organizationId: userData?.organization_id || '11111111-1111-4111-8111-111111111111',
        email: user.email || 'user@docusetu.io',
        role: userData?.role || 'Customs Broker'
      };
      return next();
    }

    res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication credentials.' });
  } catch (err: any) {
    logger.error('Authentication middleware error:', err.message);
    res.status(401).json({ error: 'Authentication failed.' });
  }
};
