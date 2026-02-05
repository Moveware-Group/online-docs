/**
 * Type definitions for the Moveware API client
 */

/**
 * Configuration for the Moveware API client
 */
export interface MovewareConfig {
  baseUrl: string;
  companyId: string;
  username: string;
  password: string;
  version: string;
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
