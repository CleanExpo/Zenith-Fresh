/**
 * Master Admin & Staff Authentication System
 * Provides full access control for master admin and staff testing
 */

const { getSessionStore } = require('../src/lib/session-store.js');

class AuthSystem {
  constructor() {
    // Master admin credentials - MUST be in environment variables
    if (!process.env.MASTER_USERNAME || !process.env.MASTER_PASSWORD) {
      throw new Error('Master credentials not configured in environment variables. Set MASTER_USERNAME and MASTER_PASSWORD.');
    }

    this.sessionStore = getSessionStore();
    this.masterCredentials = {
      username: process.env.MASTER_USERNAME,
      password: process.env.MASTER_PASSWORD,
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
      },
      enterprise: {
        name: 'Enterprise User',
        access: 'enterprise_features',
        aiApis: true,
        competitiveAnalysis: true,
        geoOptimization: true,
        advancedAudits: true,
        systemMonitoring: true,
        userManagement: false,
        billingAccess: false,
        whiteLabel: false,
        apiAccess: 'enterprise',
        exportFormats: 'standard'
      },
      professional: {
        name: 'Professional User',
        access: 'professional_features',
        aiApis: 'limited',
        competitiveAnalysis: 'basic',
        geoOptimization: false,
        advancedAudits: 'basic',
        systemMonitoring: 'basic',
        userManagement: false,
        billingAccess: false,
        whiteLabel: false,
        apiAccess: 'limited',
        exportFormats: 'basic'
      },
      starter: {
        name: 'Starter User',
        access: 'basic_features',
        aiApis: false,
        competitiveAnalysis: false,
        geoOptimization: false,
        advancedAudits: false,
        systemMonitoring: 'basic',
        userManagement: false,
        billingAccess: false,
        whiteLabel: false,
        apiAccess: 'very_limited',
        exportFormats: 'json_only'
      }
    };
    
