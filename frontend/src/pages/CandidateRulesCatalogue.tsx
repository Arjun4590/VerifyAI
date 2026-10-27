import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Filter, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { CatalogueCandidateRule, DemoRole } from '../types';
import { StatusChip } from '../components/StatusChip';

interface CandidateRulesProps {
  currentRole: DemoRole;
}

export const CandidateRulesCatalogue: React.FC<CandidateRulesProps> = ({ currentRole }) => {
  const [candidates, setCandidates] = useState<CatalogueCandidateRule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        skip: (page * limit).toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
      if (typeFilter) params.type_guess = typeFilter;
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
  }, [search, typeFilter, modalityFilter, lifecycleFilter, page]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Candidate Rules Library (1,304 Extracted Clauses)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full repository of candidate rule sentences extracted from the 231-page handbook with NLP rule-mining.
          </p>
        </div>
        <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded font-semibold self-start">
          Total Candidate Sentences: {total} / 1,304
        </span>
      </div>

      {/* Critical Regulatory Gate Warning */}
      <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 leading-relaxed">
        <strong>Execution Rule Gate:</strong> Extracted candidate sentences are <strong>not executable rules</strong>. A sentence containing 'shall' or numeric thresholds is candidate language only. Only verified rules approved by a Senior Reviewer may execute in validation runs.
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
            placeholder="Search candidate ID (e.g. R0001), sentence text, or clause..."
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
          <option value="">All Type Guesses</option>
          <option value="process/prohibition">process/prohibition</option>
          <option value="threshold/numeric">threshold/numeric</option>
          <option value="document/format">document/format</option>
        </select>

        <select
          value={modalityFilter}
          onChange={(e) => {
            setModalityFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
        >
          <option value="">All Modalities</option>
          <option value="mandatory">mandatory</option>
          <option value="shall">shall</option>
          <option value="must">must</option>
        </select>

        <select
          value={lifecycleFilter}
          onChange={(e) => {
            setLifecycleFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
        >
          <option value="">All Lifecycle States</option>
          <option value="candidate">Candidate</option>
          <option value="needs_source_review">Needs Source Review</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Candidates Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Cand ID</th>
                <th className="py-2.5 px-3 text-center">Pg</th>
                <th className="py-2.5 px-3">Clause</th>
                <th className="py-2.5 px-3">Modality</th>
                <th className="py-2.5 px-4">Extracted Candidate Sentence</th>
                <th className="py-2.5 px-3">Type Guess</th>
                <th className="py-2.5 px-3 text-center">Num</th>
                <th className="py-2.5 px-3 text-center">Cond</th>
                <th className="py-2.5 px-3">Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading candidate rules...</td>
                </tr>
              ) : (
                candidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {cand.cand_id}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {cand.page || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {cand.clause || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 capitalize whitespace-nowrap">
                      {cand.modality || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 leading-relaxed max-w-lg">
                      {cand.sentence}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {cand.type_guess || '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold">
                      {cand.has_number ? <span className="text-blue-700">Yes</span> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold">
                      {cand.conditional ? <span className="text-amber-700">Yes</span> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusChip type="lifecycle" value={cand.lifecycle_status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} candidate sentences</span>
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
