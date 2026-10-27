import React from 'react';
import {
  ShieldAlert,
  Calendar,
  UserCheck,
  Bell,
  RefreshCw,
  Database,
  Building2,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { DemoRole } from '../types';
import { setDemoRole } from '../services/api';

interface HeaderProps {
  currentRole: DemoRole;
  currentUsername: string;
  onRoleChange: (newRole: DemoRole) => void;
  activeAlertsCount: number;
  onNavigateToAlerts: () => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUsername,
  onRoleChange,
  activeAlertsCount,
  onNavigateToAlerts,
  onRefreshData
}) => {
  const handleRoleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as DemoRole;
    setDemoRole(newRole);
    onRoleChange(newRole);
  };

  const roleTitles = {
    scrutiny_officer: 'Scrutiny Officer (1st Level Review)',
    senior_reviewer: 'Senior Reviewer (Escalations & Disposition)',
    system_admin: 'System Admin (Governance & Settings)'
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* 1. Global Persistent Demo Banner */}
      <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-amber-600/20">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-950 flex-shrink-0" />
          <span>DEMO ENVIRONMENT — PROTOTYPE DECISION SUPPORT — NOT CONNECTED TO LIVE AICTE PORTAL</span>
        </div>
        <div className="flex items-center gap-4 text-amber-950">
          <span className="hidden md:inline">Synthetic Institutional Data Only</span>
          <span className="bg-amber-600/30 px-2 py-0.5 rounded text-[11px] font-mono">SIH 2026 PS 26261</span>
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="h-16 px-6 flex items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">VerifyAI</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                APH 2026–27
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Regulatory Scrutiny & Document Verification System
            </p>
          </div>
        </div>

        {/* Center / Right Control Strip */}
        <div className="flex items-center gap-3">
          {/* Fixed Evaluation Date Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">Evaluation Date:</span>
            <span className="font-semibold text-slate-900">2026-04-15</span>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-1 rounded font-mono">FIXED</span>
          </div>

          {/* Active Alerts Bell */}
          <button
            onClick={onNavigateToAlerts}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
            title="View Active System Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* DEMO ROLE SWITCHER (Explicitly labelled per Section 3.4) */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 pl-3 rounded-lg border border-slate-200">
            <div className="flex flex-col text-right hidden md:block">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Demo Role Switcher
              </span>
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUsername}
              </span>
            </div>

            <select
              value={currentRole}
              onChange={handleRoleSelect}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-medium rounded-md px-2.5 py-1.5 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="scrutiny_officer">Scrutiny Officer (Officer A)</option>
              <option value="senior_reviewer">Senior Reviewer (Escalations)</option>
              <option value="system_admin">System Admin (Governance)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
