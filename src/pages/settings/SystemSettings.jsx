import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/common/PageHeader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { posService } from '../../services/posService';

export function SystemSettings() {
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const { data: settings, loading, error, reload } = useAsyncData(posService.receiptSettings.bind(posService), {
    businessName: 'Keen Stores',
    branchAddress: '',
    taxLabel: 'VAT',
    taxRegistrationNumber: '',
    tillNumber: 'TILL-001',
    controlUnitName: 'CONTROL UNIT INFO',
    controlUnitSerial: '',
    controlUnitUrl: '',
    taxRate: 16,
    pointsEnabled: true,
    pointsPerCurrencyUnit: 0.01,
    receiptFooter: 'Thank you for shopping with us.'
  });
  const { register, handleSubmit, reset, formState } = useForm({ defaultValues: settings });

  useEffect(() => {
    reset(settings);
  }, [reset, settings]);

  const saveSettings = async (values) => {
    setMessage('');
    setSaveError('');
    try {
      const response = await posService.saveReceiptSettings(values);
      setMessage(response.offlineQueued ? response.message : 'Receipt and tax settings saved.');
      if (response.offlineQueued) {
        return;
      }
      reload();
    } catch (requestError) {
      setSaveError(requestError.response?.data?.detail || requestError.message || 'Unable to save receipt settings.');
    }
  };

  return (
    <>
      <PageHeader title="Receipt and tax settings" description="Set the POS receipt header, tax registration details, VAT rate, footer, and customer points rules." />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error || saveError ? <div className="alert alert-danger">{error || saveError}</div> : null}
      <section className="panel" data-animate="fade-up">
        {loading ? (
          <div className="chart-loading">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading settings
          </div>
        ) : (
          <form className="app-form-grid" onSubmit={handleSubmit(saveSettings)}>
            <div>
              <label className="form-label" htmlFor="business-name">
                Business name
              </label>
              <input id="business-name" className="form-control" {...register('businessName', { required: true })} />
            </div>
            <div>
              <label className="form-label" htmlFor="branch-address">
                Receipt address
              </label>
              <input id="branch-address" className="form-control" {...register('branchAddress')} />
            </div>
            <div>
              <label className="form-label" htmlFor="tax-label">
                Tax label
              </label>
              <input id="tax-label" className="form-control" placeholder="VAT" {...register('taxLabel')} />
            </div>
            <div>
              <label className="form-label" htmlFor="tax-pin">
                Tax PIN / registration no.
              </label>
              <input id="tax-pin" className="form-control" {...register('taxRegistrationNumber')} />
            </div>
            <div>
              <label className="form-label" htmlFor="till-number">
                Till number
              </label>
              <input id="till-number" className="form-control" {...register('tillNumber')} />
            </div>
            <div>
              <label className="form-label" htmlFor="control-unit-name">
                Control unit heading
              </label>
              <input id="control-unit-name" className="form-control" {...register('controlUnitName')} />
            </div>
            <div>
              <label className="form-label" htmlFor="control-unit-serial">
                Control unit serial
              </label>
              <input id="control-unit-serial" className="form-control" {...register('controlUnitSerial')} />
            </div>
            <div>
              <label className="form-label" htmlFor="control-unit-url">
                Control unit URL
              </label>
              <input id="control-unit-url" className="form-control" {...register('controlUnitUrl')} />
            </div>
            <div>
              <label className="form-label" htmlFor="tax-rate">
                Tax rate %
              </label>
              <input id="tax-rate" className="form-control" type="number" min="0" step="0.01" {...register('taxRate', { required: true, min: 0 })} />
            </div>
            <label className="settings-row mb-0">
              <span>Enable customer points</span>
              <input className="form-check-input" type="checkbox" {...register('pointsEnabled')} />
            </label>
            <div>
              <label className="form-label" htmlFor="points-rate">
                Points per KES
              </label>
              <input id="points-rate" className="form-control" type="number" min="0" step="0.0001" {...register('pointsPerCurrencyUnit', { required: true, min: 0 })} />
              <div className="form-text">Use 0.01 for 1 point per KES 100.</div>
            </div>
            <div className="col-span-2">
              <label className="form-label" htmlFor="receipt-footer">
                Receipt footer
              </label>
              <textarea id="receipt-footer" className="form-control" rows="3" {...register('receiptFooter')} />
            </div>
            <div className="col-span-2 d-flex justify-content-end">
              <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting}>
                <i className="bi bi-check2-circle" aria-hidden="true" /> Save settings
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
