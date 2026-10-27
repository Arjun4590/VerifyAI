import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, ChevronRight, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Application } from '../types';
import { StatusChip } from '../components/StatusChip';

interface ApplicationsListProps {
  onOpenApplication: (appId: string) => void;
}

export const ApplicationsList: React.FC<ApplicationsListProps> = ({ onOpenApplication }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.workflow_status = statusFilter;
      if (outcomeFilter) params.compliance_outcome = outcomeFilter;
      const res = await api.getApplications(params);
      setApplications(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [search, statusFilter, outcomeFilter]);

  return (
    <div className="space-y-4">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Institutional Applications Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered application submissions for AICTE Approval Process (APH 2026–27).
          </p>
        </div>
        <button
          onClick={fetchApps}
          className="px-3 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters & Search Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Application ID or Institution name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
        >
          <option value="">All Workflow Statuses</option>
          <option value="Ready for review">Ready for review</option>
          <option value="In review">In review</option>
          <option value="Clarification requested">Clarification requested</option>
          <option value="Escalated">Escalated</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
        >
          <option value="">All Compliance Outcomes</option>
          <option value="Met">Met</option>
          <option value="Possible deficiency">Possible deficiency</option>
          <option value="Needs clarification">Needs clarification</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">Category (Nature of App)</th>
                <th className="py-3 px-3 text-center">Docs</th>
                <th className="py-3 px-3 text-center">Findings</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4">Compliance Outcome</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading applications queue...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching applications found.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onOpenApplication(app.id)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {app.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{app.institution_name}</div>
                      <div className="text-[11px] text-slate-400">AY: {app.academic_year}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {app.nature_of_application}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {app.documents_count || 0}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {(app.findings_count || 0) > 0 ? (
                        <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-[11px]">
                          {app.findings_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusChip type="workflow" value={app.workflow_status} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusChip type="compliance" value={app.compliance_outcome} />
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {app.assigned_officer}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenApplication(app.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-blue-700 hover:bg-blue-50 rounded group-hover:border-blue-500 transition-colors inline-flex items-center gap-1"
                      >
                        <span>Open Workspace</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
