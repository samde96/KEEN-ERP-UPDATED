import { apiClient } from './apiClient';

function authErrorMessage(error, fallback) {
  return error.response?.data?.detail || error.response?.data?.message || error.message || fallback;
}

function responseMessage(response, fallback) {
  return response.data?.message || fallback;
}

export const authService = {
  async session() {
    try {
      const response = await apiClient.get('/auth/session', {
        __disableOfflineCache: true
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  async login({ email, password }) {
    const normalizedEmail = email?.trim().toLowerCase();
    let response;

    try {
      response = await apiClient.post('/auth/login', {
        email: normalizedEmail,
        password
      });
    } catch (error) {
      const message = authErrorMessage(error, 'Unable to sign in. Check your credentials and try again.');
      throw new Error(message);
    }

    return response.data;
  },

  async completeMfaLogin({ email, code, rememberDevice }) {
    try {
      const response = await apiClient.post('/auth/login/mfa', {
        email: email?.trim().toLowerCase(),
        code,
        rememberDevice: Boolean(rememberDevice)
      });
      return response.data;
    } catch (error) {
      const message = authErrorMessage(error, 'Unable to verify the code. Check it and try again.');
      throw new Error(message);
    }
  },

  async forgotPassword({ email }) {
    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: email?.trim().toLowerCase()
      });
      return responseMessage(response, 'If the email is registered, password reset instructions have been sent.');
    } catch (error) {
      throw new Error(authErrorMessage(error, 'Unable to request password reset. Try again.'));
    }
  },

  async resetPassword({ token, password }) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        password
      });
      return responseMessage(response, 'Password updated. You can sign in with the new password.');
    } catch (error) {
      throw new Error(authErrorMessage(error, 'Unable to reset password. The link may be invalid or expired.'));
    }
  },

  async requestMfaCode({ email }) {
    try {
      const response = await apiClient.post('/auth/mfa/request', {
        email: email?.trim().toLowerCase()
      });
      return responseMessage(response, 'If the email is registered, a verification code has been sent.');
    } catch (error) {
      throw new Error(authErrorMessage(error, 'Unable to request verification code. Try again.'));
    }
  },

  async verifyMfaCode({ email, code }) {
    try {
      const response = await apiClient.post('/auth/mfa/verify', {
        email: email?.trim().toLowerCase(),
        code
      });
      return responseMessage(response, 'MFA verification completed.');
    } catch (error) {
      throw new Error(authErrorMessage(error, 'Unable to verify the code. Check it and try again.'));
    }
  },

  async logout() {
    try {
      const response = await apiClient.post('/auth/logout', null, {
        __disableOfflineQueue: true
      });
      return responseMessage(response, 'Signed out.');
    } catch {
      return 'Signed out.';
    }
  }
};
