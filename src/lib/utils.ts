/**
 * Utility functions for the application
 */

import type { SupportedLanguage } from './constants';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './constants';

/**
 * Get the browser's preferred language
 */
export const getBrowserLanguage = (): SupportedLanguage => {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const lang = navigator.language.split('-')[0] as SupportedLanguage;
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
};

/**
 * Hide sensitive values in objects (for logging)
 */
export const hideValueInObject = (
  obj: any,
  valueToHide: string,
  displayLength: number = 4
): void => {
  if (!obj || !valueToHide) return;

  const hidden = valueToHide.substring(0, displayLength) + '***';

  const hideInValue = (value: any): any => {
    if (typeof value === 'string') {
      return value.replace(new RegExp(valueToHide, 'g'), hidden);
    }
    if (Array.isArray(value)) {
      return value.map(hideInValue);
    }
    if (typeof value === 'object' && value !== null) {
      hideValueAtAllLevels(value, valueToHide, displayLength);
      return value;
    }
    return value;
  };

  Object.keys(obj).forEach((key) => {
    obj[key] = hideInValue(obj[key]);
  });
};

/**
 * Recursively hide sensitive values at all levels of an object
 */
export const hideValueAtAllLevels = (
  obj: any,
  valueToHide: string,
  displayLength: number = 4
): void => {
  hideValueInObject(obj, valueToHide, displayLength);
};

/**
 * Get value from object using dot notation string path
 * e.g., "data.user.name" returns obj.data.user.name
 */
export const getValueFromObjectWithString = (path: string, obj: any): any => {
  if (!path || !obj) return undefined;

  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
};

/**
 * Convert query params object to query string
 */
export const buildQueryString = (params: Record<string, string | string[] | undefined>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Check if popup windows are blocked
 */
export const isPopupBlocked = (): boolean => {
  if (typeof window === 'undefined') return false;

  const testWindow = window.open(
    '',
    '_blank',
    'toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,left=10000,top=10000,width=10,height=10,visible=none'
  );

  if (testWindow) {
    testWindow.close();
    return false;
  }

  return true;
};

/**
 * Get device info for logging
 */
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      os_version: 'unknown',
      userAgent: 'unknown',
    };
  }

  const userAgent = navigator.userAgent;
  let osVersion = 'unknown';

  // Simple OS detection
  if (userAgent.includes('Windows NT 10.0')) osVersion = 'Windows 10';
  else if (userAgent.includes('Windows NT 6.3')) osVersion = 'Windows 8.1';
  else if (userAgent.includes('Windows NT 6.2')) osVersion = 'Windows 8';
  else if (userAgent.includes('Windows NT 6.1')) osVersion = 'Windows 7';
  else if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X ([\d_]+)/);
    osVersion = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (userAgent.includes('Linux')) osVersion = 'Linux';
  else if (userAgent.includes('Android')) osVersion = 'Android';
  else if (userAgent.includes('iOS')) osVersion = 'iOS';

  return {
    os_version: osVersion,
    userAgent,
  };
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if error response has occurred
 */
export const isErrorResponse = (response: any): boolean => {
  if (!response) return true;

  // Connection failed
  if (response.status === 0) return true;

  // HTTP error status
  if (response.status && (response.status < 200 || response.status >= 300)) return true;

  return false;
};

/**
 * Format error response
 */
export const formatErrorResponse = (
  response: any,
  requestType: string = 'data'
): { code: number; error: string } => {
  if (response.status === 0) {
    return {
      code: 0,
      error: 'Unable to connect',
    };
  }

  if (response.error && response.status) {
    return {
      code: response.status,
      error: response.error,
    };
  }

  return {
    code: response.status || 500,
    error: `Requested ${requestType} failure`,
  };
};
