/**
 * Environment configuration utility
 * Centralizes access to environment variables with type safety
 */

import type { EnvironmentConfig } from '@/types';
import { METADATA_PARAMETERS, FORBIDDEN_OS, DISPLAY_HIDDEN_VALUES_LENGTH } from './constants';

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

const getBooleanEnv = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

export const environment: EnvironmentConfig = {
  production: getEnvVar('NEXT_PUBLIC_APP_ENV') === 'production',
  version: getEnvVar('NEXT_PUBLIC_VERSION', '1.0.0'),
  fetchAssets: getEnvVar('NEXT_PUBLIC_FETCH_ASSETS', 'https://static.moveware-test.app'),
  fetchApiRoot: getEnvVar('NEXT_PUBLIC_FETCH_API_ROOT', 'https://rest.moveconnect.com/malcolm-test/v1'),
  syncfusionLicenseKey: getEnvVar('NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY', ''),
  metadataParameters: METADATA_PARAMETERS,
  forbiddenOS: FORBIDDEN_OS,
  displayHiddenValuesLength: DISPLAY_HIDDEN_VALUES_LENGTH,
  appInsights: {
    instrumentationKey: getEnvVar('NEXT_PUBLIC_APP_INSIGHTS_KEY', ''),
  },
};

export const isProduction = (): boolean => environment.production;

export const isDevelopment = (): boolean => !environment.production;

export const isMonitoringEnabled = (): boolean => {
  return getBooleanEnv('NEXT_PUBLIC_ENABLE_MONITORING', environment.production);
};
