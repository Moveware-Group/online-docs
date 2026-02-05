/**
 * Moveware API Client
 * Provides authenticated HTTP requests to the Moveware API
 */

import { MovewareConfig, MovewareResponse, MovewareError } from '../types/moveware';

/**
 * Configuration for the Moveware API client
 */
const config: MovewareConfig = {
  baseUrl: process.env.MOVEWARE_API_URL || '',
  companyId: process.env.MOVEWARE_COMPANY_ID || '',
  username: process.env.MOVEWARE_USERNAME || '',
  password: process.env.MOVEWARE_PASSWORD || '',
  version: process.env.MOVEWARE_API_VERSION || 'v1',
};

/**
 * Validates that all required configuration is present
 */
function validateConfig(): void {
  const missing: string[] = [];
  
  if (!config.baseUrl) missing.push('MOVEWARE_API_URL');
  if (!config.companyId) missing.push('MOVEWARE_COMPANY_ID');
  if (!config.username) missing.push('MOVEWARE_USERNAME');
  if (!config.password) missing.push('MOVEWARE_PASSWORD');
  
  if (missing.length > 0) {
    throw new Error(`Missing required Moveware API configuration: ${missing.join(', ')}`);
  }
}

/**
 * Creates authentication headers for Moveware API requests
 */
function getAuthHeaders(): HeadersInit {
  return {
    'mw-company-id': config.companyId,
    'mw-username': config.username,
    'mw-password': config.password,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Makes an HTTP request to the Moveware API
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<MovewareResponse<T>> {
  validateConfig();
  
  const url = `${config.baseUrl}/${config.version}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const error: MovewareError = {
        status: response.status,
        message: data.message || 'An error occurred',
        code: data.code,
        details: data.details,
      };
      throw error;
    }
    
    return {
      data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    if ((error as MovewareError).status) {
      throw error;
    }
    
    // Network or other errors
    const networkError: MovewareError = {
      status: 0,
      message: error instanceof Error ? error.message : 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
    throw networkError;
  }
}

/**
 * Moveware API Client
 */
export const movewareClient = {
  /**
   * Makes a GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<MovewareResponse<T>> {
    let url = endpoint;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${endpoint}?${queryString}`;
    }
    
    return request<T>(url, {
      method: 'GET',
    });
  },
  
  /**
   * Makes a POST request
   */
  async post<T>(endpoint: string, body: unknown): Promise<MovewareResponse<T>> {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  
  /**
   * Makes a PUT request
   */
  async put<T>(endpoint: string, body: unknown): Promise<MovewareResponse<T>> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  
  /**
   * Makes a PATCH request
   */
  async patch<T>(endpoint: string, body: unknown): Promise<MovewareResponse<T>> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  
  /**
   * Makes a DELETE request
   */
  async delete<T>(endpoint: string): Promise<MovewareResponse<T>> {
    return request<T>(endpoint, {
      method: 'DELETE',
    });
  },
  
  /**
   * Gets the current configuration (without sensitive data)
   */
  getConfig: () => ({
    baseUrl: config.baseUrl,
    version: config.version,
    companyId: config.companyId ? '***' : '',
  }),
};

export default movewareClient;
