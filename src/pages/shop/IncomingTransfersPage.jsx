import { useMemo, useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { transferService } from '../../services/transferService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

function normalizeStatus(status) {
  return String(status || '').toUpperCase().replaceAll(' ', '_');
}

function quantityLabel(quantity, singular, plural = `${singular}s`) {
  return `${quantity} ${quantity === 1 ? singular : plural}`;
}

export function IncomingTransfersPage() {
  const [activeTransfer, setActiveTransfer] = useState(null);
  const [receiveLines, setReceiveLines] = useState([]);
  const [receivePin, setReceivePin] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { data: stockTransfers, reload } = useAsyncData(transferService.transfers);
  const incoming = stockTransfers.filter((transfer) => ['IN_TRANSIT', 'DISCREPANCY_REPORTED', 'DISCREPANCY_RESOLVED', 'RECEIVED'].includes(normalizeStatus(transfer.status)));

  const receiveTotals = useMemo(
    () =>
      receiveLines.reduce(
        (totals, line) => {
          const sent = Number(line.quantitySent || 0);
          const sellable = Number(line.sellableReceived || 0);
          const damaged = Number(line.damagedReceived || 0);
          totals.sent += sent;
          totals.sellable += sellable;
          totals.damaged += damaged;
          totals.missing += Math.max(sent - sellable - damaged, 0);
          return totals;
        },
        { sent: 0, sellable: 0, damaged: 0, missing: 0 }
      ),
    [receiveLines]
  );

  const closeReceive = () => {
    setActiveTransfer(null);
    setReceiveLines([]);
    setReceivePin('');
    setLoadingDetail(false);
  };

  const openReceive = async (transfer) => {
    if (normalizeStatus(transfer.status) !== 'IN_TRANSIT') return;

    setMessage('');
    setError('');
    setActiveTransfer(transfer);
    setReceiveLines([]);
    setReceivePin('');
    setLoadingDetail(true);

    try {
      const detail = await transferService.getTransfer(transfer.transferNumber);
      setActiveTransfer(detail.transfer || transfer);
      setReceiveLines(
        (detail.lines || []).map((line) => ({
          ...line,
          sellableReceived: Number(line.quantitySent || 0),
          damagedReceived: 0
        }))
      );
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to load transfer details.');
      closeReceive();
    } finally {
      setLoadingDetail(false);
    }
  };

  const updateReceiveLine = (productId, field, value) => {
    const nextQuantity = Math.max(0, Number.parseInt(value || '0', 10) || 0);

    setReceiveLines((lines) =>
      lines.map((line) => {
        if (line.productId !== productId) return line;

        const sent = Number(line.quantitySent || 0);
        const sellable = Number(line.sellableReceived || 0);
        const damaged = Number(line.damagedReceived || 0);

        if (field === 'sellableReceived') {
          return { ...line, sellableReceived: Math.min(nextQuantity, Math.max(sent - damaged, 0)) };
        }

        return { ...line, damagedReceived: Math.min(nextQuantity, Math.max(sent - sellable, 0)) };
      })
    );
  };

  const handleReceive = async () => {
    if (!activeTransfer) return;
    setMessage('');
    setError('');
    try {
      const receivedQuantities = receiveLines.reduce((quantities, line) => {
        quantities[line.productId] = Number(line.sellableReceived || 0);
        return quantities;
      }, {});
      const damagedQuantities = receiveLines.reduce((quantities, line) => {
        const damaged = Number(line.damagedReceived || 0);
        if (damaged > 0) {
          quantities[line.productId] = damaged;
        }
        return quantities;
      }, {});

      const response = await transferService.receiveTransfer(activeTransfer.transferNumber, { receivedQuantities, damagedQuantities });
      if (response.offlineQueued) {
        setMessage(response.message);
        closeReceive();
        return;
      }

      setMessage(
        `Transfer ${activeTransfer.transferNumber} received: ${quantityLabel(receiveTotals.sellable, 'sellable unit')}${
          receiveTotals.damaged ? `, ${quantityLabel(receiveTotals.damaged, 'damaged unit')} moved to damaged goods` : ''
        }${receiveTotals.missing ? `, ${quantityLabel(receiveTotals.missing, 'unit')} missing` : ''}.`
      );
      closeReceive();
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to receive transfer.');
    }
  };

  return (
    <>
      <PageHeader title="Incoming transfers" description="Verify transferred items before they become available for sale." />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <DataTable
        data={incoming}
        columns={[
          { key: 'transferNumber', label: 'Transfer' },
          { key: 'source', label: 'Source' },
          { key: 'destination', label: 'Destination' },
          { key: 'totalUnits', label: 'Units' },
          { key: 'value', label: 'Invoice value', render: (row) => formatCurrency(row.totalRevenue || row.value) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'sentAt', label: 'Sent', render: (row) => formatDate(row.sentAt) },
          {
            key: 'actions',
            label: '',
            render: (row) => {
              const canReceive = normalizeStatus(row.status) === 'IN_TRANSIT';
              return (
                <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => openReceive(row)} disabled={!canReceive}>
                  {canReceive ? 'Receive' : 'Processed'}
                </button>
              );
            }
          }
        ]}
      />
      {activeTransfer ? (
        <div className="modal-backdrop-shell" role="presentation">
          <div className="modal d-block app-modal" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title fs-5">Receive {activeTransfer.transferNumber}</h2>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeReceive} />
                </div>
                <div className="modal-body">
                  {loadingDetail ? (
                    <div className="text-body-secondary py-3">Loading transfer lines...</div>
                  ) : (
                    <>
                      <div className="row g-2 mb-3">
                        <div className="col-6 col-md-3">
                          <span className="metric-label">Sent</span>
                          <strong className="d-block">{receiveTotals.sent}</strong>
                        </div>
                        <div className="col-6 col-md-3">
                          <span className="metric-label">Sellable</span>
                          <strong className="d-block">{receiveTotals.sellable}</strong>
                        </div>
                        <div className="col-6 col-md-3">
                          <span className="metric-label">Damaged</span>
                          <strong className="d-block">{receiveTotals.damaged}</strong>
                        </div>
                        <div className="col-6 col-md-3">
                          <span className="metric-label">Missing</span>
                          <strong className="d-block">{receiveTotals.missing}</strong>
                        </div>
                      </div>
                      <div className="table-responsive app-table-wrap">
                        <table className="table app-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>SKU</th>
                              <th>Sent</th>
                              <th>Sellable</th>
                              <th>Damaged</th>
                              <th>Missing</th>
                            </tr>
                          </thead>
                          <tbody>
                            {receiveLines.map((line) => {
                              const missing = Math.max(Number(line.quantitySent || 0) - Number(line.sellableReceived || 0) - Number(line.damagedReceived || 0), 0);
                              return (
                                <tr key={line.id}>
                                  <td>{line.product}</td>
                                  <td>{line.sku}</td>
                                  <td>{line.quantitySent}</td>
                                  <td>
                                    <input
                                      className="form-control form-control-sm"
                                      type="number"
                                      min="0"
                                      max={line.quantitySent}
                                      value={line.sellableReceived}
                                      onChange={(event) => updateReceiveLine(line.productId, 'sellableReceived', event.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      className="form-control form-control-sm"
                                      type="number"
                                      min="0"
                                      max={line.quantitySent}
                                      value={line.damagedReceived}
                                      onChange={(event) => updateReceiveLine(line.productId, 'damagedReceived', event.target.value)}
                                    />
                                  </td>
                                  <td>{missing}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <label className="form-label mt-3" htmlFor="manager-pin">
                        Manager PIN
                      </label>
                      <input
                        id="manager-pin"
                        className="form-control"
                        type="password"
                        inputMode="numeric"
                        value={receivePin}
                        onChange={(event) => setReceivePin(event.target.value)}
                        placeholder="Enter approval PIN"
                      />
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeReceive}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" disabled={loadingDetail || !receiveLines.length || receivePin.length < 4} onClick={handleReceive}>
                    Confirm receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
