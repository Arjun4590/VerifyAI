import React, { useEffect, useState } from 'react';
import {
  Scale,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  History,
  Play,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Rule, RuleVersion, DemoRole } from '../types';
import { StatusChip } from '../components/StatusChip';

interface RulesGovernanceProps {
  currentRole: DemoRole;
}

export const RulesGovernance: React.FC<RulesGovernanceProps> = ({ currentRole }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRuleVersions, setSelectedRuleVersions] = useState<{ rule: Rule; versions: RuleVersion[] } | null>(null);

  // Draft Creation Modal
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftCode, setDraftCode] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftType, setDraftType] = useState('document_validity');
  const [draftRef, setDraftRef] = useState('APH 2026-27 Norms §4');
  const [draftClause, setDraftClause] = useState('Clause 4.1');
  const [draftPage, setDraftPage] = useState<number>(100);
  const [draftError, setDraftError] = useState<string | null>(null);

  // Approval / Rejection state
  const [rejectingRuleId, setRejectingRuleId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getRules(params);
      setRules(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [statusFilter]);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setDraftError(null);
    try {
      await api.createRuleDraft({
        code: draftCode,
        title: draftTitle,
        description: draftDescription,
        check_type: draftType,
        source_reference: draftRef,
        source_clause: draftClause,
        handbook_page: draftPage,
        parameters: { rule_mode: 'draft_screening' }
      });
      setShowDraftModal(false);
      setDraftCode('');
      setDraftTitle('');
      setDraftDescription('');
      setActionMessage('New draft rule created successfully.');
      fetchRules();
    } catch (err: any) {
      setDraftError(err.message || 'Failed to create draft rule');
    }
  };

  const handleSubmitForReview = async (ruleId: string) => {
    await api.submitRuleForReview(ruleId);
    setActionMessage(`Rule ${ruleId} submitted to Senior Reviewer for formal review.`);
    fetchRules();
  };

  const handleApproveRule = async (ruleId: string) => {
    await api.approveRule(ruleId, 'Source verified against AICTE APH 2026-27 handbook');
    setActionMessage(`Rule ${ruleId} approved and published for automated execution.`);
    fetchRules();
  };

  const handleRejectRule = async () => {
    if (!rejectingRuleId || !rejectionReason.trim()) return;
    await api.rejectRule(rejectingRuleId, rejectionReason);
    setRejectingRuleId(null);
    setRejectionReason('');
    setActionMessage(`Rule rejected.`);
    fetchRules();
  };

  const handleOpenVersions = async (rule: Rule) => {
    const versions = await api.getRuleVersions(rule.id);
    setSelectedRuleVersions({ rule, versions });
  };

  const isSeniorReviewer = currentRole === 'senior_reviewer';
  const isAdmin = currentRole === 'system_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Regulatory Rules Governance & Versioning
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal rule lifecycle: Candidate → Needs Source Review → Draft → Senior Reviewer Approval → Published Version.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowDraftModal(true)}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Create Draft Rule</span>
          </button>
        )}
      </div>

      {/* Rules Engine Gate Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-950 space-y-1">
          <strong className="block text-blue-900 uppercase tracking-wide">
            Regulatory Rules Engine Gate Enforced
          </strong>
          <p className="leading-relaxed">
            Only rules in <strong>approved</strong> status can be evaluated during validation runs. Extracted candidate sentences are preserved in the catalogue library but cannot execute automatically without senior authorized review and verified handbook citation.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-medium flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold text-emerald-700">×</button>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-600">Filter Lifecycle State:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800"
        >
          <option value="">All States</option>
          <option value="approved">Approved / Published (Executable)</option>
          <option value="submitted_for_approval">Submitted for Approval</option>
          <option value="draft">Draft (System Admin)</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Rule Code & ID</th>
              <th className="py-3 px-4">Title & Description</th>
              <th className="py-3 px-4">Check Type</th>
              <th className="py-3 px-4">Source Citation</th>
              <th className="py-3 px-3 text-center">Version</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Governance Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Loading governance rules...</td>
              </tr>
            ) : rules.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-mono">
                  <div className="font-bold text-blue-700">{r.code}</div>
                  <div className="text-[10px] text-slate-400">{r.id}</div>
                </td>
                <td className="py-3 px-4 max-w-sm">
                  <div className="font-bold text-slate-900">{r.title}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2">{r.description}</div>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-600 capitalize">
                  {r.check_type.replace('_', ' ')}
                </td>
                <td className="py-3 px-4 text-slate-600 text-[11px]">
                  <div>{r.source_reference || 'Reference pending'}</div>
                  <div className="text-slate-400">{r.source_clause || ''} (Pg {r.handbook_page || '-'})</div>
                </td>
                <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                  v{r.current_version}
                </td>
                <td className="py-3 px-4">
                  <StatusChip type="lifecycle" value={r.status} />
                </td>
                <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                  {/* Admin Submit */}
                  {isAdmin && r.status === 'draft' && (
                    <button
                      onClick={() => handleSubmitForReview(r.id)}
                      className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-300 rounded font-semibold text-[11px] hover:bg-blue-100"
                    >
                      Submit for Approval
                    </button>
                  )}

                  {/* Senior Reviewer Approve */}
                  {isSeniorReviewer && (r.status === 'submitted_for_approval' || r.status === 'draft') && (
                    <button
                      onClick={() => handleApproveRule(r.id)}
                      className="px-2.5 py-1 bg-emerald-700 text-white rounded font-bold text-[11px] hover:bg-emerald-800 shadow-2xs"
                    >
                      Approve & Publish
                    </button>
                  )}

                  {/* Senior Reviewer Reject */}
                  {isSeniorReviewer && r.status === 'submitted_for_approval' && (
                    <button
                      onClick={() => setRejectingRuleId(r.id)}
                      className="px-2 py-1 bg-red-50 text-red-700 border border-red-300 rounded font-semibold text-[11px] hover:bg-red-100"
                    >
                      Reject
                    </button>
                  )}

                  {/* Version History Button */}
                  <button
                    onClick={() => handleOpenVersions(r)}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded"
                    title="View Version History"
                  >
                    <History className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Version History Modal / Drawer */}
      {selectedRuleVersions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Rule Version History: {selectedRuleVersions.rule.code}
                </h3>
                <p className="text-xs text-slate-500">{selectedRuleVersions.rule.title}</p>
              </div>
              <button onClick={() => setSelectedRuleVersions(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedRuleVersions.versions.map((ver) => (
                <div key={ver.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700">Version {ver.version}</span>
                    <StatusChip type="lifecycle" value={ver.status} />
                  </div>
                  <p className="text-slate-700"><strong>Changelog:</strong> {ver.changelog || 'No notes'}</p>
                  <p className="text-slate-500 text-[11px]">
                    Submitted By: {ver.submitted_by || 'System'} | Approved By: {ver.approved_by || 'Pending'}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRuleVersions(null)}
                className="px-4 py-1.5 bg-slate-200 text-slate-800 rounded text-xs font-semibold hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingRuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Reject Rule Draft</h3>
            <p className="text-xs text-slate-600">Please provide the regulatory reason for rejecting this rule version.</p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Clause citation does not align with APH Section 4 wording..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-600"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingRuleId(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRule}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Create New Regulatory Rule Draft</h3>
              <button onClick={() => setShowDraftModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Unique Code *</label>
                <input
                  type="text"
                  required
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value)}
                  placeholder="e.g. DOC-OCCUPANCY-CARPET"
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Title *</label>
                <input
                  type="text"
                  required
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g. Building Occupancy Carpet Area Verification"
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Evaluates whether sanctioned carpet area matches built-up floor plans..."
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check Type</label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="document_validity">Document Validity</option>
                    <option value="declaration_consistency">Declaration Consistency</option>
                    <option value="checklist">Checklist Item</option>
                    <option value="infrastructure_observation">Infrastructure Observation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Handbook Page</label>
                  <input
                    type="number"
                    value={draftPage}
                    onChange={(e) => setDraftPage(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Handbook Reference</label>
                  <input
                    type="text"
                    value={draftRef}
                    onChange={(e) => setDraftRef(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clause Label</label>
                  <input
                    type="text"
                    value={draftClause}
                    onChange={(e) => setDraftClause(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              {draftError && <p className="text-red-600 font-semibold">{draftError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold"
                >
                  Save Draft Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
