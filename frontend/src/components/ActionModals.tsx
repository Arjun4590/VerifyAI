import React, { useState } from 'react';
import { X, AlertTriangle, ArrowUpRight, CheckCircle2, Scale } from 'lucide-react';

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<void>;
  applicationId: string;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  applicationId,
}) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please provide the specific queries or documentation required from the applicant.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(notes);
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit clarification request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Request Applicant Clarification ({applicationId})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            The application status will be transitioned to <strong>Clarification requested</strong>. Please enter the specific discrepancies, missing certificates, or conflicting declarations to be communicated to the institution.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clarification Notice Text <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please provide a valid Fire Safety Certificate for AY 2026-27 and reconcile the student data portal declaration with application field Table 4.2..."
              className="w-full text-xs p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold disabled:opacity-50 transition-colors shadow-2xs"
            >
              {loading ? 'Submitting...' : 'Issue Clarification Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  applicationId: string;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  applicationId,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide the justification for escalating this case to the Senior Reviewer.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(reason);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to escalate application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Escalate Case to Senior Reviewer ({applicationId})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Escalates the case to the Senior Reviewer review queue with high priority. An automated alert will be generated.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Escalation Rationale & Officer Note <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Major contradiction between sworn affidavit and structured field, along with expired fire safety certificate. Senior review required prior to formal regulatory notice."
              className="w-full text-xs p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-md text-xs font-bold disabled:opacity-50 transition-colors shadow-2xs"
            >
              {loading ? 'Escalating...' : 'Confirm Escalation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DispositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (disposition: string, comment: string) => Promise<void>;
  applicationId: string;
}

export const DispositionModal: React.FC<DispositionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  applicationId,
}) => {
  const [disposition, setDisposition] = useState('Clarification required');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('A formal disposition comment and rationale is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(disposition, comment);
      setComment('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record disposition');
    } finally {
      setLoading(false);
    }
  };

  const dispositions = [
    { id: 'Satisfactory', label: 'Satisfactory — All Scrutiny Requirements Met' },
    { id: 'Clarification required', label: 'Clarification required — Deficiencies / Contradictions Identified' },
    { id: 'Recommend EVC inspection', label: 'Recommend EVC inspection — Physical Campus Verification Required' },
    { id: 'Refer for further consideration', label: 'Refer for further consideration — SAC / SHC Escalation' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Record Senior Reviewer Disposition ({applicationId})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
            <strong>Prototype Decision Support Label:</strong> These workflow dispositions are internal prototype status labels, not claims of an official statutory AICTE order. VerifyAI assists human officers in reaching sound decisions.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Workflow Disposition <span className="text-red-500">*</span>
            </label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 bg-white"
            >
              {dispositions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Senior Reviewer Disposition Rationale <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Concur with Scrutiny Officer Finding A and Finding B. Application placed in Clarification required status pending receipt of renewed fire certificate and reconciliation of student data upload..."
              className="w-full text-xs p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold disabled:opacity-50 transition-colors shadow-2xs"
            >
              {loading ? 'Recording...' : 'Record Formal Disposition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
