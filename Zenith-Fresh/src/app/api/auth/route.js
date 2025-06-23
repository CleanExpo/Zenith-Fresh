/**
 * Authentication API Endpoint
 * Handles master admin and staff login/logout
 */

import { NextResponse } from 'next/server';
import { getSessionStore } from '../../../lib/session-store.mjs';
const { sessionOperations } = require('../../../../lib/database.js');

// Error logging utility
const logError = (error, context, additionalInfo = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...additionalInfo
  };
  console.error('[AUTH_API_ERROR]', JSON.stringify(errorLog));
};

// Input validation utilities
const validateLoginInput = (username, password) => {
  const errors = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('Username is required and must be a string');
  } else if (username.length < 3 || username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username must contain only alphanumeric characters and underscores');
  }
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required and must be a string');
  } else if (password.length < 8 || password.length > 100) {
    errors.push('Password must be between 8 and 100 characters');
  }
  
  return errors;
};

const validateSessionId = (sessionId) => {
  const errors = [];
  
  if (!sessionId || typeof sessionId !== 'string') {
    errors.push('Session ID is required and must be a string');
  } else if (sessionId.length < 10 || sessionId.length > 200) {
    errors.push('Session ID format is invalid');
  } else if (!/^session_[0-9]+_[a-zA-Z0-9]+$/.test(sessionId)) {
    errors.push('Session ID format is invalid');
  }
  
  return errors;
};

