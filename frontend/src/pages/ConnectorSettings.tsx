import React, { useEffect, useState } from 'react';
import { Settings, ShieldAlert, CheckCircle2, RefreshCw, Power, Database, Lock } from 'lucide-react';
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
      setActionMsg(`Connector ${id} status toggled.`);
      fetchConnectors();
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleReSeed = async () => {
    try {
      const res = await api.seedDemo();
      setActionMsg('Deterministic synthetic demo data re-seeded successfully.');
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleReImport = async () => {
    try {
      const res = await api.importWorkbook();
      setActionMsg('Handbook extraction workbook re-imported successfully (2,029 records).');
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  if (currentRole !== 'system_admin') {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-3">
        <Lock className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Access Restricted</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Connector Settings and platform re-initialization are restricted to the <strong>System Administrator</strong> role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
          External Connector Settings (System Admin Only)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure simulated data connectors and manage local dataset re-initialization.
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-medium flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="font-bold text-emerald-700">×</button>
        </div>
      )}

      {/* Re-seed & Re-import Operations Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Database & Workbook Catalogue Operations
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleReSeed}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Database className="w-4 h-4" />
            <span>Re-Seed Deterministic Demo Cases</span>
          </button>
          <button
            onClick={handleReImport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-blue-700" />
            <span>Re-Import handbook_extraction.xlsx (5 Sheets)</span>
          </button>
        </div>
      </div>

      {/* Connectors List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Simulated Issuing Authority Connectors
        </h3>

        {connectors.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {c.id}
                </span>
                <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                  {c.banner}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Type: <strong>{c.type}</strong> | Simulated Endpoint: <span className="font-mono text-slate-500">{c.endpoint}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Last Heartbeat Ping: {c.last_ping} ({c.latency_ms} ms simulated latency)
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 self-end md:self-center">
              <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                c.status.includes('Active') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {c.status}
              </span>
              <button
                onClick={() => handleToggle(c.id)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5 text-slate-600" />
                <span>Toggle Status</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
