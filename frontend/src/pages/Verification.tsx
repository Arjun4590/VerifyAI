import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, FileText, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Info } from 'lucide-react';
import { api } from '../services/api';
import { Application, DocumentItem } from '../types';
import { StatusChip } from '../components/StatusChip';

export const Verification: React.FC = () => {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load main demo case documents and verification attempts
    api.getApplicationDetail('VA-DEMO-2026-014').then((res) => {
      setApp(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading document verification dossier...</div>;
  }

  if (!app) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
          Document Verification & Integrity Analysis
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Cryptographic file integrity, metadata screening, and simulated issuing authority cross-checks.
        </p>
      </div>

      {/* Principle Disclaimer Box per Section 5 & 6.6 */}
      <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2 text-xs text-slate-700">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info className="w-4 h-4 text-blue-700" />
          <span>Core Integrity & Evidence Principles (Strict Decision-Support Rules)</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
          <li><strong>SHA-256 Hash Match:</strong> Proves exact bitwise duplicate file content, NOT that the certificate is genuine or authentic.</li>
          <li><strong>Digital Signature:</strong> Confirms the document has not been altered since the certificate was stamped; does not prove every factual claim is true.</li>
          <li><strong>Metadata Anomalies:</strong> Flags creation tools or altered timestamps as decision-support indicators, NOT definitive proof of forgery.</li>
          <li><strong>Simulated Issuer Check:</strong> Cross-checks registry numbers against mock authorities. Prominently labeled <strong className="text-amber-800 bg-amber-100 px-1 py-0.2 rounded font-mono">SIMULATED — NO LIVE ISSUER API</strong>.</li>
        </ul>
      </div>

      {/* Simulated Issuer Cross-Check Showcase Card */}
      <div className="bg-white border border-amber-300 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Issuing Authority External Cross-Check (Simulated Connector)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-red-800 bg-red-100 border border-red-300 px-2.5 py-1 rounded">
            SIMULATED — NO LIVE ISSUER API
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-slate-500 block text-[11px]">Connector Source</span>
              <span className="font-semibold text-slate-900">State Directorate of Fire & Rescue Services (SIMULATED)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Queried Certificate Number</span>
              <span className="font-mono font-bold text-blue-700">FS-2023-8891</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Queried Institution</span>
              <span className="font-semibold text-slate-900">{app.institution_name}</span>
            </div>
          </div>

          <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-900">Connector Verification Outcome</span>
              <StatusChip type="verification" value="Mismatch detected" />
            </div>
            <p className="text-[11px] text-red-950 mt-1 leading-relaxed">
              Automated simulated query returned registry status: <strong>EXPIRED / RENEWAL_PENDING</strong> as of evaluation date 2026-04-15.
              Manual verification by scrutiny officer is mandatory before issuing adverse notices.
            </p>
          </div>
        </div>
      </div>

      {/* File Hashes and Integrity Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Dossier Cryptographic Hash & Metadata Table
        </h3>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Document File</th>
                <th className="py-2.5 px-4">SHA-256 Digest</th>
                <th className="py-2.5 px-4">Digital Stamp / Signature</th>
                <th className="py-2.5 px-4">Producer / Creator</th>
                <th className="py-2.5 px-4">File Duplicate Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {app.documents?.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{doc.document_name}</td>
                  <td className="py-2.5 px-4 text-slate-600 truncate max-w-xs">{doc.file_hash}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-700">{doc.signature_status}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">ReportLab / PyMuPDF</td>
                  <td className="py-2.5 px-4 font-sans text-emerald-800 font-semibold">Unique (No Hash Collision)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
