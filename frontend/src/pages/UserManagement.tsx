import React, { useEffect, useState } from 'react';
import { Users, Shield, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../services/api';
import { User, DemoRole } from '../types';

interface UserManagementProps {
  currentRole: DemoRole;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  if (currentRole !== 'system_admin') {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-3">
        <Lock className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Access Restricted</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          User Management is restricted to the <strong>System Administrator</strong> role per regulatory governance policies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
          User & Role Management (System Admin Only)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configured demonstration accounts and statutory role privileges.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Assigned Regulatory Role</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role Privileges</th>
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
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{u.username}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 capitalize font-medium">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4 text-[11px] text-slate-500">
                    {u.role === 'system_admin' && 'Platform Health, Connectors, Rule Drafting (No case decisions)'}
                    {u.role === 'scrutiny_officer' && 'Scrutiny, Run Validation, Confirm/Dismiss Findings, Escalate'}
                    {u.role === 'senior_reviewer' && 'Rule Approval, Review Escalated Cases, Formal Disposition'}
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
