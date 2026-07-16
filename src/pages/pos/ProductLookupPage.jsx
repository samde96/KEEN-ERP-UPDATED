import { useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/formatCurrency';

export function ProductLookupPage() {
  const [query, setQuery] = useState('');
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const filtered = products.filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader title="Product lookup" description="Search products by name, SKU, or barcode before checkout." />
      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search or scan product" />
      <DataTable
        data={filtered}
        columns={[
          { key: 'name', label: 'Product' },
          { key: 'sku', label: 'SKU' },
          { key: 'barcode', label: 'Barcode' },
          { key: 'sellingPrice', label: 'Price', render: (row) => formatCurrency(row.sellingPrice) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
        ]}
      />
    </>
  );
}
