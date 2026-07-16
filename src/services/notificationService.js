import { apiClient } from './apiClient';

export const notificationService = {
  async list() {
    const response = await apiClient.get('/notifications');
    return response.data || [];
  }
};
