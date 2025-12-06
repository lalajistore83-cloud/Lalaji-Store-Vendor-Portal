// Category API utilities for vendor portal
import { auth } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL 

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

// Get all categories
export const getCategories = async () => {
  console.log('getCategories called');

  const response = await apiRequest('/categories/');

  console.log('getCategories response:', response);

  return response;
};

// Get subcategories for a specific category
export const getSubcategories = async (categoryId) => {
  console.log('getSubcategories called with categoryId:', categoryId);

  if (!categoryId) {
    console.warn('getSubcategories called without categoryId');
    return { success: false, data: [] };
  }

  const response = await apiRequest(`/categories/${categoryId}/subcategories`);

  console.log('getSubcategories response:', response);

  return response;
};

export default {
  getCategories,
  getSubcategories,
};
