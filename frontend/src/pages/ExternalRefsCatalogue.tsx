import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api } from '../services/api';
import { CatalogueExternalRef } from '../types';

export const ExternalRefsCatalogue: React.FC = () => {
  const [refs, setRefs] = useState<CatalogueExternalRef[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [integrationFilter, setIntegrationFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRef, setSelectedRef] = useState<CatalogueExternalRef | null>(null);
  const limit = 25;

  const fetchRefs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        skip: (page * limit).toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
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
  }, [search, integrationFilter, page]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            External Reference Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statutory bodies, government portals, and regulatory notices cited in handbook clauses.
          </p>
        </div>
        <span className="font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded font-medium self-start sm:self-auto">
          {total} References
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search keywords, statutory authority name, or citation..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <select
          value={integrationFilter}
          onChange={(e) => {
            setIntegrationFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 cursor-pointer"
        >
          <option value="">All Integration Statuses</option>
          <option value="simulated">Simulated Demo Mock</option>
          <option value="unavailable">API Unavailable (Handbook Citation)</option>
          <option value="planned">Planned Connector</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-44">Cited Keyword / Authority</th>
                <th className="py-2.5 px-3">Handbook Citation Sentence</th>
                <th className="py-2.5 px-2 text-center w-16">Page</th>
                <th className="py-2.5 px-3 w-32">Integration Status</th>
                <th className="py-2.5 px-3 text-right w-16">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading external references...</td>
                </tr>
              ) : refs.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRef(r)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    <div>{r.keywords || 'Statutory Citation'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.clause || 'Clause Ref'}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-slate-800 line-clamp-2 leading-relaxed">{r.sentence}</p>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">{r.page || '—'}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {r.integration_status === 'simulated' ? (
                      <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                        SIMULATED
                      </span>
                    ) : r.integration_status === 'planned' ? (
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                        Planned
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded">
                        No Live API
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRef(r);
                      }}
                      className="px-2 py-0.5 text-[11px] text-blue-700 hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {Math.min(total, page * limit + 1)}–{Math.min(total, (page + 1) * limit)} of {total} references
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono font-medium">Page {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Drawer */}
      {selectedRef && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-5 overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Reference Provenance</h3>
                <span className="font-mono text-[11px] text-blue-700 font-semibold">{selectedRef.keywords}</span>
              </div>
              <button
                onClick={() => setSelectedRef(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Citing Sentence</span>
                <p className="bg-slate-50 border border-slate-200 p-3 rounded text-slate-800 leading-relaxed font-sans">
                  {selectedRef.sentence}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Handbook Page</span>
                  <strong className="text-slate-900">Page {selectedRef.page || 'Unspecified'}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Integration Status</span>
                  <strong className="text-slate-900 capitalize">{selectedRef.integration_status}</strong>
                </div>
              </div>

              {selectedRef.notes && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Notes</span>
                  <p className="text-slate-700">{selectedRef.notes}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                <div>Source: {selectedRef.source_workbook}</div>
                <div>Sheet: {selectedRef.sheet_name} (Row {selectedRef.source_row})</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
