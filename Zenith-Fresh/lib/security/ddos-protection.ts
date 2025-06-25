import { getRedis, RedisKeys } from '../redis';
import { logSecurityEvent } from './audit-logger';
import { autoBlockSuspiciousIP } from './ip-filtering';

// DDoS protection configuration
const DDOS_CONFIG = {
  // Traffic thresholds
  TRAFFIC_SPIKE_THRESHOLD: 1000, // requests per minute
  DDOS_THRESHOLD: 5000, // requests per minute
  SUSTAINED_ATTACK_THRESHOLD: 2000, // requests per minute for 5+ minutes
  
  // Time windows
  SPIKE_WINDOW: 60, // seconds
  DDOS_WINDOW: 60, // seconds
  SUSTAINED_WINDOW: 300, // 5 minutes
  
  // Mitigation settings
  AUTO_BLOCK_DURATION: 3600, // 1 hour
  RATE_LIMIT_DURATION: 300, // 5 minutes
  CAPTCHA_DURATION: 900, // 15 minutes
  
  // Pattern detection
  PATTERN_SIMILARITY_THRESHOLD: 0.8,
  MIN_PATTERN_REQUESTS: 50,
  
  // Geographic distribution
  GEO_CONCENTRATION_THRESHOLD: 0.7, // 70% from single location
  
  // User agent distribution
  UA_CONCENTRATION_THRESHOLD: 0.8, // 80% same user agent
};

export interface DDoSAnalysisResult {
  isDDoS: boolean;
  attackType: 'NONE' | 'VOLUMETRIC' | 'PROTOCOL' | 'APPLICATION' | 'DISTRIBUTED' | 'SLOW_LORIS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100
  metrics: DDoSMetrics;
  mitigation: MitigationAction;
}

export interface DDoSMetrics {
  requestRate: number; // requests per minute
  uniqueIPs: number;
  topSourceIPs: Array<{ ip: string; count: number }>;
  userAgentDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  patternSimilarity: number;
  errorRate: number;
  averageResponseTime: number;
  bandwidthUsage: number;
}

export interface MitigationAction {
  action: 'NONE' | 'RATE_LIMIT' | 'BLOCK_IPS' | 'CAPTCHA' | 'EMERGENCY_MODE';
  targets: string[]; // IPs to target
  duration: number; // seconds
  reason: string;
}

/**
 * Main DDoS detection and mitigation function
 */
export async function detectAndMitigateDDoS(): Promise<DDoSAnalysisResult> {
  try {
    const redis = getRedis();
    const now = Date.now();
    const windowStart = now - (DDOS_CONFIG.DDOS_WINDOW * 1000);
    
    // Collect traffic metrics
    const metrics = await collectTrafficMetrics(windowStart, now);
    
    // Analyze traffic patterns
    const analysis = analyzeTrafficPatterns(metrics);
    
    // Determine attack type and severity
    const attackType = determineAttackType(metrics, analysis);
    const severity = determineSeverity(metrics, attackType);
    const confidence = calculateConfidence(metrics, analysis, attackType);
    
    // Determine mitigation strategy
    const mitigation = determineMitigation(attackType, severity, metrics);
    
    const result: DDoSAnalysisResult = {
      isDDoS: attackType !== 'NONE',
      attackType,
      severity,
      confidence,
      metrics,
      mitigation,
    };
    
    // Execute mitigation if needed
    if (result.isDDoS && result.confidence > 70) {
      await executeMitigation(mitigation);
      
      // Log DDoS event
      await logSecurityEvent({
        type: 'DDOS_DETECTED',
        severity,
        sourceIp: metrics.topSourceIPs[0]?.ip || 'multiple',
        details: {
          attackType,
          confidence,
          metrics,
          mitigation,
          timestamp: new Date().toISOString(),
        },
        blocked: mitigation.action !== 'NONE',
      });
    }
    
    // Store analysis result in Redis
    await redis.setex(
      'ddos:analysis:latest',
      300, // 5 minutes
      JSON.stringify(result)
    );
    
    return result;
  } catch (error) {
    console.error('Error in DDoS detection:', error);
    return {
      isDDoS: false,
      attackType: 'NONE',
      severity: 'LOW',
      confidence: 0,
      metrics: getEmptyMetrics(),
      mitigation: { action: 'NONE', targets: [], duration: 0, reason: 'Error in detection' },
    };
  }
}

