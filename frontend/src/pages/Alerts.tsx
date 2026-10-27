import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock, AlertTriangle, ArrowRight, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';
import { Alert } from '../types';
import { StatusChip } from '../components/StatusChip';

interface AlertsProps {
  onOpenApplication: (appId: string) => void;
}

export const Alerts: React.FC<AlertsProps> = ({ onOpenApplication }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getAlerts(params);
      setAlerts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleAcknowledge = async (alertId: string) => {
    await api.acknowledgeAlert(alertId);
    fetchAlerts();
  };

  const handleResolve = async (alertId: string) => {
    await api.resolveAlert(alertId);
    fetchAlerts();
  };

  const toggleExpand = (id: string) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Regulatory Scrutiny Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated notifications for missing certificates, expired validity dates, and pending escalations.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="px-2.5 py-1 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-3 shadow-2xs">
        <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alerts List with Progressive Disclosure */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-lg">
            No alerts match current filter.
          </div>
        ) : (
          alerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            return (
              <div
                key={alert.id}
                className={`group bg-white border rounded-lg transition-all shadow-2xs overflow-hidden ${
                  isExpanded ? 'border-blue-400 ring-1 ring-blue-400/20' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Compact Row */}
                <div
                  onClick={() => toggleExpand(alert.id)}
                  className="p-3 flex items-center justify-between gap-3 text-xs cursor-pointer select-none hover:bg-slate-50/70"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        alert.priority === 'high' ? 'bg-red-600' : 'bg-amber-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                          {alert.title}
                        </span>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {alert.application_id}
                        </span>
                        <StatusChip type="priority" value={alert.priority} />
                      </div>

                      {/* Hover Subtitle */}
                      {!isExpanded && (
                        <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-5 group-hover:opacity-100 transition-all duration-150 text-[11px] text-slate-500 pt-0.5 truncate">
                          {alert.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenApplication(alert.application_id);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <span className="text-slate-400 text-xs">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-2 bg-slate-50/80 border-t border-slate-100 text-xs space-y-2">
                    <p className="text-slate-700 leading-relaxed">{alert.reason}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                      <div>
                        Created: {new Date(alert.created_at).toLocaleString()} · Role:{' '}
                        <span className="capitalize font-medium text-slate-700">{alert.assigned_role.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-2 py-0.5 text-xs border border-slate-300 text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded font-semibold cursor-pointer"
                          >
                            Resolve Alert
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
