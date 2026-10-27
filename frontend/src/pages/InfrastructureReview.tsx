import React from 'react';
import { Building, ExternalLink } from 'lucide-react';
import { StatusChip } from '../components/StatusChip';

export const InfrastructureReview: React.FC = () => {
  const infraObservations = [
    {
      facility: 'Computer Center & Laboratories',
      declared: '150 Core i7 Workstations / 400 sqm Carpet Area',
      rule: 'APH 2026-27 Norms for Computer Center §4.3',
      observed: 'Floor layout diagram indicates 320 sqm contiguous area. 80 sqm partitioned for server room.',
      outcome: 'Needs clarification',
      status: 'Observation — needs review',
      evidenceDoc: 'VA-DEMO-014_Occupancy_Certificate.pdf'
    },
    {
      facility: 'Classroom Instructional Carpet Area',
      declared: '18 Classrooms @ 66 sqm each (1,188 sqm total)',
      rule: 'APH 2026-27 Built-Up Area Norms Table 4.1',
      observed: 'Declared built-up area 12,450 sqm satisfies total institutional carpet requirements.',
      outcome: 'Met',
      status: 'Compliant observation',
      evidenceDoc: 'VA-DEMO-014_Occupancy_Certificate.pdf'
    },
    {
      facility: 'Barrier-Free Built Environment & Restrooms',
      declared: 'Ramps, Lifts, and Specialized Facilities Provided',
      rule: 'APH 2026-27 Annexure 2 §2.1 Item 6 & Rights of PwD Act',
      observed: 'Dedicated Barrier-Free Built Environment compliance certificate missing from uploaded dossier.',
      outcome: 'Possible deficiency',
      status: 'Observation — deficiency flagged',
      evidenceDoc: null
    }
  ];

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

      <div className="space-y-3">
        {infraObservations.map((obs, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-bold text-slate-900 m-0">{obs.facility}</h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip type="compliance" value={obs.outcome} />
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {obs.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Declared Value</span>
                <span className="text-slate-800 font-semibold">{obs.declared}</span>
                <p className="text-[11px] text-slate-500">Standard: {obs.rule}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Scrutiny Observation</span>
                <p className="text-slate-800">{obs.observed}</p>
                {obs.evidenceDoc ? (
                  <a
                    href={`/documents/${obs.evidenceDoc}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-semibold mt-1"
                  >
                    <span>View {obs.evidenceDoc}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-red-600 italic block mt-1">No certificate attached</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
