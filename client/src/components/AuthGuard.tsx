import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Authenticating DocuSetu Security Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
