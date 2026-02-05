import { NextRequest, NextResponse } from 'next/server';
import type { LoginCredentials, LoginResponse } from '@/lib/types/auth';

/**
 * Placeholder authentication endpoint
 * TODO: Replace with actual Microsoft SSO integration
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

    // PLACEHOLDER: Simple validation for demo purposes
    // In production, this will be replaced with Microsoft SSO
    const validUsers = [
      {
        username: 'admin',
        password: 'admin123',
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@moveware.com',
          role: 'admin' as const,
          name: 'Admin User',
        },
      },
      {
        username: 'staff',
        password: 'staff123',
        user: {
          id: '2',
          username: 'staff',
          email: 'staff@moveware.com',
          role: 'staff' as const,
          name: 'Staff User',
        },
      },
    ];

    const validUser = validUsers.find(
      (u) => u.username === credentials.username && u.password === credentials.password
    );

    if (validUser) {
      // In production, generate a proper JWT token here
      const response: LoginResponse = {
        success: true,
        user: validUser.user,
        token: 'placeholder-token',
        message: 'Login successful',
      };

      return NextResponse.json(response, { status: 200 });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password',
        } as LoginResponse,
        { status: 401 }
      );
    }
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
