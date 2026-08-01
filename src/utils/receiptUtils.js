import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';

export function buildTransferReceipt(transfer, lines = []) {
  const storeSale = String(transfer.transferType || '').toUpperCase().replace(/\s+/g, '_') === 'STORE_SALE';
  return {
    title: storeSale ? 'Store Sale Invoice' : 'Dispatch Receipt',
    number: storeSale ? transfer.invoiceNumber || transfer.receiptNo : transfer.receiptNo,
    reference: transfer.transferNumber || transfer.id,
    businessName: 'KEEN Inventory',
    source: transfer.source,
    destination: transfer.destination,
    status: transfer.status,
    issuedAt: formatDate(transfer.sentAt),
    totalUnits: transfer.totalUnits,
    total: formatCurrency(storeSale ? transfer.totalRevenue : transfer.value),
    meta: [
      { label: 'Dispatch ref', value: transfer.transferNumber || transfer.id },
      { label: 'Type', value: transfer.transferType || 'Transfer' },
      { label: 'Status', value: transfer.status },
      { label: 'Total units', value: transfer.totalUnits }
    ],
    parties: [
      { label: 'Store Manager', value: transfer.manager },
      { label: 'Shop Manager', value: transfer.shopManager },
      { label: 'Attendant', value: transfer.attendant }
    ],
    lines: lines.map((line) => {
      const quantity = Number(line.quantitySent || line.quantity || 1);
      const unitPrice = storeSale ? Number(line.unitWholesalePrice || 0) : Number(line.unitCost || 0);
      return {
        ...line,
        quantity,
        unitPrice,
        lineTotal: storeSale
          ? Number(line.lineRevenue || unitPrice * quantity)
          : Number(line.lineCost || unitPrice * quantity)
      };
    })
  };
}

const paymentLabels = {
  CASH: 'Cash',
  MPESA: 'M-Pesa',
  CARD: 'Card',
  SPLIT_PAYMENT: 'Split Payment'
};

function taxCodeForRate(rate) {
  return Number(rate || 0) > 0 ? 'G' : 'A';
}

function inclusiveTax(total, rate) {
  const taxRate = Number(rate || 0);
  const amount = Number(total || 0);
  if (taxRate <= 0 || amount <= 0) return 0;
  return (amount * taxRate) / (100 + taxRate);
}

function fallbackTaxRows(checkout, totalAmount, fallbackTaxRate, fallbackTaxAmount) {
  const rows = new Map();

  (checkout.items || []).forEach((item) => {
    const rate = Number(item.taxRate ?? fallbackTaxRate ?? 0);
    const code = item.taxCode || taxCodeForRate(rate);
    const total = Number(item.lineTotal ?? 0);
    const vat = Number(item.taxAmount ?? inclusiveTax(total, rate));
    const preVat = Number(item.preVat ?? Math.max(total - vat, 0));
    const current = rows.get(code) || { code, rate, preVat: 0, vat: 0, total: 0 };

    current.preVat += preVat;
    current.vat += vat;
    current.total += total;
    rows.set(code, current);
  });

  if (!rows.size) {
    const code = taxCodeForRate(fallbackTaxRate);
    rows.set(code, {
      code,
      rate: fallbackTaxRate,
      preVat: Math.max(totalAmount - fallbackTaxAmount, 0),
      vat: fallbackTaxAmount,
      total: totalAmount
    });
  }

  return Array.from(rows.values());
}

export function maskMemberNumber(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue || rawValue.includes('*')) return rawValue;

  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 3) return '*'.repeat(digits.length);
  if (digits.length < 8) return `${digits.slice(0, 1)}***${digits.slice(-2)}`;

  const prefix = rawValue.startsWith('+') ? '+' : '';
  return `${prefix}${digits.slice(0, 4)}***${digits.slice(-3)}`;
}

export function maskLoyaltyCardNumber(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue || rawValue.includes('*')) return rawValue;

  let hidden = 0;
  return Array.from(rawValue)
    .reverse()
    .map((character) => {
      if (hidden < 3 && /\d/.test(character)) {
        hidden += 1;
        return '*';
      }

      return character;
    })
    .reverse()
    .join('');
}

function buildQrPayload(checkout) {
  const controlUnitInvoiceNumber = checkout.controlUnitInvoiceNumber || checkout.controlUnitUrl || '';
  const payload = {
    type: 'SALE_RECEIPT',
    receiptNumber: checkout.receiptNumber,
    businessName: checkout.businessName || 'Keen Stores',
    branch: checkout.branch,
    soldAt: checkout.soldAt,
    tillNumber: checkout.tillNumber || '',
    pinNumber: checkout.pinNumber || '',
    taxRegistrationNumber: checkout.taxRegistrationNumber || '',
    controlUnitSerial: checkout.controlUnitSerial || '',
    controlUnitInvoiceNumber,
    totalAmount: Number(checkout.totalAmount || 0).toFixed(2),
    taxAmount: Number(checkout.taxAmount || 0).toFixed(2)
  };

  return JSON.stringify(payload);
}

