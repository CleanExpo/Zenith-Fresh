/**
 * CORS configuration for Zenith Fresh API routes
 */

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://zenith-fresh.vercel.app',
  // Add your production domain here
];

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response, origin = null) {
  // Allow all origins for now, restrict in production
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return response;
}

/**
 * Handle preflight OPTIONS requests
 */
export function handleOptions(request) {
  const origin = request.headers.get('Origin');
  const response = new Response(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

/**
 * Security headers for all responses
 */
export function addSecurityHeaders(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

const corsConfig = {
  addCorsHeaders,
  handleOptions,
  addSecurityHeaders
};

export default corsConfig;