// Timeout wrapper for async operations
const withTimeout = async (operation, timeoutMs = 5000, operationName = 'Operation') => {
  return Promise.race([
    operation,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Authentication System using SessionStore
class AuthSystem {
  constructor() {
    this.sessionStore = getSessionStore();
    this.masterCredentials = {
      username: process.env.MASTER_USERNAME || 'zenith_master',
      password: process.env.MASTER_PASSWORD || 'ZenithMaster2024!',
      role: 'master_admin'
    };
    
    this.staffUsers = new Map();
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

  async authenticate(username, password) {
    try {
      // Input validation
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      
      if (typeof username !== 'string' || typeof password !== 'string') {
        throw new Error('Username and password must be strings');
      }
      
      // Check master credentials with timeout
      if (username === this.masterCredentials.username && 
          password === this.masterCredentials.password) {
        return await withTimeout(
          this.createSession({
            username: this.masterCredentials.username,
            role: this.masterCredentials.role,
            name: 'Master Administrator',
            permissions: this.permissionLevels.master_admin
          }),
          3000,
          'Master session creation'
        );
      }

      // Check staff credentials
      const staff = this.staffUsers.get(username);
      if (staff && staff.password === password && staff.active) {
        staff.lastLogin = new Date().toISOString();
        return await withTimeout(
          this.createSession({
            username: staff.username,
            role: staff.role,
            name: staff.name,
            permissions: this.permissionLevels[staff.role]
          }),
          3000,
          'Staff session creation'
        );
      }

      return null;
    } catch (error) {
      logError(error, 'authenticate', { username: username?.substring(0, 3) + '***' });
      throw error;
    }
  }

  async createSession(user) {
    try {
      // Input validation
      if (!user || !user.username || !user.role) {
        throw new Error('Invalid user data for session creation');
      }
      
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionData = {
        userId: user.username,
        role: user.role,
        user: user,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      // Try to store session in database first, fallback to original session store
      try {
        await withTimeout(
          sessionOperations.storeSession(sessionId, sessionData, 86400),
          3000,
          'Database session storage'
        );
        console.log('Session stored in database');
      } catch (dbError) {
        logError(dbError, 'database_session_storage', { sessionId, userId: user.username });
        console.log('Database session storage failed, using fallback:', dbError.message);
        // Fallback to original session store
        try {
          await withTimeout(
            this.sessionStore.setSession(sessionId, sessionData, 86400),
            3000,
            'Fallback session storage'
          );
        } catch (fallbackError) {
          logError(fallbackError, 'fallback_session_storage', { sessionId, userId: user.username });
          throw new Error('Failed to store session in both database and fallback storage');
        }
      }
      
      const session = {
        id: sessionId,
        user: user,
        createdAt: sessionData.createdAt,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: sessionData.lastActivity
      };

      return session;
    } catch (error) {
      logError(error, 'createSession', { userId: user?.username });
      throw error;
    }
  }

  async validateSession(sessionId) {
    try {
      // Input validation
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID');
      }
      
      let sessionData = null;
      
      // Try to get session from database first, fallback to original store
      try {
        sessionData = await withTimeout(
          sessionOperations.getSession(sessionId),
          3000,
          'Database session retrieval'
        );
        if (sessionData) {
          // Renew session in database
          await withTimeout(
            sessionOperations.renewSession(sessionId, 86400),
            3000,
            'Database session renewal'
          );
        }
      } catch (dbError) {
        logError(dbError, 'database_session_validation', { sessionId });
        console.log('Database session validation failed, using fallback:', dbError.message);
        // Fallback to original session store
        try {
          sessionData = await withTimeout(
            this.sessionStore.getSession(sessionId),
            3000,
            'Fallback session retrieval'
          );
          if (sessionData) {
            await withTimeout(
              this.sessionStore.renewSession(sessionId, 86400),
              3000,
              'Fallback session renewal'
            );
          }
        } catch (fallbackError) {
          logError(fallbackError, 'fallback_session_validation', { sessionId });
          // Don't throw here, just return null for invalid session
        }
      }
      
      if (!sessionData) return null;
      
      const session = {
        id: sessionId,
        user: sessionData.user,
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt ? new Date(sessionData.expiresAt).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date().toISOString()
      };

      return session;
    } catch (error) {
      logError(error, 'validateSession', { sessionId });
      return null; // Return null for any validation errors
    }
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

  async logout(sessionId) {
    try {
      // Input validation
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID for logout');
      }
      
      // Try to delete from database first, fallback to original store
      try {
        const deleted = await withTimeout(
          sessionOperations.deleteSession(sessionId),
          3000,
          'Database session deletion'
        );
        return deleted;
      } catch (dbError) {
        logError(dbError, 'database_session_deletion', { sessionId });
        console.log('Database session deletion failed, using fallback:', dbError.message);
        try {
          return await withTimeout(
            this.sessionStore.deleteSession(sessionId),
            3000,
            'Fallback session deletion'
          );
        } catch (fallbackError) {
          logError(fallbackError, 'fallback_session_deletion', { sessionId });
          return false;
        }
      }
    } catch (error) {
      logError(error, 'logout', { sessionId });
      return false;
    }
  }
}

const authSystem = new AuthSystem();

/**
 * POST - Login
 */
export async function POST(request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Add request timeout
    const text = await withTimeout(
      request.text(),
      10000,
      'Request body parsing'
    );
    
    let body;
    
    // Enhanced JSON parsing with validation
    try {
      if (!text || text.trim() === '') {
        return NextResponse.json({
          success: false,
          error: 'Request body is empty',
          code: 'EMPTY_BODY',
          requestId
        }, { status: 400 });
      }
      
      body = JSON.parse(text);
      
      // Validate body is an object
      if (typeof body !== 'object' || body === null) {
        return NextResponse.json({
          success: false,
          error: 'Request body must be a JSON object',
          code: 'INVALID_BODY_TYPE',
          requestId
        }, { status: 400 });
      }
      
    } catch (parseError) {
      logError(parseError, 'json_parsing', { text: text?.substring(0, 100), requestId });
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format',
        code: 'JSON_PARSE_ERROR',
        requestId
      }, { status: 400 });
    }
    
    const { action, username, password, sessionId } = body;
    
    // Validate action parameter
    if (!action || typeof action !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Action parameter is required and must be a string',
        code: 'MISSING_ACTION',
        requestId
      }, { status: 400 });
    }
    
    const validActions = ['login', 'logout', 'validate'];
    if (!validActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: `Invalid action. Allowed actions: ${validActions.join(', ')}`,
        code: 'INVALID_ACTION',
        requestId
      }, { status: 400 });
    }

    switch (action) {
      case 'login':
        // Validate login input
        const loginValidationErrors = validateLoginInput(username, password);
        if (loginValidationErrors.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'Validation failed',
            details: loginValidationErrors,
            code: 'VALIDATION_ERROR',
            requestId
          }, { status: 400 });
        }

        try {
          const session = await withTimeout(
            authSystem.authenticate(username, password),
            5000,
            'Authentication'
          );
          
          if (!session) {
            // Log failed login attempt
            console.warn(`[AUTH] Failed login attempt for username: ${username?.substring(0, 3)}*** from ${request.headers.get('x-forwarded-for') || 'unknown'}`);
            return NextResponse.json({
              success: false,
              error: 'Invalid credentials',
              code: 'INVALID_CREDENTIALS',
              requestId
            }, { status: 401 });
          }

          const featureAccess = authSystem.getFeatureAccess(session);
          
          // Log successful login
          console.log(`[AUTH] Successful login for user: ${username} (${session.user.role})`);
          
          return NextResponse.json({
            success: true,
            session: {
              id: session.id,
              user: session.user,
              expiresAt: session.expiresAt
            },
            features: featureAccess,
            requestId
          });
        } catch (authError) {
          logError(authError, 'authentication', { username: username?.substring(0, 3) + '***', requestId });
          return NextResponse.json({
            success: false,
            error: 'Authentication service temporarily unavailable',
            code: 'AUTH_SERVICE_ERROR',
            requestId
          }, { status: 503 });
        }

      case 'logout':
        // Validate session ID
        const logoutValidationErrors = validateSessionId(sessionId);
        if (logoutValidationErrors.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'Validation failed',
            details: logoutValidationErrors,
            code: 'VALIDATION_ERROR',
            requestId
          }, { status: 400 });
        }

        try {
          const loggedOut = await withTimeout(
            authSystem.logout(sessionId),
            5000,
            'Logout'
          );
          
          if (loggedOut) {
            console.log(`[AUTH] Successful logout for session: ${sessionId}`);
          }
          
          return NextResponse.json({
            success: loggedOut,
            message: loggedOut ? 'Logged out successfully' : 'Session not found',
            code: loggedOut ? 'SUCCESS' : 'SESSION_NOT_FOUND',
            requestId
          });
        } catch (logoutError) {
          logError(logoutError, 'logout', { sessionId, requestId });
          return NextResponse.json({
            success: false,
            error: 'Logout service temporarily unavailable',
            code: 'LOGOUT_SERVICE_ERROR',
            requestId
          }, { status: 503 });
        }

      case 'validate':
        // Validate session ID
        const validateValidationErrors = validateSessionId(sessionId);
        if (validateValidationErrors.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'Validation failed',
            details: validateValidationErrors,
            code: 'VALIDATION_ERROR',
            requestId
          }, { status: 400 });
        }

        try {
          const validSession = await withTimeout(
            authSystem.validateSession(sessionId),
            5000,
            'Session validation'
          );
          
          if (!validSession) {
            return NextResponse.json({
              success: false,
              error: 'Invalid or expired session',
              code: 'INVALID_SESSION',
              requestId
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
            features: validFeatureAccess,
            requestId
          });
        } catch (validateError) {
          logError(validateError, 'session_validation', { sessionId, requestId });
          return NextResponse.json({
            success: false,
            error: 'Session validation service temporarily unavailable',
            code: 'VALIDATION_SERVICE_ERROR',
            requestId
          }, { status: 503 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: `Invalid action: ${action}`,
          code: 'INVALID_ACTION',
          requestId
        }, { status: 400 });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(error, 'auth_api_post', { processingTime, requestId });
    
    // Check for specific error types
    if (error.message && error.message.includes('timed out')) {
      return NextResponse.json({
        success: false,
        error: 'Request timed out',
        code: 'REQUEST_TIMEOUT',
        requestId
      }, { status: 408 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId
    }, { status: 500 });
  }
}

/**
 * GET - Get current session info
 */
export async function GET(request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    // Validate session ID parameter
    const validationErrors = validateSessionId(sessionId);
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        code: 'VALIDATION_ERROR',
        requestId
      }, { status: 400 });
    }

    try {
      const session = await withTimeout(
        authSystem.validateSession(sessionId),
        5000,
        'Session validation for GET'
      );
      
      if (!session) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or expired session',
          code: 'INVALID_SESSION',
          requestId
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
        features: featureAccess,
        requestId
      });
    } catch (sessionError) {
      logError(sessionError, 'get_session_validation', { sessionId, requestId });
      return NextResponse.json({
        success: false,
        error: 'Session validation service temporarily unavailable',
        code: 'VALIDATION_SERVICE_ERROR',
        requestId
      }, { status: 503 });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(error, 'auth_api_get', { processingTime, requestId });
    
    // Check for specific error types
    if (error.message && error.message.includes('timed out')) {
      return NextResponse.json({
        success: false,
        error: 'Request timed out',
        code: 'REQUEST_TIMEOUT',
        requestId
      }, { status: 408 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId
    }, { status: 500 });
  }
}

/**
 * Using Node.js runtime for persistent in-memory storage with Maps
 */