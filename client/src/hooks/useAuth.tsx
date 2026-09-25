import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockSupabase } from '../lib/supabase.js';

export interface UserProfile {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  role: 'Senior Customs Broker & Compliance Officer'
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
            role: 'Customs Officer'
          };
          setUser(profile);
          setToken(session.access_token);
        }
      });
    }

    setIsLoading(false);
  }, []);

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
            role: 'Customs Broker'
          };
          setUser(profile);
          setToken(data.session.access_token);
          localStorage.setItem('docusetu_user', JSON.stringify(profile));
          localStorage.setItem('docusetu_auth_token', data.session.access_token);
          return;
        }
      }

      // Demo/Fallback login
      const profile: UserProfile = {
        id: '00000000-0000-4000-8000-000000000001',
        email,
        organizationId: '11111111-1111-4111-8111-111111111111',
        organizationName: 'Apex Global Freight & Customs Brokerage',
        role: 'Customs Officer'
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
