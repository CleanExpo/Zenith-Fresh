/**
 * Rate Limit Middleware Placeholder
 * 
 * NOTE: This module requires Express and rate-limit dependencies which are not installed in the basic build.
 * For production deployment with rate limiting, install required packages:
 * npm install express express-rate-limit @types/express
 */

// Placeholder types for production build compatibility
export interface Request {
  [key: string]: any;
}

export interface Response {
  [key: string]: any;
}

export interface NextFunction {
  (): void;
}

// Placeholder rate limit functions
export function createRateLimit(options: any) {
  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    console.warn('Rate Limit Middleware: Mock implementation - Express dependencies required');
    next();
  };
}

// Export placeholder middleware instances
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
});

export const aiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: 'Too many AI requests, please wait before trying again.',
});

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 upload requests per minute
  message: 'Too many upload requests, please wait before trying again.',
});

export default generalRateLimit;