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

  const receipt = buildTransferReceipt(transfer, lines);

  return (
    <>
      <PageHeader
        title={`Transfer ${transfer.transferNumber}`}
        description={`${transfer.source} to ${transfer.destination}. Sent ${formatDate(transfer.sentAt)}.`}
        actions={
            <Link className="btn btn-outline-primary" to={backPath}>
            <i className="bi bi-arrow-left" aria-hidden="true" /> Back
          </Link>
        }
      />
      <section className="dashboard-grid">
        <div className="panel span-8" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Transfer lines</span>
              <h2>
                <StatusBadge status={transfer.status} />
              </h2>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => window.print()}>
              <i className="bi bi-printer" aria-hidden="true" /> Print receipt
            </button>
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
              { key: 'value', label: 'Value', render: (row) => formatCurrency(row.unitCost * row.quantitySent) }
            ]}
          />
        </div>
        <div className="span-4">
          <ReceiptPreview receipt={receipt} />
        </div>
      </section>
    </>
  );
}
