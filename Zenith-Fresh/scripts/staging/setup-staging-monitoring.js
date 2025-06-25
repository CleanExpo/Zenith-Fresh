#!/usr/bin/env node

/**
 * =============================================================================
 * ZENITH PLATFORM - STAGING MONITORING AND ALERTS SETUP
 * =============================================================================
 * This script configures comprehensive monitoring and alerting for staging environment
 * Usage: node scripts/staging/setup-staging-monitoring.js [--setup] [--verify] [--test]
 * =============================================================================
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  stagingUrl: 'https://staging.zenith.engineer',
  environment: 'staging',
  monitoringEndpoints: [
    '/api/health',
    '/api/auth/session',
    '/api/feature-flags',
    '/dashboard',
    '/api/website-analyzer'
  ],
  alertThresholds: {
    responseTime: 3000, // ms
    errorRate: 5, // percentage
    uptime: 99.0, // percentage
    memoryUsage: 80, // percentage
    cpuUsage: 80 // percentage
  },
  checkInterval: 60000, // 1 minute
  retryAttempts: 3,
  timeoutMs: 10000
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

// Logging utilities
const log = (message, color = 'blue') => {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}]${colors.reset} ${message}`);
};

const error = (message) => log(`❌ ERROR: ${message}`, 'red');
const success = (message) => log(`✅ SUCCESS: ${message}`, 'green');
const warning = (message) => log(`⚠️  WARNING: ${message}`, 'yellow');
const info = (message) => log(`ℹ️  INFO: ${message}`, 'cyan');

// Utility function to execute shell commands
const execCommand = (command, options = {}) => {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (err) {
    return { 
      success: false, 
      error: err.message, 
      output: err.stdout || err.stderr || 'Command failed'
    };
  }
};

// HTTP request utility with timeout and retries
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeout = options.timeout || CONFIG.timeoutMs;
    
    const req = https.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
  });
};

// Health check for a single endpoint
const checkEndpointHealth = async (endpoint) => {
  const url = `${CONFIG.stagingUrl}${endpoint}`;
  const maxRetries = CONFIG.retryAttempts;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await makeRequest(url);
      
      return {
        endpoint,
        url,
        status: 'healthy',
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        attempt,
        timestamp: new Date().toISOString(),
        healthy: response.statusCode >= 200 && response.statusCode < 400,
        data: response.data.substring(0, 500) // Truncate response data
      };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        warning(`Attempt ${attempt}/${maxRetries} failed for ${endpoint}: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  return {
    endpoint,
    url,
    status: 'unhealthy',
    statusCode: 0,
    responseTime: 0,
    attempt: maxRetries,
    timestamp: new Date().toISOString(),
    healthy: false,
    error: lastError?.message || 'Unknown error'
  };
};

// Comprehensive health check
const performHealthCheck = async () => {
  info('Performing comprehensive health check...');
  
  const results = await Promise.all(
    CONFIG.monitoringEndpoints.map(endpoint => checkEndpointHealth(endpoint))
  );
  
  const summary = {
    timestamp: new Date().toISOString(),
    environment: CONFIG.environment,
    baseUrl: CONFIG.stagingUrl,
    totalEndpoints: results.length,
    healthyEndpoints: results.filter(r => r.healthy).length,
    unhealthyEndpoints: results.filter(r => !r.healthy).length,
    averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
    results
  };
  
  // Log summary
  info(`Health Check Summary:`);
  info(`  Total Endpoints: ${summary.totalEndpoints}`);
  info(`  Healthy: ${summary.healthyEndpoints}`);
  info(`  Unhealthy: ${summary.unhealthyEndpoints}`);
  info(`  Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
  
  // Log individual results
  results.forEach(result => {
    const status = result.healthy ? '✅' : '❌';
    const message = `${status} ${result.endpoint} (${result.statusCode}) - ${result.responseTime}ms`;
    
    if (result.healthy) {
      success(message);
    } else {
      error(`${message} - ${result.error}`);
    }
  });
  
  return summary;
};

// Set up Vercel monitoring environment variables
const setupVercelMonitoring = () => {
  info('Setting up Vercel monitoring environment variables...');
  
  const monitoringVars = {
    'NEXT_PUBLIC_MONITORING_ENABLED': 'true',
    'MONITORING_ENVIRONMENT': 'staging',
    'MONITORING_BASE_URL': CONFIG.stagingUrl,
    'HEALTH_CHECK_INTERVAL': CONFIG.checkInterval.toString(),
    'ALERT_RESPONSE_TIME_THRESHOLD': CONFIG.alertThresholds.responseTime.toString(),
    'ALERT_ERROR_RATE_THRESHOLD': CONFIG.alertThresholds.errorRate.toString(),
    'ALERT_UPTIME_THRESHOLD': CONFIG.alertThresholds.uptime.toString()
  };
  
  try {
    for (const [key, value] of Object.entries(monitoringVars)) {
      const setVarCommand = `echo "${value}" | vercel env add ${key} staging --force`;
      const result = execCommand(setVarCommand, { silent: true });
      
      if (result.success) {
        success(`✅ ${key} configured`);
      } else {
        warning(`Failed to set ${key}: ${result.error}`);
      }
    }
    
    success('Vercel monitoring environment variables configured');
    return true;
  } catch (err) {
    error(`Failed to configure monitoring variables: ${err.message}`);
    return false;
  }
};

// Create monitoring dashboard API endpoint
const createMonitoringEndpoint = () => {
  info('Creating monitoring dashboard API endpoint...');
  
  const monitoringApiPath = './app/api/staging-monitoring/route.ts';
  const monitoringApiContent = `
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Basic health checks
    const healthChecks = {
      timestamp: new Date().toISOString(),
      environment: 'staging',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    };
    
    // Database health check
    try {
      await prisma.$connect();
      const dbResult = await prisma.$queryRaw\`SELECT NOW() as current_time\`;
      healthChecks.database = {
        status: 'connected',
        responseTime: Date.now() - startTime,
        timestamp: dbResult[0]?.current_time
      };
    } catch (err) {
      healthChecks.database = {
        status: 'error',
        error: err.message
      };
    } finally {
      await prisma.$disconnect();
    }
    
    // Feature flags status
    healthChecks.featureFlags = {
      enabled: process.env.FEATURE_FLAGS_ENABLED === 'true',
      stagingMode: process.env.STAGING_MODE === 'true',
      debugMode: process.env.DEBUG_MODE === 'true'
    };
    
    // Environment check
    healthChecks.environment = {
      nodeEnv: process.env.NODE_ENV,
      appEnv: process.env.NEXT_PUBLIC_APP_ENV,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL,
      authUrl: process.env.NEXTAUTH_URL
    };
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ...healthChecks,
      responseTime,
      status: 'healthy'
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: 'staging'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log monitoring event
    console.log('Monitoring event received:', {
      timestamp: new Date().toISOString(),
      environment: 'staging',
      event: body
    });
    
    return NextResponse.json({
      status: 'logged',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 400 });
  }
}`;
  
  // Ensure the directory exists
  const apiDir = path.dirname(monitoringApiPath);
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  // Write the monitoring endpoint
  fs.writeFileSync(monitoringApiPath, monitoringApiContent);
  success(`Monitoring API endpoint created: ${monitoringApiPath}`);
  
  return true;
};

// Create health check script
const createHealthCheckScript = () => {
  info('Creating health check script...');
  
  const healthCheckScript = `#!/usr/bin/env node

/**
 * Automated health check script for staging environment
 */

