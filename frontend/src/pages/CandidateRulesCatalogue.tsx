import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api } from '../services/api';
import { CatalogueCandidateRule, DemoRole } from '../types';

interface CandidateRulesProps {
  currentRole: DemoRole;
}

export const CandidateRulesCatalogue: React.FC<CandidateRulesProps> = ({ currentRole }) => {
  const [candidates, setCandidates] = useState<CatalogueCandidateRule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selectedCand, setSelectedCand] = useState<CatalogueCandidateRule | null>(null);
  const limit = 25;

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        skip: (page * limit).toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
      if (modalityFilter) params.modality = modalityFilter;
      if (lifecycleFilter) params.lifecycle_status = lifecycleFilter;

      const res = await api.getCandidateRules(params);
      setCandidates(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, modalityFilter, lifecycleFilter, page]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Candidate Rules Library
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mined handbook clauses awaiting domain review before promotion to executable rules.
          </p>
        </div>
        <span className="font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded font-medium self-start sm:self-auto">
          {total} Candidate Sentences
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
            placeholder="Search candidate ID (e.g. R0001), clause, or sentence text..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <select
          value={modalityFilter}
          onChange={(e) => {
            setModalityFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 cursor-pointer"
        >
          <option value="">All Modalities</option>
          <option value="mandatory">Mandatory</option>
          <option value="shall">Shall</option>
          <option value="must">Must</option>
        </select>

        <select
          value={lifecycleFilter}
          onChange={(e) => {
            setLifecycleFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 cursor-pointer"
        >
          <option value="">All Lifecycle States</option>
          <option value="candidate">Candidate</option>
          <option value="needs_source_review">Needs Source Review</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-20">ID</th>
                <th className="py-2.5 px-3">Candidate Sentence Preview</th>
                <th className="py-2.5 px-2 text-center w-24">Clause / Pg</th>
                <th className="py-2.5 px-2 text-center w-20">Modality</th>
                <th className="py-2.5 px-3 w-28">Lifecycle</th>
                <th className="py-2.5 px-3 text-right w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading candidates...</td>
                </tr>
              ) : candidates.map((cand) => (
                <tr
                  key={cand.id}
                  onClick={() => setSelectedCand(cand)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                    {cand.cand_id}
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-slate-900 line-clamp-2 leading-relaxed">{cand.sentence}</p>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600 whitespace-nowrap text-[11px]">
                    <div>{cand.clause || '—'}</div>
                    <div className="text-[10px] text-slate-400">Pg {cand.page || '—'}</div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-slate-700 capitalize whitespace-nowrap text-[11px]">
                    {cand.modality || '—'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        cand.lifecycle_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cand.lifecycle_status === 'needs_source_review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cand.lifecycle_status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCand(cand);
                      }}
                      className="px-2 py-0.5 text-[11px] text-blue-700 hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                    >
                      Inspect
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
            Showing {Math.min(total, page * limit + 1)}–{Math.min(total, (page + 1) * limit)} of {total} candidate sentences
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
      {selectedCand && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-5 overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Candidate Sentence Provenance</h3>
                <span className="font-mono text-[11px] text-blue-700 font-semibold">{selectedCand.cand_id} · Clause {selectedCand.clause}</span>
              </div>
              <button
                onClick={() => setSelectedCand(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mined Sentence Text</span>
                <p className="bg-slate-50 border border-slate-200 p-3 rounded text-slate-800 leading-relaxed font-sans">
                  {selectedCand.sentence}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Handbook Page</span>
                  <strong className="text-slate-900">Page {selectedCand.page || 'Unspecified'}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Modality</span>
                  <strong className="text-slate-900 capitalize">{selectedCand.modality || 'None'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Numeric</span>
                  <span className="font-semibold text-slate-900">{selectedCand.has_number ? 'Yes' : 'No'}</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Conditional</span>
                  <span className="font-semibold text-slate-900">{selectedCand.conditional ? 'Yes' : 'No'}</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">External Ref</span>
                  <span className="font-semibold text-slate-900">{selectedCand.points_outside_handbook ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-400 block">Type Guess</span>
                <span className="font-mono text-slate-700">{selectedCand.type_guess || 'unclassified'}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                <div>Source: {selectedCand.source_workbook}</div>
                <div>Sheet: {selectedCand.sheet_name} (Row {selectedCand.source_row})</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
