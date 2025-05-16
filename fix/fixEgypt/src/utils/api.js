import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://racial-imogen-zeyad-d557eeac.koyeb.app/api', 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Use axios directly to avoid interceptors loop
        const refreshResponse = await axios.post(
          `${originalRequest.baseURL || 'https://racial-imogen-zeyad-d557eeac.koyeb.app/api'}/auth/refresh-token`, 
          { refreshToken }
        );
        
        if (refreshResponse.data?.data?.tokens) {
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data.tokens;
          
          // Update tokens in localStorage
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update Authorization header and retry the request
          api.defaults.headers.Authorization = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          return api(originalRequest);
        } else {
          throw new Error('Invalid refresh token response');
        }
      } catch (refreshError) {
        // If refresh fails, log out the user
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Generic API request handler with error handling
 * @param {Function} apiCall - The API call function to execute
 * @returns {Promise} - The processed response or error
 */
export const sendRequest = async (apiCall) => {
  try {
    const response = await apiCall();
    console.log('API Raw Response:', response.data);
    
    // Safety check for response data
    if (!response || !response.data) {
      console.error('Invalid API response:', response);
      return {
        data: null,
        error: { message: 'Invalid response from server' },
        success: false
      };
    }
    
    // Handle different response formats
    // Some API responses use 'success' flag, others use status='success'
    if (response.data.status === 'success' || response.data.success) {
      // Extract the response data
      let processedData = null;
      
      // Try to handle all possible response formats
      if (typeof response.data.data === 'object') {
        // Normal structure with data property containing object
        processedData = response.data.data;
      } else if (response.data.data === undefined && typeof response.data === 'object') {
        // Structure without a data property, use the response data itself
        // But make sure to exclude status, message, etc.
        const rest = {...response.data};
        // Remove properties we don't want to include in the data
        delete rest.status;
        delete rest.message;
        delete rest.success;
        
        processedData = Object.keys(rest).length > 0 ? rest : null;
      }
      
      return {
        data: processedData || response.data,
        error: null,
        success: true,
        status: response.data.status,
        message: response.data.message
      };
    } else {
      // If neither success format is found, still return the response 
      // but mark success as false
      return {
        data: response.data.data || response.data,
        error: {
          message: response.data.message || 'API returned an unsuccessful response',
          details: response.data.error || response.data.errors
        },
        success: false,
        status: response.data.status
      };
    }
  } catch (error) {
    console.error('API request error:', error.response?.data || error.message);
    return {
      data: null,
      error: {
        message: error.response?.data?.message || error.message || 'An error occurred',
        status: error.response?.status,
        details: error.response?.data?.errors,
      },
      success: false,
    };
  }
};

// Authentication API endpoints
export const authAPI = {
  login: (credentials) => {
    console.log('Login request with credentials:', { email: credentials.email, passwordProvided: !!credentials.password });
    return sendRequest(async () => {
      try {
        const response = await api.post('/auth/login', credentials);
        console.log('Raw login response:', response.data);
        return response;
      } catch (error) {
        console.error('Login request failed:', error.response?.data || error.message);
        throw error;
      }
    });
  },
  register: (userData) => sendRequest(() => api.post('/auth/register', userData)),
  logout: (refreshToken) => sendRequest(() => api.post('/auth/logout', { refreshToken })),
  verifyEmail: (token) => sendRequest(() => api.get(`/auth/verify-email/${token}`)),
  forgotPassword: (email) => sendRequest(() => api.post('/auth/forgot-password', { email })),
  resetPassword: (token, password) => sendRequest(() => api.post(`/auth/reset-password/${token}`, { password })),
  refreshToken: (refreshToken) => sendRequest(() => api.post('/auth/refresh-token', { refreshToken })),
};

// User API endpoints
export const userAPI = {
  getProfile: () => sendRequest(() => api.get('/users/profile')),
  updateProfile: (userData) => sendRequest(() => api.patch('/users/profile', userData)),
  changePassword: (passwordData) => sendRequest(() => api.post('/users/change-password', passwordData)),
  deleteAccount: (password) => sendRequest(() => api.delete('/users/account', { data: { password } })),
  getAllUsers: () => sendRequest(() => api.get('/users')),
};

// Report API endpoints
export const reportAPI = {
  createReport: (formData) => {
    console.log('============ API CREATEREPORT DEBUG ============');
    console.log('FormData received:', formData);
    
    // Log authentication info (without showing the actual token)
    const hasToken = !!localStorage.getItem('token');
    console.log('Authentication:', hasToken ? 'User has token' : 'No token found');
    
    // Debug the location data specifically
    const locationData = formData.get('location');
    console.log('Location data from formData:', locationData);
    
    // Check if userId was provided
    const userId = formData.get('userId');
    console.log('User ID from formData:', userId);
    
    // Check if it's a valid JSON string
    try {
      if (locationData && typeof locationData === 'string') {
        const parsedLocation = JSON.parse(locationData);
        console.log('Successfully parsed location data:', parsedLocation);
      }
    } catch (e) {
      console.error('Error parsing location data:', e);
    }
    
    const config = { 
      headers: { 
        'Content-Type': 'multipart/form-data'
      }
    };
    
    // Add Authorization header from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API config:', config);
    
    return sendRequest(() => api.post('/reports', formData, config));
  },
  getReports: (params) => {
    console.log('Fetching reports with params:', params);
    return sendRequest(async () => {
      try {
        const response = await api.get('/reports', { params });
        console.log('Raw reports response:', response.data);
        return response;
      } catch (error) {
        console.error('Reports fetch failed:', error.response?.data || error.message);
        throw error;
      }
    });
  },
  getReportById: (id) => sendRequest(() => api.get(`/reports/${id}`)),
  updateReport: (id, reportData) => sendRequest(() => api.patch(`/reports/${id}`, reportData)),
  deleteReport: (id) => sendRequest(() => api.delete(`/reports/${id}`)),
  addImagesToReport: (id, formData) => {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    return sendRequest(() => api.post(`/reports/${id}/images`, formData, config));
  },
  getUserReports: (params) => sendRequest(() => api.get('/users/reports', { params })),
  getReportStatistics: () => sendRequest(() => api.get('/reports/statistics')),
  getNearbyReports: (params) => sendRequest(() => api.get('/reports/nearby', { params })),
  updateReportStatus: (id, status, note) => {
    // Validate the ID before sending the request
    if (!id) {
      console.error('Error: Report ID is undefined or null in updateReportStatus');
      return Promise.resolve({
        success: false,
        error: { message: 'Invalid report ID' }
      });
    }
    return sendRequest(() => api.patch(`/reports/${id}/status`, { status, note }));
  },
};

// Admin API endpoints
export const adminAPI = {
  // Users management
  getUsers: (params) => sendRequest(() => api.get('/admin/users', { params })),
  getUserById: (id) => sendRequest(() => api.get(`/admin/users/${id}`)),
  updateUser: (id, userData) => sendRequest(() => api.patch(`/admin/users/${id}`, userData)),
  verifyUser: (id) => sendRequest(() => api.patch(`/admin/users/${id}/verify`)),
  updateUserRole: (id, roleData) => sendRequest(() => api.patch(`/admin/users/${id}/role`, roleData)),
  deleteUser: (id) => sendRequest(() => api.delete(`/admin/users/${id}`)),
  
  // Reports management - using the regular reports endpoints
  getReports: (params) => sendRequest(() => api.get('/reports', { params })),
  getPendingReports: (params) => sendRequest(() => api.get('/reports', { params: { ...params, status: 'pending' } })),
  updateReportStatus: (id, statusData) => {
    // Validate and normalize the ID before sending the request
    if (!id) {
      console.error('Error: Report ID is undefined or null in admin.updateReportStatus');
      return Promise.resolve({
        success: false,
        error: { message: 'Invalid report ID' }
      });
    }
    
    // Handle different ID formats - could be _id or id
    const reportId = typeof id === 'object' ? 
      (id.id || id._id || null) : 
      id;
    
    if (!reportId) {
      console.error('Could not extract valid ID from:', id);
      return Promise.resolve({
        success: false,
        error: { message: 'Could not extract valid report ID' }
      });
    }
    
    console.log(`Sending report status update for ID: ${reportId}`);
    return sendRequest(() => api.patch(`/admin/reports/${reportId}/status`, statusData));
  },
  
  // Dashboard
  getDashboardStats: () => sendRequest(() => api.get('/admin/dashboard')),
  
  // Analytics
  getAnalytics: (params) => sendRequest(() => api.get('/admin/analytics', { params })),
  
  // Products - reuse from productAPI with admin prefix
  getProducts: (params) => sendRequest(() => api.get('/products', { params })),
  getProductById: (id) => sendRequest(() => api.get(`/products/${id}`)),
  createProduct: (productData) => sendRequest(() => api.post('/products', productData)),
  updateProduct: (id, productData) => sendRequest(() => api.patch(`/products/${id}`, productData)),
  deleteProduct: (id) => sendRequest(() => api.delete(`/products/${id}`)),
  
  // Redemptions - reuse from redemptionAPI with admin prefix
  getRedemptions: (params) => sendRequest(() => api.get('/redemptions', { params })),
  getRedemptionById: (id) => sendRequest(() => api.get(`/redemptions/${id}`)),
  updateRedemption: (id, redemptionData) => {
    // Validate the ID before sending the request
    if (!id) {
      console.error('Error: Redemption ID is undefined or null in updateRedemption');
      return Promise.resolve({
        success: false,
        error: { message: 'Invalid redemption ID' }
      });
    }
    return sendRequest(() => api.patch(`/redemptions/${id}/status`, redemptionData));
  },
  getRedemptionStatistics: () => sendRequest(() => api.get('/redemptions/statistics')),
};

export default api; 