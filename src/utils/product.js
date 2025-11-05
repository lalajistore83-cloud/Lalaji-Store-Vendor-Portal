// Product API utilities for vendor portal
import { auth } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.lalajistore.com/api';

// Helper function to make authenticated requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from auth service
  const token = auth.getToken();

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
      auth.logout();
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

// Get vendor products directly created by vendor (via /vendor/products endpoint)
// This endpoint gets products created by the vendor using req.user.id from JWT token
// Backend response structure: { success: true, count, total, pagination: { page, pages }, data: [...products] }
// Supports: page, limit, status, category, search
export const getVendorProducts = async (params = {}) => {
  console.log('getVendorProducts called with params:', params);

  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryString = new URLSearchParams(filteredParams).toString();
  const endpoint = `/vendor/products${queryString ? `?${queryString}` : ''}`;

  console.log('Fetching from endpoint:', endpoint);

  const response = await apiRequest(endpoint);

  console.log('API Response:', response);

  return response;
};

// Get MY vendor products using authenticated user (my-products endpoint)
// This endpoint automatically gets vendor ID from req.user.id (JWT token)
// Backend response structure: { success: true, count, total, pagination: { page, pages }, data: [...vendorProducts] }
// Supports: page, limit, status, search
export const getMyVendorProducts = async (params = {}) => {
  console.log('getMyVendorProducts called with params:', params);

  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryString = new URLSearchParams(filteredParams).toString();
  const endpoint = `/vendor-products/my-products${queryString ? `?${queryString}` : ''}`;

  console.log('Fetching from endpoint:', endpoint);

  const response = await apiRequest(endpoint);

  console.log('API Response:', response);

  return response;
};

// Get products by vendor ID (VendorProduct model) - requires vendorId parameter
// Backend response structure: { success: true, count, total, pagination: { page, pages }, data: [...vendorProducts] }
export const getProductsByVendor = async (vendorId, params = {}) => {
  console.log('getProductsByVendor called with vendorId:', vendorId, 'params:', params);

  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryString = new URLSearchParams(filteredParams).toString();
  const endpoint = `/vendor-products/vendor/${vendorId}${queryString ? `?${queryString}` : ''}`;

  console.log('Fetching from endpoint:', endpoint);

  const response = await apiRequest(endpoint);

  console.log('API Response:', response);

  return response;
};

// Get single product by ID
export const getProduct = async (id) => {
  return apiRequest(`/vendor/products/${id}`);
};

// Add new product
export const addProduct = async (productData) => {
  console.log('addProduct called with:', productData);

  // Transform frontend data to backend format
  const backendData = {
    name: productData.name,
    description: productData.description,
    'pricing[sellingPrice]': parseFloat(productData.price),
    category: productData.category,
    sku: productData.sku,
    'weight[value]': productData.weight ? parseFloat(productData.weight) : undefined,
    'weight[unit]': 'kg' // Default unit
  };

  // Remove undefined values
  Object.keys(backendData).forEach(key => {
    if (backendData[key] === undefined) {
      delete backendData[key];
    }
  });

  console.log('Sending to backend:', backendData);

  const response = await apiRequest('/vendor/products', {
    method: 'POST',
    body: JSON.stringify(backendData),
  });

  console.log('addProduct response:', response);
  return response;
};

// Update existing product
export const updateProduct = async (id, productData) => {
  return apiRequest(`/vendor/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
};

// Delete product
export const deleteProduct = async (id) => {
  return apiRequest(`/vendor/products/${id}`, {
    method: 'DELETE',
  });
};

// Get available products for vendor to select (products not yet added to vendor's inventory)
// Backend response structure: { success: true, count, total, pagination: { page, pages }, data: [...products] }
// Supports: page, limit, category, subcategory, search, sortBy
export const getAvailableProducts = async (params = {}) => {
  console.log('getAvailableProducts called with params:', params);

  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryString = new URLSearchParams(filteredParams).toString();
  const endpoint = `/vendor-products/available${queryString ? `?${queryString}` : ''}`;

  console.log('Fetching from endpoint:', endpoint);

  const response = await apiRequest(endpoint);

  console.log('API Response:', response);

  return response;
};

// Select product (add to vendor's inventory)
// Requires: productId, stock, notes (optional)
// Response: { success: true, data: vendorProduct, message: '...' }
export const selectProduct = async (productData) => {
  console.log('selectProduct called with data:', productData);

  const response = await apiRequest('/vendor-products/select', {
    method: 'POST',
    body: JSON.stringify(productData),
  });

  console.log('selectProduct response:', response);

  return response;
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

export default {
  getVendorProducts,
  getMyVendorProducts,
  getProductsByVendor,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getAvailableProducts,
  selectProduct,
  formatCurrency,
  formatDate,
  formatDateTime,
};
