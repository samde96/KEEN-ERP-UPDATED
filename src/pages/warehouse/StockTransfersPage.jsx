import { Link } from 'react-router-dom';
import { useState } from 'react';
import { StockTransferForm } from '../../components/forms/StockTransferForm';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DispatchReceiptPanel } from '../../components/warehouse/DispatchReceiptPanel';
import { useAsyncData } from '../../hooks/useAsyncData';
import { transferService } from '../../services/transferService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

function isStoreSale(row) {
  return String(row?.transferType || '').toUpperCase().replace(/\s+/g, '_') === 'STORE_SALE';
}

export function StockTransfersPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dispatchDetail, setDispatchDetail] = useState(null);
  const { data: stockTransfers, reload } = useAsyncData(transferService.transfers);

  const handleCreateTransfer = async (values) => {
    setMessage('');
    setError('');
    try {
      const response = await transferService.createTransfer({
        sourceLocationId: values.source,
        destinationLocationId: values.destination,
        attendantName: values.attendant,
        storeManagerName: values.storeManagerName,
        shopManagerName: values.shopManagerName,
        lines: values.lines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          wholesalePrice: line.wholesalePrice ? Number(line.wholesalePrice) : null
        }))
      });
      if (response.offlineQueued) {
        setMessage(response.message);
        setDispatchDetail(null);
        return;
      }

      let createdDispatch = null;
      try {
        createdDispatch = await transferService.dispatchFromOperation(response);
      } catch (receiptError) {
        setError(receiptError.response?.data?.detail || receiptError.message || 'Transfer created, but the dispatch receipt could not be loaded.');
      }
      setDispatchDetail(createdDispatch);
      const receiptNumber = createdDispatch?.transfer?.receiptNo || response.receiptNumber;
      setMessage(receiptNumber
        ? `Transfer ${response.transferNumber} created. Dispatch receipt ${receiptNumber} is ready to print.`
        : `Transfer ${response.transferNumber} created.`);
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to create transfer.');
    }
  };

  return (
    <>
      <PageHeader title="Stock transfers" description="Create dispatches from warehouse to shops and track in-transit inventory until shop receipt." />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <DispatchReceiptPanel detail={dispatchDetail} onDismiss={() => setDispatchDetail(null)} />
      <section className="dashboard-grid">
        <div className="panel span-12" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Create</span>
              <h2>New transfer</h2>
            </div>
          </div>
          <StockTransferForm onSubmit={handleCreateTransfer} />
        </div>
        <div className="panel span-12" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">History</span>
              <h2>Recent transfers</h2>
            </div>
          </div>
          <DataTable
            data={stockTransfers}
            columns={[
              { key: 'transferNumber', label: 'Transfer', render: (row) => <Link to={`/warehouse/transfers/${row.transferNumber}`}>{row.transferNumber}</Link> },
              {
                key: 'type',
                label: 'Type',
                render: (row) => (
                  <span className="table-stack">
                    <span>
                      <strong>{row.transferType || 'Transfer'}</strong>
                      <small>{row.invoiceNumber || row.receiptNo}</small>
                    </span>
                  </span>
                )
              },
              { key: 'destination', label: 'Destination' },
              { key: 'totalUnits', label: 'Units' },
              { key: 'value', label: 'Invoice value', render: (row) => formatCurrency(row.totalRevenue || row.value) },
              { key: 'grossProfit', label: 'Gross profit', render: (row) => (isStoreSale(row) ? formatCurrency(row.grossProfit) : '-') },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              { key: 'sentAt', label: 'Sent', render: (row) => formatDate(row.sentAt) }
            ]}
          />
        </div>
      </section>
    </>
  );
}
