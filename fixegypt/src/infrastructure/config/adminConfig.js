import bcrypt from 'bcrypt';

/**
 * Admin configuration for FixEgypt
 * Contains default admin credentials and settings
 */
const adminConfig = {

  
  // Permissions configuration
  permissions: {
    // Report permissions
    reports: {
      view: ['admin', 'manager'],
      update: ['admin', 'manager'],
      delete: ['admin'],
      assign: ['admin', 'manager'],
      dashboard: ['admin', 'manager', 'analyst']
    },
    
    // User permissions
    users: {
      view: ['admin', 'manager'],
      create: ['admin'],
      update: ['admin'],
      delete: ['admin'],
      verify: ['admin', 'manager']
    },
    
    // Analytics permissions
    analytics: {
      view: ['admin', 'manager', 'analyst'],
      export: ['admin', 'manager'],
      advanced: ['admin', 'analyst']
    },
    
    // System permissions
    system: {
      settings: ['admin'],
      logs: ['admin'],
      maintenance: ['admin']
    }
  },
  
  // Session settings
  session: {
    maxInactiveMinutes: 30, // Logout after 30 minutes of inactivity
    maxActiveDays: 1 // Force re-login after 1 day
  },
  
  // Security settings
  security: {
    loginAttempts: 5, // Lock account after 5 failed login attempts
    lockoutMinutes: 15, // Lock duration in minutes
    requirePasswordChange: 60 // Require password change every 60 days
  }
};

export default adminConfig; 