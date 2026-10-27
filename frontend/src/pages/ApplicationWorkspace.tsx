import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Play,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  FileCheck2,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Application, Finding, DemoRole, AuditEvent } from '../types';
import { StatusChip } from '../components/StatusChip';
import { EvidenceDrawer } from '../components/EvidenceDrawer';
import { ClarificationModal, EscalationModal, DispositionModal } from '../components/ActionModals';
import { openReportWindow } from '../services/reportGenerator';

import { CompactFindingCard } from '../components/CompactFindingCard';

interface ApplicationWorkspaceProps {
  applicationId: string;
  onBack: () => void;
  currentRole: DemoRole;
}

export const ApplicationWorkspace: React.FC<ApplicationWorkspaceProps> = ({
  applicationId,
  onBack,
  currentRole,
}) => {
  const [app, setApp] = useState<Application | null>(null);
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<'findings' | 'documents' | 'data' | 'summary' | 'audit'>('findings');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [showClarification, setShowClarification] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);

  const fetchApplication = async () => {
    try {
      const data = await api.getApplicationDetail(applicationId);
      setApp(data);
      const auditLog = await api.getApplicationAudit(applicationId);
      setAudits(auditLog);
    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', message: err.message || 'Error loading application' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const handleRunValidation = async () => {
    setValidating(true);
    setNotification(null);
    try {
      const res = await api.runValidation(applicationId);
      await fetchApplication();
      setNotification({
        type: 'success',
        message: `Validation completed: Evaluated ${res.rules_evaluated} approved rules. ${res.deficiency_count} deficiencies flagged.`,
      });
      setActiveTab('findings');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Validation failed' });
    } finally {
      setValidating(false);
    }
  };

  const handleReviewFinding = async (findingId: string, action: string, reason: string) => {
    await api.reviewFinding(findingId, action, reason);
    await fetchApplication();
    setNotification({
      type: 'success',
      message: `Review decision saved for finding ${findingId}.`,
    });
  };

  const handleClarificationSubmit = async (notes: string) => {
    await api.requestClarification(applicationId, notes);
    await fetchApplication();
    setNotification({
      type: 'success',
      message: `Clarification request recorded. Workflow status updated to 'Clarification requested'.`,
    });
  };

  const handleEscalationSubmit = async (reason: string) => {
    await api.escalateApplication(applicationId, reason);
    await fetchApplication();
    setNotification({
      type: 'success',
      message: `Application escalated to Senior Reviewer.`,
    });
  };

  const handleDispositionSubmit = async (disposition: string, comment: string) => {
    await api.recordDisposition(applicationId, disposition, comment);
    await fetchApplication();
    setNotification({
      type: 'success',
      message: `Senior Reviewer disposition '${disposition}' recorded. Workflow status: Completed.`,
    });
  };

  const handleOpenReport = () => {
    if (!app) return;
    openReportWindow(app, app.documents || [], app.findings || [], audits);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading Review Workspace ({applicationId})...</span>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
        Application {applicationId} not found.
      </div>
    );
  }

  const isSeniorReviewer = currentRole === 'senior_reviewer';
  const isOfficer = currentRole === 'scrutiny_officer';
  const isAdmin = currentRole === 'system_admin';

  return (
    <div className="space-y-3.5">
      {/* 1. Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-2.5 py-1.5 rounded hover:bg-slate-50 transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Applications</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Run Validation */}
          <button
            onClick={handleRunValidation}
            disabled={validating || isAdmin}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title={isAdmin ? 'System Admin cannot run case validation' : 'Run regulatory rule checks'}
          >
            <Play className={`w-3.5 h-3.5 fill-white ${validating ? 'animate-spin' : ''}`} />
            <span>{validating ? 'Evaluating...' : 'Run Validation'}</span>
          </button>

          {/* Request Clarification */}
          {(isOfficer || isSeniorReviewer) && (
            <button
              onClick={() => setShowClarification(true)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Clarification</span>
            </button>
          )}

          {/* Escalate Case */}
          {isOfficer && (
            <button
              onClick={() => setShowEscalation(true)}
              className="px-3 py-1.5 bg-white border border-purple-300 text-purple-800 hover:bg-purple-50 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Escalate</span>
            </button>
          )}

          {/* Senior Reviewer Disposition */}
          {isSeniorReviewer && (
            <button
              onClick={() => setShowDisposition(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record Disposition</span>
            </button>
          )}

          {/* Open Printable Report */}
          <button
            onClick={handleOpenReport}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-2.5 rounded text-xs font-medium flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs font-bold px-1 hover:opacity-75 cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* 2. Streamlined Application Summary Card (Progressive Disclosure) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {app.id}
              </span>
              <span className="text-slate-600 font-medium">AY {app.academic_year}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 truncate max-w-md">{app.nature_of_application}</span>
              {app.assigned_officer && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">
                    Officer: <strong className="text-slate-700 font-medium">{app.assigned_officer}</strong>
                  </span>
                </>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 m-0 leading-tight truncate">
              {app.institution_name}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-center flex-shrink-0">
            <StatusChip type="workflow" value={app.workflow_status} />
            <StatusChip type="compliance" value={app.compliance_outcome} />
            <StatusChip type="verification" value={app.verification_status} />
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold">
          {[
            { id: 'findings', label: `Findings (${app.findings?.length || 0})` },
            { id: 'documents', label: `Documents (${app.documents?.length || 0})` },
            { id: 'data', label: `Application Data (${app.fields?.length || 0})` },
            { id: 'summary', label: 'Institutional Details' },
            { id: 'audit', label: `Audit Trail (${audits.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-700 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Findings (DEFAULT VIEW — Progressive Disclosure Cards) */}
      {activeTab === 'findings' && (
        <div className="space-y-2">
          {(!app.findings || app.findings.length === 0) ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-xs">
              No findings recorded. Click "Run Validation" to evaluate rules.
            </div>
          ) : (
            app.findings.map((f) => (
              <CompactFindingCard
                key={f.id}
                finding={f}
                onSelect={(finding) => setSelectedFinding(finding)}
                isSelected={selectedFinding?.id === f.id}
              />
            ))
          )}
        </div>
      )}

      {/* Tab 2: Documents (Progressive Disclosure) */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
              Uploaded Supporting Documents ({app.documents?.length || 0})
            </h2>
            <span className="text-[11px] text-slate-400">
              Verified file hashes and metadata
            </span>
          </div>

          <div className="space-y-1.5">
            {app.documents?.map((doc) => (
              <div
                key={doc.id}
                className="group p-2.5 border border-slate-200 rounded-md hover:border-blue-300 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {doc.id}
                    </span>
                    <strong className="text-slate-900">{doc.document_name}</strong>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                      {doc.page_count} {doc.page_count === 1 ? 'Page' : 'Pages'}
                    </span>
                  </div>
                  {/* Progressive hover reveal for hash */}
                  <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-5 group-hover:opacity-100 group-focus-within:max-h-5 group-focus-within:opacity-100 transition-all duration-150 text-[10px] text-slate-400 font-mono pt-0.5 truncate">
                    SHA-256: {doc.file_hash}
                  </div>
                </div>

                <a
                  href={`/documents/${doc.document_name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 hover:border-blue-300 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <span>Open PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Tab 3: Declared Data */}
      {activeTab === 'data' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0 pb-2 border-b border-slate-100">
            Declared Portal Fields ({app.fields?.length || 0})
          </h2>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Field Key</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Declared Value</th>
                  <th className="py-2 px-3">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {app.fields?.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-700">{f.field_key}</td>
                    <td className="py-2 px-3">{f.field_label}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                      {f.field_value === 'No' ? (
                        <span className="text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold">
                          {f.field_value} (Inconsistent with Affidavit)
                        </span>
                      ) : (
                        f.field_value
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-500 capitalize">{f.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Institutional Summary */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0 pb-2 border-b border-slate-100">
              Institutional Overview
            </h2>
            <div className="space-y-1.5">
              <div><span className="text-slate-400">Institution:</span> <strong className="text-slate-900">{app.institution_name}</strong></div>
              <div><span className="text-slate-400">Application Type:</span> <strong className="text-slate-900">{app.nature_of_application}</strong></div>
              <div><span className="text-slate-400">Category ID:</span> <span className="font-mono">{app.category_id}</span></div>
              <div><span className="text-slate-400">Academic Year:</span> <span className="font-mono">{app.academic_year}</span></div>
              <div><span className="text-slate-400">Rule Set:</span> <span className="font-mono font-medium text-slate-800">{app.rule_set} v{app.rule_set_version}</span></div>
              <div><span className="text-slate-400">Evaluation Cutoff:</span> <span className="font-mono font-medium text-slate-800">{app.evaluation_date}</span></div>
              <div><span className="text-slate-400">Assigned Officer:</span> <span>{app.assigned_officer}</span></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0 pb-2 border-b border-slate-100">
              Regulatory Disposition Status
            </h2>
            {app.disposition ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-950 space-y-1">
                <div className="font-bold uppercase text-[11px] text-emerald-800">Decision: {app.disposition}</div>
                <p>"{app.disposition_comment}"</p>
                <div className="text-[10px] text-emerald-700 pt-1">
                  Recorded by {app.disposition_by} at {app.disposition_at}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic py-2">
                No formal disposition recorded yet. Scrutiny officers may escalate or request clarification. Senior Reviewers can record formal dispositions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0 pb-2 border-b border-slate-100">
            Chronological Audit Log ({audits.length})
          </h2>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">User & Role</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Details / Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{a.created_at}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <strong>{a.user_name}</strong> <span className="text-slate-400">({a.user_role})</span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">{a.action}</td>
                    <td className="py-2 px-3 text-slate-700">{a.reason_comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Evidence Drawer */}
      <EvidenceDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onReview={handleReviewFinding}
        currentRole={currentRole}
        documents={app.documents}
      />

      {/* Action Modals */}
      <ClarificationModal
        isOpen={showClarification}
        onClose={() => setShowClarification(false)}
        onSubmit={handleClarificationSubmit}
        applicationId={app.id}
      />

      <EscalationModal
        isOpen={showEscalation}
        onClose={() => setShowEscalation(false)}
        onSubmit={handleEscalationSubmit}
        applicationId={app.id}
      />

      <DispositionModal
        isOpen={showDisposition}
        onClose={() => setShowDisposition(false)}
        onSubmit={handleDispositionSubmit}
        applicationId={app.id}
      />
    </div>
  );
};
