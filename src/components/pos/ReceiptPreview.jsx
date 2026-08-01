import { Fragment, useMemo } from 'react';
import QRCode from 'qrcode';
import { formatCurrency } from '../../utils/formatCurrency';
import { maskLoyaltyCardNumber, maskMemberNumber } from '../../utils/receiptUtils';

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
  const quantity = Number(value ?? 1);
  if (!Number.isFinite(quantity)) {
    return '1';
  }

  return Number.isInteger(quantity)
    ? String(quantity)
    : quantity.toFixed(3).replace(/\.?0+$/, '');
}

function displayProductName(value) {
  const text = String(value || '').trim().toLowerCase();
  return text.replace(/[a-z]/, (letter) => letter.toUpperCase());
}

function ReceiptBarcode({ value }) {
  const seed = String(value || '000000000000');
  const bars = Array.from({ length: 84 }, (_, index) => {
    const code = seed.charCodeAt(index % seed.length) + index * 11;
    return {
      width: (code % 3) + 1,
      height: code % 5 > 1 ? 22 : 16
    };
  });

  return (
    <div className="receipt-barcode" aria-label={`Barcode ${seed}`}>
      <div>
        {bars.map((bar, index) => (
          <span key={`${seed}-${index}`} style={{ width: `${bar.width}px`, height: `${bar.height}px` }} />
        ))}
      </div>
      <small className="receipt-barcode-value">{seed}</small>
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
    <section className="receipt-preview receipt-print-target">
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
        {receipt.meta?.map((item) => (
          <Fragment key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </Fragment>
        ))}
      </dl>
      <div className="receipt-lines">
        {receipt.lines?.map((line, index) => {
          const quantity = Number(line.quantitySent || line.quantity || 1);
          const unitPrice = Number(line.unitPrice ?? line.unitWholesalePrice ?? line.unitCost ?? line.price ?? 0);
          const lineTotal = Number(line.lineTotal ?? line.lineRevenue ?? unitPrice * quantity);

          return (
            <div className="receipt-line" key={`${line.product || line.name}-${index}`}>
              <span>
                <strong>{line.product || line.name}</strong>
                {line.sku || line.barcode ? <small>{[line.sku, line.barcode].filter(Boolean).join(' | ')}</small> : null}
              </span>
              <span>{quantity}</span>
              <span>{formatCurrency(unitPrice)}</span>
              <strong>{formatCurrency(lineTotal)}</strong>
            </div>
          );
        })}
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
  const paymentLines = receipt.paymentLines?.length
    ? receipt.paymentLines
    : [
        {
          method: receipt.paymentMethod,
          rawMethod: receipt.paymentMethod === 'Cash' ? 'CASH' : receipt.paymentMethod === 'M-Pesa' ? 'MPESA' : receipt.paymentMethod === 'Card' ? 'CARD' : 'PAID',
          amount: receipt.paymentMethod === 'Cash' ? Number(receipt.amountTendered || receipt.total) : Number(receipt.total || 0)
        }
  ];
  const cashLine = paymentLines.find((line) => line.rawMethod === 'CASH');
  const cashTenderAmount = receipt.paymentMethod === 'Cash' ? Number(receipt.amountTendered || receipt.total) : Number(cashLine?.amount || 0);
  const otherPaymentLines = paymentLines.filter((line) => line.rawMethod !== 'CASH');
  const tenderRows = [
    { label: 'TOTAL', value: receipt.total },
    ...(cashLine ? [{ label: 'CASH PAID', value: cashTenderAmount }] : []),
    ...otherPaymentLines.map((line) => ({
      label: line.rawMethod === 'MPESA' ? 'MPESA PAY' : line.rawMethod === 'CARD' ? 'CARD PAY' : String(line.method || 'PAID').toUpperCase(),
      value: line.amount
    })),
    ...(receipt.changeAmount > 0 || cashLine ? [{ label: 'CHANGE', value: receipt.changeAmount }] : [])
  ];

  return (
    <section className="receipt-preview receipt-pos receipt-print-target">
      <header className="receipt-store-head">
        <strong>{receipt.businessName || 'Keen Stores'}</strong>
        {receipt.branchAddress ? <span>{receipt.branchAddress}</span> : null}
        {receipt.pinNumber ? <span>PIN No: {receipt.pinNumber}</span> : null}
        {receipt.taxRegistrationNumber ? <span>VAT Reg: {receipt.taxRegistrationNumber}</span> : null}
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
          <span>VAT</span>
        </div>
        {receipt.lines?.map((line, index) => (
          <div className="receipt-item" key={`${line.product}-${index}`}>
            <span className="receipt-product-name">{displayProductName(line.product)}</span>
            <small className="receipt-item-meta">{line.barcode || line.sku || ''}</small>
            <span className="receipt-item-qty">{quantityText(line.quantity)}</span>
            <span className="receipt-item-price">{receiptMoney(line.unitPrice)}</span>
            <span className="receipt-item-total">{receiptMoney(line.lineTotal)}</span>
            <span className="receipt-item-vat">{receiptMoney(line.taxAmount)}</span>
          </div>
        ))}
      </div>

      <div className="receipt-tender">
        {tenderRows.map((row) => (
          <Fragment key={row.label}>
            <span>{row.label}</span>
            <strong>{receiptMoney(row.value)}</strong>
          </Fragment>
        ))}
      </div>

      <div className="receipt-extra-meta">
        <span>Total Qty : {totalQuantity.toFixed(2)} units</span>
        <span>Cashier : {receipt.cashier || 'Cashier'}</span>
        {receipt.supervisor ? <span>Supervisor: {receipt.supervisor}</span> : null}
        {receipt.customerName ? <span>Customer: {receipt.customerName}</span> : null}
        {receipt.customerCardNumber ? <span>Keen Loyalty Card: {maskLoyaltyCardNumber(receipt.customerCardNumber)}</span> : null}
        {receipt.customerPhone ? <span>Member No: {maskMemberNumber(receipt.customerPhone)}</span> : null}
      </div>

      {receipt.mpesaDetails ? (
        <section className="receipt-mpesa-details">
          <h3>MPESA DETAILS</h3>
          <div>
            <span>Name</span>
            <strong>{receipt.mpesaDetails.name || 'M-PESA'}</strong>
          </div>
          <div>
            <span>Mobile No.</span>
            <strong>{receipt.mpesaDetails.mobileNumberHash || 'Not set'}</strong>
          </div>
          <div>
            <span>MPESA Trn #</span>
            <strong>{receipt.mpesaDetails.mpesaTransactionNumber || 'Not set'}</strong>
          </div>
          <div>
            <span>Amount</span>
            <strong>{receiptMoney(receipt.mpesaDetails.amount || receipt.total)}</strong>
          </div>
        </section>
      ) : null}

      <div className="receipt-tax-breakdown">
        <div className="receipt-tax-breakdown-row receipt-tax-breakdown-head">
          <span>CODE</span>
          <span>PRE-VAT</span>
          <span>VAT</span>
          <span>TOTAL</span>
        </div>
        {receipt.taxRows?.map((row) => (
          <div className="receipt-tax-breakdown-row" key={row.code}>
            <span>{row.code} ({Number(row.rate || 0).toFixed(0)}%)</span>
            <span>{receiptMoney(row.preVat)}</span>
            <span>{receiptMoney(row.vat)}</span>
            <span>{receiptMoney(row.total)}</span>
          </div>
        ))}
        <div className="receipt-tax-breakdown-row receipt-tax-breakdown-total">
          <strong>TOTAL</strong>
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
        <span>CU No: {receipt.controlUnitSerial || 'Not set'}</span>
        <span>CU Inv: {receipt.controlUnitInvoiceNumber || receipt.controlUnitUrl || 'Not set'}</span>
        <span>Rcpt Ref No: {receipt.number}</span>
        <span>Date: {receipt.issuedAt}</span>
        <ReceiptQr value={receipt.qrPayload || receipt.number} />
        <span>Scan QR to verify sale</span>
      </section>

      {hasDiscounts || receipt.discount ? (
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
          ) : null}
          {receipt.discount ? <strong>TOTAL DISCOUNT {receiptMoney(receipt.discount)}</strong> : null}
          <small>Note: Prices shown on receipt are inclusive of discount.</small>
        </section>
      ) : null}

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
