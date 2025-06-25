import { NextRequest, NextResponse } from 'next/server';
import { getSecurityEventStats } from '@/lib/security/audit-logger';
import { isDDoSProtectionActive } from '@/lib/security/ddos-protection';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get security event statistics
    const eventStats = await getSecurityEventStats(30); // Last 30 days
    
    // Get DDoS protection status
    const ddosStatus = await isDDoSProtectionActive();
    
    // Get API key statistics
    const apiKeyStats = await prisma.aPIKey.groupBy({
      by: ['isActive'],
      _count: { isActive: true },
    });
    
    // Get total API keys
    const totalApiKeys = await prisma.aPIKey.count();
    const activeApiKeys = apiKeyStats.find(stat => stat.isActive)?._count.isActive || 0;
    
    // Get recent suspicious activity
    const suspiciousActivity = await prisma.securityEvent.count({
      where: {
        type: 'SUSPICIOUS_ACTIVITY',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });
    
    // Calculate threat level based on recent events
    const criticalEvents = eventStats.severityBreakdown.CRITICAL || 0;
    const highEvents = eventStats.severityBreakdown.HIGH || 0;
    
    let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (criticalEvents > 10) {
      threatLevel = 'CRITICAL';
    } else if (criticalEvents > 5 || highEvents > 20) {
      threatLevel = 'HIGH';
    } else if (highEvents > 5) {
      threatLevel = 'MEDIUM';
    }
    
    // Count active protections
    let activeProtections = 0;
    if (ddosStatus.rateLimitEnabled) activeProtections++;
    if (ddosStatus.captchaEnabled) activeProtections++;
    if (ddosStatus.emergencyModeEnabled) activeProtections++;
    if (ddosStatus.blockedIPs > 0) activeProtections++;
    
    const stats = {
      totalEvents: eventStats.totalEvents,
      criticalEvents: criticalEvents,
      blockedAttempts: ddosStatus.blockedIPs,
      activeProtections,
      threatLevel,
      ddosProtection: {
        active: ddosStatus.rateLimitEnabled || ddosStatus.captchaEnabled || ddosStatus.emergencyModeEnabled,
        mitigations: ddosStatus.blockedIPs,
        protectionLevel: ddosStatus.emergencyModeEnabled ? 'Emergency' : 
                        ddosStatus.captchaEnabled ? 'High' :
                        ddosStatus.rateLimitEnabled ? 'Medium' : 'Normal',
      },
      rateLimit: {
        totalRequests: eventStats.totalEvents,
        blockedRequests: eventStats.typeBreakdown.RATE_LIMIT_EXCEEDED || 0,
        averageResponse: 150, // This would come from actual metrics
      },
      apiSecurity: {
        totalKeys: totalApiKeys,
        activeKeys: activeApiKeys,
        suspiciousActivity,
      },
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting security stats:', error);
    return NextResponse.json(
      { error: 'Failed to get security statistics' },
      { status: 500 }
    );
  }
}