/**
 * Collect traffic metrics from various sources
 */
async function collectTrafficMetrics(startTime: number, endTime: number): Promise<DDoSMetrics> {
  const redis = getRedis();
  
  try {
    // Get request counts per IP
    const ipCounts: Record<string, number> = {};
    const userAgents: Record<string, number> = {};
    const geoData: Record<string, number> = {};
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    // This would typically integrate with your logging system
    // For now, simulate with Redis data
    const requestKeys = await redis.keys('traffic:requests:*');
    
    for (const key of requestKeys.slice(0, 1000)) { // Limit for performance
      try {
        const data = await redis.get(key);
        if (data) {
          const requestData = JSON.parse(data);
          const timestamp = requestData.timestamp;
          
          if (timestamp >= startTime && timestamp <= endTime) {
            const ip = requestData.ip;
            const userAgent = requestData.userAgent || 'unknown';
            const country = requestData.country || 'unknown';
            const statusCode = requestData.statusCode || 200;
            const responseTime = requestData.responseTime || 0;
            
            ipCounts[ip] = (ipCounts[ip] || 0) + 1;
            userAgents[userAgent] = (userAgents[userAgent] || 0) + 1;
            geoData[country] = (geoData[country] || 0) + 1;
            
            totalRequests++;
            
            if (statusCode >= 400) {
              totalErrors++;
            }
            
            if (responseTime > 0) {
              totalResponseTime += responseTime;
              responseTimeCount++;
            }
          }
        }
      } catch (parseError) {
        // Skip invalid entries
      }
    }
    
    // Calculate derived metrics
    const requestRate = (totalRequests / DDOS_CONFIG.DDOS_WINDOW) * 60; // per minute
    const uniqueIPs = Object.keys(ipCounts).length;
    const topSourceIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
    
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    
    // Calculate pattern similarity
    const patternSimilarity = calculatePatternSimilarity(ipCounts, userAgents);
    
    return {
      requestRate,
      uniqueIPs,
      topSourceIPs,
      userAgentDistribution: userAgents,
      geographicDistribution: geoData,
      patternSimilarity,
      errorRate,
      averageResponseTime,
      bandwidthUsage: 0, // Would be calculated from actual bandwidth data
    };
  } catch (error) {
    console.error('Error collecting traffic metrics:', error);
    return getEmptyMetrics();
  }
}

/**
 * Analyze traffic patterns for anomalies
 */
function analyzeTrafficPatterns(metrics: DDoSMetrics): any {
  const analysis = {
    volumetricAnomaly: false,
    distributionAnomaly: false,
    patternAnomaly: false,
    geographicAnomaly: false,
    userAgentAnomaly: false,
  };
  
  // Check for volumetric anomalies
  if (metrics.requestRate > DDOS_CONFIG.TRAFFIC_SPIKE_THRESHOLD) {
    analysis.volumetricAnomaly = true;
  }
  
  // Check for distribution anomalies
  if (metrics.uniqueIPs > 0) {
    const topIPPercentage = metrics.topSourceIPs[0]?.count / (metrics.requestRate * DDOS_CONFIG.DDOS_WINDOW / 60) || 0;
    if (topIPPercentage > 0.5) { // Single IP responsible for >50% of traffic
      analysis.distributionAnomaly = true;
    }
  }
  
  // Check for pattern anomalies
  if (metrics.patternSimilarity > DDOS_CONFIG.PATTERN_SIMILARITY_THRESHOLD) {
    analysis.patternAnomaly = true;
  }
  
  // Check for geographic anomalies
  const totalGeoRequests = Object.values(metrics.geographicDistribution).reduce((a, b) => a + b, 0);
  if (totalGeoRequests > 0) {
    const maxGeoPercentage = Math.max(...Object.values(metrics.geographicDistribution)) / totalGeoRequests;
    if (maxGeoPercentage > DDOS_CONFIG.GEO_CONCENTRATION_THRESHOLD) {
      analysis.geographicAnomaly = true;
    }
  }
  
  // Check for user agent anomalies
  const totalUARequests = Object.values(metrics.userAgentDistribution).reduce((a, b) => a + b, 0);
  if (totalUARequests > 0) {
    const maxUAPercentage = Math.max(...Object.values(metrics.userAgentDistribution)) / totalUARequests;
    if (maxUAPercentage > DDOS_CONFIG.UA_CONCENTRATION_THRESHOLD) {
      analysis.userAgentAnomaly = true;
    }
  }
  
  return analysis;
}