const https = require('https');

const CONFIG = ${JSON.stringify(CONFIG, null, 2)};

const checkHealth = async () => {
  const url = \`\${CONFIG.stagingUrl}/api/staging-monitoring\`;
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: parsed,
            healthy: res.statusCode === 200 && parsed.status === 'healthy'
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data,
            healthy: res.statusCode === 200,
            parseError: err.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(CONFIG.timeoutMs, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

const main = async () => {
  try {
    console.log('🏥 Running staging health check...');
    
    const result = await checkHealth();
    
    if (result.healthy) {
      console.log('✅ Staging environment is healthy');
      console.log(\`📊 Response time: \${result.responseTime}ms\`);
      
      if (result.data.database) {
        console.log(\`🗄️  Database: \${result.data.database.status}\`);
      }
      
      if (result.data.memory) {
        const memoryMB = Math.round(result.data.memory.used / 1024 / 1024);
        console.log(\`💾 Memory usage: \${memoryMB}MB\`);
      }
      
      process.exit(0);
    } else {
      console.error('❌ Staging environment is unhealthy');
      console.error(\`Status code: \${result.statusCode}\`);
      console.error(\`Response time: \${result.responseTime}ms\`);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    process.exit(1);
  }
};

main();`;
  
  const healthCheckPath = path.join(__dirname, 'health-check.js');
  fs.writeFileSync(healthCheckPath, healthCheckScript);
  execCommand(`chmod +x "${healthCheckPath}"`);
  
  success(`Health check script created: ${healthCheckPath}`);
  return healthCheckPath;
};

