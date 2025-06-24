/**
 * Security Hardening Middleware
 * 
 * Implements comprehensive security measures including rate limiting,
 * input validation, XSS protection, and threat detection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { securitySuite } from '@/lib/security/comprehensive-security-suite';

export async function securityHardeningMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  try {
    // Apply security headers
    const securityHeaders = await securitySuite.createSecurityMiddleware()(request);
    
    // Copy security headers to response
    securityHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    // Check rate limiting
    const rateLimitResult = await securitySuite.checkRateLimit(request);
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          resetTime: rateLimitResult.resetTime 
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    // For POST/PUT/PATCH requests, validate input
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        try {
          const body = await request.clone().json();
          const sanitizedBody = await securitySuite.sanitizeAndValidateInput(body);
          
          // Log if sanitization changed the input
          if (JSON.stringify(body) !== JSON.stringify(sanitizedBody)) {
            await securitySuite.logSecurityEvent(
              'Input sanitization applied',
              'low',
              request.ip || 'unknown',
              { 
                originalSize: JSON.stringify(body).length,
                sanitizedSize: JSON.stringify(sanitizedBody).length,
                url: request.url
              }
            );
          }
        } catch (error) {
          // Invalid JSON - let the application handle it
        }
      }
    }
    
    return response;
    
  } catch (error) {
    console.error('Security middleware error:', error);
    
    // Log security middleware errors
    await securitySuite.logSecurityEvent(
      'Security middleware error',
      'medium',
      request.ip || 'unknown',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        url: request.url,
        method: request.method
      }
    );
    
    return response;
  }
}

// Enhanced security for API routes
export async function apiSecurityMiddleware(request: NextRequest) {
  // Additional API-specific security measures
  const userAgent = request.headers.get('user-agent');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Block requests without User-Agent (likely bots)
  if (!userAgent || userAgent.length < 5) {
    await securitySuite.logSecurityEvent(
      'Suspicious request without User-Agent',
      'medium',
      request.ip || 'unknown',
      { url: request.url, method: request.method }
    );
    
    return new NextResponse(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Validate origin for cross-origin requests
  if (request.method !== 'GET' && origin) {
    const allowedOrigins = [
      process.env.NEXTAUTH_URL,
      'https://zenith.engineer',
      'https://www.zenith.engineer'
    ].filter(Boolean);
    
    if (!allowedOrigins.includes(origin)) {
      await securitySuite.logSecurityEvent(
        'Unauthorized cross-origin request',
        'high',
        request.ip || 'unknown',
        { origin, url: request.url, method: request.method }
      );
      
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  return NextResponse.next();
}

// File upload security middleware
export async function fileUploadSecurityMiddleware(request: NextRequest) {
  if (request.method !== 'POST' || !request.headers.get('content-type')?.includes('multipart/form-data')) {
    return NextResponse.next();
  }
  
  try {
    const formData = await request.formData();
    const files = Array.from(formData.values()).filter(value => value instanceof File) as File[];
    
    for (const file of files) {
      const validation = await securitySuite.validateFileUpload(file);
      
      if (!validation.valid) {
        await securitySuite.logSecurityEvent(
          'Malicious file upload attempt',
          validation.quarantined ? 'critical' : 'high',
          request.ip || 'unknown',
          { 
            filename: file.name,
            size: file.size,
            type: file.type,
            issues: validation.issues
          },
          validation.quarantined ? 'File quarantined' : 'Upload rejected'
        );
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'File validation failed', 
            issues: validation.issues 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return NextResponse.next();
    
  } catch (error) {
    console.error('File upload security error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'File processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// CSRF protection middleware
export async function csrfProtectionMiddleware(request: NextRequest) {
  // Only apply CSRF protection to state-changing requests
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return NextResponse.next();
  }
  
  // Skip CSRF for API routes with valid API keys
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && await validateApiKey(apiKey)) {
    return NextResponse.next();
  }
  
  const sessionId = request.cookies.get('next-auth.session-token')?.value;
  const csrfToken = request.headers.get('x-csrf-token');
  
  if (!sessionId || !csrfToken) {
    return new NextResponse(
      JSON.stringify({ error: 'CSRF token required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const isValidToken = await securitySuite.validateCSRFToken(sessionId, csrfToken);
  
  if (!isValidToken) {
    await securitySuite.logSecurityEvent(
      'Invalid CSRF token',
      'high',
      request.ip || 'unknown',
      { sessionId, url: request.url, method: request.method }
    );
    
    return new NextResponse(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return NextResponse.next();
}

// Helper function to validate API keys
async function validateApiKey(apiKey: string): Promise<boolean> {
  // Implementation would check against database or secure storage
  const validApiKeys = [
    process.env.INTERNAL_API_KEY,
    process.env.WEBHOOK_API_KEY
  ].filter(Boolean);
  
  return validApiKeys.includes(apiKey);
}