function sentenceCase(value) {
  const text = String(value || '').trim().toLowerCase();
  return text.replace(/[a-z]/, (letter) => letter.toUpperCase());
}

export function buildPosReceipt(checkout) {
  const controlUnitInvoiceNumber = checkout.controlUnitInvoiceNumber || checkout.controlUnitUrl || '';
  const taxRate = Number(checkout.taxRate || 0);
  const totalAmount = Number(checkout.totalAmount || 0);
  const taxAmount = Number(checkout.taxAmount || 0);
  const mpesaDetails = checkout.mpesaDetails
    ? {
        name: checkout.mpesaDetails.name || '',
        mobileNumberHash: checkout.mpesaDetails.mobileNumberHash || '',
        mpesaTransactionNumber: checkout.mpesaDetails.mpesaTransactionNumber || '',
        amount: Number(checkout.mpesaDetails.amount || totalAmount)
      }
    : null;
  const paymentLines = checkout.paymentLines?.length
    ? checkout.paymentLines.map((line) => ({
        method: paymentLabels[line.method] || line.method,
        rawMethod: line.method,
        amount: Number(line.amount || 0),
        referenceNumber: line.referenceNumber || ''
      }))
    : [];
  const taxRows = checkout.taxRows?.length
    ? checkout.taxRows.map((row) => ({
        code: row.code,
        rate: Number(row.rate || 0),
        preVat: Number(row.preVat || 0),
        vat: Number(row.vat || 0),
        total: Number(row.total || 0)
      }))
    : fallbackTaxRows(checkout, totalAmount, taxRate, taxAmount);
  const preVat = taxRows.reduce((sum, row) => sum + Number(row.preVat || 0), 0);
  const discount = Number(checkout.discountAmount || 0);

  return {
    receiptType: 'POS',
    title: 'CASH SALE',
    number: checkout.receiptNumber,
    businessName: checkout.businessName || 'Keen Stores',
    branch: checkout.branch,
    branchAddress: checkout.branchAddress,
    cashier: checkout.cashierName,
    supervisor: checkout.supervisorName,
    customerName: checkout.customerName,
    customerPhone: maskMemberNumber(checkout.customerPhone),
    customerCardNumber: maskLoyaltyCardNumber(checkout.customerCardNumber),
    paymentMethod: paymentLabels[checkout.paymentMethod] || checkout.paymentMethod,
    paymentLines,
    mpesaDetails,
    issuedAt: formatDate(checkout.soldAt),
    rawIssuedAt: checkout.soldAt,
    taxLabel: checkout.taxLabel || 'VAT',
    taxRegistrationNumber: checkout.taxRegistrationNumber,
    pinNumber: checkout.pinNumber,
    tillNumber: checkout.tillNumber,
    controlUnitName: checkout.controlUnitName,
    controlUnitSerial: checkout.controlUnitSerial,
    controlUnitInvoiceNumber,
    qrPayload: buildQrPayload(checkout),
    taxRate,
    subtotal: Number(checkout.subtotal || 0),
    discount,
    taxableAmount: Number(checkout.taxableAmount || checkout.totalAmount || 0),
    preVat,
    taxAmount,
    total: totalAmount,
    amountTendered: Number(checkout.amountTendered || checkout.totalAmount || 0),
    changeAmount: Number(checkout.changeAmount || 0),
    pointsEarned: Number(checkout.pointsEarned || 0),
    pointsBalance: Number(checkout.pointsBalance || 0),
    footer: checkout.footer,
    taxRows,
    rewardedDiscounts: discount > 0 ? [{ item: 'Sale discount', amount: discount }] : [],
    lines: (checkout.items || []).map((item) => ({
      product: sentenceCase(item.productName),
      sku: item.sku,
      barcode: item.barcode,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice || 0),
      lineTotal: Number(item.lineTotal || 0),
      grossTotal: Number(item.grossTotal || item.lineTotal || 0),
      discountAmount: Number(item.discountAmount || 0),
      preVat: Number(item.preVat || 0),
      taxAmount: Number(item.taxAmount || 0),
      taxRate: Number(item.taxRate || taxRate || 0),
      taxCode: item.taxCode || taxCodeForRate(item.taxRate ?? taxRate)
    }))
  };
}
