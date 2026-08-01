import { useState } from 'react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DispatchReceiptPanel } from '../../components/warehouse/DispatchReceiptPanel';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../hooks/useAuth';
import { transferService } from '../../services/transferService';
import { formatDate } from '../../utils/formatDate';
import { stockRequestItems, stockRequestLineSummary, stockRequestProductSummary, stockRequestTotalQuantity } from '../../utils/stockRequestUtils';

export function StockRequestsPage() {
  const { user } = useAuth();
  const [activeRequest, setActiveRequest] = useState(null);
  const [dispatchDetail, setDispatchDetail] = useState(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const {
    data: stockRequests,
    loading,
    error: loadError,
    reload
  } = useAsyncData(transferService.requests, [], [], { pollIntervalMs: 10000 });

  const updateStatus = async (status) => {
    if (!activeRequest) return;
    setMessage('');
    setActionError('');
    try {
      const response = await transferService.updateRequestStatus(activeRequest.id, status, user?.name || 'Admin');
      if (response.offlineQueued) {
        setMessage(response.message);
        setActiveRequest(null);
        setDispatchDetail(null);
        return;
      }

      let approvedDispatch = null;
      if (status === 'APPROVED') {
        try {
          approvedDispatch = await transferService.dispatchFromOperation(response);
        } catch (receiptError) {
          setActionError(receiptError.response?.data?.detail || receiptError.message || 'Request approved, but the dispatch receipt could not be loaded.');
        }
      }

      setDispatchDetail(approvedDispatch);
      const receiptNumber = approvedDispatch?.transfer?.receiptNo || approvedDispatch?.transfer?.transferNumber;
      setMessage(status === 'APPROVED'
        ? `Request ${activeRequest.requestNumber} approved and dispatched${receiptNumber ? `. Dispatch receipt ${receiptNumber} is ready to print.` : '.'}`
        : `Request ${activeRequest.requestNumber} ${status.toLowerCase()}.`);
      setActiveRequest(null);
      reload();
    } catch (requestError) {
      setActionError(requestError.response?.data?.detail || requestError.message || 'Unable to update request.');
    }
  };

  return (
    <>
      <PageHeader
        title="Pending stock requests"
        description="Approve, reject, or review shop requests before warehouse dispatch."
        actions={
          <button className="btn btn-outline-primary" type="button" onClick={reload} disabled={loading}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh
          </button>
        }
      />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {loadError ? <div className="alert alert-warning">{loadError}</div> : null}
      {actionError ? <div className="alert alert-danger">{actionError}</div> : null}
      <DispatchReceiptPanel detail={dispatchDetail} onDismiss={() => setDispatchDetail(null)} />
      <DataTable
        data={stockRequests}
        columns={[
          { key: 'requestNumber', label: 'Request' },
          { key: 'shop', label: 'Shop' },
          { key: 'requestedBy', label: 'Requested by' },
          {
            key: 'product',
            label: 'Products',
            render: (row) => (
              <span className="table-stack">
                <span>
                  <strong>{stockRequestProductSummary(row)}</strong>
                  <small>{stockRequestLineSummary(row)}</small>
                </span>
              </span>
            )
          },
          { key: 'quantity', label: 'Qty', render: (row) => stockRequestTotalQuantity(row) || '-' },
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
              Approve {stockRequestTotalQuantity(activeRequest)} units across {stockRequestItems(activeRequest).length || 1} item{(stockRequestItems(activeRequest).length || 1) === 1 ? '' : 's'} for warehouse dispatch, or reject before transfer creation.
            </p>
            <div className="stack-list">
              {stockRequestItems(activeRequest).map((item) => (
                <article className="stack-row" key={item.productId || item.product}>
                  <span>
                    <strong>{item.product || 'Not specified'}</strong>
                    <small>{item.sku || item.barcode || 'No SKU'}</small>
                  </span>
                  <strong>{Number(item.quantity || 0)}</strong>
                </article>
              ))}
            </div>
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
