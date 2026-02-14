import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks.
 *
 * **Usage:** This function should be called:
 * 1. On save - when persisting content to the database
 * 2. On render - when displaying content to users (defense in depth)
 *
 * **Allowed tags:** p, br, strong, em, a (with href attribute only)
 * **All other tags and attributes are stripped.**
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string, or empty string if input is null/undefined
 *
 * @example
 * ```ts
 * const clean = sanitizeHtml('<p>Safe content</p><script>alert("xss")</script>');
 * // Returns: '<p>Safe content</p>'
 * ```
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) {
    return "";
  }

  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "a"],
    ALLOWED_ATTR: ["href"],
    // Additional security settings
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
  });

  return cleanHtml;
}

/**
 * Sanitizes company content fields (hero_content and copy_content).
 *
 * **Usage:** This function should be called:
 * 1. On save - when persisting company settings to the database
 * 2. On render - when displaying content to users (defense in depth)
 *
 * Both fields are sanitized using the same rules as sanitizeHtml:
 * - Allowed tags: p, br, strong, em, a (with href only)
 * - All scripts, event handlers, and dangerous content are stripped
 *
 * @param content - Object containing hero_content and/or copy_content fields
 * @returns New object with sanitized content fields
 *
 * @example
 * ```ts
 * const company = {
 *   hero_content: '<p>Welcome</p><script>alert("xss")</script>',
 *   copy_content: '<p>About us</p><img src=x onerror=alert(1)>',
 * };
 * const sanitized = sanitizeCompanyContent(company);
 * // Returns: { hero_content: '<p>Welcome</p>', copy_content: '<p>About us</p>' }
 * ```
 */
export function sanitizeCompanyContent<
  T extends {
    hero_content?: string | null;
    copy_content?: string | null;
  },
>(content: T): T {
  return {
    ...content,
    hero_content: content.hero_content
      ? sanitizeHtml(content.hero_content)
      : content.hero_content,
    copy_content: content.copy_content
      ? sanitizeHtml(content.copy_content)
      : content.copy_content,
  };
}
