/**
 * Type definitions for the Moveware API client
 */

/**
 * Configuration for the Moveware API client
 */
export interface MovewareConfig {
  baseUrl?: string;
  apiUrl?: string;
  companyId?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  version?: string;
  apiVersion?: string;
}

/**
 * Response wrapper for Moveware API calls
 */
export interface MovewareResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Error structure for Moveware API errors
 */
export interface MovewareError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Base pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Activity payload for Moveware API
 */
export interface MovewareActivityPayload {
  activityType: string;
  timestamp: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  serviceDetails: {
    serviceType: string;
    moveDate?: string;
    details?: string;
  };
  acceptance: {
    signatureData: string;
    typedName: string;
    acceptedTerms: boolean;
    acceptedAt: string;
  };
  selectedOptions?: Record<string, unknown>;
  comments?: string;
}

/**
 * Activity response from Moveware API
 */
export interface MovewareActivityResponse {
  success: boolean;
  activityId?: string;
  jobId?: string;
  timestamp?: string;
  message?: string;
  error?: string;
}
