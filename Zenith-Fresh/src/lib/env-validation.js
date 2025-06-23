/**
 * Environment Variable Validation for Zenith Fresh
 * Validates all required environment variables at startup
 */

// List all required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL', 
  'NEXTAUTH_SECRET',
  'MASTER_USERNAME',
  'MASTER_PASSWORD',
  'OPENAI_API_KEY'
];

// Optional environment variables with defaults
const optionalEnvVars = {
  'NODE_ENV': 'development',
  'PORT': '3000',
  'SESSION_EXPIRY_HOURS': '24',
  'MAX_LOGIN_ATTEMPTS': '5',
  'RATE_LIMIT_WINDOW': '900000', // 15 minutes in milliseconds
  'RATE_LIMIT_MAX_REQUESTS': '100'
};

/**
 * Validate environment variables
 */
export function validateEnv() {
  const missing = [];
  const warnings = [];
  
  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check for development defaults in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.MASTER_PASSWORD === 'ZenithMaster2024!') {
      warnings.push('Using default MASTER_PASSWORD in production');
    }
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      warnings.push('NEXTAUTH_SECRET should be at least 32 characters');
    }
  }
  
  // Set defaults for optional variables
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      console.log(`🔧 Set default ${varName}=${defaultValue}`);
    }
  }
  
  // Report results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    } else {
      console.log('⚠️  Continuing in development mode with missing variables');
    }
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  // Report warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:', warnings.join(', '));
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Get environment-specific configuration
 */
export function getConfig() {
  return {
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
    port: parseInt(process.env.PORT) || 3000,
    sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS) || 24,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    database: {
      url: process.env.DATABASE_URL
    },
    auth: {
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nextAuthSecret: process.env.NEXTAUTH_SECRET,
      masterUsername: process.env.MASTER_USERNAME,
      masterPassword: process.env.MASTER_PASSWORD
    },
    apis: {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY
    }
  };
}

/**
 * Validate environment at startup
 */
export function initializeEnvironment() {
  console.log('🔍 Validating environment variables...');
  const validation = validateEnv();
  
  if (validation.valid) {
    console.log('✅ Environment validation passed');
  } else {
    console.error('❌ Environment validation failed');
  }
  
  return validation;
}

const envValidation = {
  validateEnv,
  getConfig,
  initializeEnvironment
};

export default envValidation;