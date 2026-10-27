import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
          className="px-3 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-md text-xs font-medium flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
            No alerts match current filter.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    alert.priority === 'high' ? 'bg-red-600' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {alert.id}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">{alert.title}</span>
                    <StatusChip type="priority" value={alert.priority} />
                    <span className="text-[11px] text-slate-500 font-mono">
                      Target: <strong>{alert.application_id}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{alert.reason}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Created: {new Date(alert.created_at).toLocaleString()} | Assigned Role: <span className="capitalize">{alert.assigned_role.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                {alert.status === 'active' && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-2.5 py-1 text-xs border border-slate-300 text-slate-700 hover:bg-slate-50 rounded"
                  >
                    Acknowledge
                  </button>
                )}
                {alert.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded font-semibold"
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => onOpenApplication(alert.application_id)}
                  className="px-3 py-1 text-xs bg-blue-700 text-white rounded font-bold hover:bg-blue-800 flex items-center gap-1"
                >
                  <span>Inspect Case</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
