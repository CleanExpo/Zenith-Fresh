/**
 * Environment Detection and Configuration
 * Provides utilities for detecting current environment and managing environment-specific behavior
 */

export type Environment = 'development' | 'staging' | 'production';

/**
 * Get the current environment
 */
export function getEnvironment(): Environment {
  if (process.env.NODE_ENV === 'development') return 'development';
  if (process.env.NODE_ENV === 'staging') return 'staging';
  return 'production';
}

/**
 * Check if we're in development
 */
export const isDevelopment = (): boolean => getEnvironment() === 'development';

/**
 * Check if we're in staging
 */
export const isStaging = (): boolean => getEnvironment() === 'staging';

/**
 * Check if we're in production
 */
export const isProduction = (): boolean => getEnvironment() === 'production';

/**
 * Check if we're in a non-production environment
 */
export const isNonProduction = (): boolean => !isProduction();

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = getEnvironment();
  
  return {
    environment: env,
    isDevelopment: isDevelopment(),
    isStaging: isStaging(),
    isProduction: isProduction(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Zenith Platform',
    
    // Feature flags
    featureFlags: {
      enhancedAnalyzer: process.env.NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER === 'true',
      teamManagement: process.env.NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT === 'true',
      aiContentAnalysis: process.env.NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS === 'true',
      competitiveIntelligence: process.env.NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE === 'true',
    },
    
    // Environment-specific settings
    showStagingBanner: env === 'staging' && process.env.STAGING_BANNER === 'true',
    enableDebugMode: env !== 'production',
    enableAnalytics: env === 'production' || process.env.ENABLE_ANALYTICS === 'true',
    enableSentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Database and caching
    enableRedis: !!process.env.REDIS_URL,
    enableBackgroundJobs: env === 'production' || process.env.ENABLE_BACKGROUND_JOBS === 'true',
  };
}

/**
 * Get database configuration based on environment
 */
export function getDatabaseConfig() {
  const env = getEnvironment();
  
  return {
    url: process.env.DATABASE_URL || '',
    pooling: env === 'production',
    logging: env === 'development',
    maxConnections: env === 'production' ? 20 : 5,
    connectionTimeout: env === 'production' ? 10000 : 5000,
  };
}

/**
 * Get Redis configuration based on environment
 */
export function getRedisConfig() {
  const env = getEnvironment();
  
  return {
    url: process.env.REDIS_URL,
    enabled: !!process.env.REDIS_URL,
    maxRetries: env === 'production' ? 3 : 1,
    connectTimeout: env === 'production' ? 10000 : 5000,
    keyPrefix: `zenith:${env}:`,
    defaultTTL: env === 'production' ? 3600 : 300, // 1 hour prod, 5 min dev
  };
}

/**
 * Environment-specific logging
 */
export function envLog(message: string, data?: any) {
  const env = getEnvironment();
  const timestamp = new Date().toISOString();
  
  if (env === 'development') {
    console.log(`[${timestamp}] [${env.toUpperCase()}] ${message}`, data || '');
  } else if (env === 'staging') {
    console.log(`[STAGING] ${message}`, data || '');
  }
  // Production logs are handled by external monitoring
}

/**
 * Feature flag helper
 */
export function isFeatureEnabled(featureName: keyof ReturnType<typeof getEnvironmentConfig>['featureFlags']): boolean {
  const config = getEnvironmentConfig();
  return config.featureFlags[featureName] || false;
}

/**
 * Environment banner component props
 */
export function getEnvironmentBannerProps() {
  const config = getEnvironmentConfig();
  
  if (!config.showStagingBanner) return null;
  
  return {
    environment: getEnvironment(),
    message: `You are viewing the ${getEnvironment()} environment`,
    variant: 'warning' as const,
    dismissible: false,
  };
}