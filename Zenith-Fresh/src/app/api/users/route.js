/**
 * User Management API Endpoint
 * Handles staff user management (master admin only)
 */

import { NextResponse } from 'next/server';

// Import the AuthSystem
import AuthSystem from '../../../../lib/auth-system.js';
const authSystem = new AuthSystem();

/**
 * GET - Get all staff users (master admin only)
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const action = url.searchParams.get('action');

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

    switch (action) {
      case 'list':
        try {
          const staffUsers = authSystem.getStaffUsers(session);
          return NextResponse.json({
            success: true,
            users: staffUsers
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error.message
          }, { status: 403 });
        }

      case 'sessions':
        try {
          const activeSessions = authSystem.getActiveSessions(session);
          return NextResponse.json({
            success: true,
            sessions: activeSessions
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error.message
          }, { status: 403 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Users GET API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * POST - Add new staff user or manage existing users
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, action, userData, targetUsername } = body;

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

    switch (action) {
      case 'create':
        if (!userData || !userData.username || !userData.password || !userData.name) {
          return NextResponse.json({
            success: false,
            error: 'Username, password, and name are required'
          }, { status: 400 });
        }

        try {
          const newUser = authSystem.addStaffUser(session, userData);
          return NextResponse.json({
            success: true,
            user: {
              username: newUser.username,
              name: newUser.name,
              role: newUser.role,
              createdAt: newUser.createdAt
            },
            message: 'Staff user created successfully'
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error.message
          }, { status: 403 });
        }

      case 'deactivate':
        if (!targetUsername) {
          return NextResponse.json({
            success: false,
            error: 'Target username required'
          }, { status: 400 });
        }

        try {
          const deactivated = authSystem.deactivateStaffUser(session, targetUsername);
          return NextResponse.json({
            success: deactivated,
            message: deactivated ? 'User deactivated successfully' : 'User not found'
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error.message
          }, { status: 403 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Users POST API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Using Node.js runtime for AuthSystem lib import and persistent storage
 */