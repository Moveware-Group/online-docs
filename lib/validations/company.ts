/**
 * Company Data Validation Utilities
 *
 * Provides centralized validation functions for company-related data
 * with structured error responses for client-side display.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate company name
 * Rules: Required, max 255 characters
 */
export function validateCompanyName(
  value: string | null | undefined,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if required
  if (!value || value.trim() === "") {
    errors.push({
      field: "company_name",
      message: "Company name is required",
    });
    return { isValid: false, errors };
  }

  // Check max length
  if (value.trim().length > 255) {
    errors.push({
      field: "company_name",
      message: "Company name must not exceed 255 characters",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate brand code
 * Rules: Required, alphanumeric (plus underscore/hyphen), max 50 characters
 */
export function validateBrandCode(
  value: string | null | undefined,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if required
  if (!value || value.trim() === "") {
    errors.push({
      field: "brand_code",
      message: "Brand code is required",
    });
    return { isValid: false, errors };
  }

  const trimmedValue = value.trim();

  // Check max length
  if (trimmedValue.length > 50) {
    errors.push({
      field: "brand_code",
      message: "Brand code must not exceed 50 characters",
    });
  }

  // Check alphanumeric format (allow underscore and hyphen)
  const brandCodeRegex = /^[a-zA-Z0-9_-]+$/;
  if (!brandCodeRegex.test(trimmedValue)) {
    errors.push({
      field: "brand_code",
      message:
        "Brand code must contain only alphanumeric characters, underscores, and hyphens",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate color (hex format)
 * Rules: Optional, must be valid hex color (#RRGGBB or #RGB)
 */
export function validateColor(
  value: string | null | undefined,
  fieldName: string = "color",
): ValidationResult {
  const errors: ValidationError[] = [];

  // Optional field - empty is valid
  if (!value || value.trim() === "") {
    return { isValid: true, errors };
  }

  const trimmedValue = value.trim();

  // Validate hex color format
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexColorRegex.test(trimmedValue)) {
    errors.push({
      field: fieldName,
      message: "Color must be a valid hex color format (e.g., #2563eb or #fff)",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate logo URL or file path
 * Rules: Optional, safe path validation (no directory traversal)
 */
export function validateLogoUrl(
  value: string | null | undefined,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Optional field - empty is valid
  if (!value || value.trim() === "") {
    return { isValid: true, errors };
  }

  const trimmedValue = value.trim();

  // Check for directory traversal attempts
  if (trimmedValue.includes("..") || trimmedValue.includes("\\")) {
    errors.push({
      field: "logo_url",
      message: "Logo URL contains invalid characters",
    });
  }

  // Check max length (reasonable URL length)
  if (trimmedValue.length > 500) {
    errors.push({
      field: "logo_url",
      message: "Logo URL must not exceed 500 characters",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate text content (hero, copy, etc.)
 * Rules: Optional, max 5000 characters
 */
export function validateTextContent(
  value: string | null | undefined,
  fieldName: string = "content",
): ValidationResult {
  const errors: ValidationError[] = [];

  // Optional field - empty is valid
  if (!value || value.trim() === "") {
    return { isValid: true, errors };
  }

  const trimmedValue = value.trim();

  // Check max length
  if (trimmedValue.length > 5000) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must not exceed 5000 characters`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all company fields at once
 * Returns combined validation result
 */
export function validateCompanyData(data: {
  company_name?: string | null;
  brand_code?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  tertiary_color?: string | null;
  logo_url?: string | null;
  hero_content?: string | null;
  copy_content?: string | null;
}): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate required fields
  const nameResult = validateCompanyName(data.company_name);
  allErrors.push(...nameResult.errors);

  const brandCodeResult = validateBrandCode(data.brand_code);
  allErrors.push(...brandCodeResult.errors);

  // Validate optional fields
  if (data.primary_color) {
    const primaryColorResult = validateColor(
      data.primary_color,
      "primary_color",
    );
    allErrors.push(...primaryColorResult.errors);
  }

  if (data.secondary_color) {
    const secondaryColorResult = validateColor(
      data.secondary_color,
      "secondary_color",
    );
    allErrors.push(...secondaryColorResult.errors);
  }

  if (data.tertiary_color) {
    const tertiaryColorResult = validateColor(
      data.tertiary_color,
      "tertiary_color",
    );
    allErrors.push(...tertiaryColorResult.errors);
  }

  if (data.logo_url) {
    const logoUrlResult = validateLogoUrl(data.logo_url);
    allErrors.push(...logoUrlResult.errors);
  }

  if (data.hero_content) {
    const heroContentResult = validateTextContent(
      data.hero_content,
      "hero_content",
    );
    allErrors.push(...heroContentResult.errors);
  }

  if (data.copy_content) {
    const copyContentResult = validateTextContent(
      data.copy_content,
      "copy_content",
    );
    allErrors.push(...copyContentResult.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Format validation errors for API response
 * Converts validation errors to a user-friendly format
 */
export function formatValidationErrors(errors: ValidationError[]): {
  message: string;
  fields: Record<string, string>;
} {
  const fields: Record<string, string> = {};

  errors.forEach((error) => {
    fields[error.field] = error.message;
  });

  const message =
    errors.length === 1
      ? "Validation failed: " + errors[0].message
      : `Validation failed: ${errors.length} errors found`;

  return { message, fields };
}
