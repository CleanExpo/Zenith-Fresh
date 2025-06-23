/**
 * Input validation utilities for Zenith Fresh
 */

// Username validation
export function validateUsername(username) {
  if (typeof username !== 'string') {
    return { isValid: false, error: 'Username must be a string' };
  }
  
  if (username.length < 3 || username.length > 50) {
    return { isValid: false, error: 'Username must be between 3 and 50 characters' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { isValid: true };
}

// Password validation
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return { isValid: false, error: 'Password must be a string' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password cannot exceed 128 characters' };
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter, uppercase letter, and number' };
  }
  
  return { isValid: true };
}

// Email validation
export function validateEmail(email) {
  if (typeof email !== 'string') {
    return { isValid: false, error: 'Email must be a string' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email cannot exceed 254 characters' };
  }
  
  return { isValid: true };
}

// Session ID validation
export function validateSessionId(sessionId) {
  if (typeof sessionId !== 'string') {
    return { isValid: false, error: 'Session ID must be a string' };
  }
  
  if (sessionId.length < 10 || sessionId.length > 255) {
    return { isValid: false, error: 'Invalid session ID format' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
    return { isValid: false, error: 'Session ID contains invalid characters' };
  }
  
  return { isValid: true };
}

// Sanitize HTML input
export function sanitizeHtml(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate numeric input
export function validateNumber(value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Value must be a number' };
  }
  
  if (num < min || num > max) {
    return { isValid: false, error: `Value must be between ${min} and ${max}` };
  }
  
  return { isValid: true, value: num };
}

// Rate limiting check
export function checkRateLimit(requests, windowStart, maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  
  // Clean old requests outside the window
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    const oldestRequest = Math.min(...validRequests);
    const resetTime = oldestRequest + windowMs;
    
    return {
      allowed: false,
      resetTime,
      remaining: 0,
      total: maxRequests
    };
  }
  
  return {
    allowed: true,
    remaining: maxRequests - validRequests.length - 1,
    total: maxRequests
  };
}

const validationUtils = {
  validateUsername,
  validatePassword,
  validateEmail,
  validateSessionId,
  sanitizeHtml,
  validateNumber,
  checkRateLimit
};

export default validationUtils;