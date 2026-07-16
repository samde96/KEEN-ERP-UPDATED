import { apiClient } from './apiClient';

export const inventoryService = {
  async balances() {
    const response = await apiClient.get('/inventory/balances');
    return response.data || [];
  },

  async ledger() {
    const response = await apiClient.get('/inventory/ledger');
    return response.data || [];
  },

  async receiveStock(stock) {
    const response = await apiClient.post('/inventory/receive-stock', stock);
    return response.data;
  },

  async receiveStockBatch(receipt) {
    const response = await apiClient.post('/inventory/receive-stock/batch', receipt);
    return response.data;
  },

  async writeOffDamagedGoods(balanceId, writeOff) {
    const response = await apiClient.post(`/inventory/damaged-goods/${balanceId}/write-off`, {
      quantity: Number(writeOff.quantity || 0),
      reason: writeOff.reason || ''
    });
    return response.data;
  },

  async deliveries() {
    const response = await apiClient.get('/inventory/deliveries');
    return response.data || [];
  }
};
