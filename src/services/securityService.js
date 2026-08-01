import { apiClient } from './apiClient';

export const securityService = {
  async theftIncidents() {
    const response = await apiClient.get('/rfid/incidents');
    return response.data || [];
  },

  async reportRfidIncident(incident) {
    const response = await apiClient.post('/rfid/incidents', {
      tagOrBarcode: incident.tagOrBarcode,
      locationId: incident.locationId,
      quantity: Number(incident.quantity || 1),
      detectionMethod: incident.detectionMethod || 'RFID_EXIT_GATE',
      responsibleUser: incident.responsibleUser || '',
      notes: incident.notes || '',
      authorized: Boolean(incident.authorized)
    });
    return response.data;
  },

  async updateIncidentStatus(id, status, details = {}) {
    const response = await apiClient.patch(`/rfid/incidents/${id}/status`, {
      status,
      reviewedBy: details.reviewedBy || '',
      notes: details.notes || ''
    });
    return response.data;
  },

  async sendTestEmail() {
    const response = await apiClient.post('/notifications/test-email');
    return response.data;
  },

  async notificationEmailSettings() {
    const response = await apiClient.get('/notifications/email-settings');
    return response.data || { recipientEmails: [] };
  },

  async saveNotificationEmailSettings(settings) {
    const response = await apiClient.put('/notifications/email-settings', {
      recipientEmails: settings.recipientEmails || []
    });
    return response.data;
  }
};
