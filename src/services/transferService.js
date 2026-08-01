import { apiClient } from './apiClient';

export const transferService = {
  async requests() {
    const response = await apiClient.get('/stock-requests');
    return response.data || [];
  },

  async createRequest(request) {
    const response = await apiClient.post('/stock-requests', request);
    return response.data;
  },

  async updateRequestStatus(id, status, reviewedBy) {
    const response = await apiClient.patch(`/stock-requests/${id}/status`, { status, reviewedBy });
    return response.data;
  },

  async dispatchFromOperation(response) {
    if (response?.dispatch?.transfer) {
      return response.dispatch;
    }

    if (response?.transferNumber) {
      return transferService.getTransfer(response.transferNumber);
    }

    return null;
  },

  async transfers() {
    const response = await apiClient.get('/stock-transfers');
    return response.data || [];
  },

  async discrepancies() {
    const response = await apiClient.get('/stock-transfers/discrepancies');
    return response.data || [];
  },

  async createTransfer(transfer) {
    const response = await apiClient.post('/stock-transfers', transfer);
    return response.data;
  },

  async receiveTransfer(transferNumber, receipt = {}) {
    const payload = receipt.receivedQuantities || receipt.damagedQuantities
      ? receipt
      : { receivedQuantities: receipt };
    const response = await apiClient.post(`/stock-transfers/${transferNumber}/receive`, {
      receivedQuantities: payload.receivedQuantities || {},
      damagedQuantities: payload.damagedQuantities || {}
    });
    return response.data;
  },

  async resolveDiscrepancy(transferNumber) {
    const response = await apiClient.post(`/stock-transfers/${transferNumber}/resolve-discrepancy`);
    return response.data;
  },

  async getTransfer(id) {
    const response = await apiClient.get(`/stock-transfers/${id}`);
    return response.data || { transfer: null, lines: [] };
  }
};
