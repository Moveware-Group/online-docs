/**
 * Type definitions for the OnlineAccess application
 */

export interface ApiConfig {
  companyId: string;
  redirectBase: string;
  assetsUrl: string;
  metadataUrl: string;
  templateUrl: string;
  dataUrl: string;
  filesUrl: string;
  filesAddUrl: string;
  filesRemoveUrl: string;
  dataQueryParams: Record<string, string>;
  metadataQueryParams: Record<string, string>;
  dataTag?: string;
}

export interface MetadataResponse {
  favicon?: string;
  title?: string;
  theme?: ThemeVariable[];
  i18n?: any;
  metadata: ComponentMetadata[];
  status?: number;
  error?: string;
}

export interface DataResponse {
  [key: string]: any;
  status?: number;
  error?: string;
}

export interface ThemeVariable {
  themeVar: string;
  value: [number, number, number];
}

export interface ComponentMetadata {
  componentType: string;
  customClass?: string;
  value?: string;
  metadata?: ComponentMetadata[] | string[];
  [key: string]: any;
}

export interface ActionData {
  formData: Record<string, any>;
  method: string;
  tag?: string;
  actions?: OnClickEvent[];
  callback?: (actions?: OnClickEvent[], setButtonCallback?: any) => void;
  setButtonCallback?: any;
}

export interface OnClickEvent {
  redirectURL?: string;
  navigateURL?: string;
  downloadSrc?: string;
  tagRefresh?: string;
  responsePaths?: {
    status?: string;
    error?: string;
    redirectURL?: string;
    redirectUrl?: string; // deprecated
    navigateURL?: string;
    downloadSrc?: string;
    tagRefresh?: string;
  };
}

export interface ErrorResponse {
  code: number;
  error: string;
  message?: string;
}

export interface DeviceInfo {
  os_version: string;
  browser?: string;
  device?: string;
  userAgent?: string;
}

export interface RouteParams {
  companyId: string;
  pageType: string;
  mdVersion?: string;
}

export interface QueryParams {
  [key: string]: string | string[] | undefined;
  token?: string;
  brand?: string;
  dataVersion?: string;
  // Legacy query params
  e?: string; // companyId
  f?: string; // pageType
  cu?: string; // customerId
  in?: string; // invoiceId
  j?: string; // jobId
  p?: string; // gatewayId/configId
  t?: string; // token
}

export interface EnvironmentConfig {
  production: boolean;
  version: string;
  fetchAssets: string;
  fetchApiRoot: string;
  syncfusionLicenseKey: string;
  metadataParameters: string[];
  forbiddenOS: string[];
  displayHiddenValuesLength: {
    token: number;
    signature: number;
  };
  appInsights: {
    instrumentationKey: string;
  };
}