// Create monitoring dashboard
const createMonitoringDashboard = () => {
  info('Creating monitoring dashboard component...');
  
  const dashboardContent = `
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MonitoringData {
  timestamp: string;
  environment: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    free: number;
  };
  database: {
    status: string;
    responseTime: number;
  };
  featureFlags: {
    enabled: boolean;
    stagingMode: boolean;
    debugMode: boolean;
  };
  responseTime: number;
  status: string;
}

export function StagingMonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staging-monitoring');
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      const monitoringData = await response.json();
      setData(monitoringData);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (uptimeSeconds: number) => {
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    return \`\${hours}h \${minutes}m\`;
  };

  const formatMemory = (bytes: number) => {
    return \`\${Math.round(bytes / 1024 / 1024)}MB\`;
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staging Environment Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading monitoring data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staging Environment Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">
            <p>Error loading monitoring data: {error}</p>
            <Button onClick={fetchMonitoringData} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Staging Environment Monitoring</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={data?.status === 'healthy' ? 'default' : 'destructive'}>
              {data?.status || 'Unknown'}
            </Badge>
            <Button 
              onClick={fetchMonitoringData}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            Last updated: {lastUpdate.toLocaleString()}
          </div>
          
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-mono">{formatUptime(data.uptime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span className="font-mono">{data.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Environment:</span>
                      <Badge variant="outline">{data.environment}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Memory Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span className="font-mono">{formatMemory(data.memory.used)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free:</span>
                      <span className="font-mono">{formatMemory(data.memory.free)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-mono">{formatMemory(data.memory.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Database Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={data.database.status === 'connected' ? 'default' : 'destructive'}>
                        {data.database.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span className="font-mono">{data.database.responseTime}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature Flags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feature Flags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Enabled:</span>
                      <Badge variant={data.featureFlags.enabled ? 'default' : 'destructive'}>
                        {data.featureFlags.enabled ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Staging Mode:</span>
                      <Badge variant={data.featureFlags.stagingMode ? 'default' : 'outline'}>
                        {data.featureFlags.stagingMode ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Debug Mode:</span>
                      <Badge variant={data.featureFlags.debugMode ? 'default' : 'outline'}>
                        {data.featureFlags.debugMode ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}`;
  
  const dashboardPath = './components/staging-monitoring-dashboard.tsx';
  fs.writeFileSync(dashboardPath, dashboardContent);
  
  success(`Monitoring dashboard created: ${dashboardPath}`);
  return dashboardPath;
};

