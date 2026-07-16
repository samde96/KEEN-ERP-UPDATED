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

  async roles() {
    const response = await apiClient.get('/roles');
    return response.data || [];
  }
};
