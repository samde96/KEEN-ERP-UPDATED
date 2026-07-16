import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { transferService } from '../../services/transferService';
import { formatDate } from '../../utils/formatDate';

export function ShopRequestHistoryPage() {
  const { data: stockRequests } = useAsyncData(transferService.requests);

  return (
    <>
      <PageHeader title="Stock request history" description="Track requested products, approval decisions, and request age." />
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
          { key: 'requestedAt', label: 'Date', render: (row) => formatDate(row.requestedAt) }
        ]}
      />
    </>
  );
}
