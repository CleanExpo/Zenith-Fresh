/**
 * Authentication API Endpoint
 * Handles master admin and staff login/logout
 */

import { NextResponse } from 'next/server';

// Inline AuthSystem for edge runtime compatibility
class AuthSystem {
  constructor() {
    this.masterCredentials = {
      username: process.env.MASTER_USERNAME || 'zenith_master',
      password: process.env.MASTER_PASSWORD || 'ZenithMaster2024!',
      role: 'master_admin'
    };
    
    this.staffUsers = new Map();
    this.sessions = new Map();
    this.permissionLevels = {
      master_admin: {
        name: 'Master Administrator',
        access: 'all_features',
        aiApis: true,
        competitiveAnalysis: true,
        geoOptimization: true,
        advancedAudits: true,
        systemMonitoring: true,
        userManagement: true,
        billingAccess: true,
        whiteLabel: true,
        apiAccess: 'unlimited',
        exportFormats: 'all'
      },
      staff_tester: {
        name: 'Staff Tester',
        access: 'premium_features',
        aiApis: true,
        competitiveAnalysis: true,
        geoOptimization: true,
        advancedAudits: true,
        systemMonitoring: true,
        userManagement: false,
        billingAccess: false,
        whiteLabel: false,
        apiAccess: 'limited',
        exportFormats: 'standard'
      }
    };
    
    this.initializeStaffUsers();
  }

  initializeStaffUsers() {
    const staffList = [
      { username: 'staff_1', password: 'StaffTest2024!', name: 'Staff Tester 1', role: 'staff_tester' },
      { username: 'staff_2', password: 'StaffTest2024!', name: 'Staff Tester 2', role: 'staff_tester' },
      { username: 'qa_lead', password: 'QALead2024!', name: 'QA Lead', role: 'staff_tester' },
      { username: 'dev_test', password: 'DevTest2024!', name: 'Developer Test', role: 'staff_tester' }
    ];

    staffList.forEach(staff => {
      this.staffUsers.set(staff.username, {
        ...staff,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        active: true
      });
    });
  }

  authenticate(username, password) {
    if (username === this.masterCredentials.username && 
        password === this.masterCredentials.password) {
      return this.createSession({
        username: this.masterCredentials.username,
        role: this.masterCredentials.role,
        name: 'Master Administrator',
        permissions: this.permissionLevels.master_admin
      });
    }

    const staff = this.staffUsers.get(username);
    if (staff && staff.password === password && staff.active) {
      staff.lastLogin = new Date().toISOString();
      return this.createSession({
        username: staff.username,
        role: staff.role,
        name: staff.name,
        permissions: this.permissionLevels[staff.role]
      });
    }

    return null;
  }

  createSession(user) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      user: user,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (new Date() > new Date(session.expiresAt)) {
      this.sessions.delete(sessionId);
      return null;
    }

    session.lastActivity = new Date().toISOString();
    return session;
  }

  getFeatureAccess(session) {
    if (!session || !session.user) return null;

    const permissions = session.user.permissions;
    return {
      role: session.user.role,
      roleName: permissions.name,
      accessLevel: permissions.access,
      features: {
        aiAnalysis: permissions.aiApis,
        competitiveAnalysis: permissions.competitiveAnalysis,
        geoOptimization: permissions.geoOptimization,
        advancedAudits: permissions.advancedAudits,
        systemMonitoring: permissions.systemMonitoring,
        userManagement: permissions.userManagement,
        billingAccess: permissions.billingAccess,
        whiteLabel: permissions.whiteLabel,
        apiAccess: permissions.apiAccess,
        exportFormats: permissions.exportFormats
      }
    };
  }

  logout(sessionId) {
    return this.sessions.delete(sessionId);
  }
}

const authSystem = new AuthSystem();

/**
 * POST - Login
 */
export async function POST(request) {
  try {
    const text = await request.text();
    let body;
    
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Text:', text);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format'
      }, { status: 400 });
    }
    
    const { action, username, password, sessionId } = body;

    switch (action) {
      case 'login':
        if (!username || !password) {
          return NextResponse.json({
            success: false,
            error: 'Username and password required'
          }, { status: 400 });
        }

        const session = authSystem.authenticate(username, password);
        if (!session) {
          return NextResponse.json({
            success: false,
            error: 'Invalid credentials'
          }, { status: 401 });
        }

        const featureAccess = authSystem.getFeatureAccess(session);
        
        return NextResponse.json({
          success: true,
          session: {
            id: session.id,
            user: session.user,
            expiresAt: session.expiresAt
          },
          features: featureAccess
        });

      case 'logout':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID required'
          }, { status: 400 });
        }

        const loggedOut = authSystem.logout(sessionId);
        return NextResponse.json({
          success: loggedOut,
          message: loggedOut ? 'Logged out successfully' : 'Session not found'
        });

      case 'validate':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID required'
          }, { status: 400 });
        }

        const validSession = authSystem.validateSession(sessionId);
        if (!validSession) {
          return NextResponse.json({
            success: false,
            error: 'Invalid or expired session'
          }, { status: 401 });
        }

        const validFeatureAccess = authSystem.getFeatureAccess(validSession);
        
        return NextResponse.json({
          success: true,
          session: {
            id: validSession.id,
            user: validSession.user,
            expiresAt: validSession.expiresAt
          },
          features: validFeatureAccess
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * GET - Get current session info
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID required'
      }, { status: 400 });
    }

    const session = authSystem.validateSession(sessionId);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session'
      }, { status: 401 });
    }

    const featureAccess = authSystem.getFeatureAccess(session);
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        user: session.user,
        expiresAt: session.expiresAt,
        lastActivity: session.lastActivity
      },
      features: featureAccess
    });

  } catch (error) {
    console.error('Auth GET API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Using Node.js runtime for persistent in-memory storage with Maps
 */