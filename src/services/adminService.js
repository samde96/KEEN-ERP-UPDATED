import { apiClient } from './apiClient';

export const adminService = {
  async users() {
    const response = await apiClient.get('/users');
    return response.data || [];
  },

  async saveUser(user) {
    const payload = {
      name: user.name,
      email: user.email,
      password: user.password || null,
      roles: user.roles || [],
      locationIds: user.locationIds || [],
      status: user.status || 'ACTIVE'
    };

    if (user.id) {
      const response = await apiClient.put(`/users/${user.id}`, payload);
      return response.data;
    }

    const response = await apiClient.post('/users', payload);
    return response.data;
  },

  async deleteUser(userId) {
    const response = await apiClient.delete(`/users/${userId}`, {
      __disableOfflineQueue: true
    });
    return response.data;
  },

  async roles() {
    const response = await apiClient.get('/roles');
    return response.data || [];
  },

  async saveRole(role) {
    const payload = {
      name: role.name,
      displayName: role.displayName,
      permissionNames: role.permissionNames || role.permissions || []
    };

    if (role.id) {
      const response = await apiClient.put(`/roles/${role.id}`, payload);
      return response.data;
    }

    const response = await apiClient.post('/roles', payload);
    return response.data;
  },

  async permissions() {
    const response = await apiClient.get('/permissions');
    return response.data || [];
  },

  async savePermission(permission) {
    const payload = {
      name: permission.name,
      description: permission.description
    };

    if (permission.id) {
      const response = await apiClient.put(`/permissions/${permission.id}`, payload);
      return response.data;
    }

    const response = await apiClient.post('/permissions', payload);
    return response.data;
  }
};
