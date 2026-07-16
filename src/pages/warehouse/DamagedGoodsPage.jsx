import { useState } from 'react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { inventoryService } from '../../services/inventoryService';

export function DamagedGoodsPage() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [writeOffQuantity, setWriteOffQuantity] = useState(0);
  const [writeOffReason, setWriteOffReason] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const { data: stockBalances, loading, error, reload } = useAsyncData(inventoryService.balances);
  const damagedGoods = stockBalances
    .filter((row) => row.available > 0 && String(row.location || '').toLowerCase().includes('damaged'))
    .map((row) => ({
      ...row,
      quantity: row.available,
      source: 'Damaged Goods Area'
    }));

  const openWriteOff = (row) => {
    setMessage('');
    setActionError('');
    setSelectedItem(row);
    setWriteOffQuantity(row.quantity);
    setWriteOffReason('');
  };

  const closeWriteOff = () => {
    setSelectedItem(null);
    setWriteOffQuantity(0);
    setWriteOffReason('');
  };

  const handleWriteOff = async () => {
    if (!selectedItem) return;

    const quantity = Number(writeOffQuantity || 0);
    if (quantity <= 0 || quantity > selectedItem.quantity) {
      setActionError('Write-off quantity must be between 1 and the damaged goods quantity.');
      return;
    }

    setActionError('');
    setMessage('');
    try {
      const response = await inventoryService.writeOffDamagedGoods(selectedItem.id, {
        quantity,
        reason: writeOffReason
      });
      if (response.offlineQueued) {
        setMessage(response.message);
        closeWriteOff();
        return;
      }

      setMessage(`${quantity} damaged unit${quantity === 1 ? '' : 's'} written off for ${selectedItem.product}.`);
      closeWriteOff();
      reload();
    } catch (requestError) {
      setActionError(requestError.response?.data?.detail || requestError.message || 'Unable to write off damaged goods.');
    }
  };

  return (
    <>
      <PageHeader
        title="Damaged goods"
        description="Track damaged stock separately and remove approved write-offs from inventory."
        actions={
          <button className="btn btn-outline-primary" type="button" onClick={reload}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh
          </button>
        }
      />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error || actionError ? <div className="alert alert-danger">{error || actionError}</div> : null}
      <DataTable
        data={damagedGoods}
        emptyText={loading ? 'Loading damaged goods...' : 'No damaged goods in inventory.'}
        columns={[
          { key: 'product', label: 'Product' },
          { key: 'sku', label: 'SKU' },
          { key: 'location', label: 'Location' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'source', label: 'Source' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => openWriteOff(row)}>
                <i className="bi bi-box-arrow-up" aria-hidden="true" /> Write off
              </button>
            )
          }
        ]}
      />
      <ConfirmModal
        open={Boolean(selectedItem)}
        title="Write off damaged goods"
        body={
          selectedItem ? (
            <div className="d-grid gap-3">
              <div>
                <strong>{selectedItem.product}</strong>
                <div className="text-body-secondary small">
                  {selectedItem.sku} at {selectedItem.location}. Available damaged quantity: {selectedItem.quantity}
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="write-off-quantity">
                  Quantity
                </label>
                <input
                  id="write-off-quantity"
                  className="form-control"
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  value={writeOffQuantity}
                  onChange={(event) => setWriteOffQuantity(event.target.value)}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="write-off-reason">
                  Note
                </label>
                <input
                  id="write-off-reason"
                  className="form-control"
                  value={writeOffReason}
                  onChange={(event) => setWriteOffReason(event.target.value)}
                  placeholder="Approval note or disposal reference"
                />
              </div>
            </div>
          ) : null
        }
        confirmLabel="Write off"
        tone="danger"
        onCancel={closeWriteOff}
        onConfirm={handleWriteOff}
      />
    </>
  );
}
