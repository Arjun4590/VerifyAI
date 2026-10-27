import React, { useEffect, useState } from 'react';
import { ExternalLink, Search, Filter, RefreshCw, Info } from 'lucide-react';
import { api } from '../services/api';
import { CatalogueExternalRef } from '../types';

export const ExternalRefsCatalogue: React.FC = () => {
  const [refs, setRefs] = useState<CatalogueExternalRef[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [integrationFilter, setIntegrationFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchRefs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        skip: (page * limit).toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
      if (typeFilter) params.ref_type = typeFilter;
      if (integrationFilter) params.integration_status = integrationFilter;

      const res = await api.getExternalRefs(params);
      setRefs(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefs();
  }, [search, typeFilter, integrationFilter, page]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            External Reference Register (534 Handbook Citations)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserves all extracted external statutory bodies, governmental portals, and regulatory notices mentioned in handbook clauses.
          </p>
        </div>
        <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded font-semibold self-start">
          Total References: {total} / 534
        </span>
      </div>

      {/* Integration Truthfulness Banner per Section 4.2 */}
      <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Info className="w-4 h-4 text-blue-700" />
          <span>Integration Boundary Policy</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          The presence of an external statutory body or website in the handbook text does <strong>not</strong> mean an automated live API exists. External integration availability is tracked independently (Unavailable, Planned, or Simulated).
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search keywords, authority name, or cited sentence..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
        >
          <option value="">All Reference Types</option>
          <option value="external_body_or_authority">external_body_or_authority (280)</option>
          <option value="website_or_portal">website_or_portal (209)</option>
          <option value="update_by_notice">update_by_notice (100)</option>
        </select>

        <select
          value={integrationFilter}
          onChange={(e) => {
            setIntegrationFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
        >
          <option value="">All Integration Statuses</option>
          <option value="unavailable">Unavailable (Default)</option>
          <option value="planned">Planned</option>
          <option value="simulated">Simulated (Demo)</option>
        </select>
      </div>

      {/* References Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3 text-center">Pg</th>
                <th className="py-2.5 px-3">Clause</th>
                <th className="py-2.5 px-3">Reference Types</th>
                <th className="py-2.5 px-3">Keywords</th>
                <th className="py-2.5 px-4">Cited Handbook Sentence (Preserved Source)</th>
                <th className="py-2.5 px-3">Integration Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading external references...</td>
                </tr>
              ) : (
                refs.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {ref.page || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {ref.clause || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-700 whitespace-nowrap">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                        {ref.ref_types}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-blue-800 whitespace-nowrap">
                      {ref.keywords || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 leading-relaxed max-w-lg">
                      {ref.sentence}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ref.integration_status === 'simulated' ? 'bg-amber-100 text-amber-800' :
                        ref.integration_status === 'planned' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {ref.integration_status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} external references</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 border border-slate-300 rounded bg-white disabled:opacity-50 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-2.5 py-1 border border-slate-300 rounded bg-white disabled:opacity-50 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
