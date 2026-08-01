import { useEffect, useState } from 'react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { roleLabels } from '../../data/roles';
import { useAsyncData } from '../../hooks/useAsyncData';
import { adminService } from '../../services/adminService';

function normalizeRoleName(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizePermissionName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function RoleForm({ initialRole, permissions, saving, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    permissionNames: []
  });

  useEffect(() => {
    setForm({
      name: initialRole?.name || '',
      displayName: initialRole?.displayName || roleLabels[initialRole?.name] || '',
      permissionNames: initialRole?.permissions || []
    });
  }, [initialRole]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const togglePermission = (permissionName) => {
    setForm((current) => ({
      ...current,
      permissionNames: current.permissionNames.includes(permissionName)
        ? current.permissionNames.filter((name) => name !== permissionName)
        : [...current.permissionNames, permissionName]
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      name: normalizeRoleName(form.name),
      permissionNames: form.permissionNames
    });
  };

  return (
    <form className="app-form-grid" onSubmit={handleSubmit}>
      <div>
        <label className="form-label" htmlFor="role-name">
          Role key
        </label>
        <input
          id="role-name"
          className="form-control"
          value={form.name}
          onChange={(event) => updateField('name', normalizeRoleName(event.target.value))}
          placeholder="STORE_SUPERVISOR"
          readOnly={Boolean(initialRole?.id)}
          required
        />
      </div>
      <div>
        <label className="form-label" htmlFor="role-display-name">
          Display name
        </label>
        <input
          id="role-display-name"
          className="form-control"
          value={form.displayName}
          onChange={(event) => updateField('displayName', event.target.value)}
          placeholder="Store Supervisor"
          required
        />
      </div>
      <div className="col-span-2">
        <span className="form-label d-block">Permissions</span>
        <div className="permission-check-grid">
          {permissions.map((permission) => (
            <label className="permission-check" key={permission.id || permission.name}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={form.permissionNames.includes(permission.name)}
                onChange={() => togglePermission(permission.name)}
              />
              <span>
                <strong>{permission.name}</strong>
                <small>{permission.description}</small>
              </span>
            </label>
          ))}
          {!permissions.length ? <p className="text-body-secondary mb-0">Create permissions before assigning them to a role.</p> : null}
        </div>
      </div>
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          <i className="bi bi-check2-circle" aria-hidden="true" /> Save role
        </button>
      </div>
    </form>
  );
}

function PermissionForm({ initialPermission, saving, onSubmit }) {
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    setForm({
      name: initialPermission?.name || '',
      description: initialPermission?.description || ''
    });
  }, [initialPermission]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      name: normalizePermissionName(form.name)
    });
  };

  return (
    <form className="app-form-grid" onSubmit={handleSubmit}>
      <div>
        <label className="form-label" htmlFor="permission-name">
          Permission key
        </label>
        <input
          id="permission-name"
          className="form-control"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: normalizePermissionName(event.target.value) }))}
          placeholder="inventory:adjust"
          required
        />
      </div>
      <div>
        <label className="form-label" htmlFor="permission-description">
          Description
        </label>
        <input
          id="permission-description"
          className="form-control"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Adjust inventory balances"
          required
        />
      </div>
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          <i className="bi bi-check2-circle" aria-hidden="true" /> Save permission
        </button>
      </div>
    </form>
  );
}

export function RolePermissionManagement() {
  const [query, setQuery] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: roles, loading: rolesLoading, error: rolesError, reload: reloadRoles } = useAsyncData(adminService.roles);
  const { data: permissions, loading: permissionsLoading, error: permissionsError, reload: reloadPermissions } = useAsyncData(adminService.permissions);
  const loading = rolesLoading || permissionsLoading;
  const filteredRoles = roles.filter((role) => `${role.name} ${role.displayName} ${(role.permissions || []).join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  const saveRole = async (values) => {
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const response = await adminService.saveRole({ ...values, id: editingRole?.id });
      setEditingRole(null);
      setMessage(response.offlineQueued ? response.message : 'Role saved.');
      if (!response.offlineQueued) {
        reloadRoles();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to save role.');
    } finally {
      setSaving(false);
    }
  };

  const savePermission = async (values) => {
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const response = await adminService.savePermission({ ...values, id: editingPermission?.id });
      setEditingPermission(null);
      setMessage(response.offlineQueued ? response.message : 'Permission saved.');
      if (!response.offlineQueued) {
        reloadPermissions();
        reloadRoles();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to save permission.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Roles and permissions"
        description="Add roles, edit role permission assignments, and maintain the permission catalog."
        actions={
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary" type="button" onClick={() => setEditingPermission({})}>
              <i className="bi bi-key" aria-hidden="true" /> New permission
            </button>
            <button className="btn btn-primary" type="button" onClick={() => setEditingRole({})}>
              <i className="bi bi-shield-plus" aria-hidden="true" /> New role
            </button>
          </div>
        }
      />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error || rolesError || permissionsError ? <div className="alert alert-danger">{error || rolesError || permissionsError}</div> : null}
      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search roles and permissions" />
      {loading ? (
        <div className="chart-loading">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading roles
        </div>
      ) : (
        <section className="dashboard-grid">
          <div className="panel span-8" data-animate="fade-up">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Access</span>
                <h2>Roles</h2>
              </div>
            </div>
            <DataTable
              data={filteredRoles}
              columns={[
                { key: 'displayName', label: 'Role', render: (row) => row.displayName || roleLabels[row.name] || row.name },
                { key: 'name', label: 'Key' },
                {
                  key: 'permissions',
                  label: 'Permissions',
                  render: (row) => (row.permissions || []).join(', ') || 'No permissions'
                },
                {
                  key: 'actions',
                  label: '',
                  render: (row) => (
                    <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setEditingRole(row)}>
                      Edit
                    </button>
                  )
                }
              ]}
            />
          </div>
          <div className="panel span-4" data-animate="fade-up">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Catalog</span>
                <h2>Permissions</h2>
              </div>
            </div>
            <div className="stack-list">
              {permissions.map((permission) => (
                <article className="stack-row" key={permission.id || permission.name}>
                  <span>
                    <strong>{permission.name}</strong>
                    <small>{permission.description}</small>
                  </span>
                  <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setEditingPermission(permission)}>
                    Edit
                  </button>
                </article>
              ))}
              {!permissions.length ? <p className="text-body-secondary mb-0">No permissions found.</p> : null}
            </div>
          </div>
        </section>
      )}
      <ConfirmModal
        open={editingRole !== null}
        title={editingRole?.id ? 'Edit role' : 'New role'}
        body={<RoleForm initialRole={editingRole} permissions={permissions} saving={saving} onSubmit={saveRole} />}
        cancelLabel={null}
        confirmLabel={null}
        onCancel={() => setEditingRole(null)}
        size="modal-lg"
      />
      <ConfirmModal
        open={editingPermission !== null}
        title={editingPermission?.id ? 'Edit permission' : 'New permission'}
        body={<PermissionForm initialPermission={editingPermission} saving={saving} onSubmit={savePermission} />}
        cancelLabel={null}
        confirmLabel={null}
        onCancel={() => setEditingPermission(null)}
        size="modal-lg"
      />
    </>
  );
}
