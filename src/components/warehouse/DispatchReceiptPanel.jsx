import { Link } from 'react-router-dom';
import { DataTable } from '../common/DataTable';
import { ReceiptPreview } from '../pos/ReceiptPreview';
import { buildTransferReceipt } from '../../utils/receiptUtils';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { printReceipt } from '../../utils/printUtils';

function isStoreSale(transfer) {
  return String(transfer?.transferType || '').toUpperCase().replace(/\s+/g, '_') === 'STORE_SALE';
}

export function DispatchReceiptPanel({ detail, onDismiss }) {
  const transfer = detail?.transfer;
  const lines = detail?.lines || [];

  if (!transfer) {
    return null;
  }

  const storeSale = isStoreSale(transfer);
  const receipt = buildTransferReceipt(transfer, lines);

  return (
    <section className="dashboard-grid dispatch-receipt-panel" data-animate="fade-up">
      <div className="panel span-5">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Dispatch receipt</span>
            <h2>{transfer.receiptNo || transfer.transferNumber}</h2>
          </div>
          {onDismiss ? (
            <button className="btn btn-icon" type="button" onClick={onDismiss} aria-label="Close dispatch receipt">
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <ReceiptPreview receipt={receipt} onPrint={printReceipt} />
      </div>
      <div className="panel span-7">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Dispatch details</span>
            <h2>{transfer.source} to {transfer.destination}</h2>
          </div>
          <Link className="btn btn-outline-primary" to={`/warehouse/transfers/${transfer.transferNumber}`}>
            <i className="bi bi-box-arrow-up-right" aria-hidden="true" /> Open transfer
          </Link>
        </div>
        <div className="dispatch-receipt-summary">
          <div>
            <span>Type</span>
            <strong>{transfer.transferType || 'Transfer'}</strong>
          </div>
          <div>
            <span>{storeSale ? 'Invoice' : 'Receipt'}</span>
            <strong>{storeSale ? transfer.invoiceNumber || 'Not issued' : transfer.receiptNo}</strong>
          </div>
          <div>
            <span>Transfer</span>
            <strong>{transfer.transferNumber}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{transfer.status}</strong>
          </div>
          <div>
            <span>Store manager</span>
            <strong>{transfer.manager || 'Not recorded'}</strong>
          </div>
          <div>
            <span>Shop manager</span>
            <strong>{transfer.shopManager || 'Not recorded'}</strong>
          </div>
          <div>
            <span>Attendant</span>
            <strong>{transfer.attendant || 'Not recorded'}</strong>
          </div>
          <div>
            <span>Sent</span>
            <strong>{formatDate(transfer.sentAt)}</strong>
          </div>
          <div>
            <span>Total units</span>
            <strong>{transfer.totalUnits}</strong>
          </div>
          <div>
            <span>Total cost</span>
            <strong>{formatCurrency(transfer.totalCost || transfer.value)}</strong>
          </div>
          <div>
            <span>{storeSale ? 'Wholesale billed' : 'Total value'}</span>
            <strong>{formatCurrency(storeSale ? transfer.totalRevenue : transfer.value)}</strong>
          </div>
          {storeSale ? (
            <div>
              <span>Gross profit</span>
              <strong>{formatCurrency(transfer.grossProfit)}</strong>
            </div>
          ) : null}
        </div>
        <DataTable
          data={lines}
          emptyText="No dispatch inventory lines found."
          columns={[
            { key: 'product', label: 'Inventory' },
            { key: 'sku', label: 'SKU' },
            { key: 'barcode', label: 'Barcode' },
            { key: 'quantitySent', label: 'Sent' },
            { key: 'unitCost', label: 'Unit cost', render: (row) => formatCurrency(row.unitCost) },
            ...(storeSale
              ? [
                  { key: 'unitWholesalePrice', label: 'Wholesale', render: (row) => formatCurrency(row.unitWholesalePrice) },
                  { key: 'lineRevenue', label: 'Billed', render: (row) => formatCurrency(row.lineRevenue) },
                  { key: 'lineProfit', label: 'Profit', render: (row) => formatCurrency(row.lineProfit) }
                ]
              : [
                  { key: 'value', label: 'Value', render: (row) => formatCurrency(row.lineCost || Number(row.unitCost || 0) * Number(row.quantitySent || 0)) }
                ])
          ]}
        />
      </div>
    </section>
  );
}
