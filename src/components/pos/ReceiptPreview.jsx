import { useMemo } from 'react';
import QRCode from 'qrcode';
import { formatCurrency } from '../../utils/formatCurrency';

function receiptMoney(value) {
  return Number(value || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function displayMoney(value) {
  return typeof value === 'number' ? formatCurrency(value) : value || formatCurrency(0);
}

function quantityText(value) {
  return `${Number(value || 1).toFixed(3)} PC`;
}

function ReceiptBarcode({ value }) {
  const seed = String(value || '000000000000');
  const bars = Array.from({ length: 56 }, (_, index) => {
    const code = seed.charCodeAt(index % seed.length) + index * 11;
    return {
      width: (code % 3) + 1,
      height: code % 5 > 1 ? 34 : 27
    };
  });

  return (
    <div className="receipt-barcode" aria-label={`Barcode ${seed}`}>
      <div>
        {bars.map((bar, index) => (
          <span key={`${seed}-${index}`} style={{ width: `${bar.width}px`, height: `${bar.height}px` }} />
        ))}
      </div>
      <small>{seed}</small>
    </div>
  );
}

function ReceiptQr({ value }) {
  const qr = useMemo(() => QRCode.create(String(value || 'KEEN'), { errorCorrectionLevel: 'M' }), [value]);
  const margin = 4;
  const size = qr.modules.size;
  const viewBoxSize = size + margin * 2;
  const cells = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (qr.modules.get(row, col)) {
        cells.push(<rect key={`${row}-${col}`} x={col + margin} y={row + margin} width="1" height="1" />);
      }
    }
  }

  return (
    <svg className="receipt-qr" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} role="img" aria-label="Sale receipt verification QR code" shapeRendering="crispEdges">
      <rect width={viewBoxSize} height={viewBoxSize} fill="#ffffff" />
      <g fill="#050505">{cells}</g>
    </svg>
  );
}

function GenericReceipt({ receipt, onPrint }) {
  return (
    <section className="receipt-preview receipt-print-target" data-animate="fade-up">
      <div className="receipt-head">
        <strong>{receipt.businessName || 'Keen Stores'}</strong>
        <span>{receipt.title}</span>
        <small>{receipt.number || receipt.reference}</small>
      </div>
      <dl className="receipt-meta">
        {receipt.branch ? (
          <>
            <dt>Branch</dt>
            <dd>{receipt.branch}</dd>
          </>
        ) : null}
        {receipt.cashier ? (
          <>
            <dt>Cashier</dt>
            <dd>{receipt.cashier}</dd>
          </>
        ) : null}
        {receipt.source ? (
          <>
            <dt>Source</dt>
            <dd>{receipt.source}</dd>
            <dt>Destination</dt>
            <dd>{receipt.destination}</dd>
          </>
        ) : null}
        <dt>Date</dt>
        <dd>{receipt.issuedAt}</dd>
      </dl>
      <div className="receipt-lines">
        {receipt.lines?.map((line, index) => (
          <div className="receipt-line" key={`${line.product || line.name}-${index}`}>
            <span>
              <strong>{line.product || line.name}</strong>
              {line.sku ? <small>{line.sku}</small> : null}
            </span>
            <span>{line.quantitySent || line.quantity || 1}</span>
            <span>{line.unitCost ? formatCurrency(line.unitCost) : formatCurrency(line.unitPrice || line.price || 0)}</span>
            <strong>{line.lineTotal ? formatCurrency(line.lineTotal) : line.unitCost ? formatCurrency(line.unitCost * line.quantitySent) : formatCurrency((line.price || 0) * (line.quantity || 1))}</strong>
          </div>
        ))}
      </div>
      <div className="receipt-summary">
        <span className="receipt-grand-total">Total</span>
        <strong className="receipt-grand-total">{displayMoney(receipt.total)}</strong>
      </div>
      {receipt.parties?.length ? (
        <div className="receipt-parties">
          {receipt.parties.map((party) => (
            <span key={party.label}>{party.label}: {party.value}</span>
          ))}
        </div>
      ) : null}
      <div className="receipt-code">VERIFY-{receipt.number || receipt.reference}</div>
      {onPrint ? (
        <button className="btn btn-primary w-100 receipt-print-button" type="button" onClick={onPrint}>
          <i className="bi bi-printer" aria-hidden="true" /> Print receipt
        </button>
      ) : null}
    </section>
  );
}

