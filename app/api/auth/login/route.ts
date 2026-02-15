import { NextRequest, NextResponse } from 'next/server';
import type { LoginCredentials, LoginResponse } from '@/lib/types/auth';

/**
 * Break-glass authentication endpoint
 *
 * Provides emergency admin access when Moveware SSO is unavailable.
 * Credentials are read from ADMIN_USERNAME / ADMIN_PASSWORD env vars.
 *
 * TODO: Replace with Microsoft / Moveware SSO integration.
 */
export async function POST(request: NextRequest) {
  try {
    const credentials: LoginCredentials = await request.json();

    // Validate request body
    if (!credentials.username || !credentials.password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username and password are required',
        } as LoginResponse,
        { status: 400 }
      );
    }

    // Read break-glass credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Validate credentials
    if (
      credentials.username === adminUsername &&
      credentials.password === adminPassword
    ) {
      const response: LoginResponse = {
        success: true,
        user: {
          id: '1',
          username: adminUsername,
          email: 'admin@moveware.com',
          role: 'admin',
          name: 'Admin User',
        },
        token: 'placeholder-token',
        message: 'Login successful',
      };

      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid username or password',
      } as LoginResponse,
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      } as LoginResponse,
      { status: 500 }
    );
  }
}
