import { useState } from 'react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ROLES, roleLabels } from '../../data/roles';

const roleRows = [
  { id: ROLES.ADMIN, role: roleLabels[ROLES.ADMIN], scope: 'All locations', permissions: 'Full control', status: 'Active' },
  { id: ROLES.STORE_MANAGER, role: roleLabels[ROLES.STORE_MANAGER], scope: 'Assigned warehouses', permissions: 'Inventory, transfers, reports', status: 'Active' },
  { id: ROLES.SHOP_MANAGER, role: roleLabels[ROLES.SHOP_MANAGER], scope: 'Assigned shops', permissions: 'Requests, receiving, shop reports', status: 'Active' },
  { id: ROLES.CASHIER, role: roleLabels[ROLES.CASHIER], scope: 'Assigned POS terminal', permissions: 'Sales, receipts, shifts', status: 'Active' },
  { id: ROLES.AUDITOR, role: roleLabels[ROLES.AUDITOR], scope: 'Read-only', permissions: 'Reports and audit logs', status: 'Active' }
];

export function RolePermissionManagement() {
  const [activeRole, setActiveRole] = useState(null);
  const [permissionOpen, setPermissionOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Roles and permissions"
        description="Review role boundaries before backend RBAC enforcement is connected."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setPermissionOpen(true)}>
            <i className="bi bi-shield-plus" aria-hidden="true" /> New permission
          </button>
        }
      />
      <DataTable
        data={roleRows}
        columns={[
          { key: 'role', label: 'Role' },
          { key: 'scope', label: 'Location scope' },
          { key: 'permissions', label: 'Primary permissions' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setActiveRole(row)}>
                Edit rules
              </button>
            )
          }
        ]}
      />
      <ConfirmModal
        open={Boolean(activeRole)}
        title={activeRole?.role || 'Role rules'}
        body={
          <dl className="receipt-meta mb-0">
            <dt>Scope</dt>
            <dd>{activeRole?.scope}</dd>
            <dt>Permissions</dt>
            <dd>{activeRole?.permissions}</dd>
            <dt>Status</dt>
            <dd>{activeRole?.status}</dd>
          </dl>
        }
        confirmLabel="Close"
        cancelLabel={null}
        onConfirm={() => setActiveRole(null)}
        onCancel={() => setActiveRole(null)}
      />
      <ConfirmModal
        open={permissionOpen}
        title="New permission"
        body="Permission records are currently managed by the backend migration set so RBAC stays controlled and auditable. Add new permission definitions in the backend role-permission migration before exposing them to users."
        confirmLabel="Close"
        cancelLabel={null}
        onConfirm={() => setPermissionOpen(false)}
        onCancel={() => setPermissionOpen(false)}
      />
    </>
  );
}
