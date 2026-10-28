import React, { useState } from 'react';
import { X, Building2, Plus, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface IntakeApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newAppId: string) => void;
}

export const IntakeApplicationModal: React.FC<IntakeApplicationModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [trustName, setTrustName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026–27');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [natureOfApplication, setNatureOfApplication] = useState(
    'Category 1: Extension of Approval (EoA) based on Self-Disclosure'
  );
  const [intakeCapacity, setIntakeCapacity] = useState<number>(360);
  const [landAreaAcres, setLandAreaAcres] = useState<number>(5.5);
  const [builtUpAreaSqm, setBuiltUpAreaSqm] = useState<number>(12000);
  const [assignedOfficer, setAssignedOfficer] = useState('Officer A');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setCategoryId(val);
    const catLabels: Record<number, string> = {
      1: 'Category 1: Extension of Approval (EoA) based on Self-Disclosure',
      2: 'Category 2: Increase in Intake / Additional Course(s)',
      3: 'Category 3: Introduction of Supernumerary Seats (OCI/FN/NRI/TFW)',
      4: 'Category 4: Setting up New Technical Institution',
      7: 'Category 7: Change of Site / Location'
    };
    setNatureOfApplication(catLabels[val] || `Category ${val} Application`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim()) {
      setError('Institution Name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const generatedCode = institutionCode.trim() || `AICTE-1-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const newApp = await api.intakeApplication({
        institution_name: institutionName.trim(),
        institution_code: generatedCode,
        trust_name: trustName.trim() || `${institutionName.trim()} Foundation`,
        academic_year: academicYear,
        nature_of_application: natureOfApplication,
        category_id: categoryId,
        intake_capacity: Number(intakeCapacity) || 300,
        land_area_acres: Number(landAreaAcres) || 5.0,
        built_up_area_sqm: Number(builtUpAreaSqm) || 10000,
        assigned_officer: assignedOfficer,
        notes: notes.trim() || 'Institutional application registered via intake workflow.'
      });

      onCreated(newApp.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight m-0">
                Register New Institutional Application
              </h2>
              <p className="text-[11px] text-slate-500 m-0">
                AICTE Approval Process Handbook (APH 2026–27) Intake Workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs font-medium">
              {error}
            </div>
          )}

          {/* Institutional Identity */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 m-0">
              Institutional Identity & Registration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Institution Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Dr. B. R. Ambedkar Institute of Technology & Engineering"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  AICTE Permanent Institution ID
                </label>
                <input
                  type="text"
                  value={institutionCode}
                  onChange={(e) => setInstitutionCode(e.target.value)}
                  placeholder="Leave blank for auto-generation (e.g. AICTE-1-49910291)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Trust / Sponsoring Society Name
                </label>
                <input
                  type="text"
                  value={trustName}
                  onChange={(e) => setTrustName(e.target.value)}
                  placeholder="e.g. National Educational & Research Foundation"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-xs"
                />
              </div>
            </div>
          </div>

          {/* Regulatory Category & Reviewer */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 m-0">
              Regulatory Category & Scrutiny Assignment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Application Category (APH 2026–27)
                </label>
                <select
                  value={categoryId}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value={1}>Category 1: Extension of Approval (EoA) based on Self-Disclosure</option>
                  <option value={2}>Category 2: Increase in Intake / Additional Course(s)</option>
                  <option value={3}>Category 3: Introduction of Supernumerary Seats (OCI/FN/NRI/TFW)</option>
                  <option value={4}>Category 4: Setting up New Technical Institution</option>
                  <option value={7}>Category 7: Change of Site / Location</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="2026–27">2026–27 (Current)</option>
                  <option value="2025–26">2025–26</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1">
                  Assigned Scrutiny Officer
                </label>
                <select
                  value={assignedOfficer}
                  onChange={(e) => setAssignedOfficer(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="Officer A">Officer A (Scrutiny Officer)</option>
                  <option value="Senior Reviewer">Senior Reviewer (Review Authority)</option>
                  <option value="Technical Officer">Technical Officer (Regional Office)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Infrastructure & Capacity */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 m-0">
              Capacity & Infrastructure Declarations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Total Student Intake
                </label>
                <input
                  type="number"
                  min={60}
                  step={30}
                  value={intakeCapacity}
                  onChange={(e) => setIntakeCapacity(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Total Land Area (Acres)
                </label>
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={landAreaAcres}
                  onChange={(e) => setLandAreaAcres(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Built-up Area (sq.m)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={builtUpAreaSqm}
                  onChange={(e) => setBuiltUpAreaSqm(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-xs"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Initial Scrutiny Remarks / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sponsoring trust has uploaded registered title deed and self-disclosure affidavit for expedited scrutiny."
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-xs"
            />
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded text-[11px] text-blue-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Automated Workflow Initialization:</strong> Registering this application will automatically generate its dossier, seed required Annexure compliance items, create initial verification checkpoints, and record an immutable audit entry.
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{loading ? 'Registering...' : 'Register Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
