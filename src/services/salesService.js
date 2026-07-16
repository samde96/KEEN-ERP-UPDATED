import { apiClient } from './apiClient';

export const salesService = {
  async cashierActivity() {
    const response = await apiClient.get('/sales/cashier-shifts');
    return response.data || [];
  },

  async cashierSummary({ locationId, cashierName }) {
    if (!locationId || !cashierName) {
      return null;
    }

    const response = await apiClient.get('/sales/cashier-summary', {
      params: { locationId, cashierName }
    });
    return response.data;
  },

  async openShift({ locationId, cashierName, terminalCode, openingCash }) {
    const response = await apiClient.post('/sales/cashier-shifts/open', {
      locationId,
      cashierName,
      terminalCode,
      openingCash: Number(openingCash || 0)
    });
    return response.data;
  },

  async closeShift({ locationId, cashierName, cashCounted }) {
    const response = await apiClient.post('/sales/cashier-shifts/close', {
      locationId,
      cashierName,
      cashCounted: Number(cashCounted || 0)
    });
    return response.data;
  }
};
