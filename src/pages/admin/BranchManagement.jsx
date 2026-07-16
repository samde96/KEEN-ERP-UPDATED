import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';

const locationTypes = [
  ['MAIN_WAREHOUSE', 'Main Warehouse'],
  ['STORE', 'Store'],
  ['SHOP', 'Shop'],
  ['BRANCH', 'Branch'],
  ['DAMAGED_GOODS_AREA', 'Damaged Goods Area'],
  ['RETURNS_AREA', 'Returns Area'],
  ['TRANSIT_AREA', 'Transit Area']
];

function LocationForm({ initialLocation, onSubmit }) {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      name: initialLocation?.name || '',
      type: initialLocation?.type || 'SHOP',
      managerName: initialLocation?.manager || initialLocation?.managerName || '',
      active: initialLocation ? initialLocation.status !== 'Inactive' : true
    }
  });

  return (
    <form className="app-form-grid" onSubmit={handleSubmit(onSubmit)}>
      <div className="col-span-2">
        <label className="form-label" htmlFor="location-name">
          Location name
        </label>
        <input id="location-name" className="form-control" {...register('name', { required: true })} />
      </div>
      <div>
        <label className="form-label" htmlFor="location-type">
          Type
        </label>
        <select id="location-type" className="form-select" {...register('type')}>
          {locationTypes.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label" htmlFor="location-manager">
          Manager
        </label>
        <input id="location-manager" className="form-control" {...register('managerName', { required: true })} />
      </div>
      <div className="col-span-2 form-check form-switch">
        <input id="location-active" className="form-check-input" type="checkbox" {...register('active')} />
        <label className="form-check-label" htmlFor="location-active">
          Active location
        </label>
      </div>
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting}>
          <i className="bi bi-check2-circle" aria-hidden="true" /> Save location
        </button>
      </div>
    </form>
  );
}

export function BranchManagement() {
  const [query, setQuery] = useState('');
  const [editingLocation, setEditingLocation] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { data: locations, reload } = useAsyncData(catalogService.locations);
  const filtered = locations.filter((location) => `${location.name} ${location.type} ${location.manager}`.toLowerCase().includes(query.toLowerCase()));
  const modalOpen = editingLocation !== null;

  const handleSave = async (values) => {
    setError('');
    setMessage('');
    try {
      const response = await catalogService.saveLocation({
        ...values,
        id: editingLocation?.id,
        active: Boolean(values.active)
      });
      setEditingLocation(null);
      setMessage(response.offlineQueued ? response.message : 'Location saved.');
      if (response.offlineQueued) {
        return;
      }
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to save location.');
    }
  };

  return (
    <>
      <PageHeader
        title="Branch and location management"
        description="Manage warehouses, shops, transit areas, returns areas, and branch assignments."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setEditingLocation({})}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> New location
          </button>
        }
      />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search locations" />
      <DataTable
        data={filtered}
        columns={[
          { key: 'name', label: 'Location' },
          { key: 'type', label: 'Type' },
          { key: 'manager', label: 'Manager' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setEditingLocation(row)}>
                Edit
              </button>
            )
          }
        ]}
      />
      <ConfirmModal
        open={modalOpen}
        title={editingLocation?.id ? 'Edit location' : 'New location'}
        body={<LocationForm initialLocation={editingLocation} onSubmit={handleSave} />}
        cancelLabel={null}
        confirmLabel={null}
        onCancel={() => setEditingLocation(null)}
        size="modal-lg"
      />
    </>
  );
}
