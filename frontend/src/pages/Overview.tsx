import React, { useEffect, useState } from 'react';
import {
  FileText,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  CheckCircle2,
  BookOpen,
  Layers,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw
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
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard();
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading regulatory dashboard metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
        Error loading dashboard: {error}
      </div>
    );
  }

  const { metrics, workload_by_status, recent_alerts, catalogue_coverage } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Target */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <span>SIH 2026 Problem Statement 26261</span>
            <span>•</span>
            <span>Evaluation Date: 2026-04-15</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white m-0">
            VerifyAI Regulatory Scrutiny Operations
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            AI decision-support system evaluating institutional declarations, supporting documents, and reviewed AICTE Approval Process Handbook (APH) rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenApplication('VA-DEMO-2026-014')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>Open Demo Case (VA-DEMO-2026-014)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Directly derived from database records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Applications Under Scrutiny</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.under_review}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Active in queue ({metrics.total_applications} total registered)
          </p>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium mb-1">
            <span>Needs Review / Deficiency</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">
            {metrics.needs_attention}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            Flagged with possible deficiency or clarification
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Pending External Verification</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.pending_verification}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Simulated registry checks awaiting officer review
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Escalated to Senior Authority</span>
            <ArrowUpRight className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.escalated_cases}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Awaiting Senior Reviewer disposition
          </p>
        </div>
      </div>

      {/* Middle Row: Workload by Status & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Workload by Status
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Realtime</span>
          </div>

          <div className="space-y-3">
            {Object.entries(workload_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        count > 0 ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                      style={{ width: `${Math.min(100, count * 50)}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-900 w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Regulatory Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recent Regulatory Alerts
              </h3>
              <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {recent_alerts.length} Active
              </span>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
            >
              View All Alerts →
            </button>
          </div>

          <div className="space-y-2.5">
            {recent_alerts.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No active alerts.</div>
            ) : (
              recent_alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onOpenApplication(alert.application_id)}
                  className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        alert.priority === 'high' ? 'bg-red-600' : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{alert.title}</span>
                        <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {alert.application_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{alert.reason}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Handbook Catalogue Coverage Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Handbook Catalogue & Governance Scope (Imported from handbook_extraction.xlsx)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Faithfully preserved regulatory catalogue derived from official AICTE APH extraction.
            </p>
          </div>
          <button
            onClick={() => onNavigate('catalogue_coverage')}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
          >
            Coverage Analytics →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div
            onClick={() => onNavigate('categories_catalogue')}
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">Categories</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {catalogue_coverage.categories}
            </div>
            <p className="text-[10px] text-slate-500">Table 2.3 categories</p>
          </div>

          <div
            onClick={() => onNavigate('documents_catalogue')}
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold">Documents</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {catalogue_coverage.document_requirements}
            </div>
            <p className="text-[10px] text-slate-500">Annexure 1 & 2 items</p>
          </div>

          <div
            onClick={() => onNavigate('candidate_rules')}
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold">Candidate Rules</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {catalogue_coverage.candidate_rules}
            </div>
            <p className="text-[10px] text-slate-500">Extracted candidate sentences</p>
          </div>

          <div
            onClick={() => onNavigate('external_refs')}
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <ExternalLink className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold">External Refs</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {catalogue_coverage.external_references}
            </div>
            <p className="text-[10px] text-slate-500">Authority/portal citations</p>
          </div>

          <div
            onClick={() => onNavigate('rules_governance')}
            className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-blue-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-semibold">Approved Rules</span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              {catalogue_coverage.approved_executable_rules}
            </div>
            <p className="text-[10px] text-blue-700">Verified for execution ({catalogue_coverage.draft_governance_rules} drafts)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
