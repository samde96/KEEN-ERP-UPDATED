import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/common/PageHeader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../hooks/useAuth';
import { useBranch } from '../../hooks/useBranch';
import { salesService } from '../../services/salesService';
import { formatCurrency } from '../../utils/formatCurrency';

export function ShiftClosePage() {
  const { user } = useAuth();
  const { currentLocation } = useBranch();
  const activeShift = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('keen.inventory.activeShift') || 'null');
    } catch {
      return null;
    }
  }, []);
  const cashierName = user?.name || activeShift?.cashier || 'Cashier';
  const { data: cashierSummary } = useAsyncData(
    () =>
      currentLocation?.id
        ? salesService.cashierSummary({ locationId: currentLocation.id, cashierName })
        : Promise.resolve(null),
    null,
    [currentLocation?.id, cashierName]
  );
  const expectedCash = Number(cashierSummary?.expectedCash ?? activeShift?.openingCash ?? 0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, reset } = useForm({ defaultValues: { cashCounted: expectedCash, notes: '' } });

  useEffect(() => {
    reset((values) => ({ ...values, cashCounted: expectedCash }));
  }, [expectedCash, reset]);

  const handleClose = async (values) => {
    if (!currentLocation?.id) {
      setError('Select a shop location before closing a shift.');
      return;
    }

    const counted = Number(values.cashCounted || 0);
    setMessage('');
    setError('');
    try {
      const shift = await salesService.closeShift({
        locationId: currentLocation.id,
        cashierName,
        cashCounted: counted
      });
      if (shift.offlineQueued) {
        setMessage(shift.message);
        return;
      }

      localStorage.removeItem('keen.inventory.activeShift');
      setMessage(`Shift ${shift.shiftNumber} closed. Variance: ${formatCurrency(shift.variance)}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to close shift.');
    }
  };

  return (
    <>
      <PageHeader title="Close cashier shift" description="Reconcile expected cash, counted cash, payment references, and shift variance." />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <section className="dashboard-grid">
        <div className="panel span-4" data-animate="fade-up">
          <div className="metric-list">
            <span>Expected cash</span>
            <strong>{formatCurrency(expectedCash)}</strong>
            <span>Cash sales</span>
            <strong>{formatCurrency(cashierSummary?.cashSales || 0)}</strong>
            <span>Non-cash payments</span>
            <strong>{formatCurrency(cashierSummary?.nonCashSales || 0)}</strong>
          </div>
        </div>
        <div className="panel span-8" data-animate="fade-up">
          <form className="app-form-grid compact" onSubmit={handleSubmit(handleClose)}>
            <div>
              <label className="form-label" htmlFor="cash-counted">
                Cash counted
              </label>
              <input id="cash-counted" className="form-control" type="number" min="0" {...register('cashCounted')} />
            </div>
            <div className="col-span-2">
              <label className="form-label" htmlFor="close-notes">
                Notes
              </label>
              <textarea id="close-notes" className="form-control" rows="4" {...register('notes')} />
            </div>
            <div className="col-span-2 d-flex justify-content-end">
              <button className="btn btn-primary" type="submit">
                <i className="bi bi-lock" aria-hidden="true" /> Close shift
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
