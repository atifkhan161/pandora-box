/**
 * Form Validation Utilities
 * Provides validation functions for form inputs
 */

/**
 * Validate username
 * @param {string} username 
 * @returns {object} { isValid: boolean, message?: string }
 */
export function validateUsername(username) {
  if (!username || username.trim().length === 0) {
    return { isValid: false, message: 'Username is required' };
  }
  
  if (username.trim().length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters' };
  }
  
  if (username.trim().length > 50) {
    return { isValid: false, message: 'Username must be less than 50 characters' };
  }
  
  // Check for valid characters (alphanumeric, underscore, hyphen)
  const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validUsernameRegex.test(username.trim())) {
    return { isValid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { isValid: true };
}

/**
 * Validate password
 * @param {string} password 
 * @returns {object} { isValid: boolean, message?: string }
 */
export function validatePassword(password) {
  if (!password || password.length === 0) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }
  
  return { isValid: true };
}

/**
 * Validate email address
 * @param {string} email 
 * @returns {object} { isValid: boolean, message?: string }
 */
export function validateEmail(email) {
  if (!email || email.trim().length === 0) {
    return { isValid: false, message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
}

/**
 * Validate required field
 * @param {string} value 
 * @param {string} fieldName 
 * @returns {object} { isValid: boolean, message?: string }
 */
export function validateRequired(value, fieldName = 'Field') {
  if (!value || value.toString().trim().length === 0) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  return { isValid: true };
}

/**
 * Validate string length
 * @param {string} value 
 * @param {number} minLength 
 * @param {number} maxLength 
 * @param {string} fieldName 
 * @returns {object} { isValid: boolean, message?: string }
 */
export function validateLength(value, minLength, maxLength, fieldName = 'Field') {
  if (!value) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const length = value.toString().trim().length;
  
  if (length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (length > maxLength) {
    return { isValid: false, message: `${fieldName} must be less than ${maxLength} characters` };
  }
  
  return { isValid: true };
}

/**
 * Validate URL
 * @param {string} url 
 * @returns {object} { isValid: boolean, message?: string }
 */
export function validateUrl(url) {
  if (!url || url.trim().length === 0) {
    return { isValid: false, message: 'URL is required' };
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, message: 'Please enter a valid URL' };
  }
}

/**
 * Validate numeric value
 * @param {string|number} value 
 * @param {number} min 
 * @param {number} max 
 * @param {string} fieldName 
 * @returns {object} { isValid: boolean, message?: string }
 */
export function validateNumber(value, min = null, max = null, fieldName = 'Number') {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }
  
  if (min !== null && num < min) {
    return { isValid: false, message: `${fieldName} must be at least ${min}` };
  }
  
  if (max !== null && num > max) {
    return { isValid: false, message: `${fieldName} must be at most ${max}` };
  }
  
  return { isValid: true };
}

/**
 * Validate form data against rules
 * @param {object} data 
 * @param {object} rules 
 * @returns {object} { isValid: boolean, errors: object }
 */
export function validateForm(data, rules) {
  const errors = {};
  let isValid = true;
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      const result = rule(value);
      
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }
  
  return { isValid, errors };
}

/**
 * Create validation rule for required fields
 * @param {string} fieldName 
 * @returns {function}
 */
export function required(fieldName) {
  return (value) => validateRequired(value, fieldName);
}

/**
 * Create validation rule for string length
 * @param {number} minLength 
 * @param {number} maxLength 
 * @param {string} fieldName 
 * @returns {function}
 */
export function length(minLength, maxLength, fieldName) {
  return (value) => validateLength(value, minLength, maxLength, fieldName);
}

/**
 * Create validation rule for email
 * @returns {function}
 */
export function email() {
  return (value) => validateEmail(value);
}

/**
 * Create validation rule for username
 * @returns {function}
 */
export function username() {
  return (value) => validateUsername(value);
}

/**
 * Create validation rule for password
 * @returns {function}
 */
export function password() {
  return (value) => validatePassword(value);
}