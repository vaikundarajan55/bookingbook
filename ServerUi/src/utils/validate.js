import { ApiError } from './ApiError.js';

/**
 * Lightweight validator.
 * rules: { field: { required, type: 'number'|'email'|'date', min, max, minLength, maxLength, oneOf } }
 */
export const validate = (data, rules) => {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const empty = value === undefined || value === null || value === '';
    if (empty) {
      if (rule.required) errors[field] = `${field} is required`;
      continue;
    }
    if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field] = 'Enter a valid email address';
    if (rule.type === 'number' && Number.isNaN(Number(value))) errors[field] = `${field} must be a number`;
    if (rule.type === 'date' && Number.isNaN(Date.parse(value))) errors[field] = `${field} must be a valid date`;
    if (rule.min !== undefined && Number(value) < rule.min) errors[field] = `${field} must be at least ${rule.min}`;
    if (rule.max !== undefined && Number(value) > rule.max) errors[field] = `${field} must be at most ${rule.max}`;
    if (rule.minLength && String(value).length < rule.minLength) errors[field] = `${field} must be at least ${rule.minLength} characters`;
    if (rule.maxLength && String(value).length > rule.maxLength) errors[field] = `${field} must be at most ${rule.maxLength} characters`;
    if (rule.oneOf && !rule.oneOf.includes(value)) errors[field] = `${field} must be one of: ${rule.oneOf.join(', ')}`;
  }
  if (Object.keys(errors).length) throw ApiError.badRequest('Validation failed', errors);
};
