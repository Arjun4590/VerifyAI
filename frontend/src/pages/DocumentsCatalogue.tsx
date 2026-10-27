import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
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
  const [selectedDoc, setSelectedDoc] = useState<CatalogueDocument | null>(null);
  const limit = 25;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Document & Checklist Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Annexure-1 and Annexure-2 requirements extracted with clause provenance and conditions.
          </p>
        </div>
        <span className="font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded font-medium self-start sm:self-auto">
          {total} Records
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
            placeholder="Search requirements by text, section title, or verifier..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <select
          value={annexureFilter}
          onChange={(e) => {
            setAnnexureFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 cursor-pointer"
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
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 cursor-pointer"
        >
          <option value="">All Kinds</option>
          <option value="document">Document / Certificate</option>
          <option value="requirement">Requirement</option>
          <option value="intro">Intro / Header</option>
          <option value="note">Regulatory Note</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-28">Section</th>
                <th className="py-2.5 px-3">Requirement Text Preview</th>
                <th className="py-2.5 px-2 text-center w-16">Page</th>
                <th className="py-2.5 px-2 text-center w-20">Condition</th>
                <th className="py-2.5 px-3 w-24">Kind</th>
                <th className="py-2.5 px-3 text-right w-16">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading requirements...</td>
                </tr>
              ) : documents.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono text-[11px] text-blue-700 font-bold whitespace-nowrap">
                    <div>{doc.section}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{doc.annexure}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-slate-900 line-clamp-2 leading-relaxed">{doc.text}</p>
                    {doc.possible_verifier && (
                      <span className="text-[10px] text-slate-500 font-mono">Verifier: {doc.possible_verifier}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">{doc.page || '—'}</td>
                  <td className="py-2.5 px-2 text-center">
                    {doc.conditional ? (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        Conditional
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Standard</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-medium capitalize">
                      {doc.kind}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(doc);
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
            Showing {Math.min(total, page * limit + 1)}–{Math.min(total, (page + 1) * limit)} of {total} records
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
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-5 overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Requirement Details</h3>
                <span className="font-mono text-[11px] text-blue-700 font-semibold">{selectedDoc.annexure} · {selectedDoc.section}</span>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Full Source Text</span>
                <p className="bg-slate-50 border border-slate-200 p-3 rounded text-slate-800 leading-relaxed font-sans">
                  {selectedDoc.text}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Handbook Page</span>
                  <strong className="text-slate-900">Page {selectedDoc.page || 'Unspecified'}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Kind</span>
                  <strong className="text-slate-900 capitalize">{selectedDoc.kind}</strong>
                </div>
              </div>

              {selectedDoc.possible_verifier && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Identified Verifier / Agency</span>
                  <span className="font-semibold text-slate-900">{selectedDoc.possible_verifier}</span>
                </div>
              )}

              {selectedDoc.refs && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-400 block">Cross References</span>
                  <span className="font-mono text-slate-700">{selectedDoc.refs}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                <div>Source File: {selectedDoc.source_workbook}</div>
                <div>Sheet: {selectedDoc.sheet_name} (Row {selectedDoc.source_row})</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
