/**
 * Moveware API Client
 * Provides authenticated HTTP requests to the Moveware API
 * Supports dynamic company ID for multi-tenant applications
 */

import { MovewareConfig, MovewareResponse, MovewareError } from '../types/moveware';

/**
 * Base configuration for the Moveware API client (without company ID)
 */
const baseConfig = {
  baseUrl: process.env.MOVEWARE_API_URL || '',
  username: process.env.MOVEWARE_USERNAME || '',
  password: process.env.MOVEWARE_PASSWORD || '',
  version: process.env.MOVEWARE_API_VERSION || 'v1',
};

/**
 * Validates that all required configuration is present
 */
function validateConfig(companyId?: number): void {
  const missing: string[] = [];
  
  if (!baseConfig.baseUrl) missing.push('MOVEWARE_API_URL');
  if (!companyId) missing.push('companyId (from URL parameter)');
  if (!baseConfig.username) missing.push('MOVEWARE_USERNAME');
  if (!baseConfig.password) missing.push('MOVEWARE_PASSWORD');
  
  if (missing.length > 0) {
    throw new Error(`Missing required Moveware API configuration: ${missing.join(', ')}`);
  }
}

/**
 * Creates authentication headers for Moveware API requests
 */
function getAuthHeaders(companyId: number): Record<string, string> {
  return {
    'mw-company-id': companyId.toString(),
    'mw-username': baseConfig.username,
    'mw-password': baseConfig.password,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Makes an HTTP request to the Moveware API
 */
async function request<T>(
  endpoint: string,
  companyId: number,
  options: RequestInit = {}
): Promise<MovewareResponse<T>> {
  validateConfig(companyId);
  
  const url = `${baseConfig.baseUrl}/${baseConfig.version}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(companyId),
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
 * Factory function to create a Moveware API Client with a specific company ID
 * This allows for multi-tenant support where company ID comes from the URL
 * @param companyId - Integer company ID (e.g., 123, 456)
 */
export function createMovewareClient(companyId: number) {
  return {
    /**
     * Makes a GET request
     */
    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
      let url = endpoint;
      if (params) {
        const queryString = new URLSearchParams(params).toString();
        url = `${endpoint}?${queryString}`;
      }
      
      const response = await request<T>(url, companyId, {
        method: 'GET',
      });
      return response.data;
    },
    
    /**
     * Makes a POST request
     */
    async post<T>(endpoint: string, body: unknown): Promise<T> {
      const response = await request<T>(endpoint, companyId, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return response.data;
    },
    
    /**
     * Makes a PUT request
     */
    async put<T>(endpoint: string, body: unknown): Promise<T> {
      const response = await request<T>(endpoint, companyId, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return response.data;
    },
    
    /**
     * Makes a PATCH request
     */
    async patch<T>(endpoint: string, body: unknown): Promise<T> {
      const response = await request<T>(endpoint, companyId, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return response.data;
    },
    
    /**
     * Makes a DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
      const response = await request<T>(endpoint, companyId, {
        method: 'DELETE',
      });
      return response.data;
    },
    
    /**
     * Gets the current configuration (without sensitive data)
     */
    getConfig: () => ({
      baseUrl: baseConfig.baseUrl,
      version: baseConfig.version,
      companyId: companyId ? '***' : '',
    }),
  };
}

/**
 * Default client for backward compatibility (uses MOVEWARE_COMPANY_ID from env)
 * @deprecated Use createMovewareClient(companyId) for multi-tenant support
 */
const envCompanyId = process.env.MOVEWARE_COMPANY_ID ? parseInt(process.env.MOVEWARE_COMPANY_ID) : 0;
export const movewareClient = createMovewareClient(envCompanyId);

export default movewareClient;
