import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockSupabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';
import { validateEmail, EmailValidationResult, validatePassword } from '@shared/validations.js';

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
  validateEmail: (email: string) => EmailValidationResult;
  validateGmail: (email: string) => EmailValidationResult;
  sendOtp: (email: string, fullName?: string) => Promise<{ message: string; expiresInSeconds?: number }>;
  verifyOtp: (email: string, code: string) => Promise<{ verified: boolean; message: string }>;
  createAccount: (params: { email: string; fullName: string; password: string; code?: string }) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        const parsed = JSON.parse(savedUser);
        // Ensure user is not an old legacy demo user
        if (parsed.email === 'broker@docusetu.io' && parsed.id === '00000000-0000-4000-8000-000000000001') {
          localStorage.removeItem('docusetu_user');
          localStorage.removeItem('docusetu_auth_token');
          setUser(null);
          setToken(null);
        } else {
          setUser(parsed);
          setToken(savedToken);
        }
      } catch {
        localStorage.removeItem('docusetu_user');
        localStorage.removeItem('docusetu_auth_token');
        setUser(null);
        setToken(null);
      }
    } else {
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
   * Request 6-digit OTP code for a valid email address
   */
  const sendOtp = async (email: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const validation = validateEmail(email);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Please provide a valid email address.');
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

      // Dispatch real email via API
      const res = await api.sendOtp(validation.normalizedEmail!, fullName);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Strictly verify the 6-digit OTP received in email
   */
  const verifyOtp = async (email: string, code: string): Promise<{ verified: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const validation = validateEmail(email);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Please provide a valid email address.');
      }

      const normalizedEmail = validation.normalizedEmail!;
      const res = await api.verifyOtp(normalizedEmail, code);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Complete account creation: save password & details in database
   */
  const createAccount = async (params: {
    email: string;
    fullName: string;
    password: string;
    code?: string;
  }): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const validation = validateEmail(params.email);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Please provide a valid email address.');
      }

      const passVal = validatePassword(params.password);
      if (!passVal.isValid) {
        throw new Error(passVal.error || 'Password does not meet security requirements.');
      }

      const normalizedEmail = validation.normalizedEmail!;

      // If remote Supabase is connected, register user in Supabase Auth
      if (!isMockSupabase) {
        try {
          await supabase.auth.signUp({
            email: normalizedEmail,
            password: params.password,
            options: {
              data: { full_name: params.fullName.trim() }
            }
          });
        } catch (supaErr: any) {
          console.warn('Supabase signUp note:', supaErr.message);
        }
      }

      // Create account in database via API
      const res = await api.createAccount({
        email: normalizedEmail,
        fullName: params.fullName.trim(),
        password: params.password,
        code: params.code
      });

      const profile: UserProfile = {
        id: res.user.id,
        email: normalizedEmail,
        organizationId: res.user.organizationId || '11111111-1111-4111-8111-111111111111',
        organizationName: res.user.organizationName || 'Apex Global Freight & Customs Brokerage',
        role: res.user.role || 'Customs Broker & Compliance Officer',
        fullName: res.user.fullName || params.fullName.trim()
      };

      // Set active session
      setUser(profile);
      setToken(res.token);

      localStorage.setItem('docusetu_user', JSON.stringify(profile));
      localStorage.setItem('docusetu_auth_token', res.token);

      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Log in user with registered email and password checked against database
   */
  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const validation = validateEmail(email);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Please enter a valid registered email address.');
      }

      if (!password || password.trim().length === 0) {
        throw new Error('Please enter your password.');
      }

      const normalizedEmail = validation.normalizedEmail!;

      // If remote Supabase is configured, try Supabase Auth sign in
      if (!isMockSupabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password
          });
          if (!error && data?.session) {
            const profile: UserProfile = {
              id: data.user.id,
              email: data.user.email || normalizedEmail,
              organizationId: '11111111-1111-4111-8111-111111111111',
              organizationName: 'Apex Global Freight & Customs Brokerage',
              role: 'Customs Officer',
              fullName: data.user.user_metadata?.full_name || normalizedEmail.split('@')[0]
            };
            setUser(profile);
            setToken(data.session.access_token);
            localStorage.setItem('docusetu_user', JSON.stringify(profile));
            localStorage.setItem('docusetu_auth_token', data.session.access_token);
            return profile;
          }
        } catch (supaErr: any) {
          console.warn('Supabase signInWithPassword note:', supaErr.message);
        }
      }

      // Check registered credentials against backend database
      const res = await api.login({ email: normalizedEmail, password });

      const profile: UserProfile = {
        id: res.user.id,
        email: normalizedEmail,
        organizationId: res.user.organizationId || '11111111-1111-4111-8111-111111111111',
        organizationName: res.user.organizationName || 'Apex Global Freight & Customs Brokerage',
        role: res.user.role || 'Customs Broker & Compliance Officer',
        fullName: res.user.fullName || normalizedEmail.split('@')[0]
      };

      setUser(profile);
      setToken(res.token);

      localStorage.setItem('docusetu_user', JSON.stringify(profile));
      localStorage.setItem('docusetu_auth_token', res.token);

      return profile;
    } finally {
      setIsLoading(false);
    }
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
        validateEmail,
        validateGmail: validateEmail,
        sendOtp,
        verifyOtp,
        createAccount,
        login,
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
