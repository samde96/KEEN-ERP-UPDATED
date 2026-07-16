import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { Link } from 'react-router-dom';

export function LowStockAlertsPage() {
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const { data: stockBalances } = useAsyncData(inventoryService.balances);
  const rows = stockBalances
    .filter((row) => ['LOW_STOCK', 'Low Stock'].includes(row.status))
    .map((row) => ({
      ...row,
      reorderLevel: products.find((product) => product.name === row.product)?.reorderLevel || 0
    }));

  return (
    <>
      <PageHeader title="Low-stock alerts" description="Review shop items below reorder level and raise stock requests." />
      <DataTable
        data={rows}
        columns={[
          { key: 'product', label: 'Product' },
          { key: 'location', label: 'Location' },
          { key: 'available', label: 'Available' },
          { key: 'reorderLevel', label: 'Reorder level' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <Link className="btn btn-sm btn-outline-primary" to="/shop/request-stock" state={{ product: row.product, location: row.location }}>
                Create request
              </Link>
            )
          }
        ]}
      />
    </>
  );
}
