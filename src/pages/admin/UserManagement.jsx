import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ROLES, roleLabels } from '../../data/roles';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { catalogService } from '../../services/catalogService';

function roleDisplayName(role) {
  return role?.displayName || roleLabels[role?.name] || role?.name || 'Unnamed role';
}

function defaultRoleNames(roles) {
  const roleNames = roles.map((role) => role.name).filter(Boolean);
  if (roleNames.includes(ROLES.CASHIER)) {
    return [ROLES.CASHIER];
  }
  return roleNames.length ? [roleNames[0]] : [];
}

function formatRoleList(roleNames, roleDisplayNames) {
  return (roleNames || []).map((roleName) => roleDisplayNames.get(roleName) || roleLabels[roleName] || roleName).join(', ') || 'No roles';
}

function locationDisplayName(location) {
  const details = [location?.type, location?.status].filter(Boolean).join(' - ');
  return {
    name: location?.name || 'Unnamed location',
    details
  };
}

function formatLocationList(locationNames) {
  return (locationNames || []).join(', ') || 'No locations';
}

function UserForm({ initialUser, roles = [], rolesLoading, rolesError, locations = [], locationsLoading, locationsError, onSubmit }) {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      name: initialUser?.name || '',
      email: initialUser?.email || '',
      password: '',
      status: initialUser?.status || 'Active'
    }
  });
  const [selectedRoles, setSelectedRoles] = useState(() => initialUser?.roles || defaultRoleNames(roles));
  const [selectedLocationIds, setSelectedLocationIds] = useState(() => (initialUser?.locationIds || []).map(String));
  const [roleError, setRoleError] = useState('');
  const roleDisplayNames = useMemo(() => new Map(roles.map((role) => [role.name, roleDisplayName(role)])), [roles]);
  const selectedUnavailableRoles = selectedRoles.filter((roleName) => !roleDisplayNames.has(roleName));
  const locationDisplayNames = useMemo(() => new Map(locations.map((location) => [String(location.id), locationDisplayName(location)])), [locations]);
  const selectedUnavailableLocationIds = selectedLocationIds.filter((locationId) => !locationDisplayNames.has(String(locationId)));

  useEffect(() => {
    const assignedRoles = Array.isArray(initialUser?.roles) ? initialUser.roles.filter(Boolean) : [];
    if (assignedRoles.length) {
      setSelectedRoles(assignedRoles);
      return;
    }

    setSelectedRoles(initialUser?.id ? [] : defaultRoleNames(roles));
  }, [initialUser, roles]);

  useEffect(() => {
    setSelectedLocationIds(Array.isArray(initialUser?.locationIds) ? initialUser.locationIds.map(String).filter(Boolean) : []);
  }, [initialUser]);

  const toggleRole = (roleName) => {
    setRoleError('');
    setSelectedRoles((current) =>
      current.includes(roleName) ? current.filter((name) => name !== roleName) : [...current, roleName]
    );
  };

  const toggleLocation = (locationId) => {
    const normalizedLocationId = String(locationId);
    setSelectedLocationIds((current) =>
      current.includes(normalizedLocationId) ? current.filter((id) => id !== normalizedLocationId) : [...current, normalizedLocationId]
    );
  };

  const submit = (values) => {
    const rolesToSave = selectedRoles.filter(Boolean);
    if (!rolesToSave.length) {
      setRoleError('Select at least one role.');
      return;
    }

    onSubmit({
      ...values,
      roles: rolesToSave,
      locationIds: selectedLocationIds
    });
  };

  return (
    <form className="app-form-grid" onSubmit={handleSubmit(submit)}>
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
      <div className="col-span-2">
        <span className="form-label d-block">Roles</span>
        {rolesLoading ? (
          <div className="chart-loading align-items-start justify-content-start py-2">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading roles
          </div>
        ) : null}
        {rolesError ? <p className="text-danger small mb-2">{rolesError}</p> : null}
        {!rolesLoading && !roles.length ? <p className="text-body-secondary mb-0">Create roles before assigning them to users.</p> : null}
        {roles.length ? (
          <div className="permission-check-grid">
            {roles.map((role) => (
              <label className="permission-check" key={role.id || role.name}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={selectedRoles.includes(role.name)}
                  onChange={() => toggleRole(role.name)}
                  disabled={!role.name}
                />
                <span>
                  <strong>{roleDisplayName(role)}</strong>
                  <small>{role.name}</small>
                </span>
              </label>
            ))}
            {selectedUnavailableRoles.map((roleName) => (
              <label className="permission-check" key={roleName}>
                <input className="form-check-input" type="checkbox" checked disabled readOnly />
                <span>
                  <strong>{roleLabels[roleName] || roleName}</strong>
                  <small>Assigned role not found in the role catalog</small>
                </span>
              </label>
            ))}
          </div>
        ) : null}
        {roleError ? <p className="text-danger small mt-2 mb-0">{roleError}</p> : null}
      </div>
      <div className="col-span-2">
        <span className="form-label d-block">Locations</span>
        {locationsLoading ? (
          <div className="chart-loading align-items-start justify-content-start py-2">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading locations
          </div>
        ) : null}
        {locationsError ? <p className="text-danger small mb-2">{locationsError}</p> : null}
        {!locationsLoading && !locations.length ? <p className="text-body-secondary mb-0">Create locations before assigning them to users.</p> : null}
        {locations.length ? (
          <div className="permission-check-grid">
            {locations.map((location) => {
              const display = locationDisplayName(location);

              return (
                <label className="permission-check" key={location.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedLocationIds.includes(String(location.id))}
                    onChange={() => toggleLocation(location.id)}
                    disabled={!location.id}
                  />
                  <span>
                    <strong>{display.name}</strong>
                    <small>{display.details || location.id}</small>
                  </span>
                </label>
              );
            })}
            {selectedUnavailableLocationIds.map((locationId) => (
              <label className="permission-check" key={locationId}>
                <input className="form-check-input" type="checkbox" checked disabled readOnly />
                <span>
                  <strong>{locationId}</strong>
                  <small>Assigned location not found in the location catalog</small>
                </span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting || rolesLoading || !roles.length || !selectedRoles.length}>
          <i className="bi bi-check2-circle" aria-hidden="true" /> Save user
        </button>
      </div>
    </form>
  );
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { data: users, reload } = useAsyncData(adminService.users);
  const { data: roles, loading: rolesLoading, error: rolesError } = useAsyncData(adminService.roles);
  const { data: locations, loading: locationsLoading, error: locationsError } = useAsyncData(catalogService.locations);
  const roleDisplayNames = useMemo(() => new Map(roles.map((role) => [role.name, roleDisplayName(role)])), [roles]);
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

  const handleDelete = async () => {
    if (!deletingUser?.id) {
      return;
    }

    setMessage('');
    setError('');
    try {
      const response = await adminService.deleteUser(deletingUser.id);
      setDeletingUser(null);
      setMessage(response.message || 'User deleted.');
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to delete user.');
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
      {error || rolesError || locationsError ? <div className="alert alert-danger">{error || rolesError || locationsError}</div> : null}
      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search users" />
      <DataTable
        data={filtered}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'roles', label: 'Roles', render: (row) => formatRoleList(row.roles, roleDisplayNames) },
          { key: 'locations', label: 'Locations', render: (row) => formatLocationList(row.locations) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => {
              const isCurrentUser = row.email?.toLowerCase() === currentUser?.email?.toLowerCase();

              return (
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setEditingUser(row)}>
                    <i className="bi bi-pencil-square" aria-hidden="true" /> Manage
                  </button>
                  {!isCurrentUser ? (
                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setDeletingUser(row)}>
                      <i className="bi bi-trash" aria-hidden="true" /> Delete
                    </button>
                  ) : null}
                </div>
              );
            }
          }
        ]}
      />
      <ConfirmModal
        open={editingUser !== null}
        title={editingUser?.id ? 'Manage user' : 'New user'}
        body={
          <UserForm
            initialUser={editingUser}
            roles={roles}
            rolesLoading={rolesLoading}
            rolesError={rolesError}
            locations={locations}
            locationsLoading={locationsLoading}
            locationsError={locationsError}
            onSubmit={handleSave}
          />
        }
        cancelLabel={null}
        confirmLabel={null}
        onCancel={() => setEditingUser(null)}
        size="modal-lg"
      />
      <ConfirmModal
        open={deletingUser !== null}
        title="Delete user"
        body={`Delete ${deletingUser?.name || 'this user'}? This removes their account access and cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </>
  );
}
