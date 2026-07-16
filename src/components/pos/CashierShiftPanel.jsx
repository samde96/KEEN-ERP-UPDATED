import { formatCurrency } from '../../utils/formatCurrency';

export function CashierShiftPanel({ cashier, terminal, sales, expectedCash, status = 'Open' }) {
  return (
    <section className="cashier-shift-panel">
      <div>
        <span>Cashier</span>
        <strong>{cashier}</strong>
      </div>
      <div>
        <span>Terminal</span>
        <strong>{terminal}</strong>
      </div>
      <div>
        <span>Shift</span>
        <strong>{status}</strong>
      </div>
      <div>
        <span>Sales</span>
        <strong>{sales}</strong>
      </div>
      <div>
        <span>Expected cash</span>
        <strong>{formatCurrency(expectedCash)}</strong>
      </div>
    </section>
  );
}
