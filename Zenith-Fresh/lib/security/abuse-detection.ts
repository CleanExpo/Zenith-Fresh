import { getRedis, RedisKeys } from '../redis';
import { prisma } from '../prisma';
import { logSecurityEvent } from './audit-logger';
import { autoBlockSuspiciousIP } from './ip-filtering';

// Abuse detection thresholds and rules
const ABUSE_RULES = {
  // Request frequency rules
  RAPID_REQUESTS: {
    threshold: 1000, // requests per minute
    window: 60, // seconds
    severity: 'HIGH' as const,
    action: 'BLOCK' as const,
  },
  
  // Failed authentication attempts
  BRUTE_FORCE: {
    threshold: 10, // failed attempts
    window: 300, // 5 minutes
    severity: 'HIGH' as const,
    action: 'BLOCK' as const,
  },
  
  // API abuse
  API_ABUSE: {
    threshold: 500, // API calls per hour
    window: 3600, // 1 hour
    severity: 'MEDIUM' as const,
    action: 'RATE_LIMIT' as const,
  },
  
  // Resource consumption
  HIGH_RESOURCE_USAGE: {
    threshold: 10, // high-resource operations per hour
    window: 3600,
    severity: 'MEDIUM' as const,
    action: 'RATE_LIMIT' as const,
  },
  
  // Suspicious patterns
  PATTERN_ABUSE: {
    threshold: 5, // pattern matches
    window: 600, // 10 minutes
    severity: 'HIGH' as const,
    action: 'BLOCK' as const,
  },
  
  // Data scraping
  SCRAPING_BEHAVIOR: {
    threshold: 200, // pages per hour
    window: 3600,
    severity: 'MEDIUM' as const,
    action: 'RATE_LIMIT' as const,
  },
  
  // Error generation
  ERROR_GENERATION: {
    threshold: 50, // errors per hour
    window: 3600,
    severity: 'MEDIUM' as const,
    action: 'RATE_LIMIT' as const,
  },
};

// Behavioral analysis metrics
export interface BehaviorMetrics {
  requestFrequency: number;
  errorRate: number;
  uniqueEndpoints: number;
  userAgentConsistency: number;
  geolocationConsistency: number;
  timePatternRegularity: number;
  responseTimeVariation: number;
  payloadSizeVariation: number;
}

export interface AbuseScore {
  score: number; // 0-100
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggers: string[];
  details: any;
}

export interface AbuseDetectionResult {
  isAbuse: boolean;
  score: AbuseScore;
  action: 'ALLOW' | 'RATE_LIMIT' | 'BLOCK' | 'CAPTCHA';
  reason?: string;
}

/**
 * Main abuse detection function
 */
export async function detectAbuse(
  identifier: string, // IP or user ID
  context: {
    ip: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    responseTime?: number;
    statusCode?: number;
    payloadSize?: number;
    userId?: string;
  }
): Promise<AbuseDetectionResult> {
  try {
    // Get behavioral metrics
    const metrics = await getBehaviorMetrics(identifier);
    
    // Calculate abuse score
    const abuseScore = await calculateAbuseScore(identifier, metrics, context);
    
    // Check specific abuse rules
    const ruleViolations = await checkAbuseRules(identifier, context);
    
    // Determine action based on score and violations
    const action = determineAction(abuseScore, ruleViolations);
    
    // Log if abuse detected
    if (abuseScore.risk !== 'LOW' || ruleViolations.length > 0) {
      await logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: abuseScore.risk,
        sourceIp: context.ip,
        userAgent: context.userAgent,
        userId: context.userId,
        details: {
          abuseScore: abuseScore.score,
          triggers: abuseScore.triggers,
          violations: ruleViolations,
          metrics,
          context,
        },
        blocked: action === 'BLOCK',
      });
    }
    
    // Execute action if needed
    if (action === 'BLOCK') {
      await executeBlockAction(identifier, context, abuseScore);
    }
    
    return {
      isAbuse: abuseScore.risk !== 'LOW' || ruleViolations.length > 0,
      score: abuseScore,
      action,
      reason: abuseScore.triggers.join(', '),
    };
  } catch (error) {
    console.error('Error in abuse detection:', error);
    return {
      isAbuse: false,
      score: { score: 0, risk: 'LOW', triggers: [], details: {} },
      action: 'ALLOW',
    };
  }
}

/**
 * Get behavioral metrics for an identifier
 */
