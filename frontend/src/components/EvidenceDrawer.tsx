import React, { useState } from 'react';
import {
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Finding, DocumentItem, DemoRole } from '../types';
import { StatusChip } from './StatusChip';

interface EvidenceDrawerProps {
  finding: Finding | null;
  onClose: () => void;
  onReview: (findingId: string, action: string, reason: string) => Promise<void>;
  currentRole: DemoRole;
  documents?: DocumentItem[];
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  finding,
  onClose,
  onReview,
  currentRole,
  documents = []
}) => {
  const [reviewAction, setReviewAction] = useState<'confirm' | 'dismiss' | 'clarification_requested'>('confirm');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!finding) return null;

  const doc = documents.find(d => d.id === finding.document_id);
  const canReview = currentRole === 'scrutiny_officer' || currentRole === 'senior_reviewer';

  const handleSubmitReview = async () => {
    if (!reason.trim()) {
      setSubmitError('A written reason is required to record a formal human review action.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onReview(finding.id, reviewAction, reason);
      setReason('');
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                {finding.id}
              </span>
              <StatusChip type="compliance" value={finding.outcome} />
              <StatusChip type="processing" value={finding.processing_status} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {finding.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Category: <span className="font-semibold text-slate-700">{finding.category}</span> | Rule Code: <span className="font-mono font-semibold text-blue-700">{finding.rule_code}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Finding Explanation */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Regulatory Analysis & Finding Rationale
                </h4>
                <p className="text-xs text-blue-950 mt-1 leading-relaxed">
                  {finding.plain_reason}
                </p>
              </div>
            </div>
          </div>

          {/* Expected vs Observed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-3.5">
              <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider block mb-1">
                Expected Value (Regulatory Standard)
              </span>
              <p className="text-xs font-medium text-emerald-950">
                {finding.expected_value || 'Compliant with prescribed regulatory handbook norm'}
              </p>
            </div>

            <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-3.5">
              <span className="text-[11px] font-bold uppercase text-amber-800 tracking-wider block mb-1">
                Observed Value (Application / Evidence)
              </span>
              <p className="text-xs font-medium text-amber-950 font-mono">
                {finding.observed_value || 'Non-compliant or conflicting declaration detected'}
              </p>
            </div>
          </div>

          {/* Document & Evidence Excerpt */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">
                  Documentary Evidence Citation
                </span>
              </div>
              {finding.source_page && (
                <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  Page {finding.source_page}
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              {doc && (
                <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
                  <span>Document: <strong className="text-slate-900">{doc.document_name}</strong></span>
                  <a
                    href={`/api/applications/documents/${doc.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold"
                  >
                    <span>Open Synthetic PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Text Snippet / Evidence */}
              <div className="bg-slate-900 text-slate-100 font-mono text-xs p-3.5 rounded-md leading-relaxed whitespace-pre-wrap">
                {finding.evidence_text || 'No direct text excerpt recorded.'}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Extraction Mode: <strong className="text-slate-700">{finding.is_fixture_derived ? 'Fixture-Derived Benchmark' : 'PyMuPDF Document Extracted'}</strong></span>
                <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  SYNTHETIC DEMO DOCUMENT — NOT FOR OFFICIAL USE
                </span>
              </div>
            </div>
          </div>

          {/* Current Review Status / History */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Human Review Status
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-600">Current Status:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                finding.review_status === 'confirmed' ? 'bg-red-100 text-red-800' :
                finding.review_status === 'dismissed' ? 'bg-emerald-100 text-emerald-800' :
                finding.review_status === 'clarification_requested' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-200 text-slate-700'
              }`}>
                {finding.review_status}
              </span>
            </div>
            {finding.reviewer_name && (
              <div className="text-xs text-slate-600 space-y-1">
                <p>Reviewed By: <strong>{finding.reviewer_name}</strong> ({finding.reviewer_role})</p>
                <p>Reason: <em>"{finding.reviewer_reason}"</em></p>
                {finding.reviewed_at && (
                  <p className="text-[11px] text-slate-400">Timestamp: {new Date(finding.reviewed_at).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>

          {/* Review Action Form */}
          {canReview ? (
            <div className="border border-blue-200 bg-white rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Record Scrutiny Officer Action
              </h4>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAction('confirm')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold border transition-colors ${
                    reviewAction === 'confirm'
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Confirm Finding
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('dismiss')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold border transition-colors ${
                    reviewAction === 'dismiss'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Dismiss with Reason
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('clarification_requested')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold border transition-colors ${
                    reviewAction === 'clarification_requested'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Request Clarification
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Officer Review Rationale / Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter specific regulatory justification, reference clause, or applicant clarification query..."
                  rows={3}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-600 font-medium">{submitError}</p>
              )}

              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submitting}
                className="w-full py-2 bg-blue-700 text-white rounded-md text-xs font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-2xs"
              >
                {submitting ? 'Submitting Action...' : 'Save & Persist Review Decision'}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 text-center">
              System Admin role cannot confirm or dismiss scrutiny findings per regulatory governance policies.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-md text-xs font-medium hover:bg-slate-100"
          >
            Close Evidence Panel
          </button>
        </div>
      </div>
    </div>
  );
};
