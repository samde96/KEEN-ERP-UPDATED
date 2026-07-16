import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';

export function buildTransferReceipt(transfer, lines = []) {
  return {
    title: 'Transfer Receipt',
    number: transfer.receiptNo,
    reference: transfer.transferNumber || transfer.id,
    source: transfer.source,
    destination: transfer.destination,
    status: transfer.status,
    issuedAt: formatDate(transfer.sentAt),
    total: formatCurrency(transfer.value),
    parties: [
      { label: 'Store Manager', value: transfer.manager },
      { label: 'Shop Manager', value: transfer.shopManager },
      { label: 'Attendant', value: transfer.attendant }
    ],
    lines
  };
}

const paymentLabels = {
  CASH: 'Cash',
  MPESA: 'M-Pesa',
  CARD: 'Card',
  SPLIT_PAYMENT: 'Split Payment'
};

function buildQrPayload(checkout) {
  const payload = {
    type: 'SALE_RECEIPT',
    receiptNumber: checkout.receiptNumber,
    businessName: checkout.businessName || 'Keen Stores',
    branch: checkout.branch,
    soldAt: checkout.soldAt,
    tillNumber: checkout.tillNumber || '',
    taxRegistrationNumber: checkout.taxRegistrationNumber || '',
    controlUnitSerial: checkout.controlUnitSerial || '',
    totalAmount: Number(checkout.totalAmount || 0).toFixed(2),
    taxAmount: Number(checkout.taxAmount || 0).toFixed(2)
  };

  if (checkout.controlUnitUrl) {
    try {
      const url = new URL(checkout.controlUnitUrl);
      url.searchParams.set('receipt', payload.receiptNumber || '');
      url.searchParams.set('total', payload.totalAmount);
      url.searchParams.set('tax', payload.taxAmount);
      url.searchParams.set('date', payload.soldAt || '');
      if (payload.controlUnitSerial) url.searchParams.set('cu', payload.controlUnitSerial);
      if (payload.taxRegistrationNumber) url.searchParams.set('pin', payload.taxRegistrationNumber);
      return url.toString();
    } catch {
      return JSON.stringify(payload);
    }
  }

  return JSON.stringify(payload);
}

export function buildPosReceipt(checkout) {
  const taxRate = Number(checkout.taxRate || 0);
  const totalAmount = Number(checkout.totalAmount || 0);
  const taxAmount = Number(checkout.taxAmount || 0);
  const preVat = Math.max(totalAmount - taxAmount, 0);
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
    customerPhone: checkout.customerPhone,
    paymentMethod: paymentLabels[checkout.paymentMethod] || checkout.paymentMethod,
    issuedAt: formatDate(checkout.soldAt),
    rawIssuedAt: checkout.soldAt,
    taxLabel: checkout.taxLabel || 'VAT',
    taxRegistrationNumber: checkout.taxRegistrationNumber,
    tillNumber: checkout.tillNumber,
    controlUnitName: checkout.controlUnitName,
    controlUnitSerial: checkout.controlUnitSerial,
    controlUnitUrl: checkout.controlUnitUrl,
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
    taxRows: [
      {
        code: taxRate > 0 ? 'G' : 'A',
        rate: taxRate,
        preVat,
        vat: taxAmount,
        total: totalAmount
      }
    ],
    rewardedDiscounts: discount > 0 ? [{ item: 'Sale discount', amount: discount }] : [],
    lines: (checkout.items || []).map((item) => ({
      product: item.productName,
      sku: item.sku,
      barcode: item.barcode,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice || 0),
      lineTotal: Number(item.lineTotal || 0),
      taxCode: taxRate > 0 ? 'G' : 'A'
    }))
  };
}
