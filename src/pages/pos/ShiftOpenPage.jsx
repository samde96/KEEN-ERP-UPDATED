import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useBranch } from '../../hooks/useBranch';
import { salesService } from '../../services/salesService';

export function ShiftOpenPage() {
  const { user } = useAuth();
  const { currentLocation } = useBranch();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit } = useForm({ defaultValues: { terminal: 'POS-WST-01', openingCash: 0 } });

  const handleOpen = async (values) => {
    if (!currentLocation?.id) {
      setError('Select a shop location before opening a shift.');
      return;
    }

    setMessage('');
    setError('');
    try {
      const shift = await salesService.openShift({
        locationId: currentLocation.id,
        cashierName: user?.name || 'Cashier',
        terminalCode: values.terminal,
        openingCash: values.openingCash
      });
      if (shift.offlineQueued) {
        setMessage(shift.message);
        return;
      }

      localStorage.setItem('keen.inventory.activeShift', JSON.stringify(shift));
      setMessage(`Shift ${shift.shiftNumber} opened on ${shift.terminal}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to open shift.');
    }
  };

  return (
    <>
      <PageHeader title="Open cashier shift" description="Record terminal and opening cash before sales begin." />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <section className="panel narrow-panel" data-animate="fade-up">
        <form className="app-form-grid compact" onSubmit={handleSubmit(handleOpen)}>
          <div className="col-span-2">
            <label className="form-label" htmlFor="cashier">
              Cashier
            </label>
            <input id="cashier" className="form-control" value={user?.name || ''} readOnly />
          </div>
          <div>
            <label className="form-label" htmlFor="terminal">
              Terminal
            </label>
            <input id="terminal" className="form-control" {...register('terminal')} />
          </div>
          <div>
            <label className="form-label" htmlFor="opening-cash">
              Opening cash
            </label>
            <input id="opening-cash" className="form-control" type="number" min="0" {...register('openingCash')} />
          </div>
          <div className="col-span-2 d-flex justify-content-end">
            <button className="btn btn-primary" type="submit">
              <i className="bi bi-unlock" aria-hidden="true" /> Open shift
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
