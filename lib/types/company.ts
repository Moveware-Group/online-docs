/**
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

export interface GetCompanySettingsResponse {
  success: boolean;
  data?: {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  error?: string;
}

export interface UpdateCompanyColorsRequest {
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateCompanyColorsResponse {
  success: boolean;
  data?: {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  error?: string;
}