    this.initializeStaffUsers();
  }

  /**
   * Initialize staff users from environment variables
   * Format: STAFF_USERS=user1:pass1:name1:role1,user2:pass2:name2:role2
   */
  initializeStaffUsers() {
    const staffUsersEnv = process.env.STAFF_USERS;
    
    if (!staffUsersEnv) {
      console.log('⚠️  No staff users configured. Set STAFF_USERS environment variable to add staff accounts.');
      return;
    }

    try {
      const staffList = staffUsersEnv.split(',').map(userStr => {
        const [username, password, name, role] = userStr.trim().split(':');
        if (!username || !password || !name || !role) {
          throw new Error(`Invalid staff user format: ${userStr}`);
        }
        return { username, password, name, role };
      });

      staffList.forEach(staff => {
        this.staffUsers.set(staff.username, {
          ...staff,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          active: true
        });
      });

      console.log(`✅ Initialized ${staffList.length} staff users from environment`);
    } catch (error) {
      console.error('❌ Error initializing staff users:', error.message);
      console.log('Format: STAFF_USERS=user1:pass1:name1:role1,user2:pass2:name2:role2');
    }
  }

  /**
   * Authenticate user (master admin or staff)
   */
  async authenticate(username, password) {
    // Check master admin credentials
    if (username === this.masterCredentials.username && 
        password === this.masterCredentials.password) {
      return await this.createSession({
        username: this.masterCredentials.username,
        role: this.masterCredentials.role,
        name: 'Master Administrator',
        permissions: this.permissionLevels.master_admin
      });
    }

    // Check staff users
    const staff = this.staffUsers.get(username);
    if (staff && staff.password === password && staff.active) {
      staff.lastLogin = new Date().toISOString();
      return await this.createSession({
        username: staff.username,
        role: staff.role,
        name: staff.name,
        permissions: this.permissionLevels[staff.role]
      });
    }

    return null;
  }

  /**
   * Create authenticated session
   */
  async createSession(user) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionData = {
      userId: user.username,
      role: user.role,
      user: user,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    // Store session for 24 hours (86400 seconds)
    await this.sessionStore.setSession(sessionId, sessionData, 86400);
    
    const session = {
      id: sessionId,
      user: user,
      createdAt: sessionData.createdAt,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      lastActivity: sessionData.lastActivity
    };

    return session;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId) {
    const sessionData = await this.sessionStore.getSession(sessionId);
    if (!sessionData) return null;

    // Update last activity and renew session
    await this.sessionStore.renewSession(sessionId, 86400);
    
    const session = {
      id: sessionId,
      user: sessionData.user,
      createdAt: sessionData.createdAt,
      expiresAt: new Date(sessionData.expiresAt).toISOString(),
      lastActivity: new Date().toISOString()
    };

    return session;
  }

  /**
   * Check if user has permission for specific feature
   */
  hasPermission(session, feature) {
    if (!session || !session.user) return false;

    const permissions = session.user.permissions;
    if (!permissions) return false;

    // Master admin has access to everything
    if (session.user.role === 'master_admin') return true;

    // Check specific permissions
    switch (feature) {
      case 'ai_apis':
        return permissions.aiApis === true;
      case 'competitive_analysis':
        return permissions.competitiveAnalysis === true || permissions.competitiveAnalysis === 'basic';
      case 'geo_optimization':
        return permissions.geoOptimization === true;
      case 'advanced_audits':
        return permissions.advancedAudits === true || permissions.advancedAudits === 'basic';
      case 'system_monitoring':
        return permissions.systemMonitoring === true || permissions.systemMonitoring === 'basic';
      case 'user_management':
        return permissions.userManagement === true;
      case 'billing_access':
        return permissions.billingAccess === true;
      case 'white_label':
        return permissions.whiteLabel === true;
      case 'api_access':
        return permissions.apiAccess !== 'none';
      case 'export_all_formats':
        return permissions.exportFormats === 'all';
      default:
        return false;
    }
  }

  /**
   * Add new staff user (master admin only)
   */
  addStaffUser(adminSession, userData) {
    if (!this.hasPermission(adminSession, 'user_management')) {
      throw new Error('Insufficient permissions');
    }

    const staffUser = {
      username: userData.username,
      password: userData.password,
      name: userData.name,
      role: userData.role || 'staff_tester',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      active: true,
      createdBy: adminSession.user.username
    };

    this.staffUsers.set(userData.username, staffUser);
    return staffUser;
  }

  /**
   * Get all staff users (master admin only)
   */
  getStaffUsers(adminSession) {
    if (!this.hasPermission(adminSession, 'user_management')) {
      throw new Error('Insufficient permissions');
    }

    return Array.from(this.staffUsers.values()).map(user => ({
      username: user.username,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      active: user.active
    }));
  }

  /**
   * Deactivate staff user (master admin only)
   */
  deactivateStaffUser(adminSession, username) {
    if (!this.hasPermission(adminSession, 'user_management')) {
      throw new Error('Insufficient permissions');
    }

    const user = this.staffUsers.get(username);
    if (user) {
      user.active = false;
      return true;
    }
    return false;
  }

  /**
   * Get user's feature access summary
   */
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

  /**
   * Logout user
   */
  async logout(sessionId) {
    return await this.sessionStore.deleteSession(sessionId);
  }

  /**
   * Get active sessions (master admin only)
   */
  async getActiveSessions(adminSession) {
    if (!this.hasPermission(adminSession, 'user_management')) {
      throw new Error('Insufficient permissions');
    }

    const activeSessions = await this.sessionStore.getActiveSessions();
    return activeSessions.map(session => ({
      id: session.sessionId,
      username: session.userId,
      role: session.role,
      createdAt: new Date(session.createdAt).toISOString(),
      lastActivity: new Date(session.lastAccessed).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString()
    }));
  }
}

module.exports = AuthSystem;