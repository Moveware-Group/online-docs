/**
 * Type definitions for application settings
 */

export interface BrandingSettings {
  id: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  companyName: string;
  favicon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeroSettings {
  id: string;
  title: string;
  subtitle: string;
  backgroundImageUrl?: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  overlayOpacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CopySettings {
  id: string;
  section: string;
  key: string;
  value: string;
  locale?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBrandingInput {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  companyName: string;
  favicon?: string;
}

export interface UpdateBrandingInput {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  companyName?: string;
  favicon?: string;
}

export interface CreateHeroInput {
  title: string;
  subtitle: string;
  backgroundImageUrl?: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  overlayOpacity: number;
}

export interface UpdateHeroInput {
  title?: string;
  subtitle?: string;
  backgroundImageUrl?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  overlayOpacity?: number;
}

export interface CreateCopyInput {
  section: string;
  key: string;
  value: string;
  locale?: string;
}

export interface UpdateCopyInput {
  section?: string;
  key?: string;
  value?: string;
  locale?: string;
}

/**
 * Condition types for display logic
 */
export type ConditionType = 
  | 'userRole'
  | 'companySize'
  | 'subscription'
  | 'feature'
  | 'custom';

export type ConditionOperator = 
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'in'
  | 'notIn';

export interface Condition {
  id: string;
  type: ConditionType;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
  field?: string;
}

export interface DisplayConditions {
  conditions: Condition[];
  logic?: 'AND' | 'OR';
}
