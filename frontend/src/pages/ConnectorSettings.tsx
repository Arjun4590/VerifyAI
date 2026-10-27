import React, { useEffect, useState } from 'react';
import { Power, RotateCcw, Lock } from 'lucide-react';
import { api } from '../services/api';
import { Connector, DemoRole } from '../types';

interface ConnectorSettingsProps {
  currentRole: DemoRole;
}

export const ConnectorSettings: React.FC<ConnectorSettingsProps> = ({ currentRole }) => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchConnectors = async () => {
    setLoading(true);
    try {
      const res = await api.getConnectors();
      setConnectors(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await api.toggleConnector(id);
      setActionMsg(`Connector ${id} toggled.`);
      fetchConnectors();
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleResetData = async () => {
    try {
      await api.seedDemo();
      setActionMsg('Local demo data reset to initial state.');
      setTimeout(() => window.location.reload(), 600);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  if (currentRole !== 'system_admin') {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-lg space-y-2">
        <Lock className="w-6 h-6 text-slate-400 mx-auto" />
        <h2 className="text-sm font-bold text-slate-800 m-0">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Connector settings are restricted to the <strong>System Admin</strong> role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
            Connector Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure simulated issuing authority connectors and local prototype state.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Reset All Demo Data</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-xs font-medium flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="font-bold text-emerald-700 cursor-pointer">×</button>
        </div>
      )}

      {/* Connectors List */}
      <div className="space-y-2.5">
        {connectors.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  {c.id}
                </span>
                <strong className="text-slate-900">{c.name}</strong>
                <span className="text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.2 rounded border border-red-200 font-mono">
                  {c.banner}
                </span>
              </div>
              <p className="text-slate-600">
                Type: <strong>{c.type}</strong> | Endpoint: <span className="font-mono text-slate-500">{c.endpoint}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                c.status.includes('Active') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {c.status}
              </span>
              <button
                onClick={() => handleToggle(c.id)}
                className="px-2.5 py-1 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Power className="w-3 h-3 text-slate-500" />
                <span>Toggle</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
