import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ROLES } from '../../data/roles';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useBranch } from '../../hooks/useBranch';
import { productService } from '../../services/productService';
import { returnService } from '../../services/returnService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const dispositionOptions = [
  { value: 'RESTOCK_TO_SHOP', label: 'Restock to shop' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'DAMAGED', label: 'Damaged goods' },
  { value: 'RETURN_TO_SUPPLIER', label: 'Return to supplier' },
  { value: 'WRITE_OFF', label: 'Write off' },
  { value: 'HOLD_INVESTIGATION', label: 'Investigation hold' }
];

const destinationLabels = {
  RESTOCK_TO_SHOP: 'Shop stock',
  INSPECTION: 'Returns Area',
  DAMAGED: 'Damaged Goods Area',
  RETURN_TO_SUPPLIER: 'Returns Area',
  WRITE_OFF: 'Write-off',
  HOLD_INVESTIGATION: 'Returns Area'
};

const defaultLine = {
  productId: '',
  quantity: 1,
  unitPrice: 0,
  disposition: 'INSPECTION'
};

function userDisplayName(user) {
  return user?.name || user?.email || 'Cashier';
}

export function ReturnsRefundsPage() {
  const { user } = useAuth();
  const { currentLocation } = useBranch();
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const { data: returns, reload } = useAsyncData(returnService.list.bind(returnService));
  const [receiptNumber, setReceiptNumber] = useState('');
  const [reason, setReason] = useState('Customer return');
  const [refundMethod, setRefundMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ ...defaultLine }]);
  const [requestedBy, setRequestedBy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const signedInName = userDisplayName(user);
  const isCashier = user?.role === ROLES.CASHIER;
  const canDecideReturns = [ROLES.ADMIN, ROLES.SHOP_MANAGER].includes(user?.role);
  const submitLabel = isCashier ? 'Request manager approval' : 'Create return case';
  const queueTitle = canDecideReturns ? 'Return approval queue' : 'My return requests';
  const queueKicker = canDecideReturns ? 'Approvals' : 'Status';
  const headerDescription = canDecideReturns
    ? 'Capture return lines, record manager decisions, refund method, and stock destination.'
    : 'Create return requests for manager approval and track their status.';

  useEffect(() => {
    setRequestedBy((current) => current || signedInName);
  }, [signedInName]);

  const refundTotal = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0),
    [lines]
  );

  const updateLine = (index, changes) => {
    setLines((current) =>
      current.map((line, lineIndex) => {
        if (lineIndex !== index) return line;
        const nextLine = { ...line, ...changes };
        if (Object.prototype.hasOwnProperty.call(changes, 'productId')) {
          const product = products.find((item) => item.id === changes.productId);
          nextLine.unitPrice = Number(product?.sellingPrice || 0);
        }
        return nextLine;
      })
    );
  };

  const addLine = () => setLines((current) => [...current, { ...defaultLine }]);
  const removeLine = (index) => setLines((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)));

  const resetForm = () => {
    setReceiptNumber('');
    setReason('Customer return');
    setRefundMethod('Cash');
    setNotes('');
    setRequestedBy(signedInName);
    setLines([{ ...defaultLine }]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!currentLocation?.id) {
      setError('Select a shop location before creating a return.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await returnService.create({
        locationId: currentLocation.id,
        receiptNumber: receiptNumber.trim(),
        requestedBy: requestedBy.trim(),
        reason,
        notes: notes.trim(),
        refundMethod,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity || 1),
          unitPrice: Number(line.unitPrice || 0),
          disposition: line.disposition
        }))
      });
      if (response.offlineQueued) {
        setMessage(response.message);
        resetForm();
        return;
      }

      setMessage(`Return ${response.returnNumber} sent for manager approval.`);
      resetForm();
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to create return request.');
    } finally {
      setSubmitting(false);
    }
  };

  const decideReturn = async (row, action) => {
    setMessage('');
    setError('');
    try {
      const response = action === 'approve'
        ? await returnService.approve(row.id, signedInName)
        : await returnService.reject(row.id, signedInName);
      if (response.offlineQueued) {
        setMessage(response.message);
        return;
      }

      setMessage(`Return ${response.returnNumber} ${action === 'approve' ? 'approved' : 'rejected'}.`);
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to update return request.');
    }
  };

  const decisionText = (row) => {
    if (row.status === 'PENDING_MANAGER_APPROVAL') {
      return canDecideReturns ? 'Ready for decision' : 'Waiting for manager';
    }
    return row.approvedBy || row.rejectedBy || 'Completed';
  };

  return (
    <>
      <PageHeader title="Returns and refunds" description={headerDescription} />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <section className="dashboard-grid">
        <div className="panel span-12" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Request</span>
              <h2>New return</h2>
            </div>
            <strong>{formatCurrency(refundTotal)}</strong>
          </div>
          <form className="transfer-form" onSubmit={handleSubmit}>
            <div className="app-form-grid">
              <div>
                <label className="form-label" htmlFor="receipt-number">
                  Receipt number
                </label>
                <input id="receipt-number" className="form-control" value={receiptNumber} onChange={(event) => setReceiptNumber(event.target.value)} required />
              </div>
              <div>
                <label className="form-label" htmlFor="refund-method">
                  Refund method
                </label>
                <select id="refund-method" className="form-select" value={refundMethod} onChange={(event) => setRefundMethod(event.target.value)}>
                  <option>Cash</option>
                  <option>M-Pesa</option>
                  <option>Card</option>
                  <option>Split Payment</option>
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="return-reason">
                  Reason
                </label>
                <select id="return-reason" className="form-select" value={reason} onChange={(event) => setReason(event.target.value)}>
                  <option>Customer return</option>
                  <option>Damaged item</option>
                  <option>Wrong item sold</option>
                  <option>Price correction</option>
                  <option>Warranty return</option>
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="requested-by">
                  Requested by / cashier
                </label>
                <input id="requested-by" className="form-control" value={requestedBy} onChange={(event) => setRequestedBy(event.target.value)} disabled={isCashier} required />
              </div>
              <div className="col-span-2">
                <label className="form-label" htmlFor="return-notes">
                  Notes
                </label>
                <textarea id="return-notes" className="form-control" rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </div>
            <div className="line-editor">
              <div className="line-editor-header">
                <strong>Return lines</strong>
                <button className="btn btn-outline-primary btn-sm" type="button" onClick={addLine}>
                  <i className="bi bi-plus-lg" aria-hidden="true" /> Add line
                </button>
              </div>
              {lines.map((line, index) => (
                <div className="line-editor-row return-line-editor-row" key={`${line.productId}-${index}`}>
                  <select className="form-select" value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value })} required>
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <input className="form-control" type="number" min="1" value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value })} required />
                  <input className="form-control" type="number" min="0" value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: event.target.value })} required />
                  <select className="form-select" value={line.disposition} onChange={(event) => updateLine(index, { disposition: event.target.value })}>
                    {dispositionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-body-secondary small">{destinationLabels[line.disposition]}</span>
                  <button className="btn btn-icon text-danger" type="button" onClick={() => removeLine(index)} disabled={lines.length === 1}>
                    <i className="bi bi-trash" aria-hidden="true" />
                    <span className="visually-hidden">Remove line</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-primary" type="submit" disabled={submitting || !products.length}>
                {submitting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-arrow-return-left" aria-hidden="true" />} {submitLabel}
              </button>
            </div>
          </form>
        </div>
        <div className="panel span-12" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">{queueKicker}</span>
              <h2>{queueTitle}</h2>
            </div>
          </div>
          <DataTable
            data={returns}
            emptyText="No return requests found."
            columns={[
              { key: 'returnNumber', label: 'Return' },
              { key: 'receiptNumber', label: 'Receipt' },
              { key: 'refundAmount', label: 'Refund', render: (row) => formatCurrency(row.refundAmount) },
              {
                key: 'items',
                label: 'Products and destination',
                render: (row) => (
                  <div className="table-stack">
                    {row.items?.map((item) => (
                      <span key={item.id}>
                        <strong>{item.quantity} x {item.productName}</strong>
                        <small>{item.destinationLabel}</small>
                      </span>
                    ))}
                  </div>
                )
              },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              { key: 'requestedAt', label: 'Requested', render: (row) => formatDate(row.requestedAt) },
              {
                key: 'actions',
                label: '',
                render: (row) =>
                  row.status === 'PENDING_MANAGER_APPROVAL' && canDecideReturns ? (
                    <div className="return-action-buttons">
                      <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => decideReturn(row, 'approve')}>
                        Approve
                      </button>
                      <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => decideReturn(row, 'reject')}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-body-secondary small">{decisionText(row)}</span>
                  )
              }
            ]}
          />
        </div>
      </section>
    </>
  );
}
