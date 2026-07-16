import { useState } from 'react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../hooks/useAuth';
import { transferService } from '../../services/transferService';
import { formatDate } from '../../utils/formatDate';

export function StockRequestsPage() {
  const { user } = useAuth();
  const [activeRequest, setActiveRequest] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { data: stockRequests, reload } = useAsyncData(transferService.requests);

  const updateStatus = async (status) => {
    if (!activeRequest) return;
    setMessage('');
    setError('');
    try {
      const response = await transferService.updateRequestStatus(activeRequest.id, status, user?.name || 'Admin');
      if (response.offlineQueued) {
        setMessage(response.message);
        setActiveRequest(null);
        return;
      }

      setMessage(status === 'APPROVED' ? `Request ${activeRequest.requestNumber} approved and dispatched.` : `Request ${activeRequest.requestNumber} ${status.toLowerCase()}.`);
      setActiveRequest(null);
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to update request.');
    }
  };

  return (
    <>
      <PageHeader title="Pending stock requests" description="Approve, reject, or review shop requests before warehouse dispatch." />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <DataTable
        data={stockRequests}
        columns={[
          { key: 'requestNumber', label: 'Request' },
          { key: 'shop', label: 'Shop' },
          { key: 'requestedBy', label: 'Requested by' },
          { key: 'product', label: 'Product' },
          { key: 'quantity', label: 'Qty', render: (row) => row.quantity ?? '-' },
          { key: 'priority', label: 'Priority' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'requestedAt', label: 'Date', render: (row) => formatDate(row.requestedAt) },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setActiveRequest(row)}>
                Review
              </button>
            )
          }
        ]}
      />
      <ConfirmModal
        open={Boolean(activeRequest)}
        title={`Review ${activeRequest?.requestNumber || 'request'}`}
        body={
          <div className="d-grid gap-3">
            <p className="mb-0">
              Approve {activeRequest?.quantity ?? '-'} {activeRequest?.product || 'requested item'} for warehouse dispatch, or reject it before transfer creation.
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-danger" type="button" onClick={() => updateStatus('REJECTED')}>
                Reject
              </button>
              <button className="btn btn-primary" type="button" onClick={() => updateStatus('APPROVED')}>
                Approve
              </button>
            </div>
          </div>
        }
        onCancel={() => setActiveRequest(null)}
        cancelLabel={null}
        confirmLabel={null}
      />
    </>
  );
}
