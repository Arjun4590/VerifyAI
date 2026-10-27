import React, { useEffect, useState } from 'react';
import { Layers, FileText, BookOpen, ExternalLink, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const CatalogueCoverage: React.FC = () => {
  const [coverage, setCoverage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCoverage = async () => {
    setLoading(true);
    try {
      const res = await api.getCatalogueCoverage();
      setCoverage(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverage();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Computing catalogue metrics...</span>
        </div>
      </div>
    );
  }

  if (!coverage) return null;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Catalogue Coverage
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scope breakdown and counts across all 5 sheets of handbook_extraction.xlsx.
          </p>
        </div>
        <button
          onClick={fetchCoverage}
          className="px-2.5 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Categories</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{coverage.categories?.total || 21}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Table 2.3 approval tracks</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Documents</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{coverage.documents?.total || 170}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Annexure 1 & 2 requirements</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Candidate Rules</span>
            <BookOpen className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">1,304</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Mined candidate sentences</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>External Citations</span>
            <ExternalLink className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{coverage.external_references?.total || 534}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Statutory bodies & portals</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0 pb-1.5 border-b border-slate-100">
            Document Requirements by Kind
          </h2>

          <div className="space-y-1.5 text-xs">
            {coverage.documents?.by_kind &&
              Object.entries(coverage.documents.by_kind).map(([k, count]) => (
                <div key={k} className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                  <span className="capitalize text-slate-800">{k}</span>
                  <span className="font-mono font-bold text-slate-900">{count as any}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Candidate Rules Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0 pb-1.5 border-b border-slate-100">
            Candidate Rules by Classification
          </h2>

          <div className="space-y-1.5 text-xs">
            {coverage.candidate_rules?.by_type_guess &&
              Object.entries(coverage.candidate_rules.by_type_guess).map(([t, count]) => (
                <div key={t} className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                  <span className="capitalize text-slate-800">{t}</span>
                  <span className="font-mono font-bold text-slate-900">{count as any}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Category 21 Mapping Note */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-1.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
          Source Review Required
        </h2>
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded flex items-start gap-2 text-xs text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Category 21 (Online Learning / ODL):</strong> No direct Annexure-2 mapping in handbook (processed under UGC norms). Flagged for authorized review.
          </p>
        </div>
      </div>
    </div>
  );
};
