import { useState } from 'react';
import { AuditLogTable } from '../../components/tables/AuditLogTable';
import { PageHeader } from '../../components/common/PageHeader';
import { exportCsv } from '../../utils/exportCsv';

export function AuditLogsPage() {
  const [rows, setRows] = useState([]);

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Tamper-resistant record of sensitive actions, security events, stock movement, sales, and access outcomes."
        actions={
          <button className="btn btn-outline-primary" type="button" onClick={() => exportCsv('audit-logs.csv', rows)} disabled={!rows.length}>
            <i className="bi bi-file-earmark-arrow-down" aria-hidden="true" /> Export
          </button>
        }
      />
      <AuditLogTable onData={setRows} />
    </>
  );
}
