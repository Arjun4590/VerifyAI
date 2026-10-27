import React, { useEffect, useState } from 'react';
import { FileText, Search, Filter, RefreshCw, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../services/api';
import { CatalogueDocument } from '../types';

export const DocumentsCatalogue: React.FC = () => {
  const [documents, setDocuments] = useState<CatalogueDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [annexureFilter, setAnnexureFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        skip: (page * limit).toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
      if (annexureFilter) params.annexure = annexureFilter;
      if (kindFilter) params.kind = kindFilter;

      const res = await api.getCatalogueDocuments(params);
      setDocuments(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, annexureFilter, kindFilter, page]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Document & Requirement Catalogue (Annexure 1 & 2)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete catalogue of all 170 extracted requirement rows from Annexure-1 and Annexure-2.
          </p>
        </div>
        <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded font-semibold self-start">
          Total Catalogue Records: {total} / 170
        </span>
      </div>

      {/* Distinction Note per Section 4.2 */}
      <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700">
        <strong>Kind Distinction:</strong> Rows are separated into <strong>document/requirement</strong> (61 items), <strong>intro/condition</strong> (48 items), and <strong>note</strong> rows to maintain strict regulatory context.
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
            placeholder="Search document text, section title, or verifier..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <select
          value={annexureFilter}
          onChange={(e) => {
            setAnnexureFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
        >
          <option value="">All Annexures</option>
          <option value="Annexure-1">Annexure-1 (New / Change of Site)</option>
          <option value="Annexure-2">Annexure-2 (Existing / EoA Categories)</option>
        </select>

        <select
          value={kindFilter}
          onChange={(e) => {
            setKindFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
        >
          <option value="">All Kinds</option>
          <option value="document/requirement">document/requirement</option>
          <option value="intro/condition">intro/condition</option>
          <option value="note">note</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Annexure & Section</th>
                <th className="py-2.5 px-3 text-center">Item</th>
                <th className="py-2.5 px-3 text-center">Pg</th>
                <th className="py-2.5 px-4">Extracted Requirement Text (Preserved Source)</th>
                <th className="py-2.5 px-3">Kind</th>
                <th className="py-2.5 px-3 text-center">Cond.</th>
                <th className="py-2.5 px-3">Possible Verifier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading documents catalogue...</td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{doc.annexure}</div>
                      <div className="font-mono text-[11px] text-blue-700">{doc.section}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {doc.item_no || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {doc.page || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 leading-relaxed max-w-lg">
                      <p>{doc.text}</p>
                      {doc.section_title && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Section Title: {doc.section_title}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        doc.kind === 'document/requirement' ? 'bg-blue-100 text-blue-800' :
                        doc.kind === 'intro/condition' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {doc.kind}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold">
                      {doc.conditional ? (
                        <span className="text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[10px]">Yes</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                      {doc.possible_verifier || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} records</span>
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
