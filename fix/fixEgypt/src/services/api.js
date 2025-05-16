import axios from 'axios';

// Create base API configuration
const API_URL = window.env?.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const createApiClient = (options = {}) => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  // Request interceptor for auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Handle token expiration
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const refreshResponse = await client.post('/auth/refresh-token');
          const { token } = refreshResponse.data;
          
          // Save the new token
          localStorage.setItem('token', token);
          
          // Update the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return client(originalRequest);
        } catch (refreshError) {
          // If refresh fails, logout the user
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Default API client
const apiClient = createApiClient();

// Resource factory creates CRUD API methods for a resource
const createResource = (resource) => ({
  getAll: (params) => apiClient.get(`/${resource}`, { params }),
  getOne: (id) => apiClient.get(`/${resource}/${id}`),
  create: (data, config) => apiClient.post(`/${resource}`, data, config),
  update: (id, data) => apiClient.put(`/${resource}/${id}`, data),
  patch: (id, data) => apiClient.patch(`/${resource}/${id}`, data),
  remove: (id) => apiClient.delete(`/${resource}/${id}`),
});

// API resources
export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  refreshToken: () => apiClient.post('/auth/refresh-token'),
  verifyEmail: (token) => apiClient.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => 
    apiClient.post('/auth/reset-password', { token, newPassword }),
};

export const reportsApi = {
  ...createResource('reports'),
  getUserReports: () => apiClient.get('/reports/user'),
  uploadImage: (formData) => 
    apiClient.post('/reports/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  createWithFiles: (reportData) => 
    apiClient.post('/reports', reportData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const usersApi = {
  ...createResource('users'),
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (userData) => apiClient.put('/users/profile', userData),
};

export const adminApi = {
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  getUser: (id) => apiClient.get(`/admin/users/${id}`),
  updateUser: (id, userData) => apiClient.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
  getReports: (params) => apiClient.get('/admin/reports', { params }),
  updateReportStatus: (id, statusData) => 
    apiClient.patch(`/admin/reports/${id}/status`, statusData),
};

export const pointsApi = {
  getUserPoints: () => apiClient.get('/points/my-points'),
  getPointsHistory: () => apiClient.get('/points/history'),
};

export const productsApi = {
  ...createResource('products'),
};

export const redemptionsApi = {
  ...createResource('redemptions'),
  getUserRedemptions: () => apiClient.get('/redemptions/my-redemptions'),
};

export default apiClient; 