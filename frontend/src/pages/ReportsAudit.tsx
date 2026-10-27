import React, { useEffect, useState } from 'react';
import { FileCheck2, Download, ExternalLink, Search, RefreshCw, Calendar, History, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { Application, AuditEvent } from '../types';

export const ReportsAudit: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState('VA-DEMO-2026-014');
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApplications().then((apps) => {
      setApplications(apps);
      if (apps.length > 0 && !selectedAppId) {
        setSelectedAppId(apps[0].id);
      }
    });
  }, []);

  const fetchAudits = async () => {
    if (!selectedAppId) return;
    setLoading(true);
    try {
      const res = await api.getApplicationAudit(selectedAppId);
      setAudits(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [selectedAppId]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
          Regulatory Reports & Persistent Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate formal decision-support dossiers with evidence citations, rule outcomes, and immutable audit logs.
        </p>
      </div>

      {/* Report Generator Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Generate Official Regulatory Scrutiny Dossier
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an institutional submission to inspect or print its formal compliance report.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-800 font-semibold"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.id} — {app.institution_name}
                </option>
              ))}
            </select>

            <a
              href={`/api/applications/${selectedAppId}/report?format=html`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>Open Printable Report</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Report Preview Highlights */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span>Mandatory Report Content:</span>
            <span className="font-semibold text-emerald-800">100% Compliant Dossier Structure</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-slate-700 pt-1">
            <div className="p-2 bg-white rounded border border-slate-200">
              ✓ Application Metadata & Fixed Eval Date
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              ✓ Rule Set v1.0 & Version Outcomes
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              ✓ Evidence Citations & Pages
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              ✓ SIMULATED Issuer Check Labeling
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Audit Trail Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Immutable Audit Events Log ({selectedAppId})
            </h3>
          </div>
          <button
            onClick={fetchAudits}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Log</span>
          </button>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Officer / User</th>
                <th className="py-2.5 px-3">Previous Status</th>
                <th className="py-2.5 px-3">New Status</th>
                <th className="py-2.5 px-4">Reason / Notes / Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading audit events...</td>
                </tr>
              ) : audits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No audit events recorded for this application yet.</td>
                </tr>
              ) : (
                audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                        {a.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      <strong>{a.user_name}</strong> <span className="text-slate-400">({a.user_role})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{a.previous_status || '-'}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700 whitespace-nowrap">{a.new_status || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-800 leading-relaxed max-w-md">
                      {a.reason_comment || '-'}
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