function PosReceipt({ receipt, onPrint }) {
  const totalQuantity = receipt.lines?.reduce((sum, line) => sum + Number(line.quantity || 0), 0) || 0;
  const hasDiscounts = receipt.rewardedDiscounts?.length > 0;

  return (
    <section className="receipt-preview receipt-pos receipt-print-target" data-animate="fade-up">
      <header className="receipt-store-head">
        <strong>{receipt.businessName || 'Keen Stores'}</strong>
        {receipt.branchAddress ? <span>{receipt.branchAddress}</span> : null}
        <span>{receipt.taxLabel || 'VAT'} Reg: {receipt.taxRegistrationNumber || 'Not set'}</span>
        <h2>{receipt.title || 'CASH SALE'}</h2>
        <div>
          <span>Date: {receipt.issuedAt}</span>
          <span>Till No: {receipt.tillNumber || 'TILL-001'}</span>
        </div>
        <div>
          <span>Branch: {receipt.branch || 'Main'}</span>
          <span>Rcpt: {receipt.number}</span>
        </div>
      </header>

      <ReceiptBarcode value={receipt.number} />

      <div className="receipt-item-table">
        <div className="receipt-item-head">
          <span>Item</span>
          <span>Qty</span>
          <span>Each</span>
          <span>Total</span>
        </div>
        {receipt.lines?.map((line, index) => (
          <div className="receipt-item" key={`${line.product}-${index}`}>
            <strong>{line.product}</strong>
            <small>{line.barcode || line.sku}</small>
            <span>{quantityText(line.quantity)}</span>
            <span>{receiptMoney(line.unitPrice)}</span>
            <span>{receiptMoney(line.lineTotal)}</span>
            <em>{line.taxCode || 'G'}</em>
          </div>
        ))}
      </div>

      <div className="receipt-tender">
        <span>TOTAL</span>
        <strong>{receiptMoney(receipt.total)}</strong>
        <span>{receipt.paymentMethod === 'Cash' ? 'CASH PAID' : receipt.paymentMethod?.toUpperCase() || 'PAID'}</span>
        <strong>{receiptMoney(receipt.amountTendered || receipt.total)}</strong>
        <span>CHANGE</span>
        <strong>{receiptMoney(receipt.changeAmount)}</strong>
      </div>

      <div className="receipt-extra-meta">
        <span>Total Qty : {totalQuantity.toFixed(2)} units</span>
        <span>Cashier : {receipt.cashier || 'Cashier'}</span>
        {receipt.supervisor ? <span>Supervisor: {receipt.supervisor}</span> : null}
        {receipt.customerPhone ? <span>Member No: {receipt.customerPhone}</span> : null}
      </div>

      <div className="receipt-tax-breakdown">
        <div>
          <span>CODE</span>
          <span>PRE-VAT</span>
          <span>VAT</span>
          <span>TOTAL</span>
        </div>
        {receipt.taxRows?.map((row) => (
          <div key={row.code}>
            <span>{row.code} - {Number(row.rate || 0).toFixed(2)}%</span>
            <span>{receiptMoney(row.preVat)}</span>
            <span>{receiptMoney(row.vat)}</span>
            <span>{receiptMoney(row.total)}</span>
          </div>
        ))}
        <div>
          <strong>TOTALS</strong>
          <strong>{receiptMoney(receipt.preVat)}</strong>
          <strong>{receiptMoney(receipt.taxAmount)}</strong>
          <strong>{receiptMoney(receipt.total)}</strong>
        </div>
      </div>

      <div className="receipt-loyalty">
        <span>Customer Points</span>
        <strong>{receipt.pointsEarned || 0} earned</strong>
        <span>Balance</span>
        <strong>{receipt.pointsBalance || 0}</strong>
      </div>

      <section className="receipt-control-unit">
        <h3>{receipt.controlUnitName || 'CONTROL UNIT INFO'}</h3>
        <span>CU No: {receipt.controlUnitSerial || receipt.taxRegistrationNumber || 'Not set'}</span>
        <span>Rcpt Ref No: {receipt.number}</span>
        <span>Date: {receipt.issuedAt}</span>
        <ReceiptQr value={receipt.qrPayload || receipt.number} />
        <span>Scan QR to verify sale</span>
        {receipt.controlUnitUrl ? <small>{receipt.controlUnitUrl}</small> : null}
      </section>

      <section className="receipt-rewarded">
        <h3>REWARDED DISCOUNTS</h3>
        <div>
          <span>Item</span>
          <span>Rewarded Discount</span>
        </div>
        {hasDiscounts ? (
          receipt.rewardedDiscounts.map((discount) => (
            <div key={discount.item}>
              <span>{discount.item}</span>
              <strong>{receiptMoney(discount.amount)}</strong>
            </div>
          ))
        ) : (
          <div>
            <span>No rewarded discounts</span>
            <strong>{receiptMoney(0)}</strong>
          </div>
        )}
        {receipt.discount ? <strong>TOTAL DISCOUNT {receiptMoney(receipt.discount)}</strong> : null}
        <small>Note: Prices shown on receipt are inclusive of discount.</small>
      </section>

      {receipt.footer ? <p className="receipt-footer">{receipt.footer}</p> : null}
      {onPrint ? (
        <button className="btn btn-primary w-100 receipt-print-button" type="button" onClick={onPrint}>
          <i className="bi bi-printer" aria-hidden="true" /> Print receipt
        </button>
      ) : null}
    </section>
  );
}

export function ReceiptPreview({ receipt, onPrint }) {
  if (!receipt) {
    return (
      <section className="receipt-preview empty">
        <i className="bi bi-receipt" aria-hidden="true" />
        <span>No receipt selected.</span>
      </section>
    );
  }

  if (receipt.receiptType === 'POS') {
    return <PosReceipt receipt={receipt} onPrint={onPrint} />;
  }

  return <GenericReceipt receipt={receipt} onPrint={onPrint} />;
}
