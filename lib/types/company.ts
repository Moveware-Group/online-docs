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
  /** Unique company identifier */
  id: string;

  /** Company name */
  name: string;

  /** Brand code for company identification */
  brandCode: string;

  /** Primary brand color (hex format) */
  primaryColor?: string;

  /** Secondary brand color (hex format) */
  secondaryColor?: string;

  /** Tertiary brand color (hex format) */
  tertiaryColor?: string;

  /** Company logo URL */
  logoUrl?: string | null;

  /** Hero section content/configuration */
  heroContent?: string;

  /** Whether the company is active */
  isActive?: boolean;

  /** Timestamp of company creation (ISO 8601) */
  createdAt: string;

  /** Timestamp of last update (ISO 8601) */
  updatedAt: string;
}

/**
 * Company List Response
 * Used for GET /api/companies endpoint
 */
export interface CompanyListResponse {
  /** Indicates if the request was successful */
  success: boolean;

  /** Array of companies (present on success) */
  companies?: Company[];

  /** Error message (present on failure) */
  error?: string;
}

/**
 * Single Company Response
 * Used for individual company operations
 */
export interface CompanyResponse {
  /** Indicates if the request was successful */
  success: boolean;

  /** Company data (present on success) */
  company?: Company;

  /** Error message (present on failure) */
  error?: string;
}

/**
 * Generic Error Response
 * Used for error handling across company APIs
 */
export interface ErrorResponse {
  /** Indicates request failed */
  success: false;

  /** Error message describing what went wrong */
  error: string;

  /** Additional error details (optional) */
  details?: string;
}

/**
 * Company Branding Settings
 * Subset of company data focused on visual branding
 */
export interface CompanyBrandingSettings {
  /** Logo URL (optional) */
  logoUrl: string | null;

  /** Primary brand color (hex format, defaults to #2563eb) */
  primaryColor: string;

  /** Secondary brand color (hex format, defaults to #1e40af) */
  secondaryColor: string;

  /** Font family for company branding (defaults to Inter) */
  fontFamily: string;
 * TypeScript types for Company API
 */

export interface CreateCompanyRequest {
  name: string;
  brandCode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  heroContent?: {
    title?: string;
    subtitle?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  logo?: File;
}

export interface CompanyData {
  id: string;
  name: string;
  brandCode: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  tertiaryColor: string | null;
  heroContent: {
    title: string | null;
    subtitle: string | null;
    backgroundColor: string | null;
    textColor: string | null;
  } | null;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyResponse {
  success: boolean;
  data?: CompanyData;
  error?: string;
  details?: string;
}

/**
 * Get Company Settings Response
 * Used for GET /api/companies/[id]/settings
 */
export interface GetCompanySettingsResponse {
  /** Indicates if the request was successful */
  success: boolean;

  /** Branding settings data (present on success) */
  data?: CompanyBrandingSettings;

  /** Error message (present on failure) */
  data?: {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  error?: string;
}

/**
 * Update Company Colors Request
 * Used for PUT /api/companies/[id]/settings
 */
export interface UpdateCompanyColorsRequest {
  /** Primary color to update (hex format, optional) */
  primaryColor?: string;

  /** Secondary color to update (hex format, optional) */
  secondaryColor?: string;
}

/**
 * Update Company Colors Response
 * Response for color update operations
 */
export interface UpdateCompanyColorsResponse {
  /** Indicates if the request was successful */
  success: boolean;

  /** Updated branding settings (present on success) */
  data?: CompanyBrandingSettings;

  /** Error message (present on failure) */
  error?: string;
}

/**
 * Company Creation Request
 * Data required to create a new company
 */
export interface CreateCompanyRequest {
  /** Company name (required) */
  name: string;

  /** Brand code (required) */
  brandCode: string;

  /** Primary brand color (optional) */
  primaryColor?: string;

  /** Secondary brand color (optional) */
  secondaryColor?: string;

  /** Tertiary brand color (optional) */
  tertiaryColor?: string;

  /** Logo URL (optional) */
  logoUrl?: string;

  /** Hero content (optional) */
  heroContent?: string;
}

/**
 * Company Update Request
 * Data that can be updated for an existing company
 */
export interface UpdateCompanyRequest {
  /** Company name (optional) */
  name?: string;

  /** Brand code (optional) */
  brandCode?: string;

  /** Primary brand color (optional) */
  primaryColor?: string;

  /** Secondary brand color (optional) */
  secondaryColor?: string;

  /** Tertiary brand color (optional) */
  tertiaryColor?: string;

  /** Logo URL (optional) */
  logoUrl?: string;

  /** Hero content (optional) */
  heroContent?: string;
  data?: {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  error?: string;
}
