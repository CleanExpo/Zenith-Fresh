#!/usr/bin/env tsx
/**
 * ZENITH MONITORING CLI
 * Command-line interface for advanced monitoring and observability operations
 */

import { Command } from 'commander';
const program = new Command();
import chalk from 'chalk';
import { monitoringAgent, activateMonitoring, deactivateMonitoring, getMonitoringReport } from '../src/lib/agents/advanced-monitoring-observability-agent';
import { apiMonitor } from '../src/lib/api/api-performance-monitor';
import { securityMonitor } from '../src/lib/security/security-monitor';

// Configure CLI
program
  .name('zenith-monitoring')
  .description('Zenith Advanced Monitoring & Observability CLI')
  .version('1.0.0');

// ==================== STATUS COMMANDS ====================

program
  .command('status')
  .description('Show monitoring system status')
  .option('-v, --verbose', 'Show detailed status')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🔍 ZENITH MONITORING STATUS\n'));
      
      const status = monitoringAgent.getStatus();
      const apiStatus = apiMonitor.getMonitoringStatus();
      const securityMetrics = securityMonitor.getSecurityMetrics();
      
      // Basic status
      console.log(chalk.green('System Status:'));
      console.log(`  Agent Status: ${status.isActive ? chalk.green('✅ ACTIVE') : chalk.red('❌ INACTIVE')}`);
      console.log(`  API Monitoring: ${apiStatus.isMonitoring ? chalk.green('✅ ACTIVE') : chalk.red('❌ INACTIVE')}`);
      console.log(`  Total Metrics: ${chalk.cyan(apiStatus.metricsCount.toLocaleString())}`);
      console.log(`  Active Alerts: ${chalk.yellow(apiStatus.activeAlertsCount)}`);
      
      // Health summary
      console.log(chalk.green('\nEndpoint Health:'));
      console.log(`  🟢 Healthy: ${chalk.green(apiStatus.healthyEndpoints)}`);
      console.log(`  🟡 Degraded: ${chalk.yellow(apiStatus.degradedEndpoints)}`);
      console.log(`  🔴 Unhealthy: ${chalk.red(apiStatus.unhealthyEndpoints)}`);
      
      // Security summary
      console.log(chalk.green('\nSecurity (24h):'));
      console.log(`  Total Events: ${chalk.cyan(securityMetrics.totalEvents)}`);
      console.log(`  🚨 Critical: ${chalk.red(securityMetrics.eventsBySeverity.CRITICAL)}`);
      console.log(`  ⚠️ High: ${chalk.yellow(securityMetrics.eventsBySeverity.HIGH)}`);
      
      if (options.verbose) {
        console.log(chalk.green('\nDetailed Configuration:'));
        console.log(`  APM: ${status.config.enableAPM ? '✅' : '❌'}`);
        console.log(`  Distributed Tracing: ${status.config.enableDistributedTracing ? '✅' : '❌'}`);
        console.log(`  Business Metrics: ${status.config.enableBusinessMetrics ? '✅' : '❌'}`);
        console.log(`  User Experience: ${status.config.enableUserExperienceMonitoring ? '✅' : '❌'}`);
        console.log(`  Infrastructure: ${status.config.enableInfrastructureMonitoring ? '✅' : '❌'}`);
        console.log(`  Predictive Analytics: ${status.config.enablePredictiveAnalytics ? '✅' : '❌'}`);
        console.log(`  SLA Monitoring: ${status.config.enableSLAMonitoring ? '✅' : '❌'}`);
        console.log(`  Incident Response: ${status.config.enableIncidentResponse ? '✅' : '❌'}`);
        
        console.log(chalk.green('\nMetrics Breakdown:'));
        console.log(`  Traces: ${status.metrics.traces}`);
        console.log(`  Business Metrics: ${status.metrics.businessMetrics}`);
        console.log(`  UX Metrics: ${status.metrics.userExperienceMetrics}`);
        console.log(`  Infrastructure Metrics: ${status.metrics.infrastructureMetrics}`);
        console.log(`  Incidents: ${status.metrics.incidents}`);
        console.log(`  SLA Targets: ${status.metrics.slaTargets}`);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error getting status:'), error);
      process.exit(1);
    }
  });

// ==================== CONTROL COMMANDS ====================

