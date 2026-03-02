'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials, LoginResponse, AuthContextType } from '@/lib/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER_KEY = 'moveware_user';
const STORAGE_TOKEN_KEY = 'moveware_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_USER_KEY);
      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedToken) {
        setToken(storedToken);
      } else if (storedUser) {
        // Legacy sessions didn't store the token separately.
        // Recover it: env-var admin sessions always used 'placeholder-token'.
        setToken('placeholder-token');
        localStorage.setItem(STORAGE_TOKEN_KEY, 'placeholder-token');
      }
    } catch (error) {
      console.error('Failed to load user session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
        localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      const t = token ?? localStorage.getItem(STORAGE_TOKEN_KEY);
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  };

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user?.permissions) return false;
      return user.permissions.includes('all') || user.permissions.includes(permission);
    },
    [user],
  );

  const canSeeAllCompanies =
    !user || // not logged in — public page, no restriction
    !!user.isAdmin ||
    hasPermission('view_all_companies');

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    token,
    login,
    logout,
    hasPermission,
    canSeeAllCompanies,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
