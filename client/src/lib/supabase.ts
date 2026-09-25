import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-supabase.docusetu.internal';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-docusetu-enterprise-jwt-sample-token';

export const isMockSupabase = supabaseUrl.includes('mock-supabase') || supabaseUrl.includes('your_supabase');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
