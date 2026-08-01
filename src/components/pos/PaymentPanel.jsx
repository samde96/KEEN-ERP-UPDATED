import { formatCurrency } from '../../utils/formatCurrency';

export function PaymentPanel({
  subtotal,
  discount,
  taxLabel = 'VAT',
  taxAmount = 0,
  pointsEarned = 0,
  pointsBalance = 0,
  rewardCustomerLabel = '',
  total,
  amountTendered,
  changeAmount = 0,
  paymentMethod,
  splitCashAmount = 0,
  splitMpesaAmount = 0,
  splitBalance = 0,
  mpesaPhone = '',
  mpesaStatus = '',
  mpesaMessage = '',
  mpesaLoading = false,
  mpesaAmount = 0,
  mpesaActionDisabled = false,
  onPaymentMethodChange,
  onSplitCashAmountChange,
  onSplitMpesaAmountChange,
  onMpesaPhoneChange,
  onMpesaPush,
  onDiscountChange,
  onAmountTenderedChange,
  onCheckout,
  disabled = false,
  loading = false
}) {
  const isSplitPayment = paymentMethod === 'Split Payment';
  const isMpesaTender = paymentMethod === 'M-Pesa' || isSplitPayment;
  const splitHasBothAmounts = Number(splitCashAmount || 0) > 0 && Number(splitMpesaAmount || 0) > 0;
  const splitIsBalanced = Math.abs(Number(splitBalance || 0)) < 0.01;

  return (
    <section className="payment-panel">
      <div className="payment-row">
        <span>Subtotal</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>
      <label className="form-label" htmlFor="pos-discount">
        Discount
      </label>
      <div className="input-group">
        <span className="input-group-text">KES</span>
        <input id="pos-discount" className="form-control" type="number" min="0" value={discount} onChange={(event) => onDiscountChange(Number(event.target.value))} />
      </div>
      <label className="form-label mt-3" htmlFor="payment-method">
        Payment method
      </label>
      <select id="payment-method" className="form-select" value={paymentMethod} onChange={(event) => onPaymentMethodChange(event.target.value)}>
        <option>Cash</option>
        <option>M-Pesa</option>
        <option>Card</option>
        <option>Split Payment</option>
      </select>
      {paymentMethod === 'Cash' ? (
        <>
          <label className="form-label mt-3" htmlFor="amount-tendered">
            Cash paid
          </label>
          <div className="input-group">
            <span className="input-group-text">KES</span>
            <input id="amount-tendered" className="form-control" type="number" min="0" value={amountTendered} onChange={(event) => onAmountTenderedChange(Number(event.target.value))} />
          </div>
          <div className="payment-row">
            <span>Change</span>
            <strong>{formatCurrency(changeAmount)}</strong>
          </div>
        </>
      ) : null}
      {isSplitPayment ? (
        <div className="split-payment-panel">
          <div>
            <label className="form-label" htmlFor="split-cash-amount">
              Cash amount
            </label>
            <div className="input-group">
              <span className="input-group-text">KES</span>
              <input
                id="split-cash-amount"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={splitCashAmount}
                onChange={(event) => onSplitCashAmountChange(Number(event.target.value))}
                disabled={loading || mpesaLoading}
              />
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="split-mpesa-amount">
              M-Pesa amount
            </label>
            <div className="input-group">
              <span className="input-group-text">KES</span>
              <input
                id="split-mpesa-amount"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={splitMpesaAmount}
                onChange={(event) => onSplitMpesaAmountChange(Number(event.target.value))}
                disabled={loading || mpesaLoading}
              />
            </div>
          </div>
          <small className={`split-balance ${splitIsBalanced && splitHasBothAmounts ? 'split-balance-ok' : 'split-balance-warning'}`}>
            {!splitHasBothAmounts
              ? 'Enter cash and M-Pesa amounts'
              : splitIsBalanced
              ? 'Split balanced'
              : splitBalance > 0
                ? `${formatCurrency(splitBalance)} remaining`
                : `${formatCurrency(Math.abs(splitBalance))} over total`}
          </small>
        </div>
      ) : null}
      {isMpesaTender ? (
        <div className="mpesa-checkout-panel">
          <label className="form-label" htmlFor="mpesa-phone">
            Customer Safaricom number
          </label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-phone" aria-hidden="true" />
            </span>
            <input
              id="mpesa-phone"
              className="form-control"
              type="tel"
              inputMode="tel"
              value={mpesaPhone}
              onChange={(event) => onMpesaPhoneChange(event.target.value)}
              placeholder="0712345678"
              disabled={loading || mpesaLoading}
            />
            <button
              className="btn btn-outline-success"
              type="button"
              onClick={onMpesaPush}
              disabled={loading || mpesaLoading || mpesaActionDisabled || Number(mpesaAmount || 0) <= 0 || !String(mpesaPhone).trim()}
            >
              {mpesaLoading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-phone-vibrate" aria-hidden="true" />} Send STK Push
            </button>
          </div>
          <div className="payment-row">
            <span>STK amount</span>
            <strong>{formatCurrency(mpesaAmount)}</strong>
          </div>
          {mpesaMessage ? (
            <small className={`mpesa-status mpesa-status-${String(mpesaStatus || 'pending').toLowerCase()}`}>
              {mpesaMessage}
            </small>
          ) : null}
        </div>
      ) : null}
      <div className="payment-row">
        <span>{taxLabel} included</span>
        <strong>{formatCurrency(taxAmount)}</strong>
      </div>
      <div className="payment-row">
        <span>Reward points</span>
        <strong>{pointsEarned}</strong>
      </div>
      <div className="payment-row">
        <span>{rewardCustomerLabel || 'Rewards balance'}</span>
        <strong>{pointsBalance}</strong>
      </div>
      <div className="payment-total">
        <span>Total</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
      <button className="btn btn-success btn-lg w-100" type="button" onClick={onCheckout} disabled={disabled || loading || total <= 0}>
        {loading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-credit-card" aria-hidden="true" />} Checkout
      </button>
    </section>
  );
}
