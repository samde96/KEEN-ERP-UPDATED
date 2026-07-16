import { useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { inventoryService } from '../../services/inventoryService';

export function InventoryBalances() {
  const [query, setQuery] = useState('');
  const { data: stockBalances } = useAsyncData(inventoryService.balances);
  const filtered = stockBalances.filter((row) => `${row.product} ${row.location}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader title="Inventory balances" description="Current available, reserved, and in-transit quantities by product and location." />
      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search stock balances" />
      <DataTable
        data={filtered}
        columns={[
          { key: 'product', label: 'Product' },
          { key: 'location', label: 'Location' },
          { key: 'available', label: 'Available' },
          { key: 'reserved', label: 'Reserved' },
          { key: 'inTransit', label: 'In Transit' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
        ]}
      />
    </>
  );
}