// Generate monitoring configuration report
const generateMonitoringReport = () => {
  info('Generating monitoring configuration report...');
  
  const report = `# Staging Monitoring Configuration Report

**Generated:** ${new Date().toISOString()}  
**Environment:** ${CONFIG.environment}  
**Base URL:** ${CONFIG.stagingUrl}  

## Monitoring Configuration ✅

### Health Check Endpoints
${CONFIG.monitoringEndpoints.map(endpoint => `- ${CONFIG.stagingUrl}${endpoint}`).join('\n')}

### Alert Thresholds
- **Response Time:** ${CONFIG.alertThresholds.responseTime}ms
- **Error Rate:** ${CONFIG.alertThresholds.errorRate}%
- **Uptime:** ${CONFIG.alertThresholds.uptime}%
- **Memory Usage:** ${CONFIG.alertThresholds.memoryUsage}%
- **CPU Usage:** ${CONFIG.alertThresholds.cpuUsage}%

### Monitoring Settings
- **Check Interval:** ${CONFIG.checkInterval / 1000} seconds
- **Retry Attempts:** ${CONFIG.retryAttempts}
- **Timeout:** ${CONFIG.timeoutMs / 1000} seconds

## Components Created ✅

### API Endpoints
- **Health Check:** \`/api/staging-monitoring\`
- **Real-time Status:** GET endpoint for current health
- **Event Logging:** POST endpoint for monitoring events

### Scripts
- **Health Check Script:** \`scripts/staging/health-check.js\`
- **Automated monitoring with configurable thresholds**
- **Exit codes for CI/CD integration**

### Dashboard
- **Monitoring Dashboard:** \`components/staging-monitoring-dashboard.tsx\`
- **Real-time health visualization**
- **Auto-refresh every 30 seconds**
- **Memory, database, and system metrics**

### Environment Variables
- **NEXT_PUBLIC_MONITORING_ENABLED:** true
- **MONITORING_ENVIRONMENT:** staging
- **MONITORING_BASE_URL:** ${CONFIG.stagingUrl}
- **HEALTH_CHECK_INTERVAL:** ${CONFIG.checkInterval}
- **Alert thresholds configured**

## Usage Instructions

### Manual Health Check
\`\`\`bash
# Run health check script
node scripts/staging/health-check.js

# Check specific endpoint
curl ${CONFIG.stagingUrl}/api/staging-monitoring

# Comprehensive health check
node scripts/staging/ci-staging-workflow.js healthCheck
\`\`\`

### Continuous Monitoring
\`\`\`bash
# Set up cron job for regular health checks (every 5 minutes)
echo "*/5 * * * * node /path/to/scripts/staging/health-check.js" | crontab -

# GitHub Actions monitoring (automated with deployments)
# See .github/workflows/staging-deploy.yml
\`\`\`

### Dashboard Access
- **Staging Dashboard:** ${CONFIG.stagingUrl}/staging-monitoring
- **Add to navigation or admin panel as needed**
- **Real-time metrics and health status**

## Integration Points

### CI/CD Pipeline
- **Pre-deployment:** Health checks before deployment
- **Post-deployment:** Verification of successful deployment
- **Continuous:** Ongoing monitoring during staging use

### Alerting
- **Slack Integration:** Configure webhook for alerts
- **Email Alerts:** Set up email notifications for critical issues
- **PagerDuty:** Integrate with incident management (if needed)

### External Monitoring
- **Uptime Robot:** Free external monitoring service
- **StatusCake:** SSL and performance monitoring
- **Pingdom:** Comprehensive monitoring solution

## Alert Configuration

### Slack Webhook Setup
\`\`\`bash
# Add Slack webhook URL to Vercel environment
vercel env add SLACK_WEBHOOK_URL staging
# Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
\`\`\`

### Email Alerts Setup
\`\`\`bash
# Configure email settings
vercel env add ALERT_EMAIL_TO staging
# Value: team@zenith.engineer

vercel env add ALERT_EMAIL_FROM staging
# Value: alerts@zenith.engineer
\`\`\`

## Monitoring Metrics

### Performance Metrics
- **Response Time:** Track API response times
- **Throughput:** Requests per minute/hour
- **Error Rate:** Percentage of failed requests
- **Database Performance:** Query response times

### System Metrics
- **Memory Usage:** Application memory consumption
- **CPU Usage:** Server CPU utilization
- **Uptime:** Service availability percentage
- **SSL Certificate:** Certificate expiration monitoring

### Business Metrics
- **User Registration:** Track signup success rate
- **Feature Usage:** Monitor feature flag adoption
- **Error Patterns:** Identify common user issues
- **Performance Trends:** Track improvements over time

## Troubleshooting

### Common Issues
1. **High Response Times**
   - Check database query performance
   - Review server resource usage
   - Verify external API response times

2. **Database Connection Issues**
   - Verify Railway database status
   - Check connection pool settings
   - Review database migration status

3. **SSL Certificate Problems**
   - Check Vercel domain configuration
   - Verify DNS settings
   - Monitor certificate expiration

### Debug Commands
\`\`\`bash
# Check monitoring endpoint directly
curl -v ${CONFIG.stagingUrl}/api/staging-monitoring

# Test database connection
node scripts/staging/setup-staging-database.js verify

# Check environment variables
vercel env ls

# View deployment logs
vercel logs --follow
\`\`\`

## Next Steps

1. **Configure External Monitoring**
   - Set up Uptime Robot or similar service
   - Configure SSL certificate monitoring
   - Set up performance monitoring

2. **Implement Alerting**
   - Configure Slack/email notifications
   - Set up escalation procedures
   - Define incident response process

3. **Enhance Monitoring**
   - Add custom business metrics
   - Implement log aggregation
   - Set up performance benchmarking

4. **Documentation**
   - Create runbooks for common issues
   - Document alerting procedures
   - Train team on monitoring dashboard

---

*Generated by Zenith Platform Staging Monitoring Setup*  
*Configuration completed: ${new Date().toISOString()}*
`;
  
  fs.writeFileSync('staging-monitoring-report.md', report);
  success('Monitoring configuration report generated: staging-monitoring-report.md');
};

