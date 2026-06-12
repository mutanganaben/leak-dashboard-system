const defaultBase = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultBase;

const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Automatic logout on unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    try {
      const responseData = await response.json();
      const message = responseData?.message || responseData?.error || (typeof responseData === 'string' ? responseData : null);
      throw new Error(message || `Error ${response.status}: ${response.statusText}`);
    } catch (jsonError) {
      const text = await response.text().catch(() => null);
      throw new Error(text || 'An unknown error occurred');
    }
  }
  
  const responseData = await response.json();
  // Unwrap standardized backend response { success: true, data: ... }
  if (responseData && responseData.success === true && responseData.data !== undefined) {
    return responseData.data;
  }
  
  return responseData;
};

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  health: async () => {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }
};

export default api;
