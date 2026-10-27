import React, { useEffect, useState } from 'react';
import { Inbox, CheckCircle2, AlertTriangle, ArrowUpRight, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Application, DemoRole } from '../types';
import { StatusChip } from '../components/StatusChip';

interface ReviewQueueProps {
  onOpenApplication: (appId: string) => void;
  currentRole: DemoRole;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onOpenApplication, currentRole }) => {
  const [queueApps, setQueueApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getApplications();
      // Filter for items in review, escalated, or clarification
      setQueueApps(res.filter(a => a.workflow_status !== 'Completed'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Active Scrutiny Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Applications requiring first-level scrutiny, evidence inspection, or senior authority disposition.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-3 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-md text-xs font-medium flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Application ID</th>
              <th className="py-3 px-4">Institution Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-3 text-center">Deficiencies</th>
              <th className="py-3 px-4">Queue State</th>
              <th className="py-3 px-4">Assigned Officer</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Loading queue...</td>
              </tr>
            ) : queueApps.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">All applications in queue completed!</td>
              </tr>
            ) : (
              queueApps.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => onOpenApplication(app.id)}
                  className="hover:bg-blue-50/20 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{app.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{app.institution_name}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{app.nature_of_application}</td>
                  <td className="py-3 px-3 text-center">
                    {(app.findings_count || 0) > 0 ? (
                      <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-[11px]">
                        {app.findings_count} Flags
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusChip type="workflow" value={app.workflow_status} />
                  </td>
                  <td className="py-3 px-4 text-slate-600">{app.assigned_officer}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenApplication(app.id);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-blue-700 hover:bg-blue-50 rounded"
                    >
                      Review Case →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
