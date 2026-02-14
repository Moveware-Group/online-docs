/**
 * Company Settings API Types
 */

export interface CompanyBrandingSettings {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
}

export interface GetCompanySettingsResponse {
  success: boolean;
  data?: CompanyBrandingSettings;
  error?: string;
}

export interface UpdateCompanyColorsRequest {
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateCompanyColorsResponse {
  success: boolean;
  data?: CompanyBrandingSettings;
  error?: string;
}

export interface UploadLogoResponse {
  success: boolean;
  data?: {
    logoUrl: string;
  };
  error?: string;
}
