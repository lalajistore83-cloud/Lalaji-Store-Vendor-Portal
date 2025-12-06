// Dashboard API utility for vendor portal
import { auth } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL 
class DashboardService {
  constructor() {
    this.authService = auth;
  }

  // Get dashboard data
  async getDashboardData() {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/dashboard`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch dashboard data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      throw error;
    }
  }

  // Get vendor analytics
  async getAnalytics(period = '30') {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/analytics?period=${period}`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch analytics data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Analytics fetch error:', error);
      throw error;
    }
  }

  // Get vendor profile
  async getVendorProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/profile`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch vendor profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  // Get vendor products
  async getVendorProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/vendor/products${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch products');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Products fetch error:', error);
      throw error;
    }
  }

  // Get vendor orders
  async getVendorOrders(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/vendor/orders${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Orders fetch error:', error);
      throw error;
    }
  }

  // Get vendor earnings
  async getVendorEarnings() {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/earnings`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch earnings');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Earnings fetch error:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, deliveryBoyId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/orders/${orderId}/status`, {
        method: 'PUT',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify({ 
          status,
          ...(deliveryBoyId && { deliveryBoyId })
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  }

  // Add new product
  async addProduct(productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/products`, {
        method: 'POST',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add product');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Add product error:', error);
      throw error;
    }
  }

  // Update product
  async updateProduct(productId, productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/products/${productId}`, {
        method: 'PUT',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }

  // Update product stock
  async updateStock(productId, stockData) {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/products/${productId}/stock`, {
        method: 'PUT',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(stockData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update stock');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update stock error:', error);
      throw error;
    }
  }

  // Delete product
  async deleteProduct(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/products/${productId}`, {
        method: 'DELETE',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  }

  // Get delivery team
  async getDeliveryTeam() {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/delivery-team`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch delivery team');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delivery team fetch error:', error);
      throw error;
    }
  }

  // Get vendor payouts
  async getVendorPayouts(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/vendor/payouts${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payouts');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payouts fetch error:', error);
      throw error;
    }
  }

  // Get payout analytics
  async getPayoutAnalytics() {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/payouts/analytics`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payout analytics');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payout analytics fetch error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const dashboardService = new DashboardService();

export { dashboardService };
export default DashboardService;
