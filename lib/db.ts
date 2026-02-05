/**
 * Prisma Client Instance
 * 
 * This module provides a singleton instance of the Prisma Client for database operations.
 * It follows Next.js best practices to prevent multiple instances during development
 * due to hot reloading.
 */

import { PrismaClient } from '@prisma/client'

// Declare global type for prisma client to prevent TypeScript errors
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Create a singleton instance of PrismaClient
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// In development, attach the client to global to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma
