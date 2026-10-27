import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, FileText, ExternalLink, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';
import { Application, DocumentItem } from '../types';
import { StatusChip } from '../components/StatusChip';

export const Verification: React.FC = () => {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

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

  const toggleDocExpand = (docId: string) => {
    setExpandedDocId(expandedDocId === docId ? null : docId);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
          Document Verification & Integrity
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          SHA-256 file hashes, digital stamp verification, and authority registry checks for {app.id}.
        </p>
      </div>

      {/* Authority Registry Check Summary Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-900">
              State Fire Services Registry Cross-Check
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded self-start sm:self-auto">
            Simulated Authority Connector
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

      {/* Verification Summary Table (Progressive Disclosure) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
            Documentary Checks ({app.documents?.length || 0} Files)
          </h2>
          <span className="text-[11px] text-slate-400">Click row for cryptographic hash & audit record</span>
        </div>

        <div className="divide-y divide-slate-100">
          {app.documents?.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            const isFireDoc = doc.document_type === 'Fire Safety Certificate';
            const checkType = isFireDoc
              ? 'External Registry Check'
              : doc.document_type === 'Affidavit'
              ? 'Declaration Consistency'
              : 'File Hash & Stamp Check';
            const resultVal = isFireDoc ? 'Mismatch detected' : 'Verified';
            const sourceMode = isFireDoc ? 'Mock Authority' : 'File Integrity';

            return (
              <div key={doc.id} className="group transition-colors">
                {/* Main Compact Row */}
                <div
                  onClick={() => toggleDocExpand(doc.id)}
                  className="p-3 hover:bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                        {doc.document_name}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                        {doc.page_count} {doc.page_count === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>

                    {/* Smooth Hover / Focus preview */}
                    {!isExpanded && (
                      <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-5 group-hover:opacity-100 transition-all duration-150 text-[10px] text-slate-400 font-mono pt-0.5 truncate">
                        Check: {checkType} · Source: {sourceMode}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-auto">
                    <span className="text-slate-600 hidden md:inline text-[11px]">{checkType}</span>
                    <StatusChip type="verification" value={resultVal} />
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      {sourceMode}
                    </span>
                    <span className="text-blue-600 hover:text-blue-800 text-xs font-semibold inline-flex items-center gap-0.5">
                      <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-2 bg-slate-50/80 border-t border-slate-100 space-y-2 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Cryptographic Hash</span>
                        <p className="font-mono text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-200 break-all select-all">
                          SHA-256: {doc.file_hash}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Check Outcome</span>
                        <p className="text-slate-700">
                          {isFireDoc
                            ? 'Simulated query returned: Expired on 31 Dec 2025. Flagged for officer review.'
                            : 'Digital file structure intact. File hash validated against submission record.'}
                        </p>
                        <a
                          href={`/documents/${doc.document_name}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-semibold"
                        >
                          <span>Open PDF Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
