import React from 'react';
import {
  LayoutDashboard,
  Files,
  Inbox,
  ShieldCheck,
  Building,
  Bell,
  FileCheck2,
  Layers,
  FileText,
  BookOpen,
  ExternalLink,
  PieChart,
  Scale,
  Users,
  Settings,
  Lock
} from 'lucide-react';
import { DemoRole } from '../types';

export type NavItem =
  | 'overview'
  | 'applications'
  | 'review_queue'
  | 'verification'
  | 'infrastructure'
  | 'alerts'
  | 'reports_audit'
  | 'categories_catalogue'
  | 'documents_catalogue'
  | 'candidate_rules'
  | 'external_refs'
  | 'catalogue_coverage'
  | 'rules_governance'
  | 'user_management'
  | 'connector_settings';

interface SidebarProps {
  currentNav: NavItem;
  onNavigate: (nav: NavItem) => void;
  currentRole: DemoRole;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onNavigate,
  currentRole,
  activeAlertsCount,
}) => {
  const isAdmin = currentRole === 'system_admin';

  const navSection = (title: string, items: Array<{ id: NavItem; label: string; icon: any; badge?: number; adminOnly?: boolean }>) => (
    <div className="mb-5">
      <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
        {title}
      </div>
      <nav className="space-y-0.5">
        {items.map((item) => {
          if (item.adminOnly && !isAdmin) {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-500 rounded-md cursor-not-allowed select-none"
                title="Restricted: System Admin role required"
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
            );
          }

          const isActive = currentNav === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-700 pl-2.5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between p-3.5 flex-shrink-0 min-h-[calc(100vh-3.5rem)]">
      <div>
        {navSection('Regulatory Scrutiny', [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'applications', label: 'Applications', icon: Files },
          { id: 'review_queue', label: 'Review Queue', icon: Inbox },
          { id: 'verification', label: 'Verification & Integrity', icon: ShieldCheck },
          { id: 'infrastructure', label: 'Infrastructure Review', icon: Building },
          { id: 'alerts', label: 'Alerts', icon: Bell, badge: activeAlertsCount },
          { id: 'reports_audit', label: 'Reports & Audit', icon: FileCheck2 },
        ])}

        {navSection('Handbook Catalogue', [
          { id: 'categories_catalogue', label: 'Application Categories', icon: Layers },
          { id: 'documents_catalogue', label: 'Document Checklist', icon: FileText },
          { id: 'candidate_rules', label: 'Candidate Rules', icon: BookOpen },
          { id: 'external_refs', label: 'External References', icon: ExternalLink },
          { id: 'catalogue_coverage', label: 'Catalogue Coverage', icon: PieChart },
        ])}

        {navSection('Governance & Admin', [
          { id: 'rules_governance', label: 'Rules Governance', icon: Scale },
          { id: 'user_management', label: 'User Directory', icon: Users, adminOnly: true },
          { id: 'connector_settings', label: 'Connector Settings', icon: Settings, adminOnly: true },
        ])}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="capitalize text-slate-600 font-medium">{currentRole.replace('_', ' ')}</span>
        <span className="font-mono text-[10px] text-slate-600">Static Prototype</span>
      </div>
    </aside>
  );
};
