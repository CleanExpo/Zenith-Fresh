// Zenith Aegis Security API - Systems Vulnerability Management
// Autonomous security monitoring and incident response

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { aegisAgent } from '@/lib/agents/aegis-agent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        // Get current security status
        const securityStatus = aegisAgent.getSecurityStatus();
        return NextResponse.json({
          success: true,
          data: securityStatus,
          timestamp: new Date().toISOString()
        });

      case 'scan':
        // Execute comprehensive security scan
        const scanReport = await aegisAgent.executeContinuousScanning();
        return NextResponse.json({
          success: true,
          data: scanReport,
          message: 'Security scan completed successfully'
        });

      case 'pentest':
        // Execute holographic penetration testing
        await aegisAgent.executeHolographicPenetrationTest();
        return NextResponse.json({
          success: true,
          message: 'Holographic penetration test completed',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available actions: status, scan, pentest'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Aegis API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Security operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'emergency_lockdown':
        // Execute emergency security lockdown
        await aegisAgent.executeEmergencyLockdown();
        return NextResponse.json({
          success: true,
          message: 'Emergency security lockdown activated',
          timestamp: new Date().toISOString(),
          warning: 'System is now in compromised state - manual intervention required'
        });

      case 'scan_with_params':
        // Execute scan with specific parameters
        const scanResult = await aegisAgent.executeContinuousScanning();
        return NextResponse.json({
          success: true,
          data: scanResult,
          message: 'Parameterized security scan completed'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available POST actions: emergency_lockdown, scan_with_params'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Aegis POST API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Security operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
