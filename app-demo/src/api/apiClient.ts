// API Client
// Fetch wrapper with error handling and mock fallback support

import { API_CONFIG, isBackendEnabled } from './apiConfig';
import type { ApiResponse } from './apiConfig';

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Safe fetch wrapper that never throws to the UI.
 * Returns null on any failure, allowing callers to use fallback data.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T> | null> {
  // If backend is disabled, return null immediately to trigger fallback
  if (!isBackendEnabled()) {
    return null;
  }

  const { timeout = API_CONFIG.timeout, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...API_CONFIG.headers,
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`API request failed: ${endpoint} - ${response.status}`);
      return null;
    }

    const data: ApiResponse<T> = await response.json();

    // Check if backend returned success: false
    if (!data.success) {
      console.warn(`API returned error: ${endpoint} - ${data.message || data.error}`);
      return null;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`API request timeout: ${endpoint}`);
      } else {
        console.warn(`API request error: ${endpoint} - ${error.message}`);
      }
    }
    
    // Return null to trigger fallback - never throw
    return null;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number>
): Promise<ApiResponse<T> | null> {
  let url = endpoint;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url = `${endpoint}?${searchParams.toString()}`;
  }

  return apiFetch<T>(url, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T> | null> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  endpoint: string,
  body: unknown
): Promise<ApiResponse<T> | null> {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(
  endpoint: string
): Promise<ApiResponse<T> | null> {
  return apiFetch<T>(endpoint, { method: 'DELETE' });
}
