import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Ship, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo, isLoading } = useAuth();

  const [email, setEmail] = useState('broker@docusetu.io');
  const [password, setPassword] = useState('TradeSafe2026!');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoAccess = () => {
    loginAsDemo();
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background ambient glow circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-sky-400 shadow-glow-primary mb-2">
            <Ship className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold font-display tracking-tight text-white">
            DocuSetu
          </h2>
          <p className="text-xs text-slate-400">
            Intelligent Document Processing for Global Trade &amp; Customs
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel-glow p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-slate-200">
              {isRegistering ? 'Register Customs Broker Account' : 'Brokerage Portal Login'}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Supabase Auth
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="broker@organization.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-primary flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>{isRegistering ? 'Create Tenant Account' : 'Authenticate via Supabase'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-center text-xs text-slate-400">
              <span className="h-px bg-slate-800 flex-1" />
              <span>Zero-Config Evaluation</span>
              <span className="h-px bg-slate-800 flex-1" />
            </div>

            <button
              onClick={handleDemoAccess}
              type="button"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/70 hover:from-slate-800 hover:to-indigo-900 border border-brand-500/30 text-brand-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Instant One-Click Demo Access (Apex Global)</span>
            </button>
          </div>
        </div>

        {/* Security & RLS Badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Row-Level Security (RLS)</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-brand-400" />
            <span>Multi-Tenant Isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
