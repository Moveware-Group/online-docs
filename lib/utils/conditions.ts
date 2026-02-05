/**
 * Utility functions for evaluating display conditions
 */

import type { DisplayConditions, Condition } from '@/lib/types/settings';

/**
 * Evaluate if display conditions are met
 */
export function evaluateConditions(
  conditions: DisplayConditions,
  context: Record<string, any>
): boolean {
  // If conditions are disabled, always show
  if (!conditions.enabled) {
    return true;
  }

  // If no conditions defined, always show
  if (!conditions.conditions || conditions.conditions.length === 0) {
    return true;
  }

  // Evaluate each condition
  const results = conditions.conditions.map(condition => 
    evaluateCondition(condition, context)
  );

  // Apply logic (all = AND, any = OR)
  if (conditions.logic === 'any') {
    return results.some(result => result === true);
  } else {
    return results.every(result => result === true);
  }
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  condition: Condition,
  context: Record<string, any>
): boolean {
  const contextValue = context[condition.type];
  
  // If context value is missing, condition fails
  if (contextValue === undefined || contextValue === null) {
    return false;
  }

  // Convert values to strings for comparison
  const conditionValue = String(condition.value).toLowerCase();
  const contextValueStr = String(contextValue).toLowerCase();

  switch (condition.operator) {
    case 'equals':
      return contextValueStr === conditionValue;
    
    case 'notEquals':
      return contextValueStr !== conditionValue;
    
    case 'contains':
      return contextValueStr.includes(conditionValue);
    
    default:
      return false;
  }
}

/**
 * Check if content should be displayed based on conditions
 */
export function shouldDisplay(
  conditions: DisplayConditions | undefined,
  context: Record<string, any>
): boolean {
  if (!conditions) {
    return true;
  }
  
  return evaluateConditions(conditions, context);
}
