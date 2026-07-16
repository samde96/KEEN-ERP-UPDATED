import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RFIDAlertPanel } from '../../components/inventory/RFIDAlertPanel';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useBranch } from '../../hooks/useBranch';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { transferService } from '../../services/transferService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export function WarehouseDashboard() {
  const { currentLocation } = useBranch();
  const { data: stockBalances } = useAsyncData(inventoryService.balances);
  const { data: stockRequests } = useAsyncData(transferService.requests);
  const { data: stockTransfers } = useAsyncData(transferService.transfers);
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const { data: supplierDeliveries } = useAsyncData(inventoryService.deliveries);
  const productBySku = new Map(products.map((product) => [product.sku, product]));
  const warehouseStock = currentLocation?.name ? stockBalances.filter((row) => row.location === currentLocation.name) : stockBalances.filter((row) => !row.location.includes('Shop'));
  const warehouseUnits = warehouseStock.reduce((sum, row) => sum + Number(row.available || 0) + Number(row.reserved || 0), 0);
  const stockValue = warehouseStock.reduce((sum, row) => {
    const product = productBySku.get(row.sku);
    const units = Number(row.available || 0) + Number(row.reserved || 0);
    return sum + units * Number(product?.costPrice || 0);
  }, 0);
  const pendingRequests = stockRequests.filter((request) => ['PENDING', 'Pending'].includes(request.status));
  const transfersInTransit = stockTransfers.filter(
    (transfer) => ['IN_TRANSIT', 'In Transit'].includes(transfer.status) && (!currentLocation?.name || transfer.source === currentLocation.name)
  );

  return (
    <>
      <PageHeader
        title="Warehouse dashboard"
        description="Receive supplier stock, approve shop requests, dispatch transfers, and watch warehouse stock movement."
        actions={
          <Link className="btn btn-primary" to="/warehouse/add-stock">
            <i className="bi bi-upc-scan" aria-hidden="true" /> Add stock
          </Link>
        }
      />
      <section className="stat-grid four">
        <StatCard icon="bi-boxes" title="Warehouse units" value={warehouseUnits} subtext="Available and reserved" />
        <StatCard icon="bi-currency-exchange" title="Stock value" value={formatCurrency(stockValue)} tone="success" />
        <StatCard icon="bi-clipboard-check" title="Pending requests" value={pendingRequests.length} tone="warning" />
        <StatCard icon="bi-truck" title="Transfers in transit" value={transfersInTransit.length} tone="info" />
      </section>
      <section className="dashboard-grid">
        <div className="panel span-7" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Dispatch</span>
              <h2>Transfer queue</h2>
            </div>
            <Link className="btn btn-sm btn-outline-primary" to="/warehouse/transfers">
              View all
            </Link>
          </div>
          <DataTable
            data={stockTransfers}
            columns={[
              { key: 'transferNumber', label: 'Transfer', render: (row) => <Link to={`/warehouse/transfers/${row.transferNumber}`}>{row.transferNumber}</Link> },
              { key: 'destination', label: 'Destination' },
              { key: 'totalUnits', label: 'Units' },
              { key: 'value', label: 'Value', render: (row) => formatCurrency(row.value) },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
            ]}
          />
        </div>
        <div className="panel span-5" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Receiving</span>
              <h2>Supplier deliveries</h2>
            </div>
          </div>
          <div className="stack-list">
            {supplierDeliveries.map((delivery) => (
              <article className="stack-row" key={delivery.id}>
                <span>
                  <strong>{delivery.id}</strong>
                  <small>
                    {delivery.supplier} - {formatDate(delivery.receivedAt)}
                  </small>
                </span>
                <StatusBadge status={delivery.status} />
              </article>
            ))}
          </div>
        </div>
      </section>
      <RFIDAlertPanel />
    </>
  );
}
