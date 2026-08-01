import { formatCurrency } from '../../utils/formatCurrency';

export function POSCart({ cart, onIncrement, onDecrement, onRemove }) {
  return (
    <aside className="pos-cart">
      <div className="pos-cart-header">
        <strong>Cart</strong>
        <span>{cart.length} lines</span>
      </div>
      <div className="pos-cart-list">
        {cart.length ? (
          cart.map((item) => (
            <article className="pos-cart-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{formatCurrency(item.price)}</span>
                {Number.isFinite(Number(item.available)) ? <span>Available: {item.available}</span> : null}
              </div>
              <div className="quantity-stepper">
                <button className="btn btn-icon" type="button" onClick={() => onDecrement(item.id)} aria-label={`Decrease ${item.name}`}>
                  <i className="bi bi-dash" aria-hidden="true" />
                </button>
                <span>{item.quantity}</span>
                <button className="btn btn-icon" type="button" onClick={() => onIncrement(item.id)} disabled={Number.isFinite(Number(item.available)) && item.quantity >= Number(item.available)} aria-label={`Increase ${item.name}`}>
                  <i className="bi bi-plus" aria-hidden="true" />
                </button>
              </div>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
              <button className="btn btn-icon text-danger" type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}>
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </article>
          ))
        ) : (
          <div className="empty-cart">No items added.</div>
        )}
      </div>
    </aside>
  );
}
