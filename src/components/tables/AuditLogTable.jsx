import { useEffect } from 'react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { auditService } from '../../services/auditService';
import { formatDate } from '../../utils/formatDate';
import { DataTable } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';

export function AuditLogTable({ onData }) {
  const { data: auditLogs } = useAsyncData(auditService.logs);

  useEffect(() => {
    if (onData) onData(auditLogs);
  }, [auditLogs, onData]);

  return (
    <DataTable
      data={auditLogs}
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
  );
}
