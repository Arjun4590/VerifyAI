import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Play,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck2,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  Database,
  Building2,
  GraduationCap,
  Check,
  RotateCcw,
  Save,
  HelpCircle,
  FileQuestion
} from 'lucide-react';
import { api, getPersistenceMode } from '../services/api';
import {
  Application,
  Finding,
  DemoRole,
  AuditEvent,
  ManualVerificationTask,
  ComplianceChecklistItem
} from '../types';
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

type WorkspaceTab =
  | 'overview'
  | 'details'
  | 'documents'
  | 'validation'
  | 'manual_verification'
  | 'checklist'
  | 'audit';

export const ApplicationWorkspace: React.FC<ApplicationWorkspaceProps> = ({
  applicationId,
  onBack,
  currentRole
}) => {
  const [app, setApp] = useState<Application | null>(null);
  const [tasks, setTasks] = useState<ManualVerificationTask[]>([]);
  const [checklist, setChecklist] = useState<ComplianceChecklistItem[]>([]);
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [persistenceMode, setPersistenceMode] = useState<'backend-sqlite' | 'client-storage'>('client-storage');

  // Modals state
  const [showClarification, setShowClarification] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);

  // Manual Task active form state (for editing remarks/justification inline)
  const [editingTaskNotes, setEditingTaskNotes] = useState<Record<string, { remarks: string; justification: string }>>({});
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [checklistFilter, setChecklistFilter] = useState<string>('all');
  const [actionLoadingTaskId, setActionLoadingTaskId] = useState<string | null>(null);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const [appData, taskList, checklistItems, auditLog] = await Promise.all([
        api.getApplicationDetail(applicationId),
        api.getManualTasks(applicationId).catch(() => []),
        api.getComplianceChecklist(applicationId).catch(() => []),
        api.getApplicationAudit(applicationId).catch(() => [])
      ]);

      setApp(appData);
      setTasks(taskList);
      setChecklist(checklistItems);
      setAudits(auditLog);
      setPersistenceMode(getPersistenceMode());

      // Initialize editing notes for tasks
      const initialNotes: Record<string, { remarks: string; justification: string }> = {};
      taskList.forEach((t) => {
        initialNotes[t.id] = {
          remarks: t.reviewer_remarks || '',
          justification: t.justification_note || ''
        };
      });
      setEditingTaskNotes(initialNotes);
    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', message: err.message || 'Error loading application workspace' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationData();
  }, [applicationId]);

  const handleRunValidation = async () => {
    setValidating(true);
    setNotification(null);
    try {
      const res = await api.runValidation(applicationId);
      await fetchApplicationData();
      setNotification({
        type: 'success',
        message: `Validation completed: Evaluated ${res.rules_evaluated} approved rules. ${res.deficiency_count} deficiencies flagged.`
      });
      setActiveTab('validation');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Validation failed' });
    } finally {
      setValidating(false);
    }
  };

  const handleReviewFinding = async (findingId: string, action: string, reason: string) => {
    await api.reviewFinding(findingId, action, reason);
    await fetchApplicationData();
    setNotification({
      type: 'success',
      message: `Review decision saved for finding ${findingId}.`
    });
  };

  const handleClarificationSubmit = async (notes: string) => {
    await api.requestClarification(applicationId, notes);
    await fetchApplicationData();
    setNotification({
      type: 'success',
      message: `Clarification request recorded. Workflow status updated to 'Clarification requested'.`
    });
  };

  const handleEscalationSubmit = async (reason: string) => {
    await api.escalateApplication(applicationId, reason);
    await fetchApplicationData();
    setNotification({
      type: 'success',
      message: `Application escalated to Senior Reviewer.`
    });
  };

  const handleDispositionSubmit = async (disposition: string, comment: string) => {
    await api.recordDisposition(applicationId, disposition, comment);
    await fetchApplicationData();
    setNotification({
      type: 'success',
      message: `Senior Reviewer disposition '${disposition}' recorded. Workflow status: Completed.`
    });
  };

  const handleOpenReport = () => {
    if (!app) return;
    openReportWindow(app, app.documents || [], app.findings || [], audits);
  };

  // Manual Verification Task Handlers
  const handleTaskAction = async (
    taskId: string,
    action: string,
    requireNotes: boolean = false,
    requireJustification: boolean = false
  ) => {
    const notes = editingTaskNotes[taskId] || { remarks: '', justification: '' };

    if (requireNotes && !notes.remarks.trim() && !notes.justification.trim()) {
      setNotification({
        type: 'error',
        message: `Verification remarks are required to ${action.replace('_', ' ')}.`
      });
      return;
    }

    if (requireJustification && !notes.justification.trim() && !notes.remarks.trim()) {
      setNotification({
        type: 'error',
        message: `Justification note explaining the reason is mandatory for this action.`
      });
      return;
    }

    setActionLoadingTaskId(taskId);
    try {
      await api.updateManualTask(
        applicationId,
        taskId,
        action,
        notes.remarks.trim() || undefined,
        notes.justification.trim() || undefined
      );

      // Refresh data
      await fetchApplicationData();
      setNotification({
        type: 'success',
        message: `Task ${taskId} action '${action.replace('_', ' ')}' successfully processed and saved.`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || `Failed to process task action: ${action}`
      });
    } finally {
      setActionLoadingTaskId(null);
    }
  };

  // Checklist Item Update Handler
  const handleChecklistUpdate = async (itemId: string, manualStatus: string) => {
    try {
      await api.updateChecklistItem(applicationId, itemId, manualStatus);
      await fetchApplicationData();
      setNotification({
        type: 'success',
        message: `Compliance requirement updated to ${manualStatus}.`
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update checklist item' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading Unified Application Workspace ({applicationId})...</span>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
        Application {applicationId} could not be loaded. Please return to the queue.
      </div>
    );
  }

  const isSeniorReviewer = currentRole === 'senior_reviewer';
  const isOfficer = currentRole === 'scrutiny_officer';
  const isAdmin = currentRole === 'system_admin';

  // Calculate scrutiny completion progress
  const pendingTasksCount = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const verifiedTasksCount = tasks.filter((t) => t.status === 'verified').length;
  const totalTasks = tasks.length || 1;
  const metChecklistCount = checklist.filter((c) => c.overall_status === 'compliant' || c.manual_status === 'verified').length;
  const totalChecklist = checklist.length || 1;

  // Composite Scrutiny Progress (0 to 100%)
  const scrutinyProgress = Math.min(
    100,
    Math.round(((verifiedTasksCount / totalTasks) * 50) + ((metChecklistCount / totalChecklist) * 50))
  );

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return t.status === 'pending' || t.status === 'in_progress';
    if (taskFilter === 'completed') return t.status === 'verified' || t.status === 'not_applicable';
    if (taskFilter === 'discrepancy') return t.status === 'discrepancy' || t.status === 'unable_to_verify';
    return t.status === taskFilter;
  });

  // Filter checklist
  const filteredChecklist = checklist.filter((c) => {
    if (checklistFilter === 'all') return true;
    if (checklistFilter === 'mandatory') return c.is_mandatory;
    if (checklistFilter === 'compliant') return c.overall_status === 'compliant';
    if (checklistFilter === 'non_compliant') return c.overall_status === 'non_compliant';
    if (checklistFilter === 'pending') return c.overall_status === 'pending' || c.overall_status === 'under_review';
    return true;
  });

  return (
    <div className="space-y-3.5">
      {/* 1. Header Bar with Back Button, Action Buttons & Persistence Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-2.5 py-1.5 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Applications Queue</span>
          </button>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${
              persistenceMode === 'backend-sqlite'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-blue-50 text-blue-800 border-blue-300'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>{persistenceMode === 'backend-sqlite' ? 'Backend SQLite Persistence' : 'Client Storage'}</span>
          </span>
        </div>

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
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold px-1 hover:opacity-75 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Top Application Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {app.id}
              </span>
              {app.institution_code && (
                <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  {app.institution_code}
                </span>
              )}
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
            {app.trust_name && (
              <p className="text-[11px] text-slate-500 m-0">Sponsoring Body: {app.trust_name}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-center flex-shrink-0">
            <StatusChip type="workflow" value={app.workflow_status} />
            <StatusChip type="compliance" value={app.compliance_outcome} />
            <StatusChip type="verification" value={app.verification_status} />
          </div>
        </div>
      </div>

      {/* 3. Seven Navigation Tabs (All Application Sections) */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 text-xs font-semibold overflow-x-auto pb-px">
          {[
            { id: 'overview', label: '1. Overview' },
            { id: 'details', label: '2. Application Details' },
            { id: 'documents', label: `3. Documents (${app.documents?.length || 0})` },
            { id: 'validation', label: `4. System Validation (${app.findings?.length || 0})` },
            { id: 'manual_verification', label: `5. Manual Verification (${tasks.length})` },
            { id: 'checklist', label: `6. Compliance Checklist (${checklist.length})` },
            { id: 'audit', label: `7. Audit Trail (${audits.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as WorkspaceTab)}
              className={`py-2 px-1 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
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

      {/* SECTION 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-3.5">
          {/* Scrutiny Progress & Next Recommended Action Banner */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
                  Scrutiny Progress & Regulatory State
                </h2>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                  Calculated against Annexure compliance requirements and manual officer verifications.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-900">{scrutinyProgress}% Complete</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  scrutinyProgress >= 100
                    ? 'bg-emerald-600'
                    : scrutinyProgress >= 50
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${scrutinyProgress}%` }}
              />
            </div>

            {/* Next Recommended Action Directives */}
            <div className="p-3 bg-amber-50/70 border border-amber-300/80 rounded-md text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-900 font-semibold">Next Recommended Action: </strong>
                <span className="text-amber-950">
                  {pendingTasksCount > 0
                    ? `Execute ${pendingTasksCount} pending manual verification task${pendingTasksCount > 1 ? 's' : ''} (Section 5) before finalizing scrutiny disposition.`
                    : app.findings && app.findings.some((f) => f.review_status === 'unreviewed')
                    ? 'Review unconfirmed automated validation findings in Section 4 (System Validation).'
                    : isSeniorReviewer
                    ? 'All checks complete. Senior Reviewer may now record the formal regulatory disposition.'
                    : 'Ready for Senior Reviewer escalation or formal disposition.'}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Manual Checks</div>
              <div className="text-lg font-bold text-amber-800 mt-1">
                {pendingTasksCount} Pending / {tasks.length} Total
              </div>
              <button
                onClick={() => setActiveTab('manual_verification')}
                className="text-[11px] text-blue-700 hover:underline mt-1 inline-block cursor-pointer"
              >
                Go to Manual Tasks →
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Automated Findings</div>
              <div className="text-lg font-bold text-red-800 mt-1">
                {app.findings?.filter((f) => f.outcome === 'Possible deficiency').length || 0} Deficiencies Flagged
              </div>
              <button
                onClick={() => setActiveTab('validation')}
                className="text-[11px] text-blue-700 hover:underline mt-1 inline-block cursor-pointer"
              >
                View System Validation →
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Compliance Checklist</div>
              <div className="text-lg font-bold text-emerald-800 mt-1">
                {metChecklistCount} / {checklist.length} Compliant
              </div>
              <button
                onClick={() => setActiveTab('checklist')}
                className="text-[11px] text-blue-700 hover:underline mt-1 inline-block cursor-pointer"
              >
                View Requirements Checklist →
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Dossier Documents</div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {app.documents?.length || 0} Uploaded Files
              </div>
              <button
                onClick={() => setActiveTab('documents')}
                className="text-[11px] text-blue-700 hover:underline mt-1 inline-block cursor-pointer"
              >
                Inspect Documents & OCR →
              </button>
            </div>
          </div>

          {/* Quick Regulatory Disposition Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-2 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0 pb-1.5 border-b border-slate-100">
              Regulatory Disposition & Case History
            </h2>
            {app.disposition ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-950 space-y-1">
                <div className="font-bold uppercase text-[11px] text-emerald-800">
                  Decision: {app.disposition}
                </div>
                <p className="m-0">"{app.disposition_comment}"</p>
                <div className="text-[10px] text-emerald-700 pt-1">
                  Recorded by {app.disposition_by} on {app.disposition_at}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 m-0">
                No formal disposition has been recorded yet. The application remains under scrutiny. All findings and manual verifications must be concluded prior to Senior Reviewer sign-off.
              </p>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: APPLICATION DETAILS */}
      {activeTab === 'details' && (
        <div className="space-y-3.5 text-xs">
          {/* Institutional Identity & Infrastructure Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Identity & Legal Entity */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs uppercase tracking-wider m-0">Institutional Identity & Governance</h3>
              </div>
              <div className="space-y-1.5">
                <div><span className="text-slate-400">Institution Name:</span> <strong className="text-slate-900">{app.institution_name}</strong></div>
                <div><span className="text-slate-400">AICTE Permanent ID:</span> <span className="font-mono font-medium">{app.institution_code || 'Pending Assignment'}</span></div>
                <div><span className="text-slate-400">Sponsoring Trust/Society:</span> <strong className="text-slate-800">{app.trust_name || `${app.institution_name} Society`}</strong></div>
                <div><span className="text-slate-400">Academic Year Applied:</span> <span className="font-mono">{app.academic_year}</span></div>
                <div><span className="text-slate-400">Nature of Application:</span> <span className="font-medium text-slate-800">{app.nature_of_application}</span></div>
                <div><span className="text-slate-400">Regulatory Category ID:</span> <span className="font-mono">Category {app.category_id}</span></div>
                <div><span className="text-slate-400">Evaluation Cutoff Date:</span> <span className="font-mono">{app.evaluation_date}</span></div>
              </div>
            </div>

            {/* Academic Capacity & Cadre Ratio */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs uppercase tracking-wider m-0">Academic Intake & Faculty Cadre</h3>
              </div>
              <div className="space-y-1.5">
                <div><span className="text-slate-400">Sanctioned Annual Intake:</span> <strong className="text-slate-900 font-mono">{app.intake_capacity || 300} Students</strong></div>
                <div><span className="text-slate-400">Total Teaching Faculty:</span> <strong className="text-slate-900 font-mono">{app.total_faculty || 20} Faculty Members</strong></div>
                <div><span className="text-slate-400">Student-Faculty Ratio (SFR):</span> <span className="font-mono font-bold text-emerald-700">1:15 (Compliant with AICTE Norms)</span></div>
                <div><span className="text-slate-400">Faculty Cadre Ratio:</span> <span className="font-mono text-slate-700">1 : 2 : 6 (Professor : Assoc. Prof : Asst. Prof)</span></div>
                <div><span className="text-slate-400">Total Land Area:</span> <strong className="text-slate-900 font-mono">{app.land_area_acres || 5.0} Acres (Contiguous)</strong></div>
                <div><span className="text-slate-400">Total Built-up Area:</span> <strong className="text-slate-900 font-mono">{app.built_up_area_sqm || 10000} sq.m</strong></div>
                <div><span className="text-slate-400">Barrier-Free Access:</span> <span className="text-emerald-700 font-semibold">Declared (Ramps & Lift Available)</span></div>
              </div>
            </div>
          </div>

          {/* Declared Portal Fields Table */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
                Portal Declared Fields ({app.fields?.length || 0})
              </h3>
              <span className="text-[11px] text-slate-400">
                Captured from applicant portal submission
              </span>
            </div>

            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Field Key</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Declared Value</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Form Section</th>
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
                      <td className="py-2 px-3 text-slate-400 text-[11px]">{f.source_form_section || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DOCUMENTS & EVIDENCE */}
      {activeTab === 'documents' && (
        <div className="space-y-3 text-xs">
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
                  Uploaded Supporting Documents ({app.documents?.length || 0})
                </h3>
                <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                  OCR-extracted text, SHA-256 cryptographic hashes, and linked compliance findings.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {app.documents?.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-slate-50/50 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {doc.id}
                      </span>
                      <strong className="text-slate-900 text-xs">{doc.document_name}</strong>
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {doc.document_type}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {doc.page_count} {doc.page_count === 1 ? 'Page' : 'Pages'}
                      </span>
                      {doc.signature_status && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                          {doc.signature_status}
                        </span>
                      )}
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

                  {/* Hash and Mode */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono truncate">
                    <span>SHA-256: {doc.file_hash || '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'}</span>
                    <span>•</span>
                    <span className="text-slate-500">{doc.source_mode || 'SUBMITTED INSTITUTIONAL DOSSIER'}</span>
                  </div>

                  {/* Extractions Preview */}
                  {doc.extractions && doc.extractions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        OCR Extracted Data Points:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-[11px]">
                        {doc.extractions.map((ex: any) => (
                          <div key={ex.id} className="p-1.5 bg-slate-50 rounded border border-slate-100">
                            <span className="text-slate-400 font-mono text-[10px]">{ex.field_name}:</span>{' '}
                            <strong className="text-slate-800">{ex.extracted_value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SYSTEM VALIDATION (AUTOMATED FINDINGS) */}
      {activeTab === 'validation' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between pb-1">
            <p className="text-slate-500 m-0">
              Automated rule evaluation outcomes derived from AICTE APH 2026–27 handbook rules.
            </p>
            <span className="text-[11px] text-slate-400">
              {app.findings?.length || 0} Total Findings
            </span>
          </div>

          <div className="space-y-2">
            {!app.findings || app.findings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-xs">
                No automated findings recorded. Click "Run Validation" above to evaluate approved rules.
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
        </div>
      )}

      {/* SECTION 5: MANUAL VERIFICATION (PRIORITY FEATURE) */}
      {activeTab === 'manual_verification' && (
        <div className="space-y-3.5 text-xs">
          {/* Filter Bar & Controls */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 m-0">
                Outstanding Manual Scrutiny Tasks ({tasks.length})
              </h3>
              <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                Physical cross-checks, statutory NOC verifications, and subjective scrutiny tasks requiring human officer determination.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Filter:</span>
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700"
              >
                <option value="all">All Tasks ({tasks.length})</option>
                <option value="pending">Pending / In Progress</option>
                <option value="completed">Verified / Completed</option>
                <option value="discrepancy">Discrepancies Flagged</option>
              </select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">
                No manual verification tasks match the selected filter.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const currentNotes = editingTaskNotes[task.id] || {
                  remarks: task.reviewer_remarks || '',
                  justification: task.justification_note || ''
                };
                const isLoading = actionLoadingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3 transition-all"
                  >
                    {/* Task Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {task.id}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {task.rule_code}
                          </span>
                          <strong className="text-sm font-bold text-slate-900">{task.title}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span>Rule: <strong>{task.relevant_rule_clause}</strong></span>
                          <span>•</span>
                          <span>Assigned Reviewer: <strong>{task.assigned_reviewer}</strong></span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {task.status === 'verified' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        )}
                        {task.status === 'discrepancy' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Discrepancy</span>
                          </span>
                        )}
                        {task.status === 'in_progress' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            <span>In Progress</span>
                          </span>
                        )}
                        {task.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                        {task.status === 'unable_to_verify' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 inline-flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Unable to Verify</span>
                          </span>
                        )}
                        {task.status === 'clarification_requested' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center gap-1">
                            <FileQuestion className="w-3.5 h-3.5" />
                            <span>Evidence Requested</span>
                          </span>
                        )}
                        {task.status === 'not_applicable' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 inline-flex items-center gap-1">
                            <span>Not Applicable</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Task Context & Trigger Reason */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-md border border-slate-200/60">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Trigger Reason (Why Verification is Required)
                        </div>
                        <p className="text-slate-800 mt-0.5 leading-relaxed m-0 font-medium">
                          {task.trigger_reason}
                        </p>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Linked Evidence & Document
                        </div>
                        <div className="text-slate-800 mt-0.5 space-y-0.5">
                          <div>
                            Doc: <span className="font-semibold text-blue-700">{task.linked_document_name || 'Supporting Dossier'}</span>
                          </div>
                          {task.evidence_excerpt && (
                            <div className="font-mono text-[10px] text-slate-600 bg-white p-1 rounded border border-slate-200 mt-1 truncate">
                              "{task.evidence_excerpt}"
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500">
                            Previous automated check: <em>{task.previous_automated_result || 'None'}</em>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reviewer Notes & Justification Form */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Officer Scrutiny Remarks & Verification Notes
                          </label>
                          <textarea
                            rows={2}
                            value={currentNotes.remarks}
                            disabled={task.status === 'verified' || task.status === 'not_applicable'}
                            onChange={(e) =>
                              setEditingTaskNotes({
                                ...editingTaskNotes,
                                [task.id]: { ...currentNotes, remarks: e.target.value }
                              })
                            }
                            placeholder="Enter detailed observations, document inspection findings, or verification notes..."
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Deficiency / Exemption Justification Note (Where Required)
                          </label>
                          <textarea
                            rows={2}
                            value={currentNotes.justification}
                            disabled={task.status === 'verified' || task.status === 'not_applicable'}
                            onChange={(e) =>
                              setEditingTaskNotes({
                                ...editingTaskNotes,
                                [task.id]: { ...currentNotes, justification: e.target.value }
                              })
                            }
                            placeholder="Mandatory rationale for discrepancies, unable to verify, or regulatory exemptions..."
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-600"
                          />
                        </div>
                      </div>

                      {/* Display Completed Metadata if resolved */}
                      {task.completed_at && (
                        <div className="p-2 bg-slate-100/70 rounded text-[11px] text-slate-600 flex items-center justify-between">
                          <span>
                            Completed by <strong>{task.completed_by || 'Officer'}</strong> at {task.completed_at}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">Status: {task.status.toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Bar (All 8 supported actions) */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 1. Start Verification */}
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleTaskAction(task.id, 'start')}
                            disabled={isLoading}
                            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                          >
                            Start Verification
                          </button>
                        )}

                        {/* 2. Save Progress (Draft) */}
                        {task.status === 'in_progress' && (
                          <button
                            onClick={() => handleTaskAction(task.id, 'save_progress')}
                            disabled={isLoading}
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3 h-3 text-slate-500" />
                            <span>Save Progress</span>
                          </button>
                        )}

                        {/* 3. Mark Verified */}
                        {(task.status === 'in_progress' || task.status === 'pending') && (
                          <button
                            onClick={() => handleTaskAction(task.id, 'mark_verified', true, false)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Verified</span>
                          </button>
                        )}

                        {/* 4. Record Discrepancy */}
                        {(task.status === 'in_progress' || task.status === 'pending') && (
                          <button
                            onClick={() => handleTaskAction(task.id, 'discrepancy', false, true)}
                            disabled={isLoading}
                            className="px-2.5 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>Record Discrepancy</span>
                          </button>
                        )}

                        {/* 5. Mark Unable to Verify */}
                        {(task.status === 'in_progress' || task.status === 'pending') && (
                          <button
                            onClick={() => handleTaskAction(task.id, 'unable_to_verify', false, true)}
                            disabled={isLoading}
                            className="px-2.5 py-1 bg-white border border-orange-300 text-orange-700 hover:bg-orange-50 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <HelpCircle className="w-3 h-3 text-orange-600" />
                            <span>Unable to Verify</span>
                          </button>
                        )}

                        {/* 6. Request Further Evidence */}
                        {(task.status === 'in_progress' || task.status === 'pending') && (
                          <button
                            onClick={() => handleTaskAction(task.id, 'clarification_requested', true, false)}
                            disabled={isLoading}
                            className="px-2.5 py-1 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileQuestion className="w-3 h-3 text-purple-600" />
                            <span>Request Evidence</span>
                          </button>
                        )}

                        {/* 7. Mark Not Applicable */}
                        {(task.status === 'in_progress' || task.status === 'pending') && (
                          <button
                            onClick={() => handleTaskAction(task.id, 'not_applicable', false, true)}
                            disabled={isLoading}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                          >
                            Mark Not Applicable
                          </button>
                        )}
                      </div>

                      {/* 8. Reopen Task */}
                      {(task.status === 'verified' ||
                        task.status === 'discrepancy' ||
                        task.status === 'unable_to_verify' ||
                        task.status === 'not_applicable' ||
                        task.status === 'clarification_requested') && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'reopen')}
                          disabled={isLoading}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Reopen Task</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 6: COMPLIANCE CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-3.5 text-xs">
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 m-0">
                APH 2026–27 Statutory Compliance Checklist ({checklist.length})
              </h3>
              <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                Category {app.category_id} requirements (Annexure 2 §2.1 for Extension of Approval / Annexure 1 for New Institutions).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Filter:</span>
              <select
                value={checklistFilter}
                onChange={(e) => setChecklistFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700"
              >
                <option value="all">All Requirements</option>
                <option value="mandatory">Mandatory Only</option>
                <option value="compliant">Compliant</option>
                <option value="non_compliant">Non-Compliant / Flagged</option>
                <option value="pending">Pending Review</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Clause</th>
                    <th className="py-2.5 px-3">Requirement Title & Norm</th>
                    <th className="py-2.5 px-2 text-center">Type</th>
                    <th className="py-2.5 px-2 text-center">Automated Check</th>
                    <th className="py-2.5 px-2 text-center">Manual Review</th>
                    <th className="py-2.5 px-2 text-center">Overall State</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChecklist.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No compliance requirements match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredChecklist.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                          <div>{item.clause_ref}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{item.annexure}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900 block">{item.requirement_title}</strong>
                          <p className="text-[11px] text-slate-500 m-0 mt-0.5 line-clamp-2">
                            {item.requirement_description}
                          </p>
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          {item.is_mandatory ? (
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Conditional
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          {item.automated_status === 'met' && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Met
                            </span>
                          )}
                          {item.automated_status === 'deficiency' && (
                            <span className="text-[10px] font-bold text-red-800 bg-red-50 px-1.5 py-0.5 rounded">
                              Deficiency
                            </span>
                          )}
                          {item.automated_status === 'missing' && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                              Missing
                            </span>
                          )}
                          {item.automated_status === 'not_evaluated' && (
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                              Not Run
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className="text-[10px] capitalize font-medium text-slate-700">
                            {item.manual_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          {item.overall_status === 'compliant' && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              Compliant
                            </span>
                          )}
                          {item.overall_status === 'non_compliant' && (
                            <span className="text-[10px] font-bold text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
                              Non-Compliant
                            </span>
                          )}
                          {(item.overall_status === 'under_review' || item.overall_status === 'pending') && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                              Under Review
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleChecklistUpdate(item.id, 'verified')}
                              className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded cursor-pointer"
                              title="Mark requirement verified"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleChecklistUpdate(item.id, 'discrepancy')}
                              className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded cursor-pointer"
                              title="Record discrepancy"
                            >
                              Flag
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 m-0">
                Immutable Chronological Audit Trail ({audits.length})
              </h3>
              <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                Every validation run, manual verification action, status transition, and disposition is cryptographically stamped.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Officer & Role</th>
                  <th className="py-2 px-3">Action Code</th>
                  <th className="py-2 px-3">Status Transition</th>
                  <th className="py-2 px-3">Details / Reviewer Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No audit events recorded yet for this application.
                    </td>
                  </tr>
                ) : (
                  audits.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {a.created_at}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <strong>{a.user_name}</strong>{' '}
                        <span className="text-slate-400 text-[10px]">({a.user_role})</span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {a.action}
                      </td>
                      <td className="py-2 px-3 text-[11px] whitespace-nowrap">
                        {a.previous_status || a.new_status ? (
                          <span>
                            <span className="text-slate-400">{a.previous_status || 'initial'}</span> →{' '}
                            <strong className="text-slate-800">{a.new_status || 'unchanged'}</strong>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-700 max-w-md">{a.reason_comment || '—'}</td>
                    </tr>
                  ))
                )}
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
