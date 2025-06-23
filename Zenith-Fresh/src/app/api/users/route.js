/**
 * User Management API Endpoint
 * Handles staff user management (master admin only)
 */

import { NextResponse } from 'next/server';

// Import the AuthSystem and Database operations
import AuthSystem from '../../../../lib/auth-system.js';
const { userOperations } = require('../../../../lib/database.js');
const authSystem = new AuthSystem();

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
  console.error('[USERS_API_ERROR]', JSON.stringify(errorLog));
};

// Input validation utilities
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

const validateUserData = (userData) => {
  const errors = [];
  
  if (!userData || typeof userData !== 'object') {
    errors.push('User data is required and must be an object');
    return errors;
  }
  
  if (!userData.username || typeof userData.username !== 'string') {
    errors.push('Username is required and must be a string');
  } else if (userData.username.length < 3 || userData.username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
    errors.push('Username must contain only alphanumeric characters and underscores');
  }
  
  if (!userData.password || typeof userData.password !== 'string') {
    errors.push('Password is required and must be a string');
  } else if (userData.password.length < 8 || userData.password.length > 100) {
    errors.push('Password must be between 8 and 100 characters');
  }
  
  if (!userData.name || typeof userData.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else if (userData.name.length < 2 || userData.name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }
  
  if (userData.email && (typeof userData.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email))) {
    errors.push('Email must be a valid email address');
  }
  
  if (userData.role && !['staff_tester', 'admin'].includes(userData.role)) {
    errors.push('Role must be either "staff_tester" or "admin"');
  }
  
  return errors;
};

