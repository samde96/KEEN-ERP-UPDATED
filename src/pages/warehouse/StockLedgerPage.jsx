import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { inventoryService } from '../../services/inventoryService';
import { formatDate } from '../../utils/formatDate';

export function StockLedgerPage() {
  const { data: stockLedger } = useAsyncData(inventoryService.ledger);

  return (
    <>
      <PageHeader title="Stock ledger" description="Every inventory change is recorded as an auditable movement." />
      <DataTable
        data={stockLedger}
        columns={[
          { key: 'id', label: 'Ledger ID' },
          { key: 'product', label: 'Product' },
          { key: 'movement', label: 'Movement' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'location', label: 'Location' },
          { key: 'reference', label: 'Reference' },
          { key: 'at', label: 'Date', render: (row) => formatDate(row.at) }
        ]}
      />
    </>
  );
}
