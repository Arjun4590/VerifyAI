import React, { useEffect, useState } from 'react';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { Application, DemoRole } from '../types';
import { StatusChip } from '../components/StatusChip';

interface ReviewQueueProps {
  onOpenApplication: (appId: string) => void;
  currentRole: DemoRole;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onOpenApplication }) => {
  const [queueApps, setQueueApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getApplications();
      // Filter for items needing scrutiny (not completed)
      setQueueApps(res.filter((a) => a.workflow_status !== 'Completed'));
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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Scrutiny Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active applications requiring scrutiny officer inspection or senior reviewer disposition.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-2.5 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Application ID</th>
              <th className="py-2.5 px-3">Institution Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-2 text-center">Flags</th>
              <th className="py-2.5 px-3">Queue Status</th>
              <th className="py-2.5 px-3">Officer</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Loading queue...</td>
              </tr>
            ) : queueApps.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Queue is clear! All active cases reviewed.</td>
              </tr>
            ) : (
              queueApps.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => onOpenApplication(app.id)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{app.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{app.institution_name}</td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{app.nature_of_application}</td>
                  <td className="py-2.5 px-2 text-center">
                    {(app.findings_count || 0) > 0 ? (
                      <span className="font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded-full text-[10px]">
                        {app.findings_count}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusChip type="workflow" value={app.workflow_status} />
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{app.assigned_officer}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenApplication(app.id);
                      }}
                      className="px-2 py-0.5 text-[11px] text-blue-700 hover:bg-blue-50 border border-blue-200 rounded inline-flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3 h-3" />
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