program
  .command('start')
  .description('Start the monitoring agent')
  .action(async () => {
    try {
      console.log(chalk.blue('🚀 Starting Advanced Monitoring & Observability Agent...'));
      
      await activateMonitoring();
      
      console.log(chalk.green('✅ Monitoring agent started successfully!'));
      console.log(chalk.gray('Use "zenith-monitoring status" to check status'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error starting monitoring:'), error);
      process.exit(1);
    }
  });

program
  .command('stop')
  .description('Stop the monitoring agent')
  .action(async () => {
    try {
      console.log(chalk.blue('🛑 Stopping Advanced Monitoring & Observability Agent...'));
      
      await deactivateMonitoring();
      
      console.log(chalk.green('✅ Monitoring agent stopped successfully!'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error stopping monitoring:'), error);
      process.exit(1);
    }
  });

program
  .command('restart')
  .description('Restart the monitoring agent')
  .action(async () => {
    try {
      console.log(chalk.blue('🔄 Restarting Advanced Monitoring & Observability Agent...'));
      
      await deactivateMonitoring();
      console.log(chalk.yellow('⏸️ Agent stopped'));
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await activateMonitoring();
      console.log(chalk.green('✅ Agent restarted successfully!'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error restarting monitoring:'), error);
      process.exit(1);
    }
  });

// ==================== REPORTING COMMANDS ====================

program
  .command('report')
  .description('Generate comprehensive monitoring report')
  .option('-f, --format <format>', 'Output format (text|json)', 'text')
  .option('-o, --output <file>', 'Output file (optional)')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📊 Generating monitoring report...'));
      
      const report = await getMonitoringReport();
      
      if (options.format === 'json') {
        const jsonReport = {
          timestamp: new Date().toISOString(),
          status: monitoringAgent.getStatus(),
          apiStatus: apiMonitor.getMonitoringStatus(),
          securityMetrics: securityMonitor.getSecurityMetrics(),
          incidents: monitoringAgent.getIncidents(),
          slaTargets: monitoringAgent.getSLATargets(),
          textReport: report
        };
        
        const output = JSON.stringify(jsonReport, null, 2);
        
        if (options.output) {
          const fs = await import('fs');
          fs.writeFileSync(options.output, output);
          console.log(chalk.green(`✅ JSON report saved to ${options.output}`));
        } else {
          console.log(output);
        }
      } else {
        if (options.output) {
          const fs = await import('fs');
          fs.writeFileSync(options.output, report);
          console.log(chalk.green(`✅ Report saved to ${options.output}`));
        } else {
          console.log(report);
        }
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error generating report:'), error);
      process.exit(1);
    }
  });

// ==================== PERFORMANCE COMMANDS ====================

program
  .command('performance')
  .description('Show API performance metrics')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .action(async (options) => {
    try {
      const limit = parseInt(options.limit);
      const apiReport = await apiMonitor.generatePerformanceReport();
      
      console.log(chalk.blue.bold('⚡ API PERFORMANCE METRICS\n'));
      console.log(apiReport);
      
    } catch (error) {
      console.error(chalk.red('❌ Error getting performance metrics:'), error);
      process.exit(1);
    }
  });

program
  .command('benchmark')
  .description('Run performance benchmark on endpoint')
  .requiredOption('-e, --endpoint <endpoint>', 'Endpoint to benchmark')
  .option('-m, --method <method>', 'HTTP method', 'GET')
  .option('-c, --concurrent <number>', 'Concurrent users', '10')
  .option('-d, --duration <seconds>', 'Test duration in seconds', '60')
  .action(async (options) => {
    try {
      const { endpoint, method, concurrent, duration } = options;
      
      console.log(chalk.blue(`🏃 Running benchmark: ${method} ${endpoint}`));
      console.log(chalk.gray(`Concurrent users: ${concurrent}, Duration: ${duration}s\n`));
      
      const benchmark = await apiMonitor.runBenchmarkTest(endpoint, {
        method,
        concurrent: parseInt(concurrent),
        duration: parseInt(duration)
      });
      
      console.log(chalk.green('📊 Benchmark Results:'));
      console.log(`  Average Response Time: ${chalk.cyan(benchmark.averageResponseTime.toFixed(2))}ms`);
      console.log(`  P50: ${chalk.cyan(benchmark.p50.toFixed(2))}ms`);
      console.log(`  P90: ${chalk.cyan(benchmark.p90.toFixed(2))}ms`);
      console.log(`  P95: ${chalk.cyan(benchmark.p95.toFixed(2))}ms`);
      console.log(`  P99: ${chalk.cyan(benchmark.p99.toFixed(2))}ms`);
      console.log(`  Throughput: ${chalk.cyan(benchmark.requestsPerSecond.toFixed(2))} req/s`);
      console.log(`  Error Rate: ${chalk.cyan((benchmark.errorRate * 100).toFixed(2))}%`);
      console.log(`  Cache Hit Rate: ${chalk.cyan((benchmark.cacheHitRate * 100).toFixed(2))}%`);
      
    } catch (error) {
      console.error(chalk.red('❌ Error running benchmark:'), error);
      process.exit(1);
    }
  });

// ==================== SECURITY COMMANDS ====================

program
  .command('security')
  .description('Show security monitoring status')
  .option('-t, --threats', 'Show threat intelligence')
  .option('-a, --alerts', 'Show recent security alerts')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🛡️ SECURITY MONITORING\n'));
      
      const securityReport = securityMonitor.generateSecurityReport();
      console.log(securityReport);
      
      if (options.threats) {
        console.log(chalk.red.bold('\n🎯 THREAT INTELLIGENCE\n'));
        const threats = securityMonitor.getThreatsAboveLevel('SUSPICIOUS');
        
        if (threats.length === 0) {
          console.log(chalk.green('✅ No active threats detected'));
        } else {
          threats.forEach(threat => {
            console.log(`${threat.reputation === 'MALICIOUS' ? '🔴' : '🟡'} ${threat.ip}`);
            console.log(`  Reputation: ${chalk.red(threat.reputation)}`);
            console.log(`  Event Count: ${threat.eventCount}`);
            console.log(`  Last Seen: ${threat.lastSeen}`);
            console.log(`  Event Types: ${threat.eventTypes.join(', ')}`);
            console.log('');
          });
        }
      }
      
      if (options.alerts) {
        console.log(chalk.yellow.bold('\n🚨 RECENT SECURITY ALERTS\n'));
        const alerts = securityMonitor.getRecentAlerts(20);
        
        if (alerts.length === 0) {
          console.log(chalk.green('✅ No recent security alerts'));
        } else {
          alerts.forEach(alert => {
            const severityColor = alert.severity === 'CRITICAL' ? chalk.red : 
                                 alert.severity === 'HIGH' ? chalk.yellow : chalk.blue;
            console.log(`${severityColor(alert.severity)} ${alert.type} from ${alert.ip}`);
            console.log(`  Time: ${alert.timestamp}`);
            console.log(`  Status: ${alert.status}`);
            console.log('');
          });
        }
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error getting security status:'), error);
      process.exit(1);
    }
  });

// ==================== INCIDENT COMMANDS ====================

program
  .command('incidents')
  .description('Show incident management status')
  .option('-a, --active', 'Show only active incidents')
  .option('-s, --status <status>', 'Filter by status (open|investigating|resolved|closed)')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🚨 INCIDENT MANAGEMENT\n'));
      
      let incidents = monitoringAgent.getIncidents();
      
      if (options.active) {
        incidents = incidents.filter(i => i.status !== 'closed');
      }
      
      if (options.status) {
        incidents = incidents.filter(i => i.status === options.status);
      }
      
      if (incidents.length === 0) {
        console.log(chalk.green('✅ No incidents match the criteria'));
        return;
      }
      
      incidents.forEach(incident => {
        const severityColor = incident.severity === 'critical' ? chalk.red : 
                             incident.severity === 'high' ? chalk.yellow : 
                             incident.severity === 'medium' ? chalk.blue : chalk.gray;
        
        const statusColor = incident.status === 'resolved' ? chalk.green : 
                           incident.status === 'investigating' ? chalk.yellow : chalk.red;
        
        console.log(`${severityColor(incident.severity.toUpperCase())} ${incident.title}`);
        console.log(`  ID: ${incident.id}`);
        console.log(`  Status: ${statusColor(incident.status.toUpperCase())}`);
        console.log(`  Category: ${incident.category}`);
        console.log(`  Created: ${incident.createdAt.toISOString()}`);
        console.log(`  Updated: ${incident.updatedAt.toISOString()}`);
        if (incident.resolvedAt) {
          console.log(`  Resolved: ${incident.resolvedAt.toISOString()}`);
        }
        console.log(`  Affected Services: ${incident.affectedServices.join(', ')}`);
        console.log(`  Timeline Events: ${incident.timeline.length}`);
        console.log('');
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Error getting incidents:'), error);
      process.exit(1);
    }
  });

// ==================== SLA COMMANDS ====================

program
  .command('sla')
  .description('Show SLA monitoring status')
  .option('-d, --detailed', 'Show detailed SLA information')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🎯 SLA MONITORING\n'));
      
      const slaTargets = monitoringAgent.getSLATargets();
      
      if (slaTargets.length === 0) {
        console.log(chalk.yellow('⚠️ No SLA targets configured'));
        return;
      }
      
      // Summary
      const summary = slaTargets.reduce((acc, sla) => {
        acc[sla.status] = (acc[sla.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(chalk.green('SLA Summary:'));
      console.log(`  🟢 Healthy: ${chalk.green(summary.healthy || 0)}`);
      console.log(`  🟡 Warning: ${chalk.yellow(summary.warning || 0)}`);
      console.log(`  🔴 Critical: ${chalk.red(summary.critical || 0)}`);
      console.log(`  ⚪ Unknown: ${chalk.gray(summary.unknown || 0)}`);
      console.log('');
      
      // Individual SLAs
      slaTargets.forEach(sla => {
        const statusEmoji = sla.status === 'healthy' ? '🟢' : 
                           sla.status === 'warning' ? '🟡' : 
                           sla.status === 'critical' ? '🔴' : '⚪';
        
        console.log(`${statusEmoji} ${sla.name}`);
        console.log(`  Target: ${sla.target}${sla.unit} (${sla.period})`);
        
        if (sla.currentValue !== undefined) {
          const currentColor = sla.status === 'healthy' ? chalk.green : 
                              sla.status === 'warning' ? chalk.yellow : chalk.red;
          console.log(`  Current: ${currentColor(sla.currentValue.toFixed(2))}${sla.unit}`);
          
          const compliance = (sla.currentValue / sla.target) * 100;
          console.log(`  Compliance: ${currentColor(compliance.toFixed(1))}%`);
        } else {
          console.log(`  Current: ${chalk.gray('No data')}`);
        }
        
        if (options.detailed) {
          console.log(`  Category: ${sla.category}`);
          console.log(`  Warning Threshold: ${sla.thresholds.warning}${sla.unit}`);
          console.log(`  Critical Threshold: ${sla.thresholds.critical}${sla.unit}`);
          console.log(`  Description: ${sla.description}`);
        }
        
        console.log('');
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Error getting SLA status:'), error);
      process.exit(1);
    }
  });

// ==================== UTILITY COMMANDS ====================

program
  .command('health')
  .description('Quick health check of all monitoring systems')
  .action(async () => {
    try {
      console.log(chalk.blue.bold('🏥 ZENITH MONITORING HEALTH CHECK\n'));
      
      const status = monitoringAgent.getStatus();
      const apiStatus = apiMonitor.getMonitoringStatus();
      
      // Agent health
      console.log(`Agent Status: ${status.isActive ? chalk.green('✅ HEALTHY') : chalk.red('❌ UNHEALTHY')}`);
      
      // API monitoring health
      console.log(`API Monitoring: ${apiStatus.isMonitoring ? chalk.green('✅ HEALTHY') : chalk.red('❌ UNHEALTHY')}`);
      
      // Endpoint health
      const totalEndpoints = apiStatus.healthyEndpoints + apiStatus.degradedEndpoints + apiStatus.unhealthyEndpoints;
      if (totalEndpoints > 0) {
        const healthPercentage = (apiStatus.healthyEndpoints / totalEndpoints) * 100;
        const healthStatus = healthPercentage >= 90 ? chalk.green('✅ HEALTHY') : 
                            healthPercentage >= 70 ? chalk.yellow('⚠️ DEGRADED') : chalk.red('❌ UNHEALTHY');
        console.log(`Endpoint Health: ${healthStatus} (${healthPercentage.toFixed(1)}%)`);
      }
      
      // Overall health score
      const healthScore = calculateOverallHealth(status, apiStatus);
      const scoreColor = healthScore >= 90 ? chalk.green : healthScore >= 70 ? chalk.yellow : chalk.red;
      console.log(`Overall Health Score: ${scoreColor(healthScore.toFixed(1))}/100`);
      
    } catch (error) {
      console.error(chalk.red('❌ Error performing health check:'), error);
      process.exit(1);
    }
  });

program
  .command('metrics')
  .description('Record a custom business metric')
  .requiredOption('-n, --name <name>', 'Metric name')
  .requiredOption('-v, --value <value>', 'Metric value')
  .option('-u, --unit <unit>', 'Metric unit', 'count')
  .option('-c, --category <category>', 'Metric category', 'custom')
  .action(async (options) => {
    try {
      const metric = {
        name: options.name,
        value: parseFloat(options.value),
        unit: options.unit,
        category: options.category,
        dimensions: {
          source: 'cli',
          timestamp: new Date().toISOString()
        }
      };
      
      monitoringAgent.recordBusinessMetric(metric);
      
      console.log(chalk.green('✅ Business metric recorded:'));
      console.log(`  Name: ${metric.name}`);
      console.log(`  Value: ${metric.value}${metric.unit}`);
      console.log(`  Category: ${metric.category}`);
      
    } catch (error) {
      console.error(chalk.red('❌ Error recording metric:'), error);
      process.exit(1);
    }
  });

// Helper function to calculate overall health
function calculateOverallHealth(status: any, apiStatus: any): number {
  let score = 100;
  
  if (!status.isActive) score -= 50;
  if (!apiStatus.isMonitoring) score -= 30;
  
  const totalEndpoints = apiStatus.healthyEndpoints + apiStatus.degradedEndpoints + apiStatus.unhealthyEndpoints;
  if (totalEndpoints > 0) {
    const healthPercentage = (apiStatus.healthyEndpoints / totalEndpoints) * 100;
    score = score * (healthPercentage / 100);
  }
  
  return Math.max(0, score);
}

// Parse command line arguments
program.parse(process.argv);

export default program;