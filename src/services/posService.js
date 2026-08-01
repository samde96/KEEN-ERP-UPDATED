import { apiClient } from './apiClient';

const paymentMethodMap = {
  Cash: 'CASH',
  'M-Pesa': 'MPESA',
  Card: 'CARD',
  'Split Payment': 'SPLIT_PAYMENT'
};

function normalizeReceiptSettings(settings = {}) {
  return {
    ...settings,
    controlUnitInvoiceNumber: settings.controlUnitInvoiceNumber || settings.controlUnitUrl || ''
  };
}

export const posService = {
  async checkout({ locationId, cashierName, customerName, customerPhone, customerCardNumber, issueRewardsCard, paymentMethod, paymentReference, mpesaCheckoutRequestId, splitCashAmount, discountAmount, amountTendered, items }) {
    const response = await apiClient.post('/pos/checkout', {
      locationId,
      cashierName,
      customerName,
      customerPhone,
      customerCardNumber,
      issueRewardsCard: Boolean(issueRewardsCard),
      paymentMethod: paymentMethodMap[paymentMethod] || paymentMethod,
      paymentReference,
      mpesaCheckoutRequestId,
      splitCashAmount,
      discountAmount,
      amountTendered,
      items
    });

    return response.data;
  },

  async lookupCustomer({ cardNumber, phone }) {
    const response = await apiClient.get('/pos/customers/lookup', {
      params: {
        cardNumber: cardNumber || undefined,
        phone: phone || undefined
      }
    });
    return response.data;
  },

  async registerRewardCard({ cardNumber, customerName, customerPhone }) {
    const response = await apiClient.post(
      '/pos/customers/register',
      {
        cardNumber,
        customerName,
        customerPhone
      },
      { __disableOfflineQueue: true }
    );
    return response.data;
  },

  async receiptSettings() {
    const response = await apiClient.get('/pos/receipt-settings');
    return normalizeReceiptSettings(response.data);
  },

  async saveReceiptSettings(settings) {
    const controlUnitInvoiceNumber = settings.controlUnitInvoiceNumber || settings.controlUnitUrl || '';
    const response = await apiClient.put('/pos/receipt-settings', {
      businessName: settings.businessName,
      branchAddress: settings.branchAddress || '',
      taxLabel: settings.taxLabel || 'VAT',
      taxRegistrationNumber: settings.taxRegistrationNumber || '',
      pinNumber: settings.pinNumber || '',
      tillNumber: settings.tillNumber || '',
      controlUnitName: settings.controlUnitName || '',
      controlUnitSerial: settings.controlUnitSerial || '',
      controlUnitInvoiceNumber,
      controlUnitUrl: controlUnitInvoiceNumber,
      taxRate: Number(settings.taxRate || 0),
      pointsEnabled: Boolean(settings.pointsEnabled),
      pointsPerCurrencyUnit: Number(settings.pointsPerCurrencyUnit || 0),
      receiptFooter: settings.receiptFooter || ''
    });
    return normalizeReceiptSettings(response.data);
  }
};
