import React from 'react';
import {
  ShieldAlert,
  Calendar,
  Bell,
  RotateCcw
} from 'lucide-react';
import { DemoRole } from '../types';
import { setDemoRole, resetLocalDemoData } from '../services/api';

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

  const handleResetData = () => {
    if (window.confirm('Reset all demo data to initial state? (This clears local reviews and restorations)')) {
      resetLocalDemoData();
      if (onRefreshData) onRefreshData();
      window.location.reload();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* 1. Global Persistent Demo Banner */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-1 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>DEMO ENVIRONMENT — SYNTHETIC DATA — NOT CONNECTED TO AICTE</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-amber-800 hidden sm:flex">
          <span>AICTE APH 2026–27 Scrutiny Prototype</span>
          <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">SIH 2026 PS 26261</span>
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="h-14 px-5 flex items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-base shadow-xs">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">VerifyAI</span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded">
                Operations Console
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Control Strip */}
        <div className="flex items-center gap-2.5">
          {/* Fixed Evaluation Date */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Cutoff:</span>
            <strong className="text-slate-900 font-mono">2026-04-15</strong>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleResetData}
            title="Reset demo data to initial deterministic state"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          {/* Active Alerts Bell */}
          <button
            onClick={onNavigateToAlerts}
            className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
            title="View Active Regulatory Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* DEMO ROLE SWITCHER */}
          <div className="flex items-center gap-2 bg-slate-50 p-1 pl-2.5 rounded-md border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 hidden md:inline">
              Role:
            </span>
            <select
              value={currentRole}
              onChange={handleRoleSelect}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded px-2 py-1 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="scrutiny_officer">Officer A (Scrutiny)</option>
              <option value="senior_reviewer">Senior Reviewer (Escalations)</option>
              <option value="system_admin">System Admin (Settings)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
