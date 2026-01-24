// API Configuration
// Central configuration for backend API access

export const API_CONFIG = {
  // Base URL - defaults to localhost:3000, can be overridden via environment
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  
  // Request timeout in milliseconds
  timeout: 5000,
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
};

// API Response wrapper type matching backend format
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Check if we should use backend (can be disabled via env)
export const isBackendEnabled = () => {
  return import.meta.env.VITE_DISABLE_BACKEND !== 'true';
};

// Startup logging - log configuration when module loads
(() => {
  const backendEnabled = isBackendEnabled();
  console.log('[API Config] Backend URL:', API_CONFIG.baseUrl);
  console.log('[API Config] Backend enabled:', backendEnabled);
  
  if (!backendEnabled) {
    console.warn('[API Config] Backend is disabled - will use mock data only');
  }
})();
