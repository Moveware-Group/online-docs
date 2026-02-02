# OD-5: Implement theming and branding model

## Notes

I'll analyze the repository structure and implement a theming and branding model with a context/provider pattern.

Let me first examine the current codebase structure to understand the project setup.

<read_file>
<path>package.json
</path>
</read_file>

<read_file>
<path>src</path>
</read_file>

<read_file>
<path>tsconfig.json</path>
</read_file>

Now let me check the existing structure:

<list_dir>
<path>src</path>
</read_file>

<read_file>
<path>src/App.tsx</path>
</read_file>

<read_file>
<path>src/main.tsx</path>
</read_file>

<list_dir>
<path>src/components</path>
</read_file>

Now I'll implement the theming and branding model:

<write_file>
<path>src/types/branding.ts</path>
<content>/**
 * Branding and theming type definitions
 */

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface BrandFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface BrandTheme {
  id: string;
  name: string;
  logoUrl: string;
  faviconUrl?: string;
  colors: BrandColors;
  fonts: BrandFonts;
  borderRadius: string;
  spacing: {
    unit: number; // base unit in pixels
  };
}

export interface BrandingConfig {
  organizationName: string;
  theme: BrandTheme;
  customCss?: string;
}
</content>
</write_file>

<write_file>
<path>src/data/mockBranding.ts</path>
<content>/**
 * Mock branding data loaders
 */

import { BrandingConfig, BrandTheme } from '../types/branding';

// Default theme
export const defaultTheme: BrandTheme = {
  id: 'default',
  name: 'Default Theme',
  logoUrl: '/logo.svg',
  faviconUrl: '/favicon.ico',
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    accent: '#9c27b0',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#bdbdbd',
    },
    error: '#f44336',
    warning: '#ff9800',
    success: '#4caf50',
    info: '#2196f3',
  },
  fonts: {
    heading: '"Roboto", "Helvetica", "Arial", sans-serif',
    body: '"Roboto", "Helvetica", "Arial", sans-serif',
    mono: '"Roboto Mono", "Courier New", monospace',
  },
  borderRadius: '4px',
  spacing: {
    unit: 8,
  },
};

// Dark theme variant
export const darkTheme: BrandTheme = {
  id: 'dark',
  name: 'Dark Theme',
  logoUrl: '/logo-dark.svg',
  faviconUrl: '/favicon.ico',
  colors: {
    primary: '#90caf9',
    secondary: '#f48fb1',
    accent: '#ce93d8',
    background: '#121212',
    surface: '#1e1e1e',
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#6b6b6b',
    },
    error: '#ef5350',
    warning: '#ffa726',
    success: '#66bb6a',
    info: '#42a5f5',
  },
  fonts: {
    heading: '"Roboto", "Helvetica", "Arial", sans-serif',
    body: '"Roboto", "Helvetica", "Arial", sans-serif',
    mono: '"Roboto Mono", "Courier New", monospace',
  },
  borderRadius: '4px',
  spacing: {
    unit: 8,
  },
};

// Custom branded theme example
export const customBrandTheme: BrandTheme = {
  id: 'custom-brand',
  name: 'Custom Brand',
  logoUrl: '/custom-logo.svg',
  faviconUrl: '/custom-favicon.ico',
  colors: {
    primary: '#6366f1',
    secondary: '#ec4899',
    accent: '#8b5cf6',
    background: '#ffffff',
    surface: '#f9fafb',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#d1d5db',
    },
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
  },
  fonts: {
    heading: '"Inter", "Helvetica", "Arial", sans-serif',
    body: '"Inter", "Helvetica", "Arial", sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },
  borderRadius: '8px',
  spacing: {
    unit: 8,
  },
};

// Default branding configuration
export const defaultBranding: BrandingConfig = {
  organizationName: 'My Organization',
  theme: defaultTheme,
};

/**
 * Mock API call to fetch branding configuration
 * In production, this would fetch from a backend API
 */
export const fetchBrandingConfig = async (
  organizationId?: string
): Promise<BrandingConfig> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Return different themes based on organization
  switch (organizationId) {
    case 'dark-org':
      return {
        organizationName: 'Dark Mode Organization',
        theme: darkTheme,
      };
    case 'custom-org':
      return {
        organizationName: 'Custom Brand Inc.',
        theme: customBrandTheme,
      };
    default:
      return defaultBranding;
  }
};

/**
 * Mock API call to fetch available themes
 */
export const fetchAvailableThemes = async (): Promise<BrandTheme[]> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return [defaultTheme, darkTheme, customBrandTheme];
};
</content>
</write_file>