const validateUsername = (username) => {
  const errors = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('Username is required and must be a string');
  } else if (username.length < 3 || username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username must contain only alphanumeric characters and underscores');
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

/**
 * GET - Get all staff users (master admin only)
 */
export async function GET(request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const action = url.searchParams.get('action');

    // Validate session ID
    const sessionValidationErrors = validateSessionId(sessionId);
    if (sessionValidationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: sessionValidationErrors,
        code: 'VALIDATION_ERROR',
        requestId
      }, { status: 400 });
    }

    // Validate action parameter
    if (!action || typeof action !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Action parameter is required and must be a string',
        code: 'MISSING_ACTION',
        requestId
      }, { status: 400 });
    }
    
    const validActions = ['list', 'sessions'];
    if (!validActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: `Invalid action. Allowed actions: ${validActions.join(', ')}`,
        code: 'INVALID_ACTION',
        requestId
      }, { status: 400 });
    }

    // Validate session with timeout
    let session;
    try {
      session = await withTimeout(
        authSystem.validateSession(sessionId),
        5000,
        'Session validation'
      );
    } catch (sessionError) {
      logError(sessionError, 'session_validation', { sessionId, requestId });
      return NextResponse.json({
        success: false,
        error: 'Session validation service temporarily unavailable',
        code: 'SESSION_VALIDATION_ERROR',
        requestId
      }, { status: 503 });
    }
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION',
        requestId
      }, { status: 401 });
    }

    switch (action) {
      case 'list':
        try {
          // Try to get users from database first, fallback to auth system
          let users = [];
          try {
            const dbUsers = await withTimeout(
              userOperations.getAllUsers(),
              5000,
              'Database user retrieval'
            );
            users = dbUsers.map(user => ({
              username: user.username,
              email: user.email,
              role: user.role,
              createdAt: user.createdAt,
              source: 'database'
            }));
          } catch (dbError) {
            logError(dbError, 'database_user_lookup', { sessionId, requestId });
            console.log('Database user lookup failed, using auth system fallback');
            
            try {
              const staffUsers = await withTimeout(
                authSystem.getStaffUsers(session),
                3000,
                'Auth system staff user retrieval'
              );
              users = staffUsers.map(user => ({
                ...user,
                source: 'auth_system'
              }));
            } catch (authError) {
              logError(authError, 'auth_system_user_lookup', { sessionId, requestId });
              throw new Error('Both database and auth system user lookup failed');
            }
          }
          
          return NextResponse.json({
            success: true,
            users: users,
            requestId
          });
        } catch (error) {
          logError(error, 'user_list_retrieval', { sessionId, requestId });
          
          // Check if it's a permission error
          if (error.message && error.message.includes('permission')) {
            return NextResponse.json({
              success: false,
              error: 'Insufficient permissions to access user list',
              code: 'INSUFFICIENT_PERMISSIONS',
              requestId
            }, { status: 403 });
          }
          
          return NextResponse.json({
            success: false,
            error: 'Failed to retrieve user list',
            code: 'USER_LIST_ERROR',
            requestId
          }, { status: 500 });
        }

      case 'sessions':
        try {
          const activeSessions = await withTimeout(
            authSystem.getActiveSessions(session),
            5000,
            'Active sessions retrieval'
          );
          return NextResponse.json({
            success: true,
            sessions: activeSessions,
            requestId
          });
        } catch (error) {
          logError(error, 'active_sessions_retrieval', { sessionId, requestId });
          
          // Check if it's a permission error
          if (error.message && error.message.includes('permission')) {
            return NextResponse.json({
              success: false,
              error: 'Insufficient permissions to access active sessions',
              code: 'INSUFFICIENT_PERMISSIONS',
              requestId
            }, { status: 403 });
          }
          
          return NextResponse.json({
            success: false,
            error: 'Failed to retrieve active sessions',
            code: 'SESSIONS_RETRIEVAL_ERROR',
            requestId
          }, { status: 500 });
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
    logError(error, 'users_api_get', { processingTime, requestId });
    
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
 * POST - Add new staff user or manage existing users
 */
export async function POST(request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Parse request body with timeout
    let body;
    try {
      const text = await withTimeout(
        request.text(),
        10000,
        'Request body parsing'
      );
      
      if (!text || text.trim() === '') {
        return NextResponse.json({
          success: false,
          error: 'Request body is empty',
          code: 'EMPTY_BODY',
          requestId
        }, { status: 400 });
      }
      
      body = JSON.parse(text);
      
      if (typeof body !== 'object' || body === null) {
        return NextResponse.json({
          success: false,
          error: 'Request body must be a JSON object',
          code: 'INVALID_BODY_TYPE',
          requestId
        }, { status: 400 });
      }
      
    } catch (parseError) {
      logError(parseError, 'json_parsing', { requestId });
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format',
        code: 'JSON_PARSE_ERROR',
        requestId
      }, { status: 400 });
    }
    
    const { sessionId, action, userData, targetUsername } = body;

    // Validate session ID
    const sessionValidationErrors = validateSessionId(sessionId);
    if (sessionValidationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: sessionValidationErrors,
        code: 'VALIDATION_ERROR',
        requestId
      }, { status: 400 });
    }
    
    // Validate action parameter
    if (!action || typeof action !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Action parameter is required and must be a string',
        code: 'MISSING_ACTION',
        requestId
      }, { status: 400 });
    }
    
    const validActions = ['create', 'deactivate'];
    if (!validActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: `Invalid action. Allowed actions: ${validActions.join(', ')}`,
        code: 'INVALID_ACTION',
        requestId
      }, { status: 400 });
    }

    // Validate session with timeout
    let session;
    try {
      session = await withTimeout(
        authSystem.validateSession(sessionId),
        5000,
        'Session validation'
      );
    } catch (sessionError) {
      logError(sessionError, 'session_validation', { sessionId, requestId });
      return NextResponse.json({
        success: false,
        error: 'Session validation service temporarily unavailable',
        code: 'SESSION_VALIDATION_ERROR',
        requestId
      }, { status: 503 });
    }
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION',
        requestId
      }, { status: 401 });
    }

    switch (action) {
      case 'create':
        // Validate user data
        const userValidationErrors = validateUserData(userData);
        if (userValidationErrors.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'User data validation failed',
            details: userValidationErrors,
            code: 'VALIDATION_ERROR',
            requestId
          }, { status: 400 });
        }

        try {
          let newUser;
          let source = 'auth_system';
          
          // Try to create user in database first
          try {
            const dbUser = await withTimeout(
              userOperations.createUser({
                username: userData.username,
                email: userData.email || `${userData.username}@example.com`,
                role: userData.role || 'staff_tester'
              }),
              5000,
              'Database user creation'
            );
            newUser = {
              username: dbUser.username,
              email: dbUser.email,
              name: userData.name,
              role: dbUser.role,
              createdAt: dbUser.createdAt
            };
            source = 'database';
          } catch (dbError) {
            logError(dbError, 'database_user_creation', { username: userData.username, requestId });
            console.log('Database user creation failed, using auth system fallback:', dbError.message);
            
            // Fallback to auth system
            try {
              const authUser = await withTimeout(
                authSystem.addStaffUser(session, userData),
                3000,
                'Auth system user creation'
              );
              newUser = {
                username: authUser.username,
                name: authUser.name,
                role: authUser.role,
                createdAt: authUser.createdAt
              };
            } catch (authError) {
              logError(authError, 'auth_system_user_creation', { username: userData.username, requestId });
              throw new Error('Both database and auth system user creation failed');
            }
          }
          
          console.log(`[USERS] User created successfully: ${userData.username} via ${source}`);
          
          return NextResponse.json({
            success: true,
            user: {
              ...newUser,
              source: source
            },
            message: `Staff user created successfully in ${source}`,
            requestId
          });
        } catch (error) {
          logError(error, 'user_creation', { username: userData.username, requestId });
          
          // Check for specific error types
          if (error.message && error.message.includes('permission')) {
            return NextResponse.json({
              success: false,
              error: 'Insufficient permissions to create user',
              code: 'INSUFFICIENT_PERMISSIONS',
              requestId
            }, { status: 403 });
          }
          
          if (error.message && error.message.includes('already exists')) {
            return NextResponse.json({
              success: false,
              error: 'Username already exists',
              code: 'USERNAME_EXISTS',
              requestId
            }, { status: 409 });
          }
          
          return NextResponse.json({
            success: false,
            error: 'Failed to create user',
            code: 'USER_CREATION_ERROR',
            requestId
          }, { status: 500 });
        }

      case 'deactivate':
        // Validate target username
        const usernameValidationErrors = validateUsername(targetUsername);
        if (usernameValidationErrors.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'Target username validation failed',
            details: usernameValidationErrors,
            code: 'VALIDATION_ERROR',
            requestId
          }, { status: 400 });
        }

        try {
          const deactivated = await withTimeout(
            authSystem.deactivateStaffUser(session, targetUsername),
            5000,
            'User deactivation'
          );
          
          if (deactivated) {
            console.log(`[USERS] User deactivated successfully: ${targetUsername}`);
          }
          
          return NextResponse.json({
            success: deactivated,
            message: deactivated ? 'User deactivated successfully' : 'User not found',
            code: deactivated ? 'SUCCESS' : 'USER_NOT_FOUND',
            requestId
          });
        } catch (error) {
          logError(error, 'user_deactivation', { targetUsername, requestId });
          
          // Check for specific error types
          if (error.message && error.message.includes('permission')) {
            return NextResponse.json({
              success: false,
              error: 'Insufficient permissions to deactivate user',
              code: 'INSUFFICIENT_PERMISSIONS',
              requestId
            }, { status: 403 });
          }
          
          return NextResponse.json({
            success: false,
            error: 'Failed to deactivate user',
            code: 'USER_DEACTIVATION_ERROR',
            requestId
          }, { status: 500 });
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
    logError(error, 'users_api_post', { processingTime, requestId });
    
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
 * Using Node.js runtime for AuthSystem lib import and persistent storage
 */