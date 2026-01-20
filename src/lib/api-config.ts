/**
 * API Configuration Builder
 * Constructs API configuration from route parameters and query params
 */

import type { ApiConfig, QueryParams, RouteParams } from '@/types';
import { environment } from './environment';
import { METADATA_PARAMETERS } from './constants';

export class ApiConfigBuilder {
  private config: ApiConfig;

  constructor(params: RouteParams, queryParams: QueryParams) {
    this.config = this.buildConfig(params, queryParams);
  }

  private buildConfig(params: RouteParams, queryParams: QueryParams): ApiConfig {
    const { companyId, pageType, mdVersion } = params;

    const metadataQueryParams: Record<string, string> = {};
    const dataQueryParams: Record<string, string> = {};

    // Separate query params into metadata and data params
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value === undefined) return;

      const stringValue = Array.isArray(value) ? value[0] : String(value);

      if (METADATA_PARAMETERS.includes(key)) {
        metadataQueryParams[key] = stringValue;
      } else {
        dataQueryParams[key] = stringValue;
      }
    });

    const brand = metadataQueryParams['brand'];

    return {
      companyId: queryParams?.coId?.toString() || companyId || '',
      redirectBase: `${typeof window !== 'undefined' ? window.location.origin : ''}/rms/${companyId}`,
      assetsUrl: `${environment.fetchAssets}/${companyId}${brand ? `/${brand}` : ''}`,
      metadataUrl: `${environment.fetchApiRoot}/company/${companyId}/page/${pageType}${
        mdVersion ? `/${mdVersion}` : ''
      }`,
      templateUrl: `${environment.fetchApiRoot}/company/${companyId}/brand/${brand || ''}/file`,
      dataUrl: `${environment.fetchApiRoot}/company/${companyId}/page/${pageType}/data`,
      filesUrl: `${environment.fetchApiRoot}/company/${companyId}/page/${pageType}/files`,
      filesAddUrl: `${environment.fetchApiRoot}/company/${companyId}/page/${pageType}/files/add`,
      filesRemoveUrl: `${environment.fetchApiRoot}/company/${companyId}/page/${pageType}/files/remove`,
      metadataQueryParams,
      dataQueryParams,
    };
  }

  public getConfig(): ApiConfig {
    return this.config;
  }

  public updateDataTag(tag: string): void {
    this.config.dataTag = tag;
  }
}

/**
 * Parse legacy query parameters and convert to standard format
 * Legacy params: e (companyId), f (pageType), cu (customerId), in (invoiceId), j (jobId), p (gatewayId), t (token)
 */
export const parseLegacyQueryParams = (queryParams: QueryParams): {
  companyId?: string;
  pageType?: string;
  params: Record<string, string>;
} => {
  const result: {
    companyId?: string;
    pageType?: string;
    params: Record<string, string>;
  } = { params: {} };

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value === undefined) return;

    const stringValue = Array.isArray(value) ? value[0] : String(value);

    switch (key) {
      case 'e':
        result.companyId = stringValue;
        break;
      case 'f':
        result.pageType = stringValue;
        break;
      case 'cu':
        result.params.customerId = stringValue;
        break;
      case 'in':
        result.params.invoiceId = stringValue;
        break;
      case 'j':
        result.params.jobId = stringValue;
        break;
      case 'p':
        result.params.gatewayId = stringValue;
        result.params.configId = stringValue;
        break;
      case 't':
        result.params.token = stringValue;
        break;
      default:
        result.params[key] = stringValue;
    }
  });

  return result;
};
