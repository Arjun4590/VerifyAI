import React, { useEffect, useState } from 'react';
import { Search, AlertTriangle, Edit3, X } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Application Categories
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Table 2.3 approval tracks, scrutiny requirements, and Annexure-2 checklist mappings.
          </p>
        </div>
        <span className="font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded font-medium self-start sm:self-auto">
          {categories.length} Categories
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by label, clause, or section..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <select
          value={mappingFilter}
          onChange={(e) => setMappingFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-700 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="extracted">Extracted</option>
          <option value="unresolved_needs_review">Needs Review</option>
          <option value="by_reference">By Reference</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">ID</th>
                <th className="py-2.5 px-3">Nature of Application</th>
                <th className="py-2.5 px-2 text-center">Self-Disc</th>
                <th className="py-2.5 px-2 text-center">Scrutiny</th>
                <th className="py-2.5 px-2 text-center">EVC</th>
                <th className="py-2.5 px-2 text-center">SAC/SHC</th>
                <th className="py-2.5 px-3">Annexure-2 Sections</th>
                <th className="py-2.5 px-3">Mapping Status</th>
                {canEditMapping && <th className="py-2.5 px-2 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading categories...</td>
                </tr>
              ) : categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">{cat.cat_id}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{cat.nature_of_application}</div>
                    {cat.note && <div className="text-[10px] text-slate-500">{cat.note}</div>}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">{cat.self_disclosure || '-'}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">{cat.scrutiny || '-'}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">{cat.evc || '-'}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">{cat.sac_shc || '-'}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800">
                    {cat.annexure2_sections || '-'}
                  </td>
                  <td className="py-2.5 px-3">
                    {cat.mapping_status === 'unresolved_needs_review' ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        <span>Needs Review</span>
                      </span>
                    ) : cat.mapping_status === 'by_reference' ? (
                      <span className="bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        By Reference
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.2 rounded">
                        Extracted
                      </span>
                    )}
                  </td>
                  {canEditMapping && (
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => {
                          setEditingCat(cat);
                          setMappingStatus(cat.mapping_status);
                          setMappingNotes(cat.mapping_notes || '');
                        }}
                        className="p-1 text-slate-500 hover:text-blue-700 rounded hover:bg-slate-100 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm m-0">
                Category {editingCat.cat_id} Mapping Review
              </h3>
              <button onClick={() => setEditingCat(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-700 font-semibold">{editingCat.nature_of_application}</p>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Mapping Status</label>
              <select
                value={mappingStatus}
                onChange={(e) => setMappingStatus(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
              >
                <option value="extracted">Extracted</option>
                <option value="unresolved_needs_review">Unresolved (Needs Review)</option>
                <option value="by_reference">Includes by Reference</option>
                <option value="verified">Verified against Handbook</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Review Notes</label>
              <textarea
                rows={2}
                value={mappingNotes}
                onChange={(e) => setMappingNotes(e.target.value)}
                placeholder="Authorized review note..."
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingCat(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMapping}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