async function getBehaviorMetrics(identifier: string): Promise<BehaviorMetrics> {
  const redis = getRedis();
  const window = 3600; // 1 hour analysis window
  const now = Date.now();
  const windowStart = now - (window * 1000);
  
  try {
    // Get request data from the last hour
    const requestData = await getRequestHistory(identifier, windowStart, now);
    
    // Calculate metrics
    const metrics: BehaviorMetrics = {
      requestFrequency: calculateRequestFrequency(requestData, window),
      errorRate: calculateErrorRate(requestData),
      uniqueEndpoints: calculateUniqueEndpoints(requestData),
      userAgentConsistency: calculateUserAgentConsistency(requestData),
      geolocationConsistency: calculateGeolocationConsistency(requestData),
      timePatternRegularity: calculateTimePatternRegularity(requestData),
      responseTimeVariation: calculateResponseTimeVariation(requestData),
      payloadSizeVariation: calculatePayloadSizeVariation(requestData),
    };
    
    // Cache metrics for a short time
    await redis.setex(
      `abuse:metrics:${identifier}`,
      300, // 5 minutes
      JSON.stringify(metrics)
    );
    
    return metrics;
  } catch (error) {
    console.error('Error getting behavior metrics:', error);
    return {
      requestFrequency: 0,
      errorRate: 0,
      uniqueEndpoints: 0,
      userAgentConsistency: 100,
      geolocationConsistency: 100,
      timePatternRegularity: 50,
      responseTimeVariation: 50,
      payloadSizeVariation: 50,
    };
  }
}

/**
 * Calculate abuse score based on metrics and context
 */
async function calculateAbuseScore(
  identifier: string,
  metrics: BehaviorMetrics,
  context: any
): Promise<AbuseScore> {
  let score = 0;
  const triggers: string[] = [];
  const details: any = {};
  
  // Request frequency scoring (0-30 points)
  if (metrics.requestFrequency > 500) {
    score += 30;
    triggers.push('Very high request frequency');
  } else if (metrics.requestFrequency > 200) {
    score += 20;
    triggers.push('High request frequency');
  } else if (metrics.requestFrequency > 100) {
    score += 10;
    triggers.push('Elevated request frequency');
  }
  
  // Error rate scoring (0-25 points)
  if (metrics.errorRate > 0.5) {
    score += 25;
    triggers.push('Very high error rate');
  } else if (metrics.errorRate > 0.3) {
    score += 15;
    triggers.push('High error rate');
  } else if (metrics.errorRate > 0.1) {
    score += 8;
    triggers.push('Elevated error rate');
  }
  
  // Endpoint diversity scoring (0-15 points)
  if (metrics.uniqueEndpoints > 50) {
    score += 15;
    triggers.push('Excessive endpoint exploration');
  } else if (metrics.uniqueEndpoints > 20) {
    score += 10;
    triggers.push('High endpoint diversity');
  }
  
  // User agent consistency scoring (0-15 points)
  if (metrics.userAgentConsistency < 50) {
    score += 15;
    triggers.push('Inconsistent user agent');
  } else if (metrics.userAgentConsistency < 80) {
    score += 8;
    triggers.push('Variable user agent');
  }
  
  // Time pattern regularity scoring (0-10 points)
  if (metrics.timePatternRegularity > 90) {
    score += 10;
    triggers.push('Highly regular request pattern');
  } else if (metrics.timePatternRegularity > 80) {
    score += 5;
    triggers.push('Regular request pattern');
  }
  
  // Response time variation scoring (0-5 points)
  if (metrics.responseTimeVariation < 10) {
    score += 5;
    triggers.push('Suspiciously consistent response times');
  }
  
  // Historical abuse score
  const historicalScore = await getHistoricalAbuseScore(identifier);
  score += historicalScore * 0.2; // 20% weight for historical behavior
  
  if (historicalScore > 50) {
    triggers.push('Previous abuse history');
  }
  
  // Determine risk level
  let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (score >= 80) {
    risk = 'CRITICAL';
  } else if (score >= 60) {
    risk = 'HIGH';
  } else if (score >= 30) {
    risk = 'MEDIUM';
  } else {
    risk = 'LOW';
  }
  
  details.rawMetrics = metrics;
  details.calculationBreakdown = {
    requestFrequencyScore: Math.min(30, metrics.requestFrequency / 500 * 30),
    errorRateScore: Math.min(25, metrics.errorRate * 50),
    endpointDiversityScore: Math.min(15, metrics.uniqueEndpoints / 50 * 15),
    userAgentScore: Math.min(15, (100 - metrics.userAgentConsistency) / 100 * 15),
    timePatternScore: Math.min(10, metrics.timePatternRegularity / 100 * 10),
    historicalScore: historicalScore * 0.2,
  };
  
  return { score, risk, triggers, details };
}

