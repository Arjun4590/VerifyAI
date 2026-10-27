import React, { useEffect, useState } from 'react';
import { Layers, Search, AlertTriangle, CheckCircle2, RefreshCw, Edit3, X } from 'lucide-react';
import { api } from '../services/api';
import { CatalogueCategory, DemoRole } from '../types';

interface CategoriesCatalogueProps {
  currentRole: DemoRole;
}

export const CategoriesCatalogue: React.FC<CategoriesCatalogueProps> = ({ currentRole }) => {
  const [categories, setCategories] = useState<CatalogueCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mappingFilter, setMappingFilter] = useState('');

  // Mapping correction modal state
  const [editingCat, setEditingCat] = useState<CatalogueCategory | null>(null);
  const [mappingStatus, setMappingStatus] = useState('extracted');
  const [mappingNotes, setMappingNotes] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (mappingFilter) params.mapping_status = mappingFilter;
      const res = await api.getCategories(params);
      setCategories(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search, mappingFilter]);

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    await api.updateCategoryMapping(editingCat.cat_id, mappingStatus, mappingNotes);
    setEditingCat(null);
    fetchCategories();
  };

  const canEditMapping = currentRole === 'system_admin' || currentRole === 'senior_reviewer';

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Application Categories Catalogue (Table 2.3)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Preserves all 21 extracted application categories, exact labels, scrutiny indicators, and Annexure-2 mappings.
          </p>
        </div>
        <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded font-semibold self-start">
          Total Categories: {categories.length} / 21
        </span>
      </div>

      {/* Unresolved mapping note */}
      <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Regulatory Integrity Rule:</strong> Category 21 (Online Learning / ODL courses) has no Annexure-2 section in the handbook. VerifyAI does not invent a fictional checklist; it displays the unresolved mapping warning and requires authorized source review.
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by category name, section, or notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <select
          value={mappingFilter}
          onChange={(e) => setMappingFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700"
        >
          <option value="">All Mapping Statuses</option>
          <option value="extracted">Extracted</option>
          <option value="unresolved_needs_review">Unresolved (Needs Review)</option>
          <option value="by_reference">Includes by Reference</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center">ID</th>
                <th className="py-3 px-4">Nature of Application (Exact Source Label)</th>
                <th className="py-3 px-3 text-center">Self-Disc</th>
                <th className="py-3 px-3 text-center">Scrutiny</th>
                <th className="py-3 px-3 text-center">EVC</th>
                <th className="py-3 px-3 text-center">SAC/SHC</th>
                <th className="py-3 px-4">Annexure-2 Sections</th>
                <th className="py-3 px-3 text-center">Docs</th>
                <th className="py-3 px-4">Mapping Status</th>
                {canEditMapping && <th className="py-3 px-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">Loading categories...</td>
                </tr>
              ) : categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{cat.cat_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm">
                    {cat.nature_of_application}
                    {cat.note && <div className="text-[11px] text-blue-700 mt-0.5 font-normal">Note: {cat.note}</div>}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600">{cat.self_disclosure || '-'}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600">{cat.scrutiny || '-'}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600">{cat.evc || '-'}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600">{cat.sac_shc || '-'}</td>
                  <td className="py-3 px-4 font-mono text-slate-800">
                    {cat.annexure2_sections || '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">{cat.own_document_items || 0}</td>
                  <td className="py-3 px-4">
                    {cat.mapping_status === 'unresolved_needs_review' ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        Needs Source Review
                      </span>
                    ) : cat.mapping_status === 'by_reference' ? (
                      <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        By Reference
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-medium px-2 py-0.5 rounded">
                        Extracted
                      </span>
                    )}
                  </td>
                  {canEditMapping && (
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setEditingCat(cat);
                          setMappingStatus(cat.mapping_status);
                          setMappingNotes(cat.mapping_notes || '');
                        }}
                        className="p-1 text-slate-500 hover:text-blue-700 rounded hover:bg-slate-100"
                        title="Edit Mapping Status"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mapping Correction Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Authorized Category Mapping Review (Cat {editingCat.cat_id})
              </h3>
              <button onClick={() => setEditingCat(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 font-semibold">{editingCat.nature_of_application}</p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mapping Status</label>
              <select
                value={mappingStatus}
                onChange={(e) => setMappingStatus(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white"
              >
                <option value="extracted">Extracted</option>
                <option value="unresolved_needs_review">Unresolved (Needs Review)</option>
                <option value="by_reference">Includes by Reference</option>
                <option value="verified">Verified against Handbook</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Review Notes & Reference</label>
              <textarea
                rows={3}
                value={mappingNotes}
                onChange={(e) => setMappingNotes(e.target.value)}
                placeholder="Enter authorized review note regarding section mapping..."
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingCat(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMapping}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
