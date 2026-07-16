import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { roleLabels } from '../../data/roles';
import { useAsyncData } from '../../hooks/useAsyncData';
import { adminService } from '../../services/adminService';
import { catalogService } from '../../services/catalogService';

function UserForm({ initialUser, roles, locations, onSubmit }) {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      name: initialUser?.name || '',
      email: initialUser?.email || '',
      password: '',
      roles: initialUser?.roles || ['CASHIER'],
      locationIds: initialUser?.locationIds || [],
      status: initialUser?.status || 'Active'
    }
  });

  return (
    <form className="app-form-grid" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="form-label" htmlFor="user-name">
          Name
        </label>
        <input id="user-name" className="form-control" {...register('name', { required: true })} />
      </div>
      <div>
        <label className="form-label" htmlFor="user-email">
          Email
        </label>
        <input id="user-email" className="form-control" type="email" {...register('email', { required: true })} />
      </div>
      <div>
        <label className="form-label" htmlFor="user-password">
          Password
        </label>
        <input
          id="user-password"
          className="form-control"
          type="password"
          placeholder={initialUser?.id ? 'Leave blank to keep current password' : ''}
          {...register('password', { required: !initialUser?.id })}
        />
      </div>
      <div>
        <label className="form-label" htmlFor="user-status">
          Status
        </label>
        <select id="user-status" className="form-select" {...register('status')}>
          <option>Active</option>
          <option>Locked</option>
          <option>Disabled</option>
        </select>
      </div>
      <div>
        <label className="form-label" htmlFor="user-roles">
          Roles
        </label>
        <select id="user-roles" className="form-select" multiple {...register('roles', { required: true })}>
          {roles.map((role) => (
            <option key={role.id || role.name} value={role.name}>
              {role.displayName || roleLabels[role.name] || role.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label" htmlFor="user-locations">
          Locations
        </label>
        <select id="user-locations" className="form-select" multiple {...register('locationIds')}>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting}>
          <i className="bi bi-check2-circle" aria-hidden="true" /> Save user
        </button>
      </div>
    </form>
  );
}

export function UserManagement() {
  const [query, setQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { data: users, reload } = useAsyncData(adminService.users);
  const { data: roles } = useAsyncData(adminService.roles);
  const { data: locations } = useAsyncData(catalogService.locations);
  const filtered = users.filter((user) => `${user.name} ${user.email} ${(user.roles || []).join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  const handleSave = async (values) => {
    setMessage('');
    setError('');
    try {
      const response = await adminService.saveUser({
        ...values,
        id: editingUser?.id,
        roles: Array.isArray(values.roles) ? values.roles : [values.roles].filter(Boolean),
        locationIds: Array.isArray(values.locationIds) ? values.locationIds : [values.locationIds].filter(Boolean)
      });
      setEditingUser(null);
      setMessage(response.offlineQueued ? response.message : 'User saved.');
      if (response.offlineQueued) {
        return;
      }
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to save user.');
    }
  };

  return (
    <>
      <PageHeader
        title="User management"
        description="Create users, assign roles, and restrict users to approved locations."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setEditingUser({})}>
            <i className="bi bi-person-plus" aria-hidden="true" /> New user
          </button>
        }
      />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search users" />
      <DataTable
        data={filtered}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'roles', label: 'Role', render: (row) => (row.roles || []).map((role) => roleLabels[role] || role).join(', ') },
          { key: 'locations', label: 'Locations', render: (row) => (row.locations || []).join(', ') },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setEditingUser(row)}>
                Manage
              </button>
            )
          }
        ]}
      />
      <ConfirmModal
        open={editingUser !== null}
        title={editingUser?.id ? 'Manage user' : 'New user'}
        body={<UserForm initialUser={editingUser} roles={roles} locations={locations} onSubmit={handleSave} />}
        cancelLabel={null}
        confirmLabel={null}
        onCancel={() => setEditingUser(null)}
        size="modal-lg"
      />
    </>
  );
}
