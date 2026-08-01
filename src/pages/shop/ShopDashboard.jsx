import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useBranch } from '../../hooks/useBranch';
import { inventoryService } from '../../services/inventoryService';
import { salesService } from '../../services/salesService';
import { transferService } from '../../services/transferService';
import { formatCurrency } from '../../utils/formatCurrency';
import { balanceMatchesLocation, isLikelyShopBalance, isShopLocation } from '../../utils/locationTypes';

export function ShopDashboard() {
  const { currentLocation, locations } = useBranch();
  const { data: stockBalances } = useAsyncData(inventoryService.balances);
  const { data: stockRequests } = useAsyncData(transferService.requests, [], [], { pollIntervalMs: 10000 });
  const { data: stockTransfers } = useAsyncData(transferService.transfers);
  const { data: cashierActivity } = useAsyncData(salesService.cashierActivity);
  const shopLocations = locations.filter(isShopLocation);
  const selectedShop = currentLocation && isShopLocation(currentLocation) ? currentLocation : null;
  const visibleShopLocations = selectedShop ? [selectedShop] : shopLocations;
  const shopStock = visibleShopLocations.length
    ? stockBalances.filter((row) => visibleShopLocations.some((location) => balanceMatchesLocation(row, location)))
    : stockBalances.filter(isLikelyShopBalance);
  const lowStock = shopStock.filter((row) => ['LOW_STOCK', 'Low Stock'].includes(row.status));
  const shopNames = visibleShopLocations.map((location) => location.name);
  const incoming = stockTransfers.filter(
    (transfer) => ['IN_TRANSIT', 'In Transit'].includes(transfer.status) && (!shopNames.length || shopNames.includes(transfer.destination))
  );
  const locationRequests = stockRequests.filter((request) => !shopNames.length || shopNames.includes(request.shop));
  const locationCashierActivity = cashierActivity.filter((shift) => !shopNames.length || shopNames.includes(shift.location));
  const cashExpected = locationCashierActivity.reduce((sum, shift) => sum + Number(shift.cashExpected || 0), 0);

  return (
    <>
      <PageHeader
        title="Shop dashboard"
        description="Monitor shop stock, incoming transfers, cashier shifts, low stock, and sales activity."
        actions={
          <Link className="btn btn-primary" to="/shop/request-stock">
            <i className="bi bi-clipboard-plus" aria-hidden="true" /> Request stock
          </Link>
        }
      />
      <section className="stat-grid four">
        <StatCard icon="bi-box-seam" title="Shop SKUs" value={shopStock.length} subtext="Across selected shop" />
        <StatCard icon="bi-bell" title="Low stock" value={lowStock.length} tone="warning" />
        <StatCard icon="bi-box-arrow-in-left" title="Incoming transfers" value={incoming.length} tone="info" />
        <StatCard icon="bi-cash-stack" title="Till cash expected" value={formatCurrency(cashExpected)} subtext="From cashier shifts" tone="success" />
      </section>
      <section className="dashboard-grid">
        <div className="panel span-7" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Inventory</span>
              <h2>Current shop stock</h2>
            </div>
            <Link className="btn btn-sm btn-outline-primary" to="/shop/stock">
              View stock
            </Link>
          </div>
          <DataTable
            data={shopStock}
            columns={[
              { key: 'product', label: 'Product' },
              { key: 'location', label: 'Shop' },
              { key: 'available', label: 'Available' },
              { key: 'reserved', label: 'Reserved' },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
            ]}
          />
        </div>
        <div className="panel span-5" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Cashiers</span>
              <h2>Shift activity</h2>
            </div>
          </div>
          <div className="stack-list">
            {locationCashierActivity.map((shift) => (
              <article className="stack-row" key={shift.id}>
                <span>
                  <strong>{shift.cashier}</strong>
                  <small>
                    {shift.terminal} - {formatCurrency(shift.cashExpected)}
                  </small>
                </span>
                <StatusBadge status={shift.shift} />
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="panel" data-animate="fade-up">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Requests</span>
            <h2>Request history</h2>
          </div>
        </div>
        <DataTable
          data={locationRequests}
          columns={[
            { key: 'requestNumber', label: 'Request' },
            { key: 'shop', label: 'Shop' },
            { key: 'product', label: 'Product' },
            { key: 'quantity', label: 'Qty', render: (row) => row.quantity ?? '-' },
            { key: 'priority', label: 'Priority' },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
          ]}
        />
      </section>
    </>
  );
}
