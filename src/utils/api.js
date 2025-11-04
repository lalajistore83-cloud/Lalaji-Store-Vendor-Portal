// API utilities for vendor portal
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function to make authenticated requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage directly to avoid circular dependency
  const token = localStorage.getItem('vendor_token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Handle token expiration
    if (response.status === 401) {
      // Clear auth data
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('vendor_user');
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Dashboard APIs
export const getDashboardData = async () => {
  return apiRequest('/vendor/dashboard');
};

export const getVendorStats = async () => {
  return apiRequest('/vendor/stats');
};

// Product APIs
export const getProducts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/vendor/products${queryString ? `?${queryString}` : ''}`);
};

export const getProduct = async (id) => {
  return apiRequest(`/vendor/products/${id}`);
};

export const addProduct = async (productData) => {
  return apiRequest('/vendor/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
};

export const updateProduct = async (id, productData) => {
  return apiRequest(`/vendor/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
};

export const deleteProduct = async (id) => {
  return apiRequest(`/vendor/products/${id}`, {
    method: 'DELETE',
  });
};

// Order APIs
export const getOrders = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/vendor/orders${queryString ? `?${queryString}` : ''}`);
};

export const getOrder = async (id) => {
  return apiRequest(`/vendor/orders/${id}`);
};

export const updateOrderStatus = async (id, status) => {
  return apiRequest(`/vendor/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

// Inventory APIs
export const getInventory = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/vendor/inventory${queryString ? `?${queryString}` : ''}`);
};

export const updateStock = async (productId, stockData) => {
  return apiRequest(`/vendor/inventory/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(stockData),
  });
};

export const addStockMovement = async (movementData) => {
  return apiRequest('/vendor/inventory/movements', {
    method: 'POST',
    body: JSON.stringify(movementData),
  });
};

export const getStockMovements = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/vendor/inventory/movements${queryString ? `?${queryString}` : ''}`);
};

// Wallet & Payment APIs
export const getWalletData = async () => {
  return apiRequest('/vendor/wallet');
};

export const getTransactions = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/vendor/wallet/transactions${queryString ? `?${queryString}` : ''}`);
};

export const requestPayout = async (amount) => {
  return apiRequest('/vendor/wallet/payout', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
};

export const getPayouts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/vendor/wallet/payouts${queryString ? `?${queryString}` : ''}`);
};

// Analytics APIs
export const getAnalytics = async (timeRange = '7d') => {
  return apiRequest(`/vendor/analytics?range=${timeRange}`);
};

export const getSalesReport = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/vendor/analytics/sales${queryString ? `?${queryString}` : ''}`);
};

export const getProductAnalytics = async (productId, timeRange = '30d') => {
  return apiRequest(`/vendor/analytics/products/${productId}?range=${timeRange}`);
};

// Profile APIs
export const getVendorProfile = async () => {
  return apiRequest('/vendor/profile');
};

export const updateVendorProfile = async (profileData) => {
  return apiRequest('/vendor/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  
  return apiRequest('/vendor/profile/photo', {
    method: 'POST',
    headers: {
      // Remove Content-Type to let browser set it with boundary for FormData
      'Authorization': `Bearer ${auth.getToken()}`,
    },
    body: formData,
  });
};

export const uploadDocument = async (type, file) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('type', type);
  
  return apiRequest('/vendor/profile/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${auth.getToken()}`,
    },
    body: formData,
  });
};

// Category APIs
export const getCategories = async () => {
  return apiRequest('/vendor/categories');
};

// Notification APIs
export const getNotifications = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/vendor/notifications${queryString ? `?${queryString}` : ''}`);
};

export const markNotificationRead = async (id) => {
  return apiRequest(`/vendor/notifications/${id}/read`, {
    method: 'PUT',
  });
};

export const markAllNotificationsRead = async () => {
  return apiRequest('/vendor/notifications/read-all', {
    method: 'PUT',
  });
};

// Settings APIs
export const getSettings = async () => {
  return apiRequest('/vendor/settings');
};

export const updateSettings = async (settings) => {
  return apiRequest('/vendor/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};

// Reports APIs
export const downloadReport = async (type, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(
    `${API_BASE_URL}/vendor/reports/${type}${queryString ? `?${queryString}` : ''}`,
    {
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to download report');
  }

  return response.blob();
};

// Utility functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Error handling helper
export const handleApiError = (error) => {
  if (error.message.includes('401')) {
    auth.logout();
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }
  
  if (error.message.includes('403')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.message.includes('404')) {
    return 'The requested resource was not found.';
  }
  
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred.';
};

export default {
  getDashboardData,
  getVendorStats,
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrder,
  updateOrderStatus,
  getInventory,
  updateStock,
  addStockMovement,
  getStockMovements,
  getWalletData,
  getTransactions,
  requestPayout,
  getPayouts,
  getAnalytics,
  getSalesReport,
  getProductAnalytics,
  getVendorProfile,
  updateVendorProfile,
  uploadProfilePhoto,
  uploadDocument,
  getCategories,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getSettings,
  updateSettings,
  downloadReport,
  formatCurrency,
  formatDate,
  formatDateTime,
  handleApiError,
};
