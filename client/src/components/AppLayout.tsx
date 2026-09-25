import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ship,
  FileUp,
  Sliders,
  LogOut,
  Sparkles,
  ShieldCheck,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { AuditLogsModal } from './AuditLogsModal.js';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard & Insights', icon: LayoutDashboard },
    { to: '/shipments', label: 'Shipments & Consignments', icon: Ship },
    { to: '/documents', label: 'Omnichannel Ingestion', icon: FileUp },
    { to: '/settings', label: 'Advisory & Tolerances', icon: Sliders },
  ];

  return (
    <div className="flex h-screen bg-navy-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-navy-900/90 border-r border-slate-800/80 flex flex-col justify-between z-20 backdrop-blur-xl">
        <div>
          {/* Brand Logo */}
          <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-glow-primary">
                <Ship className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                  DocuSetu
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    IDP
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">Customs & Trade AI Engine</p>
              </div>
            </div>
          </div>

          {/* Tenant Isolation Pill */}
          <div className="px-4 py-3 mx-4 my-4 rounded-lg bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Isolated Tenant</span>
            </div>
            <p className="text-xs font-semibold text-slate-200 truncate">
              {user?.organizationName || 'Apex Global Freight & Customs'}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">RLS Security Active</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/70 space-y-3">
          {/* AI Model Badge */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-brand-950/60 to-slate-900 border border-brand-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-brand-200">Gemini 2.5 Pro</p>
                <p className="text-[10px] text-slate-400">Contextual Reasoning</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Active
            </span>
          </div>

          {/* User Account */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.fullName || user?.email}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-navy-900/60 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="font-semibold text-slate-200">Global Customs Portal</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-brand-400 font-mono text-xs">WCO Data Model 3.0 Standard</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/documents')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-primary transition-all active:scale-95"
            >
              <FileUp className="w-3.5 h-3.5" />
              Ingest Trade PDF
            </button>

            <button
              onClick={() => setIsAuditLogsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Open Compliance Audit Trail"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>Audit Logs</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

      {/* Compliance Audit Trail Modal */}
      <AuditLogsModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />
    </div>
  );
};
