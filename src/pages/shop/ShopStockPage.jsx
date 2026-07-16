import { useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useBranch } from '../../hooks/useBranch';
import { inventoryService } from '../../services/inventoryService';

export function ShopStockPage() {
  const [query, setQuery] = useState('');
  const { currentLocation } = useBranch();
  const { data: stockBalances } = useAsyncData(inventoryService.balances);
  const shopStock = currentLocation?.name ? stockBalances.filter((row) => row.location === currentLocation.name) : stockBalances;
  const filtered = shopStock.filter((row) => `${row.product} ${row.location}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader title="Current shop stock" description="Stock available for sale only after Shop Manager receiving approval." />
      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search shop stock" />
      <DataTable
        data={filtered}
        columns={[
          { key: 'product', label: 'Product' },
          { key: 'location', label: 'Shop' },
          { key: 'available', label: 'Available' },
          { key: 'reserved', label: 'Reserved' },
          { key: 'inTransit', label: 'In Transit' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
        ]}
      />
    </>
  );
}
