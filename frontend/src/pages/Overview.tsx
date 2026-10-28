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
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { localApi } from '../services/localDataService';
import { DashboardData, Application } from '../types';
import { StatusChip } from '../components/StatusChip';

interface OverviewProps {
  onOpenApplication: (appId: string) => void;
  onNavigate: (nav: any) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onOpenApplication, onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, appsRes] = await Promise.all([
        api.getDashboard(),
        api.getApplications()
      ]);
      setData(dashRes);
      setApplications(appsRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      try {
        const [dashRes, appsRes] = await Promise.all([
          localApi.getDashboard(),
          localApi.getApplications()
        ]);
        setData(dashRes);
        setApplications(appsRes);
      } catch (fallbackErr) {
        console.error('Fallback failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2.5 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading operations dashboard...</span>
        </div>
      </div>
    );
  }

  const { metrics, workload_by_status, recent_alerts, catalogue_coverage } = data;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. Page Header with Operational Subtitle and Primary Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
            Operations Overview
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Active application scrutiny queue, compliance checks, and regulatory alerts for APH 2026–27.
          </p>
        </div>
        <button
          onClick={() => onOpenApplication('VA-DEMO-2026-014')}
          className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold flex items-center gap-2.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Open Main Demo Case</span>
          <span className="font-mono text-xs bg-blue-800 px-2 py-0.5 rounded text-blue-100 font-bold">
            VA-DEMO-2026-014
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Enlarged & Rebalanced KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs flex flex-col justify-between min-h-[145px] hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-600 text-sm font-semibold mb-2">
            <span>Under Scrutiny</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              {metrics.under_review}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1.5 font-medium">
              Of {metrics.total_applications} registered applications
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 md:p-6 shadow-xs flex flex-col justify-between min-h-[145px] hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-amber-900 text-sm font-semibold mb-2">
            <span>Needs Review</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-amber-900">
              {metrics.needs_attention}
            </div>
            <p className="text-xs md:text-sm text-amber-700 mt-1.5 font-medium">
              Deficiencies or clarifications flagged
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs flex flex-col justify-between min-h-[145px] hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-600 text-sm font-semibold mb-2">
            <span>External Verification</span>
            <ShieldCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              {metrics.pending_verification}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1.5 font-medium">
              Authority checks requiring review
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs flex flex-col justify-between min-h-[145px] hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-600 text-sm font-semibold mb-2">
            <span>Escalated Cases</span>
            <ArrowUpRight className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              {metrics.escalated_cases}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1.5 font-medium">
              Awaiting Senior Reviewer disposition
            </p>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Workload by Status & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload Status Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm md:text-base font-bold uppercase tracking-wider text-slate-800 m-0">
                Workload by Status
              </h2>
              <button
                onClick={() => onNavigate('applications')}
                className="text-xs md:text-sm text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
              >
                View all →
              </button>
            </div>

            <div className="space-y-3.5">
              {Object.entries(workload_by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">{status}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${count > 0 ? 'bg-blue-600' : 'bg-slate-300'}`}
                        style={{ width: `${Math.min(100, count * 50)}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm md:text-base font-bold uppercase tracking-wider text-slate-800 m-0">
                  Recent Regulatory Alerts
                </h2>
                <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2 py-0.5 rounded-full">
                  {recent_alerts.length} active
                </span>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs md:text-sm text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
              >
                All Alerts →
              </button>
            </div>

            <div className="space-y-2.5">
              {recent_alerts.length === 0 ? (
                <div className="text-sm text-slate-400 py-6 text-center">No active alerts.</div>
              ) : (
                recent_alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => onOpenApplication(alert.application_id)}
                    className="group p-3.5 md:p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          alert.priority === 'high' ? 'bg-red-600' : 'bg-amber-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                            {alert.title}
                          </span>
                          <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex-shrink-0 font-bold">
                            {alert.application_id}
                          </span>
                        </div>
                        <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-6 group-hover:opacity-100 transition-all duration-150 text-xs text-slate-500 pt-1 truncate">
                          {alert.reason}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Handbook Catalogue Summary Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm md:text-base font-bold uppercase tracking-wider text-slate-800 m-0">
              Handbook Catalogue Scope (AICTE APH 2024–27)
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Extracted regulatory baseline preserved with original source clauses and page numbers.
            </p>
          </div>
          <button
            onClick={() => onNavigate('catalogue_coverage')}
            className="text-xs md:text-sm text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
          >
            Full Coverage →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 md:gap-5">
          <div
            onClick={() => onNavigate('categories_catalogue')}
            className="p-4 md:p-5 bg-slate-50/80 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-600 text-xs md:text-sm mb-1 font-semibold">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Categories</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{catalogue_coverage.categories}</div>
            <p className="text-xs text-slate-400 mt-0.5">Approval categories</p>
          </div>

          <div
            onClick={() => onNavigate('documents_catalogue')}
            className="p-4 md:p-5 bg-slate-50/80 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-600 text-xs md:text-sm mb-1 font-semibold">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Documents</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{catalogue_coverage.document_requirements}</div>
            <p className="text-xs text-slate-400 mt-0.5">Annexure 1 & 2 items</p>
          </div>

          <div
            onClick={() => onNavigate('candidate_rules')}
            className="p-4 md:p-5 bg-slate-50/80 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-600 text-xs md:text-sm mb-1 font-semibold">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Candidate Rules</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{catalogue_coverage.candidate_rules}</div>
            <p className="text-xs text-slate-400 mt-0.5">Extracted sentences</p>
          </div>

          <div
            onClick={() => onNavigate('external_refs')}
            className="p-4 md:p-5 bg-slate-50/80 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-600 text-xs md:text-sm mb-1 font-semibold">
              <ExternalLink className="w-4 h-4 text-emerald-600" />
              <span>External Refs</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{catalogue_coverage.external_references}</div>
            <p className="text-xs text-slate-400 mt-0.5">Statutory citations</p>
          </div>

          <div
            onClick={() => onNavigate('rules_governance')}
            className="p-4 md:p-5 bg-blue-50/50 border border-blue-200 rounded-xl hover:border-blue-400 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 text-blue-900 text-xs md:text-sm mb-1 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Approved Rules</span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-blue-900">{catalogue_coverage.approved_executable_rules}</div>
            <p className="text-xs text-blue-700 mt-0.5">Verified for execution</p>
          </div>
        </div>
      </div>

      {/* 5. Lower Section: Applications Requiring Operational Scrutiny */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm md:text-base font-bold uppercase tracking-wider text-slate-800 m-0">
              Applications Requiring Attention
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Active institutional submissions in queue with unresolved compliance flags or pending officer review.
            </p>
          </div>
          <button
            onClick={() => onNavigate('applications')}
            className="text-xs md:text-sm text-blue-700 hover:text-blue-900 font-semibold cursor-pointer self-start sm:self-auto"
          >
            View All Applications ({applications.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-3 text-center">Unresolved Findings</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4">Compliance Outcome</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active applications in queue.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onOpenApplication(app.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {app.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                        {app.institution_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        AY {app.academic_year} · Officer: {app.assigned_officer}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate">
                      {app.nature_of_application}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {(app.findings_count || 0) > 0 ? (
                        <span className="font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full text-xs">
                          {app.findings_count} {app.findings_count === 1 ? 'flag' : 'flags'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">0 flags</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusChip type="workflow" value={app.workflow_status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusChip type="compliance" value={app.compliance_outcome} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenApplication(app.id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-blue-700 hover:bg-blue-50 rounded-md group-hover:border-blue-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Workspace</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
