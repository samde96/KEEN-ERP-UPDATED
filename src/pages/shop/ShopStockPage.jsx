import { useMemo, useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useBranch } from '../../hooks/useBranch';
import { inventoryService } from '../../services/inventoryService';
import { balanceMatchesLocation, isLikelyShopBalance, isShopLocation } from '../../utils/locationTypes';

export function ShopStockPage() {
  const [query, setQuery] = useState('');
  const { currentLocation, locations } = useBranch();
  const { data: stockBalances } = useAsyncData(inventoryService.balances);
  const shopLocations = useMemo(() => locations.filter(isShopLocation), [locations]);
  const selectedShop = currentLocation && isShopLocation(currentLocation) ? currentLocation : null;
  const shopStock = useMemo(() => {
    const visibleLocations = selectedShop ? [selectedShop] : shopLocations;
    if (visibleLocations.length) {
      return stockBalances.filter((row) => visibleLocations.some((location) => balanceMatchesLocation(row, location)));
    }

    return stockBalances.filter(isLikelyShopBalance);
  }, [selectedShop, shopLocations, stockBalances]);
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
