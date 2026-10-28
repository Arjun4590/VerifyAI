import React, { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  ChevronRight,
  Plus,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  ArrowUpDown
} from 'lucide-react';
import { api, getPersistenceMode } from '../services/api';
import { Application } from '../types';
import { StatusChip } from '../components/StatusChip';
import { IntakeApplicationModal } from '../components/IntakeApplicationModal';

interface ApplicationsListProps {
  onOpenApplication: (appId: string) => void;
}

export const ApplicationsList: React.FC<ApplicationsListProps> = ({ onOpenApplication }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [reviewerFilter, setReviewerFilter] = useState('');
  const [sortField, setSortField] = useState<'id' | 'name' | 'tasks' | 'status'>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<'backend-sqlite' | 'client-storage'>('client-storage');

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (academicYearFilter) params.academic_year = academicYearFilter;
      if (categoryFilter) params.category_id = categoryFilter;
      if (statusFilter) params.workflow_status = statusFilter;
      if (verificationFilter) params.verification_status = verificationFilter;
      if (reviewerFilter) params.assigned_officer = reviewerFilter;

      const res = await api.getApplications(params);
      setApplications(res);
      setPersistenceMode(getPersistenceMode());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [search, academicYearFilter, categoryFilter, statusFilter, verificationFilter, reviewerFilter]);

  // Calculated Summary Cards
  const totalApps = applications.length;
  const totalPendingTasks = applications.reduce((acc, app) => acc + (app.pending_tasks_count || 0), 0);
  const totalDeficiencies = applications.reduce((acc, app) => acc + (app.findings_count || 0), 0);
  const completedScrutiny = applications.filter((app) => app.workflow_status === 'Completed').length;

  // Sorting
  const sortedApps = [...applications].sort((a, b) => {
    let comp = 0;
    if (sortField === 'id') {
      comp = a.id.localeCompare(b.id);
    } else if (sortField === 'name') {
      comp = a.institution_name.localeCompare(b.institution_name);
    } else if (sortField === 'tasks') {
      comp = (a.pending_tasks_count || 0) - (b.pending_tasks_count || 0);
    } else if (sortField === 'status') {
      comp = (a.workflow_status || '').localeCompare(b.workflow_status || '');
    }
    return sortAsc ? comp : -comp;
  });

  const toggleSort = (field: 'id' | 'name' | 'tasks' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleCreatedApplication = (newAppId: string) => {
    fetchApps();
    onOpenApplication(newAppId);
  };

  return (
    <div className="space-y-4">
      {/* Page Title, Persistence Mode & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
              Applications Queue & Scrutiny Management
            </h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                persistenceMode === 'backend-sqlite'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-blue-50 text-blue-800 border-blue-300'
              }`}
              title={
                persistenceMode === 'backend-sqlite'
                  ? 'Connected to FastAPI backend with shared SQLite database'
                  : 'Operating in self-contained client state with local persistence'
              }
            >
              <Database className="w-3 h-3" />
              <span>{persistenceMode === 'backend-sqlite' ? 'Backend SQLite' : 'Client Storage'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an institutional application to open its Unified Workspace, review findings, and execute pending manual verifications.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowIntakeModal(true)}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Intake Application</span>
          </button>
          <button
            onClick={fetchApps}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Calculated Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Applications
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{totalApps}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">APH 2026–27 Submissions</div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-md">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              Pending Manual Checks
            </div>
            <div className="text-xl font-bold text-amber-900 mt-0.5">{totalPendingTasks}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Outstanding Officer Action</div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-md">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">
              Open Findings
            </div>
            <div className="text-xl font-bold text-red-900 mt-0.5">{totalDeficiencies}</div>
            <div className="text-[10px] text-red-500 mt-0.5">Automated Rule Flags</div>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-md">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Completed Scrutiny
            </div>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{completedScrutiny}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Disposition Recorded</div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-md">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Multi-Field Search & Enhanced Filters Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-2.5 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Application ID, Institution Name, or Institution Code..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        {/* Academic Year */}
        <select
          value={academicYearFilter}
          onChange={(e) => setAcademicYearFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
        >
          <option value="">All Academic Years</option>
          <option value="2026–27">AY 2026–27</option>
          <option value="2025–26">AY 2025–26</option>
        </select>

        {/* Application Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
        >
          <option value="">All Categories</option>
          <option value="1">Category 1 (EoA Self-Disclosure)</option>
          <option value="2">Category 2 (Increase in Intake)</option>
          <option value="3">Category 3 (Supernumerary Seats)</option>
          <option value="4">Category 4 (New Institution)</option>
          <option value="7">Category 7 (Change of Site)</option>
        </select>

        {/* Scrutiny / Workflow Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
        >
          <option value="">All Scrutiny Statuses</option>
          <option value="Ready for review">Ready for review</option>
          <option value="In review">In review</option>
          <option value="Clarification requested">Clarification requested</option>
          <option value="Escalated">Escalated</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Verification Status */}
        <select
          value={verificationFilter}
          onChange={(e) => setVerificationFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
        >
          <option value="">All Verification Statuses</option>
          <option value="Verification pending">Verification pending</option>
          <option value="In progress">In progress</option>
          <option value="Verification complete">Verification complete</option>
        </select>

        {/* Assigned Reviewer */}
        <select
          value={reviewerFilter}
          onChange={(e) => setReviewerFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
        >
          <option value="">All Assigned Officers</option>
          <option value="Officer A">Officer A</option>
          <option value="Senior Reviewer">Senior Reviewer</option>
          <option value="Technical Officer">Technical Officer</option>
        </select>

        {(search || academicYearFilter || categoryFilter || statusFilter || verificationFilter || reviewerFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setAcademicYearFilter('');
              setCategoryFilter('');
              setStatusFilter('');
              setVerificationFilter('');
              setReviewerFilter('');
            }}
            className="text-[11px] text-blue-700 hover:underline px-1 cursor-pointer font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th
                  onClick={() => toggleSort('id')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Application ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Institution & Sponsoring Body</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Category</th>
                <th
                  onClick={() => toggleSort('tasks')}
                  className="py-2.5 px-2 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Manual Checks</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center">Open Flags</th>
                <th
                  onClick={() => toggleSort('status')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Scrutiny Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Next Action</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading applications queue...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No matching applications found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try adjusting your search criteria or register a new application.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onOpenApplication(app.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      <div>{app.id}</div>
                      {app.institution_code && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {app.institution_code}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                        {app.institution_name}
                      </div>
                      <div className="text-[10px] text-slate-500 pt-0.5 truncate max-w-sm">
                        {app.trust_name ? `${app.trust_name} · ` : ''}AY {app.academic_year} · Officer: {app.assigned_officer}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      <div className="font-medium">{app.nature_of_application}</div>
                      <div className="text-[10px] text-slate-400">Cat {app.category_id}</div>
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      {(app.pending_tasks_count || 0) > 0 ? (
                        <span className="font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full text-[10px]">
                          {app.pending_tasks_count} Pending
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                          All Completed
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      {(app.findings_count || 0) > 0 ? (
                        <span className="font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full text-[10px]">
                          {app.findings_count} Deficiencies
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusChip type="workflow" value={app.workflow_status} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block truncate max-w-[220px]">
                        {app.next_recommended_action || 'Inspect Dossier & Run Validation'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenApplication(app.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-blue-700 hover:bg-blue-50 rounded group-hover:border-blue-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Workspace</span>
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

      {/* Intake Application Modal */}
      <IntakeApplicationModal
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        onCreated={handleCreatedApplication}
      />
    </div>
  );
};
