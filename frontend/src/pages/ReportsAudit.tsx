import React, { useEffect, useState } from 'react';
import { FileCheck2, ExternalLink, RefreshCw, Printer } from 'lucide-react';
import { api } from '../services/api';
import { Application, AuditEvent } from '../types';
import { openReportWindow } from '../services/reportGenerator';

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

  const handleOpenPrintableReport = async () => {
    try {
      const app = await api.getApplicationDetail(selectedAppId);
      openReportWindow(app, app.documents || [], app.findings || [], audits);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
          Reports & Audit History
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate formal scrutiny reports and review chronological case activity.
        </p>
      </div>

      {/* Report Generator Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Application:</span>
          <select
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 font-semibold cursor-pointer"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.id} — {app.institution_name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenPrintableReport}
          className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Open Printable Dossier</span>
          <ExternalLink className="w-3 h-3 text-blue-200" />
        </button>
      </div>

      {/* Global Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
            Case Audit Events ({audits.length})
          </h2>
          <button
            onClick={fetchAudits}
            className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Official</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Justification / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading audit history...</td>
                </tr>
              ) : audits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No audit events recorded for this case.</td>
                </tr>
              ) : (
                audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{a.created_at}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <strong>{a.user_name}</strong> <span className="text-slate-400">({a.user_role})</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">{a.action}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {a.finding_id || a.rule_id || a.application_id || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{a.reason_comment || '—'}</td>
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