/**
 * Check specific abuse rules
 */
async function checkAbuseRules(identifier: string, context: any): Promise<string[]> {
  const redis = getRedis();
  const violations: string[] = [];
  
  try {
    // Check each rule
    for (const [ruleName, rule] of Object.entries(ABUSE_RULES)) {
      const key = `abuse:${ruleName.toLowerCase()}:${identifier}`;
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, rule.window);
      }
      
      if (current > rule.threshold) {
        violations.push(ruleName);
      }
    }
    
    return violations;
  } catch (error) {
    console.error('Error checking abuse rules:', error);
    return [];
  }
}

/**
 * Determine action based on score and violations
 */
function determineAction(
  abuseScore: AbuseScore,
  violations: string[]
): 'ALLOW' | 'RATE_LIMIT' | 'BLOCK' | 'CAPTCHA' {
  // Critical risk or specific violations always block
  if (abuseScore.risk === 'CRITICAL' || violations.some(v => ABUSE_RULES[v as keyof typeof ABUSE_RULES]?.action === 'BLOCK')) {
    return 'BLOCK';
  }
  
  // High risk or rate limit violations
  if (abuseScore.risk === 'HIGH' || violations.some(v => ABUSE_RULES[v as keyof typeof ABUSE_RULES]?.action === 'RATE_LIMIT')) {
    return 'RATE_LIMIT';
  }
  
  // Medium risk might require CAPTCHA
  if (abuseScore.risk === 'MEDIUM' && abuseScore.score > 40) {
    return 'CAPTCHA';
  }
  
  return 'ALLOW';
}

/**
 * Execute block action
 */
async function executeBlockAction(
  identifier: string,
  context: any,
  abuseScore: AbuseScore
): Promise<void> {
  try {
    // If identifier is an IP, auto-block it
    if (isIPAddress(identifier)) {
      await autoBlockSuspiciousIP(
        identifier,
        `Abuse detected: ${abuseScore.triggers.join(', ')}`,
        abuseScore.risk as 'HIGH' | 'CRITICAL',
        3600 // 1 hour block
      );
    }
    
    // Log the block action
    await logSecurityEvent({
      type: 'IP_BLOCKED',
      severity: abuseScore.risk,
      sourceIp: context.ip,
      userAgent: context.userAgent,
      userId: context.userId,
      details: {
        reason: 'Automated abuse detection',
        score: abuseScore.score,
        triggers: abuseScore.triggers,
        identifier,
      },
      blocked: true,
    });
  } catch (error) {
    console.error('Error executing block action:', error);
  }
}

/**
 * Get request history for analysis
 */
