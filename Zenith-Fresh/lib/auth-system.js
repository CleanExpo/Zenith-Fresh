/**
 * Master Admin & Staff Authentication System
 * Provides full access control for master admin and staff testing
 */

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
   * Initialize predefined staff users for testing
   */
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

  /**
   * Authenticate user (master admin or staff)
   */
  authenticate(username, password) {
    // Check master admin credentials
    if (username === this.masterCredentials.username && 
        password === this.masterCredentials.password) {
      return this.createSession({
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
      return this.createSession({
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
  createSession(user) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      user: user,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      lastActivity: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Validate session
   */
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if session expired
    if (new Date() > new Date(session.expiresAt)) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();
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
  logout(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get active sessions (master admin only)
   */
  getActiveSessions(adminSession) {
    if (!this.hasPermission(adminSession, 'user_management')) {
      throw new Error('Insufficient permissions');
    }

    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      username: session.user.username,
      role: session.user.role,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt
    }));
  }
}

export default AuthSystem;