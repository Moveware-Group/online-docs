/**
 * Authentication-related type definitions
 */

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'admin' | 'client' | string;
  /** Display name */
  name: string;
  /** Internal role record ID */
  roleId?: string;
  /** Role display name */
  roleName?: string;
  /** Permission strings granted by the role */
  permissions?: string[];
  /** Company IDs this user is allowed to access (empty = all if admin) */
  companyIds?: string[];
  /** Convenience flag: true when role has the "all" permission */
  isAdmin?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
  token?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  /** True if the user has the "all" permission or the given specific permission */
  hasPermission: (permission: string) => boolean;
  /** True when the user can see all companies (admin or has view_all_companies perm) */
  canSeeAllCompanies: boolean;
}
