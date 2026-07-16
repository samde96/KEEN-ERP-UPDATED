import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';

function SupplierForm({ initialSupplier, onSubmit }) {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      name: initialSupplier?.name || '',
      contact: initialSupplier?.contact || '',
      leadTime: initialSupplier?.leadTime || '',
      status: initialSupplier?.status || 'Active'
    }
  });

  return (
    <form className="app-form-grid" onSubmit={handleSubmit(onSubmit)}>
      <div className="col-span-2">
        <label className="form-label" htmlFor="supplier-name">
          Supplier name
        </label>
        <input id="supplier-name" className="form-control" {...register('name', { required: true })} />
      </div>
      <div>
        <label className="form-label" htmlFor="supplier-contact">
          Contact
        </label>
        <input id="supplier-contact" className="form-control" {...register('contact', { required: true })} />
      </div>
      <div>
        <label className="form-label" htmlFor="supplier-lead-time">
          Lead time
        </label>
        <input id="supplier-lead-time" className="form-control" placeholder="2 days" {...register('leadTime', { required: true })} />
      </div>
      <div>
        <label className="form-label" htmlFor="supplier-status">
          Status
        </label>
        <select id="supplier-status" className="form-select" {...register('status')}>
          <option>Active</option>
          <option>Review</option>
          <option>Inactive</option>
        </select>
      </div>
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting}>
          <i className="bi bi-check2-circle" aria-hidden="true" /> Save supplier
        </button>
      </div>
    </form>
  );
}

export function SupplierManagement() {
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { data: suppliers, reload } = useAsyncData(catalogService.suppliers);

  const handleSave = async (values) => {
    setMessage('');
    setError('');
    try {
      const response = await catalogService.saveSupplier({ ...values, id: editingSupplier?.id });
      setEditingSupplier(null);
      setMessage(response.offlineQueued ? response.message : 'Supplier saved.');
      if (response.offlineQueued) {
        return;
      }
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to save supplier.');
    }
  };

  return (
    <>
      <PageHeader
        title="Supplier management"
        description="Track supplier contacts, lead times, and delivery status for purchase receiving."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setEditingSupplier({})}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> New supplier
          </button>
        }
      />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <DataTable
        data={suppliers}
        columns={[
          { key: 'name', label: 'Supplier' },
          { key: 'contact', label: 'Contact' },
          { key: 'leadTime', label: 'Lead time' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setEditingSupplier(row)}>
                Edit
              </button>
            )
          }
        ]}
      />
      <ConfirmModal
        open={editingSupplier !== null}
        title={editingSupplier?.id ? 'Edit supplier' : 'New supplier'}
        body={<SupplierForm initialSupplier={editingSupplier} onSubmit={handleSave} />}
        cancelLabel={null}
        confirmLabel={null}
        onCancel={() => setEditingSupplier(null)}
        size="modal-lg"
      />
    </>
  );
}
