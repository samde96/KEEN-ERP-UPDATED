import { useEffect } from 'react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { auditService } from '../../services/auditService';
import { formatDate } from '../../utils/formatDate';
import { DataTable } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';

export function AuditLogTable({ onData }) {
  const { data: auditLogs, error } = useAsyncData(auditService.logs, [], [], { pollIntervalMs: 10000 });

  useEffect(() => {
    if (onData) onData(auditLogs);
  }, [auditLogs, onData]);

  return (
    <>
      {error ? <div className="alert alert-warning">{error}</div> : null}
      <DataTable
        data={auditLogs}
        emptyText="No audit events recorded yet. New admin, stock, transfer, POS, and security actions will appear here."
        columns={[
          { key: 'id', label: 'Event ID' },
          { key: 'user', label: 'User' },
          { key: 'role', label: 'Role' },
          { key: 'action', label: 'Action' },
          { key: 'entity', label: 'Entity' },
          { key: 'location', label: 'Location' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'at', label: 'Date', render: (row) => formatDate(row.at) }
        ]}
      />
    </>
  );
}
