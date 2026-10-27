import { Application, DocumentItem, Finding, AuditEvent } from '../types';

export function generateReportHtml(
  app: Application,
  documents: DocumentItem[],
  findings: Finding[],
  audits: AuditEvent[],
  generatedBy: string = 'Officer A'
): string {
  const generatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const findingsRows = findings
    .map(
      (f) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">${f.rule_code}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>${f.title}</strong><br/><span style="color: #64748b; font-size: 11px;">${f.plain_reason}</span></td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; ${
        f.outcome === 'Possible deficiency'
          ? 'background: #fee2e2; color: #991b1b;'
          : f.outcome === 'Needs clarification'
          ? 'background: #fef3c7; color: #92400e;'
          : 'background: #dcfce7; color: #166534;'
      }">${f.outcome}</span></td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${f.review_status} ${
        f.reviewer_reason ? `<br/><em>"${f.reviewer_reason}"</em>` : ''
      }</td>
    </tr>
  `
    )
    .join('');

  const documentsRows = documents
    .map(
      (d) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${d.document_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${d.document_type}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">${d.file_hash ? d.file_hash.substring(0, 16) + '...' : 'N/A'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><span style="padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 10px; font-weight: 600;">${d.source_mode || 'Verified Fixture'}</span></td>
    </tr>
  `
    )
    .join('');

  const auditRows = audits
    .map(
      (a) => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${a.created_at}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 11px;">${a.user_name} (${a.user_role})</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">${a.action}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${a.reason_comment || '—'}</td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>VerifyAI Compliance Report — ${app.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #0f172a; margin: 0; padding: 24px; background: #f8fafc; }
    .container { max-width: 900px; margin: 0 auto; background: #ffffff; padding: 36px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .banner { background: #fef3c7; color: #78350f; padding: 10px 16px; border-radius: 6px; font-size: 12px; font-weight: bold; margin-bottom: 24px; border: 1px solid #fde68a; display: flex; justify-content: space-between; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { font-size: 20px; font-weight: 800; margin: 0; color: #0f172a; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; }
    .meta-item strong { color: #475569; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { text-align: left; padding: 8px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-weight: 700; color: #334155; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1e293b; margin: 24px 0 12px; border-left: 3px solid #2563eb; padding-left: 8px; }
    .disclaimer { margin-top: 32px; padding: 16px; background: #f8fafc; border-left: 4px solid #94a3b8; font-size: 11px; color: #64748b; }
    .print-btn { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; }
    @media print { .no-print { display: none; } body { background: white; padding: 0; } .container { border: none; box-shadow: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <span>Official Regulatory Scrutiny Evaluation Dossier</span>
      <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>
    </div>

    <div class="header">
      <div>
        <h1>VerifyAI Regulatory Scrutiny Dossier</h1>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">AICTE Approval Process Handbook (APH 2026–27) · Rule Set v1.0</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #64748b;">
        <div>Dossier ID: <strong>REP-${app.id}</strong></div>
        <div>Generated: ${generatedAt}</div>
        <div>Officer: ${generatedBy}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><strong>Application ID:</strong> ${app.id}</div>
      <div class="meta-item"><strong>Institution:</strong> ${app.institution_name}</div>
      <div class="meta-item"><strong>Academic Year:</strong> ${app.academic_year}</div>
      <div class="meta-item"><strong>Nature of Application:</strong> ${app.nature_of_application}</div>
      <div class="meta-item"><strong>Fixed Evaluation Date:</strong> ${app.evaluation_date}</div>
      <div class="meta-item"><strong>Workflow Status:</strong> ${app.workflow_status}</div>
      <div class="meta-item"><strong>Compliance Summary:</strong> ${app.compliance_outcome}</div>
      <div class="meta-item"><strong>Final Disposition:</strong> ${app.disposition || 'Pending Official Disposition'}</div>
    </div>

    <div class="section-title">Automated Rule Findings & Observations</div>
    <table>
      <thead>
        <tr>
          <th>Rule ID</th>
          <th>Requirement & Details</th>
          <th>Outcome</th>
          <th>Officer Review</th>
        </tr>
      </thead>
      <tbody>
        ${findingsRows || '<tr><td colspan="4" style="text-align: center; padding: 12px; color: #94a3b8;">No findings recorded.</td></tr>'}
      </tbody>
    </table>

    <div class="section-title">Submitted Supporting Documents</div>
    <table>
      <thead>
        <tr>
          <th>Document Title</th>
          <th>Category</th>
          <th>SHA-256 Hash</th>
          <th>Source Mode</th>
        </tr>
      </thead>
      <tbody>
        ${documentsRows || '<tr><td colspan="4" style="text-align: center; padding: 12px; color: #94a3b8;">No documents uploaded.</td></tr>'}
      </tbody>
    </table>

    <div class="section-title">Chronological Audit Trail</div>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Official</th>
          <th>Action</th>
          <th>Justification / Notes</th>
        </tr>
      </thead>
      <tbody>
        ${auditRows || '<tr><td colspan="4" style="text-align: center; padding: 12px; color: #94a3b8;">No audit entries.</td></tr>'}
      </tbody>
    </table>

    <div class="disclaimer">
      <strong>Regulatory Operations Notice:</strong> This document was generated by VerifyAI strictly as an automated decision-support dossier. VerifyAI cross-checks declared application parameters against approved AICTE Handbook rule versions. It does not automatically approve or reject applications. All final regulatory decisions remain under the exclusive statutory authority of designated regulatory officials.
    </div>
  </div>
</body>
</html>`;
}

export function openReportWindow(
  app: Application,
  documents: DocumentItem[],
  findings: Finding[],
  audits: AuditEvent[],
  generatedBy?: string
) {
  const html = generateReportHtml(app, documents, findings, audits, generatedBy);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