async function getRequestHistory(identifier: string, startTime: number, endTime: number): Promise<any[]> {
  try {
    // This would typically come from your logging system
    // For now, get from security events
    const events = await prisma.securityEvent.findMany({
      where: {
        sourceIp: identifier,
        createdAt: {
          gte: new Date(startTime),
          lte: new Date(endTime),
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 1000, // Limit for performance
    });
    
    return events.map(event => ({
      timestamp: event.createdAt.getTime(),
      endpoint: (event.details as any)?.pathname || '',
      method: (event.details as any)?.method || 'GET',
      statusCode: (event.details as any)?.statusCode || 200,
      userAgent: event.userAgent || '',
      responseTime: (event.details as any)?.responseTime || 0,
      payloadSize: (event.details as any)?.payloadSize || 0,
    }));
  } catch (error) {
    console.error('Error getting request history:', error);
    return [];
  }
}

/**
 * Calculate request frequency (requests per minute)
 */
function calculateRequestFrequency(requests: any[], windowSeconds: number): number {
  if (requests.length === 0) return 0;
  return (requests.length / windowSeconds) * 60;
}

/**
 * Calculate error rate
 */
function calculateErrorRate(requests: any[]): number {
  if (requests.length === 0) return 0;
  const errors = requests.filter(r => r.statusCode >= 400).length;
  return errors / requests.length;
}

/**
 * Calculate unique endpoints accessed
 */
function calculateUniqueEndpoints(requests: any[]): number {
  const endpoints = new Set(requests.map(r => r.endpoint));
  return endpoints.size;
}

/**
 * Calculate user agent consistency
 */
function calculateUserAgentConsistency(requests: any[]): number {
  if (requests.length === 0) return 100;
  const userAgents = new Set(requests.map(r => r.userAgent));
  return Math.max(0, 100 - (userAgents.size - 1) * 20);
}

/**
 * Calculate geolocation consistency (placeholder)
 */
function calculateGeolocationConsistency(requests: any[]): number {
  // This would analyze IP geolocation changes
  // For now, return a default value
  return 90;
}

/**
 * Calculate time pattern regularity
 */
function calculateTimePatternRegularity(requests: any[]): number {
  if (requests.length < 3) return 50;
  
  const intervals = [];
  for (let i = 1; i < requests.length; i++) {
    intervals.push(requests[i].timestamp - requests[i-1].timestamp);
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => {
    return sum + Math.pow(interval - avgInterval, 2);
  }, 0) / intervals.length;
  
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = standardDeviation / avgInterval;
  
  // Lower coefficient of variation = more regular = higher score
  return Math.max(0, 100 - (coefficientOfVariation * 100));
}

/**
 * Calculate response time variation
 */
function calculateResponseTimeVariation(requests: any[]): number {
  if (requests.length < 2) return 50;
  
  const responseTimes = requests.map(r => r.responseTime).filter(t => t > 0);
  if (responseTimes.length === 0) return 50;
  
  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const variance = responseTimes.reduce((sum, time) => {
    return sum + Math.pow(time - avg, 2);
  }, 0) / responseTimes.length;
  
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = avg > 0 ? (standardDeviation / avg) * 100 : 0;
  
  return Math.min(100, coefficientOfVariation);
}

/**
 * Calculate payload size variation
 */
function calculatePayloadSizeVariation(requests: any[]): number {
  if (requests.length < 2) return 50;
  
  const payloadSizes = requests.map(r => r.payloadSize).filter(s => s > 0);
  if (payloadSizes.length === 0) return 50;
  
  const avg = payloadSizes.reduce((a, b) => a + b, 0) / payloadSizes.length;
  const variance = payloadSizes.reduce((sum, size) => {
    return sum + Math.pow(size - avg, 2);
  }, 0) / payloadSizes.length;
  
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = avg > 0 ? (standardDeviation / avg) * 100 : 0;
  
  return Math.min(100, coefficientOfVariation);
}

/**
 * Get historical abuse score
 */
async function getHistoricalAbuseScore(identifier: string): Promise<number> {
  try {
    const redis = getRedis();
    const cached = await redis.get(RedisKeys.abuseScore(identifier));
    
    if (cached) {
      return parseFloat(cached);
    }
    
    // Calculate based on historical security events
    const events = await prisma.securityEvent.findMany({
      where: {
        sourceIp: identifier,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });
    
    let score = 0;
    for (const event of events) {
      switch (event.severity) {
        case 'CRITICAL': score += 10; break;
        case 'HIGH': score += 5; break;
        case 'MEDIUM': score += 2; break;
        case 'LOW': score += 1; break;
      }
    }
    
    score = Math.min(100, score);
    
    // Cache for 1 hour
    await redis.setex(RedisKeys.abuseScore(identifier), 3600, score.toString());
    
    return score;
  } catch (error) {
    console.error('Error getting historical abuse score:', error);
    return 0;
  }
}

/**
 * Check if string is an IP address
 */
function isIPAddress(str: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(str) || ipv6Regex.test(str);
}

/**
 * Reset abuse score for identifier (admin function)
 */
export async function resetAbuseScore(identifier: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(RedisKeys.abuseScore(identifier));
    
    // Clear all abuse rule counters
    const keys = await redis.keys(`abuse:*:${identifier}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Error resetting abuse score:', error);
  }
}

/**
 * Get abuse detection statistics
 */
export async function getAbuseDetectionStats(days: number = 30): Promise<any> {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const abuseEvents = await prisma.securityEvent.findMany({
      where: {
        type: 'SUSPICIOUS_ACTIVITY',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    const stats = {
      totalAbuseAttempts: abuseEvents.length,
      bySeverity: {} as Record<string, number>,
      byDay: {} as Record<string, number>,
      topAbusers: {} as Record<string, number>,
      blockedAttempts: abuseEvents.filter(e => e.blocked).length,
    };
    
    for (const event of abuseEvents) {
      // By severity
      stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
      
      // By day
      const day = event.createdAt.toISOString().split('T')[0];
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      
      // Top abusers
      const ip = event.sourceIp;
      stats.topAbusers[ip] = (stats.topAbusers[ip] || 0) + 1;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting abuse detection stats:', error);
    return {
      totalAbuseAttempts: 0,
      bySeverity: {},
      byDay: {},
      topAbusers: {},
      blockedAttempts: 0,
    };
  }
}