<write_file>
<path>src/contexts/BrandingContext.tsx</path>
<content>/**
 * Branding Context Provider
 * Manages theming and branding configuration across the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrandingConfig, BrandTheme } from '../types/branding';
import { defaultBranding, fetchBrandingConfig } from '../data/mockBranding';

interface BrandingContextValue {
  branding: BrandingConfig;
  theme: BrandTheme;
  isLoading: boolean;
  error: string | null;
  setTheme: (theme: BrandTheme) => void;
  setBranding: (branding: BrandingConfig) => void;
  refreshBranding: (organizationId?: string) => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

interface BrandingProviderProps {
  children: ReactNode;
  organizationId?: string;
  initialBranding?: BrandingConfig;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({
  children,
  organizationId,
  initialBranding,
}) => {
  const [branding, setBrandingState] = useState<BrandingConfig>(
    initialBranding || defaultBranding
  );
  const [isLoading, setIsLoading] = useState(!initialBranding);
  const [error, setError] = useState<string | null>(null);

  const refreshBranding = async (orgId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const config = await fetchBrandingConfig(orgId || organizationId);
      setBrandingState(config);
      applyThemeToDocument(config.theme);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branding');
      console.error('Error loading branding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialBranding) {
      refreshBranding();
    } else {
      applyThemeToDocument(initialBranding.theme);
    }
  }, [organizationId]);

  const setTheme = (theme: BrandTheme) => {
    setBrandingState((prev) => ({
      ...prev,
      theme,
    }));
    applyThemeToDocument(theme);
  };

  const setBranding = (newBranding: BrandingConfig) => {
    setBrandingState(newBranding);
    applyThemeToDocument(newBranding.theme);
  };

  const value: BrandingContextValue = {
    branding,
    theme: branding.theme,
    isLoading,
    error,
    setTheme,
    setBranding,
    refreshBranding,
  };

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};

/**
 * Hook to access branding context
 */
export const useBranding = (): BrandingContextValue => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

/**
 * Apply theme to document root for CSS variables
 */
const applyThemeToDocument = (theme: BrandTheme) => {
  const root = document.documentElement;

  // Set CSS custom properties
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-surface', theme.colors.surface);
  root.style.setProperty('--color-text-primary', theme.colors.text.primary);
  root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
  root.style.setProperty('--color-text-disabled', theme.colors.text.disabled);
  root.style.setProperty('--color-error', theme.colors.error);
  root.style.setProperty('--color-warning', theme.colors.warning);
  root.style.setProperty('--color-success', theme.colors.success);
  root.style.setProperty('--color-info', theme.colors.info);

  root.style.setProperty('--font-heading', theme.fonts.heading);
  root.style.setProperty('--font-body', theme.fonts.body);
  root.style.setProperty('--font-mono', theme.fonts.mono);

  root.style.setProperty('--border-radius', theme.borderRadius);
  root.style.setProperty('--spacing-unit', `${theme.spacing.unit}px`);

  // Update favicon if provided
  if (theme.faviconUrl) {
    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = theme.faviconUrl;
    }
  }
};
</content>
</write_file>

<write_file>
<path>src/hooks/useBranding.ts</path>
<content>/**
 * Re-export useBranding hook for convenience
 */

export { useBranding } from '../contexts/BrandingContext';
</content>
</write_file>

<write_file>
<path>src/styles/theme.css</path>
<content>/**
 * Global theme styles using CSS custom properties
 * These variables are set by the BrandingProvider
 */

:root {
  /* Colors - defaults (will be overridden by theme) */
  --color-primary: #1976d2;
  --color-secondary: #dc004e;
  --color-accent: #9c27b0;
  --color-background: #ffffff;
  --color-surface: #f5f5f5;
  --color-text-primary: #212121;
  --color-text-secondary: #757575;
  --color-text-disabled: #bdbdbd;
  --color-error: #f44336;
  --color-warning: #ff9800;
  --color-success: #4caf50;
  --color-info: #2196f3;

  /* Typography */
  --font-heading: "Roboto", "Helvetica", "Arial", sans-serif;
  --font-body: "Roboto", "Helvetica", "Arial", sans-serif;
  --font-mono: "Roboto Mono", "Courier New", monospace;

  /* Spacing */
  --spacing-unit: 8px;
  --spacing-xs: calc(var(--spacing-unit) * 0.5);
  --spacing-sm: var(--spacing-unit);
  --spacing-md: calc(var(--spacing-unit) * 2);
  --spacing-lg: calc(var(--spacing-unit) * 3);
  --spacing-xl: calc(var(--spacing-unit) * 4);

  /* Border */
  --border-radius: 4px;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  margin: 0;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: var(--color-text-primary);
}

code, pre {
  font-family: var(--font-mono);
}

/* Utility classes for themed components */
.themed-surface {
  background-color: var(--color-surface);
  border-radius: var(--border-radius);
}

.themed-primary {
  color: var(--color-primary);
}

.themed-secondary {
  color: var(--color-secondary);
}

.themed-text-primary {
  color: var(--color-text-primary);
}

.themed-text-secondary {
  color: var(--color-text-secondary);
}
</content>
</write_file>

Now let me create a simple example component to demonstrate usage:

<write_file>
<path>src/components/BrandingDemo.tsx</path>
<content>/**
 * Demo component showing how to use the branding context
 */

import React from 'react';
import { useBranding } from '../hooks/useBranding';
import { fetchAvailableThemes } from '../data/mockBranding';

export const BrandingDemo: React.FC = () => {
  const { branding, theme, isLoading, error, setTheme } = useBranding();
  const [availableThemes, setAvailableThemes] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchAvailableThemes().then(setAvailableThemes);
  }, []);

  if (isLoading) {
    return <div>Loading branding...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--color-error)
