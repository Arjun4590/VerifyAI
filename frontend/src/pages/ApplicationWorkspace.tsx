import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Play,
  ArrowUpRight,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  Building2,
  FileCheck2,
  Download,
  ExternalLink,
  RefreshCw,
  Eye,
  Check,
  XCircle,
  MessageSquare,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { Application, Finding, DemoRole } from '../types';
import { StatusChip } from '../components/StatusChip';
import { EvidenceDrawer } from '../components/EvidenceDrawer';
import { ClarificationModal, EscalationModal, DispositionModal } from '../components/ActionModals';

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
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'data' | 'documents' | 'findings' | 'audit'>('summary');
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
        message: `Validation Run completed! Evaluated ${res.rules_evaluated} approved rules. ${res.deficiency_count} deficiencies, ${res.clarification_count} clarifications flagged.`,
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
      message: `Finding ${findingId} review recorded (${action}).`,
    });
  };

  const handleClarificationSubmit = async (notes: string) => {
    await api.requestClarification(applicationId, notes);
    await fetchApplication();
    setNotification({
      type: 'success',
      message: `Clarification request issued to applicant. Status changed to 'Clarification requested'.`,
    });
  };

  const handleEscalationSubmit = async (reason: string) => {
    await api.escalateApplication(applicationId, reason);
    await fetchApplication();
    setNotification({
      type: 'success',
      message: `Application escalated to Senior Reviewer with high priority.`,
    });
  };

  const handleDispositionSubmit = async (disposition: string, comment: string) => {
    await api.recordDisposition(applicationId, disposition, comment);
    await fetchApplication();
    setNotification({
      type: 'success',
      message: `Senior Reviewer disposition '${disposition}' successfully recorded. Workflow status: Completed.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading Application Review Workspace ({applicationId})...</span>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
        Application {applicationId} not found.
      </div>
    );
  }

  const isSeniorReviewer = currentRole === 'senior_reviewer';
  const isOfficer = currentRole === 'scrutiny_officer';
  const isAdmin = currentRole === 'system_admin';

  return (
    <div className="space-y-5">
      {/* Back button and persistent banner */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applications</span>
        </button>

        <span className="text-[11px] font-mono text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded font-semibold">
          DEMO DATA — NOT CONNECTED TO AICTE
        </span>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold px-1.5 py-0.5 hover:opacity-75"
          >
            ×
          </button>
        </div>
      )}

      {/* Workspace Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                {app.id}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Academic Year: <strong className="text-slate-900">{app.academic_year}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 m-0 leading-tight">
              {app.institution_name}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Category: <strong className="text-slate-800">{app.nature_of_application}</strong> (Cat ID: {app.category_id})
            </p>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Run Validation */}
            <button
              onClick={handleRunValidation}
              disabled={validating || isAdmin}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
              title={isAdmin ? 'System Admin cannot run case validation' : 'Run regulatory rule checks'}
            >
              <Play className={`w-3.5 h-3.5 fill-white ${validating ? 'animate-spin' : ''}`} />
              <span>{validating ? 'Evaluating Rules...' : 'Run Validation'}</span>
            </button>

            {/* Request Clarification */}
            {(isOfficer || isSeniorReviewer) && (
              <button
                onClick={() => setShowClarification(true)}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                <span>Request Clarification</span>
              </button>
            )}

            {/* Escalate (Scrutiny Officer Only) */}
            {isOfficer && (
              <button
                onClick={() => setShowEscalation(true)}
                className="px-3 py-2 bg-white border border-purple-300 text-purple-800 hover:bg-purple-50 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Escalate Case</span>
              </button>
            )}

            {/* Senior Reviewer Disposition */}
            {isSeniorReviewer && (
              <button
                onClick={() => setShowDisposition(true)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Record Disposition</span>
              </button>
            )}

            {/* Open Formal Report */}
            <a
              href={`/api/applications/${app.id}/report?format=html`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Report View</span>
            </a>
          </div>
        </div>

        {/* Summary Status Strip */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-[11px] text-slate-600 uppercase font-semibold block mb-0.5">Workflow Status</span>
            <StatusChip type="workflow" value={app.workflow_status} />
          </div>
          <div>
            <span className="text-[11px] text-slate-600 uppercase font-semibold block mb-0.5">Compliance Summary</span>
            <StatusChip type="compliance" value={app.compliance_outcome} />
          </div>
          <div>
            <span className="text-[11px] text-slate-600 uppercase font-semibold block mb-0.5">Verification Summary</span>
            <StatusChip type="verification" value={app.verification_status} />
          </div>
          <div>
            <span className="text-[11px] text-slate-600 uppercase font-semibold block mb-0.5">Processing QA</span>
            <StatusChip type="processing" value={app.processing_status} />
          </div>
          <div>
            <span className="text-[11px] text-slate-600 uppercase font-semibold block mb-0.5">Rule Set Evaluated</span>
            <span className="font-mono font-semibold text-slate-900">{app.rule_set} (v{app.rule_set_version})</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-600 uppercase font-semibold block mb-0.5">Evaluation Date</span>
            <span className="font-mono font-semibold text-slate-900">{app.evaluation_date}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold">
          {[
            { id: 'summary', label: 'Case Summary' },
            { id: 'data', label: `Application Data (${app.fields?.length || 0} fields)` },
            { id: 'documents', label: `Documents (${app.documents?.length || 0} files)` },
            { id: 'findings', label: `Findings (${app.findings?.length || 0} flags)` },
            { id: 'audit', label: 'Audit Trail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 border-b-2 font-medium transition-colors ${
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

      {/* Tab 1: Summary Panel */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Disposition Banner if completed */}
            {app.disposition && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-900 uppercase">
                      Formal Senior Reviewer Disposition: {app.disposition}
                    </h3>
                    <p className="text-xs text-emerald-950 mt-1">
                      "{app.disposition_comment}"
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                      Recorded By: {app.disposition_by} at {app.disposition_at ? new Date(app.disposition_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Institutional Profile */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Institutional Details & Submission Profile
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Institution Name</span>
                  <span className="font-semibold text-slate-900">{app.institution_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Assigned Scrutiny Officer</span>
                  <span className="font-semibold text-slate-900">{app.assigned_officer}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-semibold text-slate-900">{app.nature_of_application}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Source Mode</span>
                  <span className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                    {app.source_mode}
                  </span>
                </div>
              </div>
            </div>

            {/* Category-Specific Checklist Progress */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Applicable Category Checklist (Annexure 2 §2.1)
                </h3>
                <span className="text-[11px] text-blue-700 font-semibold">
                  Extension of Approval based on Self-Disclosure
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'Affidavit / Undertaking of Self-Disclosure (Annexure 2 §2.1 Item 1)', status: 'Uploaded', ok: true },
                  { name: 'Fire Safety Certificate with valid expiry date (Annexure 2 §2.1 Item 4)', status: 'Expired', ok: false },
                  { name: 'Building Occupancy / Completion Certificate (Annexure 2 §2.1 Item 3)', status: 'Uploaded', ok: true },
                  { name: 'Audited Balance Sheet & Financial Statements (Annexure 2 §2.1 Item 2)', status: 'Uploaded', ok: true },
                  { name: 'Land Title & Location Certificate (Annexure 2 §2.1 Item 5)', status: 'Uploaded', ok: true },
                  { name: 'Application Processing Fee Payment Challan (Annexure 2 §2.1 Item 7)', status: 'Uploaded', ok: true },
                  { name: 'Barrier-Free Built Environment / PwD Certificate (Annexure 2 §2.1 Item 6)', status: 'Missing', ok: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                    <span className="text-slate-800 font-medium">{item.name}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      item.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Case Actions & Recent Activity */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Active Scrutiny Flags
              </h3>
              <div className="space-y-2">
                {app.findings?.slice(0, 3).map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFinding(f);
                    }}
                    className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500 font-bold">{f.id}</span>
                      <StatusChip type="compliance" value={f.outcome} />
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-snug">{f.title}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{f.plain_reason}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('findings')}
                className="w-full text-center text-xs text-blue-700 hover:text-blue-900 font-bold py-2 border-t border-slate-100 block"
              >
                Inspect All {app.findings?.length || 0} Findings →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Application Data */}
      {activeTab === 'data' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Structured Application Form Fields (Self-Disclosure Portal)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Declarations, infrastructure parameters, and statutory committees declared by the institution.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500">
              {app.fields?.length || 0} fields declared
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Field Key</th>
                  <th className="py-2.5 px-4">Label & Form Section</th>
                  <th className="py-2.5 px-4">Declared Value</th>
                  <th className="py-2.5 px-4">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {app.fields?.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{f.field_key}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{f.field_label}</div>
                      <div className="text-[11px] text-slate-400">{f.source_form_section || 'General'}</div>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                      {f.field_value === 'No' ? (
                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                          {f.field_value} (Inconsistent with Affidavit)
                        </span>
                      ) : (
                        f.field_value
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 capitalize">{f.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Documents Dossier */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Uploaded Demonstration Dossier & File Integrity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every document is a real synthetic PDF generated with SHA-256 integrity hash and visible watermark.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              SYNTHETIC DEMO DOCUMENT — NOT FOR OFFICIAL USE
            </span>
          </div>

          <div className="space-y-3">
            {app.documents?.map((doc) => (
              <div
                key={doc.id}
                className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-all bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {doc.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{doc.document_name}</span>
                    <span className="text-[11px] text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                      {doc.page_count} {doc.page_count === 1 ? 'Page' : 'Pages'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Type: <strong className="text-slate-800">{doc.document_type}</strong> | Checklist: <span className="font-mono">{doc.checklist_item_id || 'General'}</span>
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 truncate max-w-xl">
                    SHA-256: {doc.file_hash || 'Calculating...'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`/api/applications/documents/${doc.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Synthetic PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Findings List & Review */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Evidence-Linked Regulatory Findings ({app.findings?.length || 0})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every finding links to a verified APH regulatory rule, document page, or conflicting application field.
              </p>
            </div>
            <button
              onClick={handleRunValidation}
              disabled={validating || isAdmin}
              className="px-3 py-1.5 bg-blue-700 text-white rounded text-xs font-bold hover:bg-blue-800 disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${validating ? 'animate-spin' : ''}`} />
              <span>Re-run Validation</span>
            </button>
          </div>

          <div className="space-y-3">
            {app.findings?.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 hover:border-blue-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      {f.id}
                    </span>
                    <StatusChip type="compliance" value={f.outcome} />
                    <StatusChip type="processing" value={f.processing_status} />
                    <span className="text-xs text-slate-500">
                      Rule: <strong className="font-mono text-blue-700">{f.rule_code}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Review Status:</span>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      f.review_status === 'confirmed' ? 'bg-red-100 text-red-800' :
                      f.review_status === 'dismissed' ? 'bg-emerald-100 text-emerald-800' :
                      f.review_status === 'clarification_requested' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {f.review_status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{f.plain_reason}</p>
                </div>

                {/* Expected vs Observed Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Expected Value:</span>
                    <span className="text-slate-800 font-medium">{f.expected_value}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Observed Value:</span>
                    <span className="text-slate-900 font-mono font-semibold">{f.observed_value}</span>
                  </div>
                </div>

                {/* Reviewer Note if recorded */}
                {f.reviewer_reason && (
                  <div className="p-2.5 bg-blue-50/50 border border-blue-200 rounded text-xs text-blue-950">
                    <strong>{f.reviewer_name}</strong> ({f.reviewer_role}): <em>"{f.reviewer_reason}"</em>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Category: <strong className="text-slate-600">{f.category}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedFinding(f)}
                    className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Evidence & Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Persistent Regulatory Scrutiny Audit Trail
            </h3>
            <span className="text-xs text-slate-500">Immutable Backend Log</span>
          </div>

          <div className="space-y-2">
            <AuditHistoryList applicationId={app.id} />
          </div>
        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onReview={handleReviewFinding}
        currentRole={currentRole}
        documents={app.documents}
      />

      {/* Modals */}
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

// Sub-component for audit history list
const AuditHistoryList: React.FC<{ applicationId: string }> = ({ applicationId }) => {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApplicationAudit(applicationId).then((res) => {
      setAudits(res);
      setLoading(false);
    });
  }, [applicationId]);

  if (loading) return <div className="text-xs text-slate-400 py-4">Loading audit trail...</div>;
  if (audits.length === 0) return <div className="text-xs text-slate-400 py-4">No audit events recorded yet.</div>;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
          <tr>
            <th className="py-2 px-3">Timestamp</th>
            <th className="py-2 px-3">Action</th>
            <th className="py-2 px-3">Officer / User</th>
            <th className="py-2 px-3">Comment / Regulatory Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {audits.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                {new Date(a.created_at).toLocaleString()}
              </td>
              <td className="py-2 px-3 font-semibold text-slate-900">{a.action}</td>
              <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                {a.user_name} <span className="text-slate-400">({a.user_role})</span>
              </td>
              <td className="py-2 px-3 text-slate-600">{a.reason_comment || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
