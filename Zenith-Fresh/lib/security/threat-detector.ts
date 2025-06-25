import { NextRequest } from 'next/server';
import { prisma } from '../prisma';
import { getRedis, RedisKeys } from '../redis';

// Threat patterns and rules
const THREAT_PATTERNS = {
  // SQL Injection patterns
  SQL_INJECTION: [
    /(\s*(union|select|insert|delete|update|drop|create|alter|exec|execute)\s+)/i,
    /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /(((\%27)|(\'))union|union.*select)/i,
    /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))\s+/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /(((\%27)|(\'))\s*|\s*)\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))\s+/i,
    /'.*or.*'/i,
    /'.*and.*'/i,
    /--\s*$/,
    /\/\*.*\*\//,
  ],
  
  // XSS patterns
  XSS: [
    /<script[^>]*>.*?<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<link[^>]*>/i,
    /<meta[^>]*>/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i,
    /<svg[^>]*>/i,
  ],
  
  // Command Injection patterns
  COMMAND_INJECTION: [
    /[;&|`$(){}[\]]/,
    /\.\.\//,
    /\/etc\/passwd/i,
    /\/proc\/self\/environ/i,
    /cmd\.exe/i,
    /powershell/i,
    /bash/i,
    /sh\s/i,
    /wget\s/i,
    /curl\s/i,
  ],
  
  // Directory traversal patterns
  DIRECTORY_TRAVERSAL: [
    /\.\.\//,
    /\.\.\\\\+/,
    /%2e%2e%2f/i,
    /%2e%2e\\+/i,
    /\.\.%2f/i,
    /\.\.%5c/i,
  ],
  
  // LDAP Injection patterns
  LDAP_INJECTION: [
    /\*\)\(\|/,
    /\)\(\&/,
    /\*\)\(\!/,
    /\)\(\*/,
  ],
  
  // XXE patterns
  XXE: [
    /<!ENTITY/i,
    /<!DOCTYPE.*ENTITY/i,
    /SYSTEM\s*["']/i,
    /PUBLIC\s*["']/i,
  ],
  
  // SSRF patterns
  SSRF: [
    /localhost/i,
    /127\.0\.0\.1/,
    /0\.0\.0\.0/,
    /10\.\d+\.\d+\.\d+/,
    /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/,
    /192\.168\.\d+\.\d+/,
    /file:\/\//i,
    /gopher:\/\//i,
    /dict:\/\//i,
  ],
  
  // Malicious user agents
  MALICIOUS_USER_AGENT: [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /openvas/i,
    /w3af/i,
    /skipfish/i,
    /burp/i,
    /masscan/i,
    /nmap/i,
    /gobuster/i,
    /dirb/i,
    /dirbuster/i,
    /wfuzz/i,
    /hydra/i,
    /medusa/i,
    /brutus/i,
  ],
  
  // Bot patterns (suspicious)
  SUSPICIOUS_BOT: [
    /bot.*crawler/i,
    /spider.*bot/i,
    /crawler.*spider/i,
    /scan.*tool/i,
    /hack.*tool/i,
    /penetration.*test/i,
    /vulnerability.*scanner/i,
    /security.*scanner/i,
  ],
};

// Suspicious request patterns
const SUSPICIOUS_PATTERNS = {
  // High frequency patterns
  RAPID_REQUESTS: {
    threshold: 100, // requests per minute
    window: 60, // seconds
  },
  
  // Error rate patterns
  HIGH_ERROR_RATE: {
    threshold: 0.5, // 50% error rate
    window: 300, // 5 minutes
    minRequests: 10,
  },
  
  // Unusual request patterns
  UNUSUAL_METHODS: ['TRACE', 'CONNECT', 'OPTIONS'],
  UNUSUAL_PATHS: [
    '/.env',
    '/.git',
    '/admin',
    '/phpmyadmin',
    '/wp-admin',
    '/wp-login.php',
    '/config.php',
    '/backup',
    '/test',
    '/debug',
  ],
  
  // Large payload patterns
  LARGE_PAYLOAD: 10 * 1024 * 1024, // 10MB
  
  // Suspicious headers
  SUSPICIOUS_HEADERS: [
    'x-forwarded-host',
    'x-real-ip',
    'x-forwarded-for',
    'x-cluster-client-ip',
  ],
};

export interface ThreatDetectionResult {
  threat: boolean;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  pattern?: string;
  details?: any;
}

/**
 * Main threat detection function
 */
export async function detectThreats(request: NextRequest): Promise<ThreatDetectionResult> {
  const url = new URL(request.url);
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  // Check URL path
  const pathThreat = checkURLThreats(url.pathname);
  if (pathThreat.threat) return pathThreat;
  
  // Check query parameters
  const queryThreat = checkQueryThreats(url.searchParams);
  if (queryThreat.threat) return queryThreat;
  
  // Check headers
  const headerThreat = checkHeaderThreats(request.headers);
  if (headerThreat.threat) return headerThreat;
  
  // Check user agent
  const userAgentThreat = checkUserAgentThreats(userAgent);
  if (userAgentThreat.threat) return userAgentThreat;
  
  // Check request body (for POST/PUT requests)
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const body = await request.clone().text();
      const bodyThreat = checkBodyThreats(body);
      if (bodyThreat.threat) return bodyThreat;
    } catch (error) {
      // Body might not be text, skip this check
    }
  }
  
  // Check for unusual request patterns
  const patternThreat = await checkRequestPatterns(request);
  if (patternThreat.threat) return patternThreat;
  
  return { threat: false, type: 'NONE', severity: 'LOW' };
}

/**
 * Check URL path for threats
 */
function checkURLThreats(path: string): ThreatDetectionResult {
  // Check for directory traversal
  for (const pattern of THREAT_PATTERNS.DIRECTORY_TRAVERSAL) {
    if (pattern.test(path)) {
      return {
        threat: true,
        type: 'DIRECTORY_TRAVERSAL',
        severity: 'HIGH',
        pattern: pattern.toString(),
        details: { path },
      };
    }
  }
  
  // Check for unusual paths
  for (const suspiciousPath of SUSPICIOUS_PATTERNS.UNUSUAL_PATHS) {
    if (path.includes(suspiciousPath)) {
      return {
        threat: true,
        type: 'SUSPICIOUS_PATH',
        severity: 'MEDIUM',
        details: { path, suspiciousPath },
      };
    }
  }
  
  return { threat: false, type: 'NONE', severity: 'LOW' };
}

/**
 * Check query parameters for threats
 */
function checkQueryThreats(searchParams: URLSearchParams): ThreatDetectionResult {
  const queryString = searchParams.toString();
  
  // Check for SQL injection
  for (const pattern of THREAT_PATTERNS.SQL_INJECTION) {
    if (pattern.test(queryString)) {
      return {
        threat: true,
        type: 'SQL_INJECTION_ATTEMPT',
        severity: 'CRITICAL',
        pattern: pattern.toString(),
        details: { queryString },
      };
    }
  }
  
  // Check for XSS
  for (const pattern of THREAT_PATTERNS.XSS) {
    if (pattern.test(queryString)) {
      return {
        threat: true,
        type: 'XSS_ATTEMPT',
        severity: 'HIGH',
        pattern: pattern.toString(),
        details: { queryString },
      };
    }
  }
  
  // Check for command injection
  for (const pattern of THREAT_PATTERNS.COMMAND_INJECTION) {
    if (pattern.test(queryString)) {
      return {
        threat: true,
        type: 'COMMAND_INJECTION_ATTEMPT',
        severity: 'CRITICAL',
        pattern: pattern.toString(),
        details: { queryString },
      };
    }
  }
  
  return { threat: false, type: 'NONE', severity: 'LOW' };
}

/**
 * Check headers for threats
 */
function checkHeaderThreats(headers: Headers): ThreatDetectionResult {
  const headerObj: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerObj[key.toLowerCase()] = value;
  });
  
  // Check for host header injection
  const host = headerObj['host'];
  if (host && /[<>'"]/g.test(host)) {
    return {
      threat: true,
      type: 'HOST_HEADER_INJECTION',
      severity: 'HIGH',
      details: { host },
    };
  }
  
  // Check for suspicious forwarded headers
  for (const suspiciousHeader of SUSPICIOUS_PATTERNS.SUSPICIOUS_HEADERS) {
    const value = headerObj[suspiciousHeader];
    if (value && (/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(value))) {
      return {
        threat: true,
        type: 'SSRF_ATTEMPT',
        severity: 'HIGH',
        details: { header: suspiciousHeader, value },
      };
    }
  }
  
  return { threat: false, type: 'NONE', severity: 'LOW' };
}

/**
 * Check user agent for threats
 */
function checkUserAgentThreats(userAgent: string): ThreatDetectionResult {
  // Check for malicious user agents
  for (const pattern of THREAT_PATTERNS.MALICIOUS_USER_AGENT) {
    if (pattern.test(userAgent)) {
      return {
        threat: true,
        type: 'MALICIOUS_USER_AGENT',
        severity: 'HIGH',
        pattern: pattern.toString(),
        details: { userAgent },
      };
    }
  }
  
  // Check for suspicious bots
  for (const pattern of THREAT_PATTERNS.SUSPICIOUS_BOT) {
    if (pattern.test(userAgent)) {
      return {
        threat: true,
        type: 'SUSPICIOUS_BOT',
        severity: 'MEDIUM',
        pattern: pattern.toString(),
        details: { userAgent },
      };
    }
  }
  
  return { threat: false, type: 'NONE', severity: 'LOW' };
}

/**
 * Check request body for threats
 */
function checkBodyThreats(body: string): ThreatDetectionResult {
  // Check body size
  if (body.length > SUSPICIOUS_PATTERNS.LARGE_PAYLOAD) {
    return {
      threat: true,
      type: 'LARGE_PAYLOAD',
      severity: 'MEDIUM',
      details: { size: body.length },
    };
  }
  
  // Check for SQL injection in body
  for (const pattern of THREAT_PATTERNS.SQL_INJECTION) {
    if (pattern.test(body)) {
      return {
        threat: true,
        type: 'SQL_INJECTION_ATTEMPT',
        severity: 'CRITICAL',
        pattern: pattern.toString(),
        details: { bodyPreview: body.substring(0, 200) },
      };
    }
  }
  
  // Check for XSS in body
  for (const pattern of THREAT_PATTERNS.XSS) {
    if (pattern.test(body)) {
      return {
        threat: true,
        type: 'XSS_ATTEMPT',
        severity: 'HIGH',
        pattern: pattern.toString(),
        details: { bodyPreview: body.substring(0, 200) },
      };
    }
  }
  
  // Check for XXE
  for (const pattern of THREAT_PATTERNS.XXE) {
    if (pattern.test(body)) {
      return {
        threat: true,
        type: 'XXE_ATTEMPT',
        severity: 'HIGH',
        pattern: pattern.toString(),
        details: { bodyPreview: body.substring(0, 200) },
      };
    }
  }
  
  return { threat: false, type: 'NONE', severity: 'LOW' };
}

/**
 * Check for suspicious request patterns
 */
async function checkRequestPatterns(request: NextRequest): Promise<ThreatDetectionResult> {
  const ip = getClientIP(request);
  const method = request.method;
  const redis = getRedis();
  
  try {
    // Check for unusual HTTP methods
    if (SUSPICIOUS_PATTERNS.UNUSUAL_METHODS.includes(method)) {
      return {
        threat: true,
        type: 'UNUSUAL_HTTP_METHOD',
        severity: 'MEDIUM',
        details: { method },
      };
    }
    
    // Check request frequency
    const frequencyKey = `threat:frequency:${ip}`;
    const currentCount = await redis.incr(frequencyKey);
    if (currentCount === 1) {
      await redis.expire(frequencyKey, SUSPICIOUS_PATTERNS.RAPID_REQUESTS.window);
    }
    
    if (currentCount > SUSPICIOUS_PATTERNS.RAPID_REQUESTS.threshold) {
      return {
        threat: true,
        type: 'RAPID_REQUESTS',
        severity: 'HIGH',
        details: { requestCount: currentCount, ip },
      };
    }
    
    // Check error rate (would need to track errors)
    const errorKey = `threat:errors:${ip}`;
    const requestKey = `threat:requests:${ip}`;
    
    const [errorCount, requestCount] = await Promise.all([
      redis.get(errorKey),
      redis.get(requestKey),
    ]);
    
    if (requestCount && parseInt(requestCount) >= SUSPICIOUS_PATTERNS.HIGH_ERROR_RATE.minRequests) {
      const errorRate = parseInt(errorCount || '0') / parseInt(requestCount);
      if (errorRate >= SUSPICIOUS_PATTERNS.HIGH_ERROR_RATE.threshold) {
        return {
          threat: true,
          type: 'HIGH_ERROR_RATE',
          severity: 'MEDIUM',
          details: { errorRate, errorCount, requestCount, ip },
        };
      }
    }
    
    return { threat: false, type: 'NONE', severity: 'LOW' };
  } catch (error) {
    console.error('Error checking request patterns:', error);
    return { threat: false, type: 'NONE', severity: 'LOW' };
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP;
  
  return request.ip || 'unknown';
}

/**
 * Load custom threat patterns from database
 */
export async function loadCustomThreatPatterns(): Promise<void> {
  try {
    const patterns = await prisma.threatPattern.findMany({
      where: { isActive: true },
    });
    
    // Update patterns in memory
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.pattern, 'i');
        const patternType = pattern.type.toUpperCase() as keyof typeof THREAT_PATTERNS;
        
        if (THREAT_PATTERNS[patternType]) {
          THREAT_PATTERNS[patternType].push(regex);
        }
        
        // Update match count
        await prisma.threatPattern.update({
          where: { id: pattern.id },
          data: { lastMatch: new Date() },
        });
      } catch (error) {
        console.error(`Invalid threat pattern regex: ${pattern.pattern}`, error);
      }
    }
  } catch (error) {
    console.error('Error loading custom threat patterns:', error);
  }
}

/**
 * Add custom threat pattern
 */
export async function addThreatPattern(
  name: string,
  pattern: string,
  type: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  action: 'LOG' | 'BLOCK' | 'RATE_LIMIT'
): Promise<boolean> {
  try {
    // Validate regex pattern
    new RegExp(pattern, 'i');
    
    await prisma.threatPattern.create({
      data: {
        name,
        pattern,
        type,
        severity,
        action,
        isActive: true,
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error adding threat pattern:', error);
    return false;
  }
}

/**
 * Update threat pattern statistics
 */
export async function updateThreatPatternStats(patternId: string): Promise<void> {
  try {
    await prisma.threatPattern.update({
      where: { id: patternId },
      data: {
        matchCount: { increment: 1 },
        lastMatch: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating threat pattern stats:', error);
  }
}

/**
 * Get threat detection statistics
 */
export async function getThreatDetectionStats(days: number = 30): Promise<any> {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const threatEvents = await prisma.securityEvent.findMany({
      where: {
        type: {
          in: [
            'SQL_INJECTION_ATTEMPT',
            'XSS_ATTEMPT',
            'COMMAND_INJECTION_ATTEMPT',
            'DIRECTORY_TRAVERSAL',
            'MALICIOUS_USER_AGENT',
            'SUSPICIOUS_ACTIVITY',
          ],
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    const stats = threatEvents.reduce((acc, event) => {
      const type = event.type;
      const severity = event.severity;
      
      acc.totalThreats++;
      acc.byType[type] = (acc.byType[type] || 0) + 1;
      acc.bySeverity[severity] = (acc.bySeverity[severity] || 0) + 1;
      
      const date = event.createdAt.toISOString().split('T')[0];
      acc.daily[date] = (acc.daily[date] || 0) + 1;
      
      return acc;
    }, {
      totalThreats: 0,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      daily: {} as Record<string, number>,
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting threat detection stats:', error);
    return {
      totalThreats: 0,
      byType: {},
      bySeverity: {},
      daily: {},
    };
  }
}