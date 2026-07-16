import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { inventoryService } from '../../services/inventoryService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export function SupplierDeliveries() {
  const { data: supplierDeliveries, loading, error, reload } = useAsyncData(inventoryService.deliveries);
  const totals = useMemo(
    () =>
      supplierDeliveries.reduce(
        (summary, delivery) => {
          summary.units += Number(delivery.units || 0);
          summary.value += Number(delivery.value || 0);
          if (delivery.supplier) summary.suppliers.add(delivery.supplier);
          return summary;
        },
        { units: 0, value: 0, suppliers: new Set() }
      ),
    [supplierDeliveries]
  );

  return (
    <>
      <PageHeader
        title="Supplier deliveries"
        description="Review posted goods received notes and supplier receiving status."
        actions={
          <>
            <button className="btn btn-outline-primary" type="button" onClick={reload}>
              <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh
            </button>
            <Link className="btn btn-primary" to="/warehouse/add-stock">
              <i className="bi bi-box-arrow-in-down" aria-hidden="true" /> Receive stock
            </Link>
          </>
        }
      />
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <section className="stat-grid four">
        <StatCard icon="bi-receipt" title="Posted GRNs" value={loading ? '...' : supplierDeliveries.length} subtext="recent supplier receipts" />
        <StatCard icon="bi-boxes" title="Units received" value={loading ? '...' : totals.units} subtext="across listed deliveries" />
        <StatCard icon="bi-cash-stack" title="Stock value" value={loading ? '...' : formatCurrency(totals.value)} subtext="cost value received" />
        <StatCard icon="bi-truck" title="Suppliers" value={loading ? '...' : totals.suppliers.size} subtext="represented in GRNs" />
      </section>
      <DataTable
        data={supplierDeliveries}
        emptyText={loading ? 'Loading supplier deliveries...' : 'No supplier deliveries found.'}
        columns={[
          { key: 'reference', label: 'GRN' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'products', label: 'Products' },
          { key: 'location', label: 'Location' },
          { key: 'units', label: 'Units' },
          { key: 'value', label: 'Value', render: (row) => formatCurrency(row.value) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'receivedAt', label: 'Received', render: (row) => formatDate(row.receivedAt) }
        ]}
      />
    </>
  );
}
