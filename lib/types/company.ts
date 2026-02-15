/**
 * Company Type Definitions
 *
 * TypeScript interfaces and API types for company data structures.
 * Used across components and API services for type safety.
 */

/**
 * Core Company Interface
 * Matches backend schema with all company fields
 */
export interface Company {
  id: string;
  name: string;
  brandCode: string;
  tenantId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  logoUrl?: string | null;
  heroContent?: string;
  copyContent?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Company Branding Settings
 */
export interface CompanyBrandingSettings {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

/**
 * Company List Response
 */
export interface CompanyListResponse {
  success: boolean;
  companies?: Company[];
  error?: string;
}

/**
 * Single Company Response
 */
export interface CompanyResponse {
  success: boolean;
  company?: Company;
  error?: string;
}

/**
 * Generic Error Response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * Create Company Request
 */
export interface CreateCompanyRequest {
  name: string;
  brandCode: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  logoUrl?: string;
  heroContent?: string;
}

/**
 * Create Company Response
 */
export interface CreateCompanyResponse {
  success: boolean;
  data?: Company;
  error?: string;
  details?: string;
}

/**
 * Update Company Request
 */
export interface UpdateCompanyRequest {
  name?: string;
  brandCode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  logoUrl?: string;
  heroContent?: string;
}

/**
 * Get Company Settings Response
 */
export interface GetCompanySettingsResponse {
  success: boolean;
  data?: CompanyBrandingSettings;
  error?: string;
}

/**
 * Update Company Colors Request
 */
export interface UpdateCompanyColorsRequest {
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Update Company Colors Response
 */
export interface UpdateCompanyColorsResponse {
  success: boolean;
  data?: CompanyBrandingSettings;
  error?: string;
}
