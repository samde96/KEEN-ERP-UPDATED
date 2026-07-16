import { apiClient } from './apiClient';

export const catalogService = {
  async locations() {
    const response = await apiClient.get('/locations');
    return response.data || [];
  },

  async saveLocation(location) {
    const payload = {
      name: location.name,
      type: location.type,
      managerName: location.managerName || location.manager,
      active: location.active ?? location.status !== 'Inactive'
    };

    if (location.id) {
      const response = await apiClient.put(`/locations/${location.id}`, payload);
      return response.data;
    }

    const response = await apiClient.post('/locations', payload);
    return response.data;
  },

  async categories() {
    const response = await apiClient.get('/categories');
    return response.data || [];
  },

  async saveCategory(category) {
    const payload = {
      name: category.name,
      status: category.status || 'Active'
    };

    if (category.id) {
      const response = await apiClient.put(`/categories/${category.id}`, payload);
      return response.data;
    }

    const response = await apiClient.post('/categories', payload);
    return response.data;
  },

  async suppliers() {
    const response = await apiClient.get('/suppliers');
    return response.data || [];
  },

  async saveSupplier(supplier) {
    const payload = {
      name: supplier.name,
      contact: supplier.contact,
      leadTime: supplier.leadTime,
      status: supplier.status || 'Active'
    };

    if (supplier.id) {
      const response = await apiClient.put(`/suppliers/${supplier.id}`, payload);
      return response.data;
    }

    const response = await apiClient.post('/suppliers', payload);
    return response.data;
  }
};
