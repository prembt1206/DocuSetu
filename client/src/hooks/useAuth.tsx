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
  lastGeneratedOtp: string | null;
  validateGmail: (email: string) => GmailValidationResult;
  sendOtp: (email: string) => Promise<{ code?: string; message: string; expiresInSeconds?: number }>;
  verifyOtp: (email: string, code: string, fullName?: string) => Promise<UserProfile>;
  login: (email: string, password?: string) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => void;
  clearLastOtp: () => void;
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
  const [lastGeneratedOtp, setLastGeneratedOtp] = useState<string | null>(null);

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
      }
    } else {
      // Default to demo session for instant out-of-the-box experience
      setUser(DEMO_USER);
      setToken('mock-token-docusetu-enterprise');
      localStorage.setItem('docusetu_user', JSON.stringify(DEMO_USER));
      localStorage.setItem('docusetu_auth_token', 'mock-token-docusetu-enterprise');
    }

    if (!isMockSupabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || 'user@docusetu.io',
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
   * Request OTP code for a verified Gmail address
   */
  const sendOtp = async (email: string) => {
    setIsLoading(true);
    try {
      const validation = validateGmail(email);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Please provide a valid @gmail.com address.');
      }

      // If remote Supabase is configured, optionally initiate Supabase OTP in parallel
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

      // Invoke server API for secure OTP generation & delivery
      const res = await api.sendOtp(validation.normalizedEmail!);
      if (res.code) {
        setLastGeneratedOtp(res.code);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify the 6-digit OTP and store user profile in Supabase
   */
  const verifyOtp = async (email: string, code: string, fullName?: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const validation = validateGmail(email);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Please provide a valid @gmail.com address.');
      }

      const normalizedEmail = validation.normalizedEmail!;

      // 1. Verify OTP with backend
      const res = await api.verifyOtp(normalizedEmail, code);

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
      setLastGeneratedOtp(null);

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

      // Fallback direct login
      const profile: UserProfile = {
        id: 'user-' + Math.random().toString(36).substring(2, 10),
        email,
        organizationId: '11111111-1111-4111-8111-111111111111',
        organizationName: 'Apex Global Freight & Customs Brokerage',
        role: 'Customs Officer',
        fullName: email.split('@')[0]
      };
      const demoToken = 'mock-token-' + Math.random().toString(36).substring(2);
      setUser(profile);
      setToken(demoToken);
      localStorage.setItem('docusetu_user', JSON.stringify(profile));
      localStorage.setItem('docusetu_auth_token', demoToken);
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
    setLastGeneratedOtp(null);
    localStorage.removeItem('docusetu_user');
    localStorage.removeItem('docusetu_auth_token');
    if (!isMockSupabase) {
      supabase.auth.signOut();
    }
  };

  const clearLastOtp = () => {
    setLastGeneratedOtp(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        lastGeneratedOtp,
        validateGmail,
        sendOtp,
        verifyOtp,
        login,
        loginAsDemo,
        logout,
        clearLastOtp
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
