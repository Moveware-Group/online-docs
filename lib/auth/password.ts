/**
 * Password hashing using Node.js built-in crypto.scrypt.
 * No external dependencies required.
 */

import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hash a plain-text password. Returns a string in the form `<hash>.<salt>`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Compare a plain-text password against a stored hash.
 */
export async function comparePassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [hashedPassword, salt] = stored.split('.');
  if (!hashedPassword || !salt) return false;
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const key = Buffer.from(hashedPassword, 'hex');
  return timingSafeEqual(buf, key);
}
