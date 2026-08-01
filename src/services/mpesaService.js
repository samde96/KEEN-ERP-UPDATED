import { apiClient } from './apiClient';

const liveOnly = () => ({ __disableOfflineQueue: true, __disableOfflineCache: true });

export const mpesaService = {
  async initiateStkPush({ phoneNumber, amount, accountReference }) {
    const response = await apiClient.post(
      '/mpesa/stk/push',
      {
        phoneNumber,
        amount,
        accountReference
      },
      liveOnly()
    );
    return response.data;
  },

  async queryStk(checkoutRequestId) {
    const response = await apiClient.post(`/mpesa/stk/query/${encodeURIComponent(checkoutRequestId)}`, {}, liveOnly());
    return response.data;
  },

  async status(checkoutRequestId) {
    const response = await apiClient.get(`/mpesa/stk/status/${encodeURIComponent(checkoutRequestId)}`, liveOnly());
    return response.data;
  }
};