/**
 * Determine attack type based on metrics and analysis
 */
function determineAttackType(metrics: DDoSMetrics, analysis: any): DDoSAnalysisResult['attackType'] {
  // No attack if below threshold
  if (metrics.requestRate < DDOS_CONFIG.TRAFFIC_SPIKE_THRESHOLD) {
    return 'NONE';
  }
  
  // Volumetric attack - high volume from distributed sources
  if (metrics.requestRate > DDOS_CONFIG.DDOS_THRESHOLD && metrics.uniqueIPs > 100) {
    return 'VOLUMETRIC';
  }
  
  // Distributed attack - many sources, coordinated patterns
  if (metrics.uniqueIPs > 50 && analysis.patternAnomaly) {
    return 'DISTRIBUTED';
  }
  
  // Application layer attack - focused on specific endpoints
  if (analysis.distributionAnomaly && metrics.errorRate > 0.3) {
    return 'APPLICATION';
  }
  
  // Slow loris - many connections, slow requests
  if (metrics.averageResponseTime > 5000 && metrics.requestRate > 500) {
    return 'SLOW_LORIS';
  }
  
  // Protocol attack - unusual patterns
  if (analysis.patternAnomaly && analysis.userAgentAnomaly) {
    return 'PROTOCOL';
  }
  
  // Default to volumetric if high volume
  if (metrics.requestRate > DDOS_CONFIG.DDOS_THRESHOLD) {
    return 'VOLUMETRIC';
  }
  
  return 'NONE';
}

/**
 * Determine severity based on metrics and attack type
 */
