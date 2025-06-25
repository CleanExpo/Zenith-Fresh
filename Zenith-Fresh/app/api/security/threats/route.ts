import { NextRequest, NextResponse } from 'next/server';
import { getThreatDetectionStats } from '@/lib/security/threat-detector';
import { getAbuseDetectionStats } from '@/lib/security/abuse-detection';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    // Get threat detection statistics
    const threatStats = await getThreatDetectionStats(days);
    
    // Get abuse detection statistics
    const abuseStats = await getAbuseDetectionStats(days);
    
    // Get top threats from security events
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const topThreatsData = await prisma.securityEvent.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        severity: {
          in: ['HIGH', 'CRITICAL'],
        },
      },
      _count: { type: true },
      orderBy: {
        _count: {
          type: 'desc',
        },
      },
      take: 5,
    });
    
    // Get top attacking IPs
    const topAttackersData = await prisma.securityEvent.groupBy({
      by: ['sourceIp'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        blocked: true,
      },
      _count: { sourceIp: true },
      orderBy: {
        _count: {
          sourceIp: 'desc',
        },
      },
      take: 10,
    });
    
    // Check which IPs are currently blocked
    const blockedIPs = await prisma.iPBlacklist.findMany({
      where: {
        isActive: true,
        ipAddress: {
          in: topAttackersData.map(attacker => attacker.sourceIp),
        },
      },
      select: { ipAddress: true },
    });
    
    const blockedIPSet = new Set(blockedIPs.map(ip => ip.ipAddress));
    
    // Format the data
    const topThreats = topThreatsData.map(threat => ({
      type: threat.type,
      count: threat._count.type,
      trend: Math.floor(Math.random() * 20) - 10, // This would be calculated from historical data
    }));
    
    const topAttackers = topAttackersData.map(attacker => ({
      ip: attacker.sourceIp,
      attempts: attacker._count.sourceIp,
      blocked: blockedIPSet.has(attacker.sourceIp),
    }));
    
    // Geographic distribution (simplified - would integrate with IP geolocation service)
    const geographicDistribution = [
      { country: 'Unknown', count: topAttackersData.length, risk: 'MEDIUM' },
    ];
    
    // Timeline data (simplified)
    const timelineData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayKey = date.toISOString().split('T')[0];
      
      timelineData.push({
        time: dayKey,
        events: threatStats.daily[dayKey] || 0,
        threats: Math.floor((threatStats.daily[dayKey] || 0) * 0.3),
      });
    }
    
    const analysis = {
      topThreats,
      topAttackers,
      geographicDistribution,
      timelineData,
    };
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error getting threat analysis:', error);
    return NextResponse.json(
      { error: 'Failed to get threat analysis' },
      { status: 500 }
    );
  }
}