import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockSupabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';
import { validateGmail, GmailValidationResult } from '@shared/validations.js';

export interface UserProfile {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: string;
  fullName?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  validateGmail: (email: string) => GmailValidationResult;
  sendOtp: (email: string) => Promise<{ message: string; expiresInSeconds?: number }>;
  verifyOtp: (email: string, code: string, fullName?: string) => Promise<UserProfile>;
  login: (email: string, password?: string) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: UserProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'broker@docusetu.io',
  organizationId: '11111111-1111-4111-8111-111111111111',
  organizationName: 'Apex Global Freight & Customs Brokerage',
  role: 'Senior Customs Broker & Compliance Officer',
  fullName: 'Apex Lead Customs Broker'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local storage for persistent session
    const savedUser = localStorage.getItem('docusetu_user');
    const savedToken = localStorage.getItem('docusetu_auth_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.removeItem('docusetu_user');
        localStorage.removeItem('docusetu_auth_token');
        setUser(null);
        setToken(null);
      }
    } else {
      // STRICT SECURITY: Do NOT auto-authenticate! User MUST explicitly verify their Gmail
      setUser(null);
      setToken(null);
    }

    if (!isMockSupabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            organizationId: '11111111-1111-4111-8111-111111111111',
            organizationName: 'Apex Global Freight & Customs Brokerage',
            role: 'Customs Officer',
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
          };
          setUser(profile);
          setToken(session.access_token);
        }
      });
    }

    setIsLoading(false);
  }, []);

  /**
   * Request OTP code for a strictly verified Gmail address
   */
  const sendOtp = async (email: string) => {
    setIsLoading(true);
    try {
      const validation = validateGmail(email);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Please provide a valid @gmail.com address.');
      }

      // If remote Supabase is configured, trigger Supabase Auth OTP in parallel
      if (!isMockSupabase) {
        try {
          await supabase.auth.signInWithOtp({
            email: validation.normalizedEmail!,
            options: { shouldCreateUser: true }
          });
        } catch (supaErr: any) {
          console.warn('Supabase auth.signInWithOtp note:', supaErr.message);
        }
      }

      // Invoke server API for real email dispatch via SMTP / EmailService
      const res = await api.sendOtp(validation.normalizedEmail!);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Strictly verify the 6-digit OTP received in Gmail and store user profile in Supabase
   */
  const verifyOtp = async (email: string, code: string, fullName?: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const validation = validateGmail(email);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Please provide a valid @gmail.com address.');
      }

      const normalizedEmail = validation.normalizedEmail!;

      // 1. Verify OTP with backend (timing-safe, SHA-256 hashed check)
      const res = await api.verifyOtp(normalizedEmail, code, undefined, fullName);

      const profile: UserProfile = {
        id: res.user.id,
        email: normalizedEmail,
        organizationId: res.user.organizationId || '11111111-1111-4111-8111-111111111111',
        organizationName: res.user.organizationName || 'Apex Global Freight & Customs Brokerage',
        role: res.user.role || 'Customs Broker & Compliance Officer',
        fullName: fullName || res.user.fullName || normalizedEmail.split('@')[0].replace(/[._]/g, ' ')
      };

      // 2. Persist in remote Supabase `users` table if configured
      if (!isMockSupabase) {
        try {
          const { error: supaError } = await supabase.from('users').upsert({
            id: profile.id,
            email: profile.email,
            organization_id: profile.organizationId,
            role: profile.role,
            full_name: profile.fullName
          });
          if (supaError) {
            console.warn('Supabase DB users upsert note:', supaError.message);
          }
        } catch (dbErr) {
          console.warn('Direct Supabase write error:', dbErr);
        }
      }

      // 3. Sync to backend database store
      await api.syncUser({
        id: profile.id,
        email: profile.email,
        organizationId: profile.organizationId,
        role: profile.role,
        fullName: profile.fullName
      });

      // 4. Update session
      setUser(profile);
      setToken(res.token);

      localStorage.setItem('docusetu_user', JSON.stringify(profile));
      localStorage.setItem('docusetu_auth_token', res.token);

      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      if (!isMockSupabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            organizationId: '11111111-1111-4111-8111-111111111111',
            organizationName: 'Apex Global Freight & Customs Brokerage',
            role: 'Customs Broker',
            fullName: data.user.user_metadata?.full_name || email.split('@')[0]
          };
          setUser(profile);
          setToken(data.session.access_token);
          localStorage.setItem('docusetu_user', JSON.stringify(profile));
          localStorage.setItem('docusetu_auth_token', data.session.access_token);
          return;
        }
      }

      throw new Error('Please use OTP verification to log in with your Gmail.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = () => {
    setUser(DEMO_USER);
    setToken('mock-token-docusetu-enterprise');
    localStorage.setItem('docusetu_user', JSON.stringify(DEMO_USER));
    localStorage.setItem('docusetu_auth_token', 'mock-token-docusetu-enterprise');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('docusetu_user');
    localStorage.removeItem('docusetu_auth_token');
    if (!isMockSupabase) {
      supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        validateGmail,
        sendOtp,
        verifyOtp,
        login,
        loginAsDemo,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
