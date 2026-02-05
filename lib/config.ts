/**
 * Application configuration
 * Centralizes all environment variable access and provides type safety
 */

export interface AppConfig {
  nodeEnv: string;
  app: {
    name: string;
    url: string;
  };
  moveware: {
    apiUrl: string;
    apiKey: string;
    apiVersion: string;
  };
}

/**
 * Get environment variable with optional default value
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  return value || defaultValue || '';
}

/**
 * Application configuration object
 * All environment variables are loaded and validated here
 */
export const config: AppConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Moveware App'),
    url: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  },
  moveware: {
    apiUrl: getEnvVar('MOVEWARE_API_URL'),
    apiKey: getEnvVar('MOVEWARE_API_KEY'),
    apiVersion: getEnvVar('MOVEWARE_API_VERSION', 'v1'),
  },
};

/**
 * Validate that required configuration is present
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.moveware.apiUrl) {
    errors.push('MOVEWARE_API_URL is required');
  }

  if (!config.moveware.apiKey) {
    errors.push('MOVEWARE_API_KEY is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
