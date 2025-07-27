// API configuration utility
const API_BASE_URL = ''; // nginx proxy will handle this
console.log("Backend Url: " + (API_BASE_URL || 'nginx proxy'))

// Helper function to get cookie
const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getCookie('auth_token');
  return {
    'Content-Type': 'application/json',
    'Cookie': document.cookie, // Send all cookies in Cookie header
    ...(token && { 'Authorization': `Bearer ${token}` }) // Also send as Authorization header if needed
  };
};

// Authenticated fetch wrapper
export const authenticatedFetch = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include', // Important: include cookies in requests
    headers: getAuthHeaders(),
    ...options,
  };

  // Merge headers if options has headers
  if (options.headers) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      ...options.headers,
    };
  }

  // Debug: Log request details
  console.log('Making authenticated request to:', url);
  console.log('Request options:', defaultOptions);
  console.log('Current cookies:', document.cookie);

  const response = await fetch(url, defaultOptions);

  // Debug: Log response
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  return response;
};

export const API_ENDPOINTS = {
  // Auth endpoints (no JWT required)
  LOGIN: `/api/auth/login`,

  // Todo endpoints (JWT required)
  TODOS: `/api/todos`,
  TODO_BY_ID: (id) => `/api/todos/${id}`,

  // Step endpoints (JWT required)
  STEPS: `/api/steps`,
  STEPS_BY_TODO_ID: (todoId) => `/api/steps/todo/${todoId}`,
  STEP_BY_ID: (stepId) => `/api/steps/${stepId}`,

  // Legacy endpoints (for backward compatibility - can be removed after full React migration)
  LEGACY: {
    INDEX: `/legacy/`,
    TODO: `/legacy/todo`,
    STEP: (todoId) => `/legacy/todo/${todoId}`
  }
};

export default API_ENDPOINTS;
