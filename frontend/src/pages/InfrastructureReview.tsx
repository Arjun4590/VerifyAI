import React, { useState } from 'react';
import { Building, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusChip } from '../components/StatusChip';

export const InfrastructureReview: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const infraObservations = [
    {
      facility: 'Computer Center & Laboratories',
      shortPreview: 'Declared: 150 Core i7 Workstations / 400 sqm Carpet Area',
      declared: '150 Core i7 Workstations / 400 sqm Carpet Area',
      rule: 'APH 2026-27 Norms for Computer Center §4.3',
      observed: 'Floor layout diagram indicates 320 sqm contiguous area. 80 sqm partitioned for server room.',
      outcome: 'Needs clarification' as const,
      status: 'Observation — needs review',
      evidenceDoc: 'VA-DEMO-014_Occupancy_Certificate.pdf'
    },
    {
      facility: 'Classroom Instructional Carpet Area',
      shortPreview: 'Declared: 18 Classrooms @ 66 sqm each (1,188 sqm total)',
      declared: '18 Classrooms @ 66 sqm each (1,188 sqm total)',
      rule: 'APH 2026-27 Built-Up Area Norms Table 4.1',
      observed: 'Declared built-up area 12,450 sqm satisfies total institutional carpet requirements.',
      outcome: 'Met' as const,
      status: 'Compliant observation',
      evidenceDoc: 'VA-DEMO-014_Occupancy_Certificate.pdf'
    },
    {
      facility: 'Barrier-Free Built Environment & Restrooms',
      shortPreview: 'Declared: Ramps, Lifts, and Specialized Facilities Provided',
      declared: 'Ramps, Lifts, and Specialized Facilities Provided',
      rule: 'APH 2026-27 Annexure 2 §2.1 Item 6 & Rights of PwD Act',
      observed: 'Dedicated Barrier-Free Built Environment compliance certificate missing from uploaded dossier.',
      outcome: 'Possible deficiency' as const,
      status: 'Observation — deficiency flagged',
      evidenceDoc: null
    }
  ];

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">
          Infrastructure & Facilities Review
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Campus carpet areas, instructional space norms, and physical facility declarations.
        </p>
      </div>

      <div className="space-y-2.5">
        {infraObservations.map((obs, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={idx}
              className={`group bg-white border rounded-lg transition-all shadow-2xs overflow-hidden ${
                isExpanded ? 'border-blue-400 ring-1 ring-blue-400/20' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {/* Compact Header Row */}
              <div
                onClick={() => toggleExpand(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(idx);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={isExpanded}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building className="w-4 h-4 text-blue-700 flex-shrink-0" />
                    <h3 className="text-xs font-bold text-slate-900 m-0 group-hover:text-blue-900 transition-colors">
                      {obs.facility}
                    </h3>
                  </div>

                  {/* Smooth Hover / Focus Subtitle */}
                  {!isExpanded && (
                    <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-6 group-hover:opacity-100 group-focus:max-h-6 group-focus:opacity-100 transition-all duration-150 ease-out text-[11px] text-slate-500 font-normal pt-0.5 truncate">
                      {obs.shortPreview}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusChip type="compliance" value={obs.outcome} />
                  <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                    <span>{isExpanded ? 'Hide' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </div>
              </div>

              {/* Progressive Disclosure Details Panel */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Declared Value & Standard
                      </span>
                      <p className="text-slate-900 font-semibold">{obs.declared}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Standard: {obs.rule}</p>
                    </div>

                    <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Scrutiny Observation
                      </span>
                      <p className="text-slate-800 leading-relaxed">{obs.observed}</p>
                      {obs.evidenceDoc ? (
                        <a
                          href={`/documents/${obs.evidenceDoc}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-semibold pt-1"
                        >
                          <span>Open Document: {obs.evidenceDoc}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-red-600 italic block pt-1">
                          No compliance certificate attached
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
