import { apiClient } from './apiClient';

export const auditService = {
  async logs() {
    const response = await apiClient.get('/audit-logs');
    return response.data || [];
  }
};
