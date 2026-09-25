import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export function getSupabase() {
  if (
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('mock-supabase') &&
    !supabaseUrl.includes('your_supabase')
  ) {
    try {
      return createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err.message);
    }
  }
  return null;
}
