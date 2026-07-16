import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { transferService } from '../../services/transferService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export function TransferDiscrepanciesPage() {
  const [activeDiscrepancy, setActiveDiscrepancy] = useState(null);
  const [pendingResolve, setPendingResolve] = useState(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const { data: discrepancies, loading, error, reload } = useAsyncData(transferService.discrepancies);
  const totals = useMemo(
    () =>
      discrepancies.reduce(
        (summary, transfer) => {
          summary.missing += Number(transfer.missingUnits || 0);
          summary.damaged += Number(transfer.damagedUnits || 0);
          summary.value += Number(transfer.discrepancyValue || 0);
          return summary;
        },
        { missing: 0, damaged: 0, value: 0 }
      ),
    [discrepancies]
  );

  const openLines = (transfer) => {
    setActiveDiscrepancy((current) => (current?.transferNumber === transfer.transferNumber ? null : transfer));
  };

  const confirmResolve = async () => {
    if (!pendingResolve) return;

    setMessage('');
    setActionError('');
    try {
      const response = await transferService.resolveDiscrepancy(pendingResolve.transferNumber);
      if (response.offlineQueued) {
        setMessage(response.message);
        setPendingResolve(null);
        return;
      }

      setMessage(`Transfer ${pendingResolve.transferNumber} discrepancy resolved.`);
      setPendingResolve(null);
      if (activeDiscrepancy?.transferNumber === pendingResolve.transferNumber) {
        setActiveDiscrepancy(null);
      }
      reload();
    } catch (requestError) {
      setActionError(requestError.response?.data?.detail || requestError.message || 'Unable to resolve discrepancy.');
      setPendingResolve(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Transfer discrepancies"
        description="Review damaged and missing transfer quantities before closing the discrepancy."
        actions={
          <button className="btn btn-outline-primary" type="button" onClick={reload}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh
          </button>
        }
      />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error || actionError ? <div className="alert alert-danger">{error || actionError}</div> : null}
      <section className="stat-grid four">
        <StatCard icon="bi-exclamation-square" title="Open discrepancies" value={loading ? '...' : discrepancies.length} subtext="transfers needing review" />
        <StatCard icon="bi-question-circle" title="Missing units" value={loading ? '...' : totals.missing} subtext="not received or damaged" />
        <StatCard icon="bi-tools" title="Damaged units" value={loading ? '...' : totals.damaged} subtext="moved to damaged goods" />
        <StatCard icon="bi-cash-stack" title="Value at risk" value={loading ? '...' : formatCurrency(totals.value)} subtext="cost of affected units" />
      </section>
      <DataTable
        data={discrepancies}
        emptyText={loading ? 'Loading transfer discrepancies...' : 'No open transfer discrepancies.'}
        columns={[
          { key: 'transferNumber', label: 'Transfer', render: (row) => <Link to={`/shop/transfers/${row.transferNumber}`}>{row.transferNumber}</Link> },
          { key: 'source', label: 'Source' },
          { key: 'destination', label: 'Destination' },
          { key: 'missingUnits', label: 'Missing' },
          { key: 'damagedUnits', label: 'Damaged' },
          { key: 'affectedLines', label: 'Lines' },
          { key: 'discrepancyValue', label: 'Value', render: (row) => formatCurrency(row.discrepancyValue) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'reportedAt', label: 'Reported', render: (row) => formatDate(row.reportedAt) },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="return-action-buttons">
                <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => openLines(row)}>
                  <i className="bi bi-list-ul" aria-hidden="true" /> Lines
                </button>
                <button className="btn btn-sm btn-primary" type="button" onClick={() => setPendingResolve(row)}>
                  <i className="bi bi-check2-circle" aria-hidden="true" /> Resolve
                </button>
              </div>
            )
          }
        ]}
      />
      {activeDiscrepancy ? (
        <section className="panel mt-3" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Affected lines</span>
              <h2>{activeDiscrepancy.transferNumber}</h2>
            </div>
            <Link className="btn btn-outline-primary" to={`/shop/transfers/${activeDiscrepancy.transferNumber}`}>
              <i className="bi bi-receipt" aria-hidden="true" /> Receipt
            </Link>
          </div>
          <DataTable
            data={activeDiscrepancy.lines || []}
            emptyText="No affected lines found for this transfer."
            columns={[
              { key: 'product', label: 'Product' },
              { key: 'sku', label: 'SKU' },
              { key: 'quantitySent', label: 'Sent' },
              { key: 'quantityReceived', label: 'Sellable' },
              { key: 'quantityDamaged', label: 'Damaged' },
              { key: 'quantityMissing', label: 'Missing' },
              { key: 'unitCost', label: 'Unit cost', render: (row) => formatCurrency(row.unitCost) },
              { key: 'discrepancyValue', label: 'Affected value', render: (row) => formatCurrency(row.discrepancyValue) }
            ]}
          />
        </section>
      ) : null}
      <ConfirmModal
        open={Boolean(pendingResolve)}
        title="Resolve discrepancy"
        body={
          pendingResolve
            ? `Close ${pendingResolve.transferNumber} after confirming damaged and missing quantities have been reviewed.`
            : ''
        }
        confirmLabel="Resolve"
        onCancel={() => setPendingResolve(null)}
        onConfirm={confirmResolve}
      />
    </>
  );
}
