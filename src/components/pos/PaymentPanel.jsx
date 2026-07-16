import { formatCurrency } from '../../utils/formatCurrency';

export function PaymentPanel({
  subtotal,
  discount,
  taxLabel = 'VAT',
  taxAmount = 0,
  pointsEarned = 0,
  total,
  amountTendered,
  changeAmount = 0,
  paymentMethod,
  onPaymentMethodChange,
  onDiscountChange,
  onAmountTenderedChange,
  onCheckout,
  disabled = false,
  loading = false
}) {
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
      <div className="payment-row">
        <span>{taxLabel} included</span>
        <strong>{formatCurrency(taxAmount)}</strong>
      </div>
      <div className="payment-row">
        <span>Customer points</span>
        <strong>{pointsEarned}</strong>
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
