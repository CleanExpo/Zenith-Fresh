/**
 * ZENITH ENTERPRISE INPUT VALIDATOR
 * Comprehensive input validation and sanitization for API security
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { securitySuite } from './enterprise-security-suite';

// Common validation schemas
export const ValidationSchemas = {
  // Basic data types
  email: z.string().email().max(254).refine(
    (email) => securitySuite.validateEmail(email),
    { message: 'Invalid email format or potentially malicious' }
  ),
  
  password: z.string().min(8).max(128).refine(
    (password) => securitySuite.checkPasswordStrength(password).isStrong,
    { message: 'Password does not meet security requirements' }
  ),
  
  url: z.string().url().refine(
    (url) => securitySuite.validateURL(url),
    { message: 'URL is not allowed or potentially malicious' }
  ),
  
  // Sanitized strings
  safeString: z.string().max(1000).transform(
    (str) => securitySuite.sanitizeHTML(str)
  ),
  
  sqlSafeString: z.string().max(1000).transform(
    (str) => securitySuite.sanitizeSQL(str)
  ),
  
  // Numeric validations
  positiveInteger: z.number().int().positive(),
  limitedInteger: z.number().int().min(1).max(1000),
  
  // ID validations
  uuid: z.string().uuid(),
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  
  // File validations
  fileName: z.string().max(255).refine(
    (name) => !/[<>:"/\\|?*]/.test(name),
    { message: 'Invalid file name characters' }
  ),
  
  fileSize: z.number().max(50 * 1024 * 1024), // 50MB max
  
  // JSON validation
  jsonString: z.string().refine(
    (str) => {
      try {
        JSON.parse(str);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid JSON format' }
  ),
  
  // API key validation
  apiKey: z.string().refine(
    (key) => securitySuite.verifyAPIKey(key),
    { message: 'Invalid API key format' }
  ),
};

// Request validation schemas
export const RequestSchemas = {
  // User registration
  userRegistration: z.object({
    email: ValidationSchemas.email,
    password: ValidationSchemas.password,
    name: z.string().min(1).max(100).transform(str => securitySuite.sanitizeHTML(str)),
    terms: z.boolean().refine(val => val === true, { message: 'Terms must be accepted' }),
  }),
  
  // User login
  userLogin: z.object({
    email: ValidationSchemas.email,
    password: z.string().min(1).max(128),
    rememberMe: z.boolean().optional(),
  }),
  
  // Profile update
  profileUpdate: z.object({
    name: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    website: ValidationSchemas.url.optional(),
    location: z.string().max(100).optional(),
  }).transform(data => ({
    ...data,
    name: data.name ? securitySuite.sanitizeHTML(data.name) : undefined,
    bio: data.bio ? securitySuite.sanitizeHTML(data.bio) : undefined,
    location: data.location ? securitySuite.sanitizeHTML(data.location) : undefined,
  })),
  
  // Search query
  searchQuery: z.object({
    q: z.string().min(1).max(200).transform(str => securitySuite.sanitizeHTML(str)),
    limit: z.number().int().min(1).max(100).default(10),
    offset: z.number().int().min(0).default(0),
    sort: z.enum(['relevance', 'date', 'popularity']).default('relevance'),
  }),
  
  // File upload
  fileUpload: z.object({
    fileName: ValidationSchemas.fileName,
    fileSize: ValidationSchemas.fileSize,
    mimeType: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'].includes(type),
      { message: 'File type not allowed' }
    ),
  }),
  
  // Contact form
  contactForm: z.object({
    name: z.string().min(1).max(100),
    email: ValidationSchemas.email,
    subject: z.string().min(1).max(200),
    message: z.string().min(1).max(2000),
  }).transform(data => ({
    name: securitySuite.sanitizeHTML(data.name),
    email: data.email.toLowerCase(),
    subject: securitySuite.sanitizeHTML(data.subject),
    message: securitySuite.sanitizeHTML(data.message),
  })),
  
  // API pagination
  pagination: z.object({
    page: z.number().int().min(1).max(1000).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

export class InputValidator {
  private static securityChecks = {
    // Check for common injection patterns
    checkInjectionPatterns: (input: string): string[] => {
      const threats: string[] = [];
      
      // SQL injection patterns
      const sqlPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /insert\s+into/i,
        /delete\s+from/i,
        /update\s+set/i,
        /exec\s*\(/i,
        /sp_executesql/i,
      ];
      
      if (sqlPatterns.some(pattern => pattern.test(input))) {
        threats.push('SQL Injection');
      }
      
      // XSS patterns
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
      ];
      
      if (xssPatterns.some(pattern => pattern.test(input))) {
        threats.push('XSS');
      }
      
      // Command injection patterns
      const commandPatterns = [
        /[;&|`$()]/,
        /\|\s*nc\s/i,
        /wget\s|curl\s/i,
        /\/bin\/\w+/,
      ];
      
      if (commandPatterns.some(pattern => pattern.test(input))) {
        threats.push('Command Injection');
      }
      
      // Path traversal
      if (/\.\.\/|\.\.\\/.test(input)) {
        threats.push('Path Traversal');
      }
      
      return threats;
    },
    
    // Check for suspicious file names
    checkFileName: (fileName: string): boolean => {
      const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
        '.jar', '.php', '.asp', '.aspx', '.jsp', '.sh', '.py', '.pl',
      ];
      
      const lowercaseName = fileName.toLowerCase();
      return !dangerousExtensions.some(ext => lowercaseName.endsWith(ext));
    },
    
    // Check content length
    checkContentLength: (content: string, maxLength: number): boolean => {
      return content.length <= maxLength;
    },
  };

  // Validate and sanitize request data
  static async validateRequest<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    options: {
      allowUnknown?: boolean;
      stripUnknown?: boolean;
      threatDetection?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    data?: T;
    errors?: string[];
    threats?: string[];
  }> {
    try {
      // Perform threat detection if enabled
      let threats: string[] = [];
      if (options.threatDetection && typeof data === 'object' && data !== null) {
        threats = this.performThreatDetection(data);
        if (threats.length > 0) {
          // Log security event
          securitySuite.logSecurityEvent({
            type: 'SUSPICIOUS_ACTIVITY',
            ip: 'unknown', // Should be provided by middleware
            details: { threats, data: JSON.stringify(data) },
          });
        }
      }
      
      // Validate with Zod schema
      const result = await schema.parseAsync(data);
      
      return {
        success: true,
        data: result,
        threats: threats.length > 0 ? threats : undefined,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      
      return {
        success: false,
        errors: ['Validation failed'],
      };
    }
  }

  // Perform comprehensive threat detection
  private static performThreatDetection(data: any): string[] {
    const threats = new Set<string>();
    
    const checkValue = (value: any) => {
      if (typeof value === 'string') {
        const detectedThreats = this.securityChecks.checkInjectionPatterns(value);
        detectedThreats.forEach(threat => threats.add(threat));
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(checkValue);
      }
    };
    
    checkValue(data);
    return Array.from(threats);
  }

  // Sanitize HTML content
  static sanitizeHTML(content: string, options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  }): string {
    if (!content) return '';
    
    const defaultOptions = {
      ALLOWED_TAGS: options?.allowedTags || ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: options?.allowedAttributes || ['href', 'title'],
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe'],
    };
    
    return DOMPurify.sanitize(content, defaultOptions);
  }

  // Validate file upload
  static validateFileUpload(file: {
    name: string;
    size: number;
    type: string;
    buffer?: Buffer;
  }): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check file name
    if (!this.securityChecks.checkFileName(file.name)) {
      errors.push('File type not allowed');
    }
    
    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      errors.push('File size too large');
    }
    
    // Check MIME type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/json', 'application/xml',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }
    
    // Check for null bytes
    if (file.name.includes('\0')) {
      errors.push('Invalid file name');
    }
    
    // If we have the file buffer, check for malicious content
    if (file.buffer) {
      // Check for executable headers
      const executableHeaders = [
        Buffer.from([0x4D, 0x5A]), // PE/COFF
        Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF
        Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Mach-O
      ];
      
      const fileHeader = file.buffer.slice(0, 4);
      if (executableHeaders.some(header => fileHeader.equals(header.slice(0, fileHeader.length)))) {
        errors.push('Executable file detected');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Create validation middleware for Express/Next.js
  static createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
    return async (req: any, res: any, next: any) => {
      const result = await this.validateRequest(req.body, schema, {
        threatDetection: true,
      });
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation Error',
          details: result.errors,
        });
      }
      
      if (result.threats && result.threats.length > 0) {
        // Log security event but don't block request
        securitySuite.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          details: { threats: result.threats },
        });
      }
      
      // Attach validated data to request
      req.validatedBody = result.data;
      next();
    };
  }
}

// Export commonly used validators
export const validateUserRegistration = (data: unknown) =>
  InputValidator.validateRequest(data, RequestSchemas.userRegistration);

export const validateUserLogin = (data: unknown) =>
  InputValidator.validateRequest(data, RequestSchemas.userLogin);

export const validateSearchQuery = (data: unknown) =>
  InputValidator.validateRequest(data, RequestSchemas.searchQuery);

export const validateFileUpload = InputValidator.validateFileUpload;
export const sanitizeHTML = InputValidator.sanitizeHTML;