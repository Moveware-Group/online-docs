/**
 * Backend API Service
 * Handles all API requests to the backend
 */

import type { 
  ApiConfig, 
  MetadataResponse, 
  DataResponse, 
  ActionData, 
  ErrorResponse 
} from '@/types';
import { buildQueryString, isErrorResponse, formatErrorResponse } from './utils';
import { environment } from './environment';

export class BackendAPIService {
  constructor(private apiConfig: ApiConfig) {}

  /**
   * Fetch metadata from the backend
   */
  async fetchMetadata(): Promise<MetadataResponse | ErrorResponse> {
    try {
      const queryString = buildQueryString(this.apiConfig.metadataQueryParams);
      const url = `${this.apiConfig.metadataUrl}${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return formatErrorResponse(
          {
            status: response.status,
            error: response.statusText,
          },
          'metadata'
        );
      }

      const text = await response.text();
      const data = JSON.parse(text);

      return data;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return {
        code: 0,
        error: 'Unable to connect',
      };
    }
  }

  /**
   * Fetch data from the backend
   */
  async fetchData(dataVersion?: string): Promise<DataResponse | ErrorResponse> {
    try {
      const params = { ...this.apiConfig.dataQueryParams };
      if (dataVersion) {
        params['po-version'] = dataVersion;
      }

      const queryString = buildQueryString(params);
      const url = `${this.apiConfig.dataUrl}${
        this.apiConfig.dataTag ? `/${this.apiConfig.dataTag}` : ''
      }${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return formatErrorResponse(
          {
            status: response.status,
            error: response.statusText,
          },
          'data'
        );
      }

      const text = await response.text();
      const data = JSON.parse(text);

      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return {
        code: 0,
        error: 'Unable to connect',
      };
    }
  }

  /**
   * Post data to the backend endpoint
   */
  async postData(actionData: ActionData): Promise<any[]> {
    const methods = actionData.method.toUpperCase().split(',');
    const responses: any[] = [];

    for (const method of methods) {
      try {
        const queryString = buildQueryString(this.apiConfig.dataQueryParams);
        const url = `${this.apiConfig.dataUrl}${
          actionData.tag ? `/${actionData.tag}` : ''
        }${queryString}`;

        const response = await fetch(url, {
          method: method.trim(),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(actionData.formData),
        });

        const data = await response.json();
        const result = {
          status: response.status,
          statusText: response.statusText,
          body: data,
        };

        responses.push(result);

        // If this request failed, don't continue with subsequent requests
        if (response.status < 200 || response.status >= 300) {
          break;
        }
      } catch (error) {
        console.error(`Error posting data with method ${method}:`, error);
        responses.push({
          status: 0,
          error: 'Unable to connect',
        });
        break;
      }
    }

    return responses;
  }

  /**
   * Get API configuration
   */
  getConfig(): ApiConfig {
    return this.apiConfig;
  }

  /**
   * Update API configuration
   */
  updateConfig(config: Partial<ApiConfig>): void {
    this.apiConfig = { ...this.apiConfig, ...config };
  }
}

/**
 * Create error log payload
 */
export const createErrorLog = (
  error: any,
  apiConfig: ApiConfig,
  hideToken: boolean = true
): any => {
  const reducedMessage = {
    message: error.message || error.error,
    name: error.name || 'Error',
    status: error.status || error.code,
    statusText: error.statusText || error.error,
    url: error.url,
  };

  // Hide token if needed (implement hiding logic if monitoring service requires it)
  if (hideToken && apiConfig.dataQueryParams.token) {
    // Token hiding would be done here
  }

  return reducedMessage;
};
