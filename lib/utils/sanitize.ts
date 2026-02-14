/**
 * Content Sanitization Utility
 *
 * Provides HTML sanitization functions to prevent XSS attacks.
 * Uses isomorphic-dompurify which works in both Node.js (server) and browser (client) environments.
 *
 * Sanitization occurs:
 * - On save: When content is stored in the database via API endpoints
 * - On render: When content is displayed to users (as a defense-in-depth measure)
 *
 * Allowed HTML tags: p, br, strong, em, a (with href attribute only)
 * Allowed attributes: href (on <a> tags only)
 *
 * All other tags, attributes, and potentially dangerous content (scripts, event handlers,
 * javascript: URLs) are stripped out.
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Configuration for allowed HTML tags and attributes
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "a"],
  ALLOWED_ATTR: ["href"],
  // Disallow javascript: and data: URLs in href
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitizes HTML content by removing potentially dangerous tags and attributes
 *
 * @param html - The HTML string to sanitize (can be null or undefined)
 * @returns Sanitized HTML string, or empty string if input is null/undefined
 *
 * @example
 * ```typescript
 * const safe = sanitizeHtml('<p>Hello</p><script>alert("XSS")</script>');
 * // Returns: '<p>Hello</p>'
 * ```
 */
export function sanitizeHtml(html: string | null | undefined): string {
  // Handle null/undefined gracefully
  if (html == null) {
    return "";
  }

  // Handle empty strings
  if (typeof html !== "string" || html.trim() === "") {
    return "";
  }

  // Sanitize with DOMPurify
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

/**
 * Interface for company content that needs sanitization
 */
export interface CompanyContent {
  hero_content?: string | null;
  copy_content?: string | null;
  [key: string]: any;
}

/**
 * Sanitizes company content fields (hero_content and copy_content)
 *
 * @param content - Object containing company content fields
 * @returns New object with sanitized content fields
 *
 * @example
 * ```typescript
 * const sanitized = sanitizeCompanyContent({
 *   hero_content: '<p>Welcome</p><script>alert("XSS")</script>',
 *   copy_content: '<strong>About us</strong>',
 *   other_field: 'unchanged',
 * });
 * // Returns: {
 * //   hero_content: '<p>Welcome</p>',
 * //   copy_content: '<strong>About us</strong>',
 * //   other_field: 'unchanged',
 * // }
 * ```
 */
export function sanitizeCompanyContent<T extends CompanyContent>(
  content: T,
): T {
  // Handle null/undefined input
  if (content == null) {
    return content;
  }

  // Create a shallow copy to avoid mutating the original
  const sanitized = { ...content };

  // Sanitize hero_content if present
  if ("hero_content" in sanitized) {
    sanitized.hero_content = sanitizeHtml(sanitized.hero_content);
  }

  // Sanitize copy_content if present
  if ("copy_content" in sanitized) {
    sanitized.copy_content = sanitizeHtml(sanitized.copy_content);
  }

  return sanitized;
}
