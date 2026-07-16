import { apiClient } from './apiClient';

const paymentMethodMap = {
  Cash: 'CASH',
  'M-Pesa': 'MPESA',
  Card: 'CARD',
  'Split Payment': 'SPLIT_PAYMENT'
};

export const posService = {
  async checkout({ locationId, cashierName, customerName, customerPhone, paymentMethod, paymentReference, discountAmount, amountTendered, items }) {
    const response = await apiClient.post('/pos/checkout', {
      locationId,
      cashierName,
      customerName,
      customerPhone,
      paymentMethod: paymentMethodMap[paymentMethod] || paymentMethod,
      paymentReference,
      discountAmount,
      amountTendered,
      items
    });

    return response.data;
  },

  async receiptSettings() {
    const response = await apiClient.get('/pos/receipt-settings');
    return response.data;
  },

  async saveReceiptSettings(settings) {
    const response = await apiClient.put('/pos/receipt-settings', {
      businessName: settings.businessName,
      branchAddress: settings.branchAddress || '',
      taxLabel: settings.taxLabel || 'VAT',
      taxRegistrationNumber: settings.taxRegistrationNumber || '',
      tillNumber: settings.tillNumber || '',
      controlUnitName: settings.controlUnitName || '',
      controlUnitSerial: settings.controlUnitSerial || '',
      controlUnitUrl: settings.controlUnitUrl || '',
      taxRate: Number(settings.taxRate || 0),
      pointsEnabled: Boolean(settings.pointsEnabled),
      pointsPerCurrencyUnit: Number(settings.pointsPerCurrencyUnit || 0),
      receiptFooter: settings.receiptFooter || ''
    });
    return response.data;
  }
};
