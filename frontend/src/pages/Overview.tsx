import React, { useEffect, useState } from 'react';
import {
  FileText,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  ChevronRight,
  Layers,
  BookOpen,
  ExternalLink,
  RefreshCw,
  Building2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';

interface OverviewProps {
  onOpenApplication: (appId: string) => void;
  onNavigate: (nav: any) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onOpenApplication, onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading operations dashboard...</span>
        </div>
      </div>
    );
  }

  const { metrics, workload_by_status, recent_alerts, catalogue_coverage } = data;

  return (
    <div className="space-y-5">
      {/* 1. Header with Compact Operational Subtitle and Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">Operations Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active application queue, compliance checks, and regulatory alerts for APH 2026–27.
          </p>
        </div>
        <button
          onClick={() => onOpenApplication('VA-DEMO-2026-014')}
          className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Open Main Demo Case</span>
          <span className="font-mono text-[11px] bg-blue-800 px-1.5 py-0.2 rounded text-blue-100">VA-DEMO-2026-014</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Under Scrutiny</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.under_review}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Of {metrics.total_applications} registered applications</p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-900 text-xs font-medium mb-1">
            <span>Needs Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{metrics.needs_attention}</div>
          <p className="text-[11px] text-amber-700 mt-0.5">Deficiencies or clarifications flagged</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>External Verification</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.pending_verification}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Issuer checks requiring review</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Escalated Cases</span>
            <ArrowUpRight className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.escalated_cases}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting Senior Reviewer disposition</p>
        </div>
      </div>

      {/* 3. Middle Section: Workload & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Workload Status */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
              Workload by Status
            </h2>
            <button
              onClick={() => onNavigate('applications')}
              className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
            >
              View all →
            </button>
          </div>

          <div className="space-y-2.5">
            {Object.entries(workload_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${count > 0 ? 'bg-blue-600' : 'bg-slate-300'}`}
                      style={{ width: `${Math.min(100, count * 50)}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-900 w-3 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
                Recent Regulatory Alerts
              </h2>
              <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {recent_alerts.length} active
              </span>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
            >
              All Alerts →
            </button>
          </div>

          <div className="space-y-2">
            {recent_alerts.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No active alerts.</div>
            ) : (
              recent_alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onOpenApplication(alert.application_id)}
                  className="group p-2.5 border border-slate-200 rounded-md hover:border-blue-400 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        alert.priority === 'high' ? 'bg-red-600' : 'bg-amber-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors truncate">
                          {alert.title}
                        </span>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 rounded border border-blue-200 flex-shrink-0">
                          {alert.application_id}
                        </span>
                      </div>
                      <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-5 group-hover:opacity-100 transition-all duration-150 text-[11px] text-slate-500 pt-0.5 truncate">
                        {alert.reason}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Catalogue Summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
              Handbook Catalogue Scope (AICTE APH 2024–27)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Extracted regulatory baseline preserved with original source clauses and page numbers.
            </p>
          </div>
          <button
            onClick={() => onNavigate('catalogue_coverage')}
            className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
          >
            Full Coverage →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            onClick={() => onNavigate('categories_catalogue')}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-md hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-0.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Categories</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{catalogue_coverage.categories}</div>
            <p className="text-[10px] text-slate-400">Approval categories</p>
          </div>

          <div
            onClick={() => onNavigate('documents_catalogue')}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-md hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-0.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Documents</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{catalogue_coverage.document_requirements}</div>
            <p className="text-[10px] text-slate-400">Annexure 1 & 2 items</p>
          </div>

          <div
            onClick={() => onNavigate('candidate_rules')}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-md hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-0.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Candidate Rules</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{catalogue_coverage.candidate_rules}</div>
            <p className="text-[10px] text-slate-400">Extracted sentences</p>
          </div>

          <div
            onClick={() => onNavigate('external_refs')}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-md hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-0.5 font-medium">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>External Refs</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{catalogue_coverage.external_references}</div>
            <p className="text-[10px] text-slate-400">Statutory citations</p>
          </div>

          <div
            onClick={() => onNavigate('rules_governance')}
            className="p-2.5 bg-blue-50/50 border border-blue-200 rounded-md hover:border-blue-400 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-blue-800 text-[11px] mb-0.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>Approved Rules</span>
            </div>
            <div className="text-lg font-bold text-blue-900">{catalogue_coverage.approved_executable_rules}</div>
            <p className="text-[10px] text-blue-700">Verified for execution</p>
          </div>
        </div>
      </div>
    </div>
  );
};
