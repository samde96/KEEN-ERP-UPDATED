import { apiClient } from './apiClient';

const paymentMethodMap = {
  Cash: 'CASH',
  'M-Pesa': 'MPESA',
  Card: 'CARD',
  'Split Payment': 'SPLIT_PAYMENT'
};

export const returnService = {
  async list() {
    const response = await apiClient.get('/returns');
    return response.data || [];
  },

  async create(payload) {
    const response = await apiClient.post('/returns', {
      ...payload,
      refundMethod: paymentMethodMap[payload.refundMethod] || payload.refundMethod
    });
    return response.data;
  },

  async approve(id, managerName) {
    const response = await apiClient.patch(`/returns/${id}/approve`, { managerName });
    return response.data;
  },

  async reject(id, managerName) {
    const response = await apiClient.patch(`/returns/${id}/reject`, { managerName });
    return response.data;
  }
};