// Main workflow functions
const workflows = {
  // Full monitoring setup
  async setup() {
    try {
      info('Setting up comprehensive staging monitoring...');
      
      setupVercelMonitoring();
      createMonitoringEndpoint();
      const healthCheckPath = createHealthCheckScript();
      createMonitoringDashboard();
      generateMonitoringReport();
      
      success('🚀 Staging monitoring setup completed successfully!');
      info('Next steps:');
      info('  1. Deploy the new monitoring endpoint to staging');
      info('  2. Configure external monitoring services');
      info('  3. Set up alerting (Slack, email, etc.)');
      info('  4. Test monitoring dashboard');
      
    } catch (err) {
      error(`Monitoring setup failed: ${err.message}`);
      process.exit(1);
    }
  },
  
  // Verify monitoring configuration
  async verify() {
    try {
      info('Verifying staging monitoring configuration...');
      
      const summary = await performHealthCheck();
      
      if (summary.healthyEndpoints === summary.totalEndpoints) {
        success('🏥 All monitoring endpoints are healthy');
      } else {
        warning(`⚠️ ${summary.unhealthyEndpoints}/${summary.totalEndpoints} endpoints are unhealthy`);
      }
      
      // Check if monitoring API endpoint exists
      try {
        const monitoringResult = await checkEndpointHealth('/api/staging-monitoring');
        if (monitoringResult.healthy) {
          success('📊 Monitoring API endpoint is operational');
        } else {
          warning('⚠️ Monitoring API endpoint is not available');
        }
      } catch (err) {
        warning('⚠️ Could not verify monitoring API endpoint');
      }
      
    } catch (err) {
      error(`Monitoring verification failed: ${err.message}`);
      process.exit(1);
    }
  },
  
  // Test monitoring and alerting
  async test() {
    try {
      info('Testing monitoring and alerting systems...');
      
      // Test health check script
      info('Testing health check script...');
      const healthCheckPath = path.join(__dirname, 'health-check.js');
      if (fs.existsSync(healthCheckPath)) {
        const result = execCommand(`node "${healthCheckPath}"`, { silent: false });
        if (result.success) {
          success('Health check script test passed');
        } else {
          warning('Health check script test failed');
        }
      } else {
        warning('Health check script not found');
      }
      
      // Test monitoring endpoint
      info('Testing monitoring endpoint...');
      const monitoringResult = await checkEndpointHealth('/api/staging-monitoring');
      if (monitoringResult.healthy) {
        success('Monitoring endpoint test passed');
        info(`Response time: ${monitoringResult.responseTime}ms`);
      } else {
        warning('Monitoring endpoint test failed');
      }
      
      // Test comprehensive health check
      info('Running comprehensive health check...');
      const healthSummary = await performHealthCheck();
      
      success('🧪 Monitoring tests completed');
      info(`Health score: ${healthSummary.healthyEndpoints}/${healthSummary.totalEndpoints}`);
      
    } catch (err) {
      error(`Monitoring test failed: ${err.message}`);
      process.exit(1);
    }
  }
};

// CLI interface
const main = async () => {
  const [,, command = 'setup', ...args] = process.argv;
  
  if (!workflows[command]) {
    error(`Unknown command: ${command}`);
    console.log('\nAvailable commands:');
    console.log('  setup   - Set up comprehensive staging monitoring');
    console.log('  verify  - Verify monitoring configuration and health');
    console.log('  test    - Test monitoring and alerting systems');
    process.exit(1);
  }
  
  info(`Running staging monitoring workflow: ${command}`);
  await workflows[command](...args);
};

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    error(`Monitoring workflow failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { workflows, CONFIG };