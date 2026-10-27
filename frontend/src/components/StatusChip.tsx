import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  HelpCircle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ShieldX
} from 'lucide-react';

interface StatusChipProps {
  type: 'workflow' | 'compliance' | 'verification' | 'processing' | 'lifecycle' | 'priority';
  value: string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ type, value, className = '' }) => {
  if (!value) return null;

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = HelpCircle;

  const val = value.trim();

  // Workflow status
  if (type === 'workflow') {
    switch (val) {
      case 'New':
        bg = 'bg-slate-100 text-slate-700 border-slate-300';
        Icon = FileText;
        break;
      case 'Processing':
        bg = 'bg-blue-50 text-blue-700 border-blue-200';
        Icon = Clock;
        break;
      case 'Ready for review':
        bg = 'bg-sky-50 text-sky-800 border-sky-300';
        Icon = Clock;
        break;
      case 'In review':
        bg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        Icon = Clock;
        break;
      case 'Clarification requested':
        bg = 'bg-amber-50 text-amber-800 border-amber-300';
        Icon = AlertTriangle;
        break;
      case 'Escalated':
        bg = 'bg-purple-50 text-purple-800 border-purple-300';
        Icon = ArrowUpRight;
        break;
      case 'Completed':
        bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
        Icon = CheckCircle2;
        break;
    }
  }

  // Compliance outcome
  if (type === 'compliance') {
    switch (val) {
      case 'Met':
        bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
        Icon = CheckCircle2;
        break;
      case 'Possible deficiency':
        bg = 'bg-red-50 text-red-800 border-red-300';
        Icon = AlertCircle;
        break;
      case 'Needs clarification':
        bg = 'bg-amber-50 text-amber-800 border-amber-300';
        Icon = AlertTriangle;
        break;
      case 'Not applicable':
        bg = 'bg-slate-100 text-slate-600 border-slate-200';
        Icon = HelpCircle;
        break;
      case 'Not evaluated':
        bg = 'bg-zinc-100 text-zinc-600 border-zinc-200';
        Icon = Clock;
        break;
    }
  }

  // Verification status
  if (type === 'verification') {
    switch (val) {
      case 'Verified':
        bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
        Icon = ShieldCheck;
        break;
      case 'Mismatch detected':
        bg = 'bg-red-50 text-red-800 border-red-300';
        Icon = ShieldAlert;
        break;
      case 'Verification pending':
        bg = 'bg-amber-50 text-amber-800 border-amber-300';
        Icon = Clock;
        break;
      case 'Source unavailable':
        bg = 'bg-slate-100 text-slate-700 border-slate-300';
        Icon = ShieldX;
        break;
      case 'Manual review required':
        bg = 'bg-orange-50 text-orange-800 border-orange-300';
        Icon = AlertTriangle;
        break;
      case 'Not required':
        bg = 'bg-slate-50 text-slate-600 border-slate-200';
        Icon = CheckCircle2;
        break;
    }
  }

  // Processing status
  if (type === 'processing') {
    switch (val) {
      case 'OK':
        bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle2;
        break;
      case 'Low confidence':
        bg = 'bg-amber-50 text-amber-800 border-amber-300';
        Icon = AlertTriangle;
        break;
      case 'Failed':
        bg = 'bg-red-50 text-red-700 border-red-200';
        Icon = AlertCircle;
        break;
      case 'Pending':
        bg = 'bg-slate-100 text-slate-600 border-slate-200';
        Icon = Clock;
        break;
    }
  }

  // Lifecycle status
  if (type === 'lifecycle') {
    switch (val) {
      case 'candidate':
        bg = 'bg-slate-100 text-slate-700 border-slate-300';
        Icon = FileText;
        break;
      case 'needs_source_review':
        bg = 'bg-amber-50 text-amber-800 border-amber-300';
        Icon = AlertTriangle;
        break;
      case 'reviewed':
        bg = 'bg-sky-50 text-sky-800 border-sky-300';
        Icon = CheckCircle2;
        break;
      case 'draft':
        bg = 'bg-blue-50 text-blue-800 border-blue-300';
        Icon = Clock;
        break;
      case 'submitted_for_approval':
        bg = 'bg-purple-50 text-purple-800 border-purple-300';
        Icon = ArrowUpRight;
        break;
      case 'approved':
        bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
        Icon = CheckCircle2;
        break;
      case 'rejected':
        bg = 'bg-rose-50 text-rose-800 border-rose-300';
        Icon = AlertCircle;
        break;
      case 'retired':
        bg = 'bg-zinc-100 text-zinc-600 border-zinc-300';
        Icon = ShieldX;
        break;
    }
  }

  // Priority
  if (type === 'priority') {
    switch (val) {
      case 'high':
        bg = 'bg-red-50 text-red-800 border-red-300';
        Icon = AlertCircle;
        break;
      case 'medium':
        bg = 'bg-amber-50 text-amber-800 border-amber-300';
        Icon = AlertTriangle;
        break;
      case 'low':
        bg = 'bg-slate-100 text-slate-700 border-slate-200';
        Icon = Clock;
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{val}</span>
    </span>
  );
};
