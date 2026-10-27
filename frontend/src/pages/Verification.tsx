import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Application } from '../types';
import { StatusChip } from '../components/StatusChip';

export const Verification: React.FC = () => {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApplicationDetail('VA-DEMO-2026-014').then((res) => {
      setApp(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading verification status...</span>
        </div>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
          Document Verification & Integrity
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          SHA-256 file hashes, digital stamp verification, and simulated authority checks for {app.id}.
        </p>
      </div>

      {/* Simulated External Issuer Check Card */}
      <div className="bg-white border border-amber-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-slate-900">
              State Fire Services Cross-Check (Simulated)
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-red-800 bg-red-100 border border-red-200 px-2 py-0.5 rounded self-start sm:self-auto">
            SIMULATED — NO LIVE ISSUER API
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Queried Serial</span>
            <span className="font-mono font-bold text-slate-900">FSC-2023-8891</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Registry Status</span>
            <span className="font-semibold text-red-700">Expired / Renewal Pending</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Outcome</span>
            <StatusChip type="verification" value="Mismatch detected" />
          </div>
        </div>
      </div>

      {/* Verification Summary Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
            Documentary Checks Summary ({app.documents?.length || 0} Files)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Document</th>
                <th className="py-2.5 px-3">Check Performed</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Source / Mode</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {app.documents?.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{doc.document_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">SHA-256: {doc.file_hash?.substring(0, 20)}...</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    {doc.document_type === 'Fire Safety Certificate'
                      ? 'External Registry Check'
                      : doc.document_type === 'Affidavit'
                      ? 'Declaration Consistency'
                      : 'File Hash & Stamp Check'}
                  </td>
                  <td className="py-2.5 px-3">
                    {doc.document_type === 'Fire Safety Certificate' ? (
                      <StatusChip type="verification" value="Mismatch detected" />
                    ) : (
                      <StatusChip type="verification" value="Verified" />
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {doc.document_type === 'Fire Safety Certificate' ? (
                      <span className="text-[10px] font-mono text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded font-semibold">
                        SIMULATED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                        FILE INTEGRITY
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <a
                      href={`/documents/${doc.document_name}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
