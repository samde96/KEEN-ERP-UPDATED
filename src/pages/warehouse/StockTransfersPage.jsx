import { Link } from 'react-router-dom';
import { useState } from 'react';
import { StockTransferForm } from '../../components/forms/StockTransferForm';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { transferService } from '../../services/transferService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export function StockTransfersPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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
          quantity: Number(line.quantity)
        }))
      });
      if (response.offlineQueued) {
        setMessage(response.message);
        return;
      }

      setMessage(`Transfer ${response.transferNumber} created.`);
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
      <section className="dashboard-grid">
        <div className="panel span-5" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Create</span>
              <h2>New transfer</h2>
            </div>
          </div>
          <StockTransferForm onSubmit={handleCreateTransfer} />
        </div>
        <div className="panel span-7" data-animate="fade-up">
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
              { key: 'destination', label: 'Destination' },
              { key: 'totalUnits', label: 'Units' },
              { key: 'value', label: 'Value', render: (row) => formatCurrency(row.value) },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              { key: 'sentAt', label: 'Sent', render: (row) => formatDate(row.sentAt) }
            ]}
          />
        </div>
      </section>
    </>
  );
}