function determineSeverity(metrics: DDoSMetrics, attackType: string): DDoSAnalysisResult['severity'] {
  if (attackType === 'NONE') return 'LOW';
  
  if (metrics.requestRate > DDOS_CONFIG.DDOS_THRESHOLD * 2) {
    return 'CRITICAL';
  }
  
  if (metrics.requestRate > DDOS_CONFIG.DDOS_THRESHOLD) {
    return 'HIGH';
  }
  
  if (metrics.requestRate > DDOS_CONFIG.TRAFFIC_SPIKE_THRESHOLD) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Calculate confidence score
 */
function calculateConfidence(metrics: DDoSMetrics, analysis: any, attackType: string): number {
  if (attackType === 'NONE') return 0;
  
  let confidence = 0;
  
  // Base confidence from volume
  if (metrics.requestRate > DDOS_CONFIG.DDOS_THRESHOLD) {
    confidence += 40;
  } else if (metrics.requestRate > DDOS_CONFIG.TRAFFIC_SPIKE_THRESHOLD) {
    confidence += 20;
  }
  
  // Boost confidence with anomalies
  if (analysis.volumetricAnomaly) confidence += 15;
  if (analysis.distributionAnomaly) confidence += 15;
  if (analysis.patternAnomaly) confidence += 10;
  if (analysis.geographicAnomaly) confidence += 10;
  if (analysis.userAgentAnomaly) confidence += 10;
  
  // Pattern consistency boost
  if (metrics.patternSimilarity > 0.9) confidence += 10;
  
  // Error rate boost
  if (metrics.errorRate > 0.5) confidence += 10;
  
  return Math.min(100, confidence);
}

/**
 * Determine mitigation strategy
 */
function determineMitigation(
  attackType: string,
  severity: string,
  metrics: DDoSMetrics
): MitigationAction {
  if (attackType === 'NONE') {
    return { action: 'NONE', targets: [], duration: 0, reason: 'No attack detected' };
  }
  
  // Emergency mode for critical attacks
  if (severity === 'CRITICAL') {
    return {
      action: 'EMERGENCY_MODE',
      targets: [],
      duration: DDOS_CONFIG.AUTO_BLOCK_DURATION,
      reason: 'Critical DDoS attack detected',
    };
  }
  
  // Block top attacking IPs
  if (['VOLUMETRIC', 'APPLICATION'].includes(attackType) && severity === 'HIGH') {
    const topIPs = metrics.topSourceIPs
      .filter(ip => ip.count > 100) // Only IPs with significant traffic
      .slice(0, 50) // Limit to top 50
      .map(ip => ip.ip);
    
    return {
      action: 'BLOCK_IPS',
      targets: topIPs,
      duration: DDOS_CONFIG.AUTO_BLOCK_DURATION,
      reason: `Blocking top ${topIPs.length} attacking IPs`,
    };
  }
  
  // Rate limiting for medium severity
  if (severity === 'MEDIUM') {
    return {
      action: 'RATE_LIMIT',
      targets: [],
      duration: DDOS_CONFIG.RATE_LIMIT_DURATION,
      reason: 'Rate limiting applied due to traffic spike',
    };
  }
  
  // CAPTCHA for distributed attacks
  if (attackType === 'DISTRIBUTED') {
    return {
      action: 'CAPTCHA',
      targets: [],
      duration: DDOS_CONFIG.CAPTCHA_DURATION,
      reason: 'CAPTCHA challenge for distributed attack',
    };
  }
  
  return {
    action: 'RATE_LIMIT',
    targets: [],
    duration: DDOS_CONFIG.RATE_LIMIT_DURATION,
    reason: 'Default mitigation for detected attack',
  };
}

/**
 * Execute mitigation actions
 */
async function executeMitigation(mitigation: MitigationAction): Promise<void> {
  try {
    const redis = getRedis();
    
    switch (mitigation.action) {
      case 'BLOCK_IPS':
        // Block specific IPs
        for (const ip of mitigation.targets) {
          await autoBlockSuspiciousIP(
            ip,
            mitigation.reason,
            'HIGH',
            mitigation.duration
          );
        }
        break;
        
      case 'RATE_LIMIT':
        // Enable global rate limiting
        await redis.setex(
          'ddos:rate_limit:enabled',
          mitigation.duration,
          'true'
        );
        break;
        
      case 'CAPTCHA':
        // Enable CAPTCHA challenge
        await redis.setex(
          'ddos:captcha:enabled',
          mitigation.duration,
          'true'
        );
        break;
        
      case 'EMERGENCY_MODE':
        // Enable emergency mode (strictest protection)
        await redis.setex(
          'ddos:emergency:enabled',
          mitigation.duration,
          'true'
        );
        
        // Also block top IPs
        const topIPs = mitigation.targets.slice(0, 20);
        for (const ip of topIPs) {
          await autoBlockSuspiciousIP(ip, 'Emergency DDoS mitigation', 'CRITICAL', mitigation.duration);
        }
        break;
    }
    
    // Log mitigation action
    await logSecurityEvent({
      type: 'DDOS_MITIGATED',
      severity: 'HIGH',
      sourceIp: mitigation.targets[0] || 'multiple',
      details: {
        action: mitigation.action,
        targets: mitigation.targets.length,
        duration: mitigation.duration,
        reason: mitigation.reason,
        timestamp: new Date().toISOString(),
      },
    });
    
    console.log(`DDoS mitigation executed: ${mitigation.action} for ${mitigation.duration}s`);
  } catch (error) {
    console.error('Error executing DDoS mitigation:', error);
  }
}

/**
 * Check if DDoS protection is currently active
 */
export async function isDDoSProtectionActive(): Promise<{
  rateLimitEnabled: boolean;
  captchaEnabled: boolean;
  emergencyModeEnabled: boolean;
  blockedIPs: number;
}> {
  try {
    const redis = getRedis();
    
    const [rateLimit, captcha, emergency] = await Promise.all([
      redis.get('ddos:rate_limit:enabled'),
      redis.get('ddos:captcha:enabled'),
      redis.get('ddos:emergency:enabled'),
    ]);
    
    // Count currently blocked IPs (from last hour)
    const recentBlocks = await redis.keys('blacklist:*');
    
    return {
      rateLimitEnabled: rateLimit === 'true',
      captchaEnabled: captcha === 'true',
      emergencyModeEnabled: emergency === 'true',
      blockedIPs: recentBlocks.length,
    };
  } catch (error) {
    console.error('Error checking DDoS protection status:', error);
    return {
      rateLimitEnabled: false,
      captchaEnabled: false,
      emergencyModeEnabled: false,
      blockedIPs: 0,
    };
  }
}

/**
 * Manually trigger DDoS mitigation (admin function)
 */
export async function triggerDDoSMitigation(
  action: MitigationAction['action'],
  duration: number,
  targets: string[] = []
): Promise<boolean> {
  try {
    const mitigation: MitigationAction = {
      action,
      targets,
      duration,
      reason: 'Manually triggered by administrator',
    };
    
    await executeMitigation(mitigation);
    return true;
  } catch (error) {
    console.error('Error triggering DDoS mitigation:', error);
    return false;
  }
}

/**
 * Disable DDoS protection (admin function)
 */
export async function disableDDoSProtection(): Promise<boolean> {
  try {
    const redis = getRedis();
    
    await Promise.all([
      redis.del('ddos:rate_limit:enabled'),
      redis.del('ddos:captcha:enabled'),
      redis.del('ddos:emergency:enabled'),
    ]);
    
    await logSecurityEvent({
      type: 'DDOS_MITIGATED',
      severity: 'LOW',
      sourceIp: 'admin',
      details: {
        action: 'disabled',
        reason: 'Manually disabled by administrator',
        timestamp: new Date().toISOString(),
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error disabling DDoS protection:', error);
    return false;
  }
}

/**
 * Calculate pattern similarity
 */
function calculatePatternSimilarity(ipCounts: Record<string, number>, userAgents: Record<string, number>): number {
  const ipValues = Object.values(ipCounts);
  const uaValues = Object.values(userAgents);
  
  if (ipValues.length === 0 || uaValues.length === 0) return 0;
  
  // Calculate coefficient of variation for both distributions
  const ipMean = ipValues.reduce((a, b) => a + b, 0) / ipValues.length;
  const ipVariance = ipValues.reduce((sum, val) => sum + Math.pow(val - ipMean, 2), 0) / ipValues.length;
  const ipCV = ipMean > 0 ? Math.sqrt(ipVariance) / ipMean : 0;
  
  const uaMean = uaValues.reduce((a, b) => a + b, 0) / uaValues.length;
  const uaVariance = uaValues.reduce((sum, val) => sum + Math.pow(val - uaMean, 2), 0) / uaValues.length;
  const uaCV = uaMean > 0 ? Math.sqrt(uaVariance) / uaMean : 0;
  
  // Lower coefficient of variation indicates more similar patterns
  const avgCV = (ipCV + uaCV) / 2;
  return Math.max(0, 1 - avgCV); // Convert to similarity score (0-1)
}

/**
 * Get empty metrics (fallback)
 */
function getEmptyMetrics(): DDoSMetrics {
  return {
    requestRate: 0,
    uniqueIPs: 0,
    topSourceIPs: [],
    userAgentDistribution: {},
    geographicDistribution: {},
    patternSimilarity: 0,
    errorRate: 0,
    averageResponseTime: 0,
    bandwidthUsage: 0,
  };
}

/**
 * Get DDoS protection statistics
 */
export async function getDDoSProtectionStats(days: number = 7): Promise<any> {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const ddosEvents = await logSecurityEvent({
      type: 'DDOS_DETECTED',
      severity: 'HIGH',
      sourceIp: 'query',
      details: { query: true },
    });
    
    // This would be replaced with actual query logic
    // For now, return sample stats
    return {
      totalAttacks: 0,
      attacksBlocked: 0,
      averageAttackDuration: 0,
      attackTypes: {},
      mitigationActions: {},
      protectionUptime: 99.9,
    };
  } catch (error) {
    console.error('Error getting DDoS protection stats:', error);
    return {
      totalAttacks: 0,
      attacksBlocked: 0,
      averageAttackDuration: 0,
      attackTypes: {},
      mitigationActions: {},
      protectionUptime: 0,
    };
  }
}