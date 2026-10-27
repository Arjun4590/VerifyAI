import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Finding } from '../types';
import { StatusChip } from './StatusChip';

interface CompactFindingCardProps {
  finding: Finding;
  onSelect: (finding: Finding) => void;
  isSelected?: boolean;
}

export const getFindingSubtitle = (f: Finding): string => {
  if (f.rule_code === 'DOC-FIRE-EXPIRY') {
    return 'Validity date: 31 Dec 2025';
  }
  if (f.rule_code === 'DECL-FORM-STUDENT-DATA') {
    return 'Affidavit and application field disagree';
  }
  if (f.rule_code === 'CHECKLIST-MISSING-DOC') {
    return 'Barrier-Free Built Environment Certificate';
  }
  if (f.rule_code === 'ISSUER-VERIFY-CHECK') {
    return 'Certificate registry result needs review';
  }
  if (f.rule_code === 'OCR-CONFIDENCE-LOW') {
    return 'One extracted field requires manual review';
  }
  if (f.observed_value) {
    return f.observed_value;
  }
  const sentence = f.plain_reason.split('.')[0];
  return sentence.length > 60 ? `${sentence.slice(0, 57)}...` : sentence;
};

export const getCleanFindingTitle = (f: Finding): string => {
  if (f.rule_code === 'CHECKLIST-MISSING-DOC') {
    return 'Required Document Missing';
  }
  if (f.rule_code === 'DECL-FORM-STUDENT-DATA') {
    return 'Student Data Declaration Mismatch';
  }
  if (f.rule_code === 'ISSUER-VERIFY-CHECK') {
    return 'Issuer Registry Check Mismatch';
  }
  if (f.rule_code === 'OCR-CONFIDENCE-LOW') {
    return 'Low-Confidence Document Extraction';
  }
  return f.title;
};

export const CompactFindingCard: React.FC<CompactFindingCardProps> = ({
  finding,
  onSelect,
  isSelected = false,
}) => {
  const title = getCleanFindingTitle(finding);
  const subtitle = getFindingSubtitle(finding);

  return (
    <div
      onClick={() => onSelect(finding)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(finding);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${title} - ${finding.outcome}. Click to view details.`}
      className={`group relative p-3 bg-white border rounded-lg transition-all duration-150 cursor-pointer text-left focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-400 select-none ${
        isSelected
          ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/20 shadow-xs'
          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/70 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Title + Progressive Disclosure Subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-semibold text-slate-900 group-hover:text-blue-900 transition-colors m-0 truncate">
              {title}
            </h3>
            {finding.review_status !== 'unreviewed' && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  finding.review_status === 'confirmed'
                    ? 'bg-red-100 text-red-800'
                    : finding.review_status === 'dismissed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {finding.review_status}
              </span>
            )}
          </div>

          {/* Subtitle revealed smoothly on hover and keyboard focus */}
          <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-6 group-hover:opacity-100 group-focus:max-h-6 group-focus:opacity-100 group-focus-within:max-h-6 group-focus-within:opacity-100 transition-all duration-150 ease-out text-[11px] text-slate-500 font-normal">
            <span className="truncate block pt-0.5">{subtitle}</span>
          </div>
        </div>

        {/* Right: Outcome badge + View Details action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusChip type="compliance" value={finding.outcome} />
          <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-800 flex items-center gap-0.5 transition-colors">
            <span>View details</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};
