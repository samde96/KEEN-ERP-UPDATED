import { Link, useLocation, useParams } from 'react-router-dom';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ReceiptPreview } from '../../components/pos/ReceiptPreview';
import { useAsyncData } from '../../hooks/useAsyncData';
import { transferService } from '../../services/transferService';
import { buildTransferReceipt } from '../../utils/receiptUtils';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { printReceipt } from '../../utils/printUtils';

function isStoreSale(transfer) {
  return String(transfer?.transferType || '').toUpperCase().replace(/\s+/g, '_') === 'STORE_SALE';
}

export function TransferDetailsPage() {
  const { transferId } = useParams();
  const location = useLocation();
  const backPath = location.pathname.startsWith('/shop/') ? '/shop/discrepancies' : '/warehouse/transfers';
  const { data: detail } = useAsyncData(() => transferService.getTransfer(transferId), { transfer: null, lines: [] }, [transferId]);
  const transfer = detail.transfer;
  const lines = detail.lines || [];

  if (!transfer) {
    return (
      <>
        <PageHeader
          title="Transfer details"
          description="No transfer record was found for this reference."
          actions={
            <Link className="btn btn-outline-primary" to={backPath}>
              <i className="bi bi-arrow-left" aria-hidden="true" /> Back
            </Link>
          }
        />
      </>
    );
  }

  const storeSale = isStoreSale(transfer);
  const receipt = buildTransferReceipt(transfer, lines);

  return (
    <>
      <PageHeader
        title={`${storeSale ? 'Store sale' : 'Transfer'} ${transfer.transferNumber}`}
        description={`${transfer.source} to ${transfer.destination}. Sent ${formatDate(transfer.sentAt)}${storeSale && transfer.invoiceNumber ? `. Invoice ${transfer.invoiceNumber}.` : '.'}`}
        actions={
            <Link className="btn btn-outline-primary" to={backPath}>
            <i className="bi bi-arrow-left" aria-hidden="true" /> Back
          </Link>
        }
      />
      <section className="dashboard-grid">
        <div className="panel span-12" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Transfer lines</span>
              <h2>
                <StatusBadge status={transfer.status} />
              </h2>
            </div>
            <button className="btn btn-primary" type="button" onClick={printReceipt}>
              <i className="bi bi-printer" aria-hidden="true" /> Print receipt
            </button>
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
              <span>Total cost</span>
              <strong>{formatCurrency(transfer.totalCost || transfer.value)}</strong>
            </div>
            <div>
              <span>{storeSale ? 'Wholesale billed' : 'Transfer value'}</span>
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
            columns={[
              { key: 'product', label: 'Product' },
              { key: 'sku', label: 'SKU' },
              { key: 'barcode', label: 'Barcode' },
              { key: 'quantitySent', label: 'Sent' },
              { key: 'quantityReceived', label: 'Sellable' },
              { key: 'quantityDamaged', label: 'Damaged' },
              { key: 'quantityMissing', label: 'Missing' },
              { key: 'unitCost', label: 'Unit cost', render: (row) => formatCurrency(row.unitCost) },
              ...(storeSale
                ? [
                    { key: 'unitWholesalePrice', label: 'Wholesale', render: (row) => formatCurrency(row.unitWholesalePrice) },
                    { key: 'lineRevenue', label: 'Billed', render: (row) => formatCurrency(row.lineRevenue) },
                    { key: 'lineProfit', label: 'Profit', render: (row) => formatCurrency(row.lineProfit) }
                  ]
                : [
                    { key: 'value', label: 'Value', render: (row) => formatCurrency(row.lineCost || row.unitCost * row.quantitySent) }
                  ])
            ]}
          />
        </div>
      </section>
      <div className="receipt-print-host" aria-hidden="true">
        <ReceiptPreview receipt={receipt} />
      </div>
    </>
  );
}
