import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { transferService } from '../../services/transferService';
import { formatDate } from '../../utils/formatDate';
import { stockRequestLineSummary, stockRequestProductSummary, stockRequestTotalQuantity } from '../../utils/stockRequestUtils';

export function ShopRequestHistoryPage() {
  const { data: stockRequests, loading, error, reload } = useAsyncData(
    transferService.requests,
    [],
    [],
    { pollIntervalMs: 10000 }
  );

  return (
    <>
      <PageHeader
        title="Stock request history"
        description="Track requested products, approval decisions, and request age."
        actions={
          <button className="btn btn-outline-primary" type="button" onClick={reload} disabled={loading}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh
          </button>
        }
      />
      {error ? <div className="alert alert-warning">{error}</div> : null}
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
          { key: 'requestedAt', label: 'Date', render: (row) => formatDate(row.requestedAt) }
        ]}
      />
    </>
  );
}
