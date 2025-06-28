/**
 * Rate Limiting Utility
 * Provides configurable rate limiting for API endpoints
 */

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

interface RateLimitConfig {
  requests: number;
  window: string; // e.g., '1h', '1m', '1d'
}

// In-memory store for development/staging
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function parseWindow(window: string): number {
  const unit = window.slice(-1);
  const value = parseInt(window.slice(0, -1));
  
  switch (unit) {
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    case 's': return value * 1000; // seconds
    default: return value * 60 * 60 * 1000; // default to hours
  }
}

export async function rateLimit(
  key: string,
  requests: number,
  window: string
): Promise<RateLimitResult> {
  const windowMs = parseWindow(window);
  const now = Date.now();
  
  // Get or create rate limit entry
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    
    return {
      success: true,
      remaining: requests - 1,
      resetTime
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= requests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    remaining: requests - entry.count,
    resetTime: entry.resetTime
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

export { RateLimitResult, RateLimitConfig };