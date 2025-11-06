// Complaints API functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get authentication token
const getAuthToken = () => {
  const token = localStorage.getItem('vendor_token') || localStorage.getItem('token');
  console.log('Auth token:', token ? 'Found' : 'Not found');
  return token;
};

// Get complaints for vendor (orders related to vendor)
export const getVendorComplaints = async (params = {}) => {
  try {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const url = `${API_BASE_URL}/complaints/vendor${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('Fetching complaints from:', url);
    console.log('With auth token:', token ? 'Present' : 'Missing');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to fetch complaints: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vendor complaints:', error);
    throw error;
  }
};

// Get specific complaint details
export const getComplaintDetails = async (complaintId) => {
  try {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch complaint details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    throw error;
  }
};

// Add response/communication to complaint
export const addComplaintResponse = async (complaintId, responseData) => {
  try {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/vendor-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(responseData)
    });

    if (!response.ok) {
      throw new Error(`Failed to add complaint response: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding complaint response:', error);
    throw error;
  }
};

// Get complaints statistics for vendor
export const getComplaintsStats = async () => {
  try {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/complaints/vendor/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch complaints stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching complaints stats:', error);
    throw error;
  }
};

// Update complaint status (for vendor responses)
export const updateComplaintStatus = async (complaintId, statusData) => {
  try {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/vendor-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statusData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update complaint status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw error;
  }
};

// Add internal note to complaint (vendor's internal notes)
export const addVendorNote = async (complaintId, note) => {
  try {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/vendor-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ note })
    });

    if (!response.ok) {
      throw new Error(`Failed to add vendor note: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding vendor note:', error);
    throw error;
  }
};

export default {
  getVendorComplaints,
  getComplaintDetails,
  addComplaintResponse,
  getComplaintsStats,
  updateComplaintStatus,
  addVendorNote
};