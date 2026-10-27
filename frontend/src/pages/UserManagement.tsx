import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '../services/api';
import { User, DemoRole } from '../types';

interface UserManagementProps {
  currentRole: DemoRole;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  if (currentRole !== 'system_admin') {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-lg space-y-2">
        <Lock className="w-6 h-6 text-slate-400 mx-auto" />
        <h2 className="text-sm font-bold text-slate-800 m-0">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          User Management is restricted to the <strong>System Admin</strong> role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
          User & Role Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configured demo scrutiny roles and administrative access privileges.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Username</th>
              <th className="py-2.5 px-3">Full Name</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Email</th>
              <th className="py-2.5 px-3">Permissions Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">Loading users...</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{u.username}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 capitalize font-medium">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">
                    {u.role === 'system_admin' && 'Connectors, rule drafting, platform reset'}
                    {u.role === 'scrutiny_officer' && 'Case review, validation, deficiency confirmation, escalation'}
                    {u.role === 'senior_reviewer' && 'Rule approval, escalation review, formal case disposition'}
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
