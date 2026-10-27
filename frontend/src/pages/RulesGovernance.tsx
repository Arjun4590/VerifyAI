import React, { useEffect, useState } from 'react';
import {
  Plus,
  CheckCircle2,
  XCircle,
  History,
  X,
  RefreshCw
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

  // Rejection state
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
      setActionMessage('New draft rule created.');
      fetchRules();
    } catch (err: any) {
      setDraftError(err.message || 'Failed to create draft rule');
    }
  };

  const handleSubmitForReview = async (ruleId: string) => {
    await api.submitRuleForReview(ruleId);
    setActionMessage(`Rule ${ruleId} submitted for Senior Reviewer approval.`);
    fetchRules();
  };

  const handleApproveRule = async (ruleId: string) => {
    await api.approveRule(ruleId, 'Source verified against AICTE APH handbook');
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Rules Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, version, and approve regulatory rules for automated compliance verification.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <button
              onClick={() => setShowDraftModal(true)}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Draft Rule</span>
            </button>
          )}
          <button
            onClick={fetchRules}
            className="px-2.5 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-xs font-medium flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold text-emerald-700 cursor-pointer">×</button>
        </div>
      )}

      {/* Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-3 shadow-2xs">
        <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 cursor-pointer"
        >
          <option value="">All Rules ({rules.length})</option>
          <option value="approved">Approved / Published (Executable)</option>
          <option value="submitted_for_approval">Submitted for Approval</option>
          <option value="draft">Draft</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Rule Code</th>
                <th className="py-2.5 px-3">Title & Summary</th>
                <th className="py-2.5 px-3">Source Citation</th>
                <th className="py-2.5 px-2 text-center">Version</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading rules...</td>
                </tr>
              ) : rules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{r.code}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{r.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{r.description}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div>{r.source_reference}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.source_clause} · Page {r.handbook_page}</div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                    v{r.current_version}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        r.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'submitted_for_approval'
                          ? 'bg-amber-100 text-amber-800'
                          : r.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenVersions(r)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                        title="View Version History"
                      >
                        <History className="w-3 h-3 inline mr-1" />
                        Versions
                      </button>

                      {isAdmin && r.status === 'draft' && (
                        <button
                          onClick={() => handleSubmitForReview(r.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded cursor-pointer"
                        >
                          Submit
                        </button>
                      )}

                      {isSeniorReviewer && r.status === 'submitted_for_approval' && (
                        <>
                          <button
                            onClick={() => handleApproveRule(r.id)}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingRuleId(r.id)}
                            className="px-2 py-1 text-[11px] font-bold text-red-800 bg-red-50 hover:bg-red-100 border border-red-300 rounded cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Version History Drawer */}
      {selectedRuleVersions && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Version History</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedRuleVersions.rule.code}</p>
              </div>
              <button
                onClick={() => setSelectedRuleVersions(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedRuleVersions.versions.map((ver) => (
                <div key={ver.id} className="p-3 border border-slate-200 rounded-md bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700">v{ver.version}</span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">{ver.status}</span>
                  </div>
                  <p className="text-slate-700">{ver.changelog}</p>
                  <p className="text-[10px] text-slate-400">
                    Approved By: {ver.approved_by || 'Pending'} · {ver.approved_at || ver.created_at}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Draft Rule Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 m-0">Create Draft Regulatory Rule</h3>
              <button onClick={() => setShowDraftModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Rule Code</label>
                <input
                  type="text"
                  required
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value)}
                  placeholder="e.g. FACULTY-CADRE-RATIO-CHECK"
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Rule Title</label>
                <input
                  type="text"
                  required
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g. Faculty Cadre Ratio Verification"
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Source Handbook Citation</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={draftClause}
                    onChange={(e) => setDraftClause(e.target.value)}
                    placeholder="Clause (e.g. Clause 4.2)"
                    className="p-2 border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="number"
                    value={draftPage}
                    onChange={(e) => setDraftPage(Number(e.target.value))}
                    placeholder="Page No"
                    className="p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Operational compliance rule description..."
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              {draftError && <p className="text-red-600 text-[11px]">{draftError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 cursor-pointer"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingRuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 m-0">Reject Rule Draft</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejecting this rule..."
              rows={3}
              className="w-full p-2 border border-slate-300 rounded text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingRuleId(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRule}
                disabled={!rejectionReason.trim()}
                className="px-3 py-1.5 bg-red-700 text-white rounded text-xs font-bold hover:bg-red-800 disabled:opacity-50 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
