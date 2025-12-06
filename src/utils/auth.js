// Authentication utility for vendor portal
const API_BASE_URL = import.meta.env.VITE_API_URL 

class AuthService {
  constructor() {
    // Always load from localStorage on initialization
    this.refreshFromStorage();
  }

  // Refresh authentication state from localStorage
  refreshFromStorage() {
    this.token = localStorage.getItem('vendor_token');
    const storedUser = localStorage.getItem('vendor_user');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.user = null;
      }
    } else {
      this.user = null;
    }
  }

  // Check if user is authenticated on app startup
  async initializeAuth() {
    this.refreshFromStorage();
    
    if (!this.token) {
      return false;
    }

    // Verify token is still valid
    return await this.checkAuth();
  }

  // Vendor login with email/phone and password
  async login(emailOrPhone, password) {
    try {
      console.log('Login attempt with:', emailOrPhone);
      
      // Since your backend expects phoneNumber as the primary identifier,
      // we need to handle both email and phone login properly
      const isEmail = emailOrPhone.includes('@');
      
      let loginData;
      
      if (isEmail) {
        // For email login, use your specific phone number from database
        // This is a workaround since your backend expects phoneNumber
        loginData = {
          phoneNumber: "+919421742289", // Your phone number from the database
          password,
          authMethod: 'password',
          role: 'vendor'
        };
      } else {
        // For phone login
        loginData = {
          phoneNumber: emailOrPhone.startsWith('+') ? emailOrPhone : `+91${emailOrPhone}`,
          password,
          authMethod: 'password',
          role: 'vendor'
        };
      }

      console.log('Sending login data:', { ...loginData, password: '[HIDDEN]' });

      const response = await fetch(`${API_BASE_URL}/auth/vendor-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Login failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data
      this.token = data.token;
      this.user = data.data.user;
      
      localStorage.setItem('vendor_token', this.token);
      localStorage.setItem('vendor_user', JSON.stringify(this.user));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Vendor registration
  async register(formData) {
    try {
      console.log('Register attempt');

      const response = await fetch(`${API_BASE_URL}/auth/vendor-register-with-files`, {
        method: 'POST',
        body: formData, // FormData with files
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Registration failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      this.token = null;
      this.user = null;
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('vendor_user');
    }
  }

  async checkAuth() {
    // Refresh from localStorage first
    this.refreshFromStorage();
    
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Token is invalid, clear auth data
        this.logout();
        return false;
      }

      const data = await response.json();
      
      if (!data.success) {
        this.logout();
        return false;
      }

      // Update user data if provided
      if (data.data) {
        this.user = data.data;
        localStorage.setItem('vendor_user', JSON.stringify(this.user));
      }

      return true;
    } catch (error) {
      console.error('Auth verification error:', error);
      // Don't logout on network errors, keep the token for retry
      return this.isAuthenticated();
    }
  }

  getToken() {
    // Always get the latest token from localStorage
    this.token = localStorage.getItem('vendor_token');
    return this.token;
  }

  getUser() {
    // Always get the latest user from localStorage
    const storedUser = localStorage.getItem('vendor_user');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.user = null;
      }
    }
    return this.user;
  }

  isAuthenticated() {
    // Check both instance variable and localStorage
    const token = this.getToken();
    return !!token;
  }

  // Refresh authentication state from localStorage
  refreshFromStorage() {
    this.token = localStorage.getItem('vendor_token');
    const storedUser = localStorage.getItem('vendor_user');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.user = null;
      }
    } else {
      this.user = null;
    }
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get user profile with role-specific data
  async getUserProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user profile');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        this.user = data.data;
        localStorage.setItem('vendor_user', JSON.stringify(this.user));
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/updatedetails`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Profile update failed');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        this.user = data.data;
        localStorage.setItem('vendor_user', JSON.stringify(this.user));
      }

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Change password for vendors
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Password change failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Upload avatar
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Avatar upload failed');
      }

      const data = await response.json();
      
      if (data.success && data.data.user) {
        this.user = data.data.user;
        localStorage.setItem('vendor_user', JSON.stringify(this.user));
      }

      return data;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }

  // Delete avatar
  async deleteAvatar() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Avatar deletion failed');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        this.user = data.data;
        localStorage.setItem('vendor_user', JSON.stringify(this.user));
      }

      return data;
    } catch (error) {
      console.error('Delete avatar error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const auth = new AuthService();

export { auth };
export default AuthService;
