#!/usr/bin/env tsx

/**
 * Business Intelligence & Analytics Agent Test Script
 * 
 * Demonstrates the comprehensive analytics capabilities including:
 * - Real-time dashboard generation
 * - Predictive analytics and ML models
 * - Business insights and recommendations
 * - ETL pipeline execution
 * - Automated report generation
 */

import { businessIntelligenceAgent } from '@/lib/agents/business-intelligence-analytics-agent';
import { performance } from 'perf_hooks';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message: string, color: string = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function logMetric(name: string, value: any, trend?: string) {
  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  console.log(`${colors.bright}${name}:${colors.reset} ${colors.green}${value}${colors.reset} ${trendIcon}`);
}

function logInsight(insight: any) {
  const impactColor = insight.impact === 'high' ? colors.red : 
                     insight.impact === 'medium' ? colors.yellow : colors.green;
  
  console.log(`\n${colors.bright}[${insight.type.toUpperCase()}]${colors.reset} ${insight.title}`);
  console.log(`${colors.dim}Impact: ${impactColor}${insight.impact}${colors.reset}`);
  console.log(`${colors.dim}Confidence: ${insight.confidence * 100}%${colors.reset}`);
  console.log(`Description: ${insight.description}`);
  
  if (insight.recommendations?.length > 0) {
    console.log(`${colors.bright}Recommendations:${colors.reset}`);
    insight.recommendations.forEach((rec: string, index: number) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
}

async function testBusinessIntelligence() {
  logSection('🧠 BUSINESS INTELLIGENCE & ANALYTICS AGENT TEST');

  try {
    // Test 1: Execute comprehensive analysis
    logSection('1. EXECUTING COMPREHENSIVE BUSINESS ANALYSIS');
    
    const startTime = performance.now();
    const analysisResults = await businessIntelligenceAgent.executeAnalysis();
    const analysisTime = ((performance.now() - startTime) / 1000).toFixed(2);
    
    log(`✅ Analysis completed in ${analysisTime}s`, colors.green);
    log(`Generated ${analysisResults.dashboards.length} dashboards`, colors.blue);
    log(`Discovered ${analysisResults.insights.length} business insights`, colors.blue);
    log(`Created ${analysisResults.recommendations.length} strategic recommendations`, colors.blue);
    log(`Triggered ${analysisResults.alerts.length} alerts`, colors.yellow);

    // Test 2: Display Executive Dashboard
    logSection('2. EXECUTIVE DASHBOARD');
    
    const executiveDashboard = analysisResults.dashboards.find(d => d.id === 'executive-dashboard');
    if (executiveDashboard) {
      executiveDashboard.widgets.forEach((widget: any) => {
        console.log(`\n${colors.bright}📊 ${widget.title}${colors.reset}`);
        
        if (widget.type === 'kpi-summary' && widget.data) {
          widget.data.forEach((metric: any) => {
            logMetric(metric.name, metric.value, metric.trend);
          });
        }
        
        if (widget.type === 'health-score' && widget.data) {
          console.log(`Overall Score: ${colors.green}${widget.data.score}/100${colors.reset}`);
          console.log(`Trend: ${widget.data.trend}`);
        }
      });
    }

    // Test 3: Display High-Impact Insights
    logSection('3. HIGH-IMPACT BUSINESS INSIGHTS');
    
    const highImpactInsights = analysisResults.insights
      .filter(i => i.impact === 'high')
      .slice(0, 3);
    
    highImpactInsights.forEach(insight => logInsight(insight));

    // Test 4: Revenue Analytics
    logSection('4. REVENUE ANALYTICS DASHBOARD');
    
    const revenueDashboard = analysisResults.dashboards.find(d => d.id === 'revenue-dashboard');
    if (revenueDashboard) {
      const revenueWidget = revenueDashboard.widgets.find((w: any) => w.type === 'revenue-summary');
      if (revenueWidget?.data) {
        logMetric('Current Revenue', `$${revenueWidget.data.current.toLocaleString()}`);
        logMetric('Projected Revenue', `$${revenueWidget.data.projected.toLocaleString()}`);
        logMetric('Growth Rate', `${revenueWidget.data.growth.toFixed(1)}%`, 'up');
      }
    }

    // Test 5: Customer Intelligence
    logSection('5. CUSTOMER INTELLIGENCE');
    
    const customerDashboard = analysisResults.dashboards.find(d => d.id === 'customer-dashboard');
    if (customerDashboard) {
      const segmentWidget = customerDashboard.widgets.find((w: any) => w.type === 'segmentation');
      if (segmentWidget?.data) {
        console.log(`\n${colors.bright}Customer Segments:${colors.reset}`);
        segmentWidget.data.forEach((segment: any) => {
          console.log(`\n${colors.bright}${segment.name}${colors.reset}`);
          console.log(`  Size: ${segment.size} customers`);
          console.log(`  Value: $${segment.value.toLocaleString()}`);
          console.log(`  Avg Order Value: $${segment.behavior.averageOrderValue}`);
          console.log(`  Churn Risk: ${(segment.behavior.churnRisk * 100).toFixed(0)}%`);
          console.log(`  Lifetime Value: $${segment.behavior.lifetimeValue.toLocaleString()}`);
        });
      }
    }

    // Test 6: Marketing Performance
    logSection('6. MARKETING PERFORMANCE ANALYSIS');
    
    const marketingDashboard = analysisResults.dashboards.find(d => d.id === 'marketing-dashboard');
    if (marketingDashboard) {
      const roiWidget = marketingDashboard.widgets.find((w: any) => w.type === 'roi-summary');
      if (roiWidget?.data) {
        logMetric('Overall Marketing ROI', `${roiWidget.data.overall.toFixed(0)}%`);
        
        if (roiWidget.data.byCampaign?.length > 0) {
          console.log(`\n${colors.bright}Campaign Performance:${colors.reset}`);
          roiWidget.data.byCampaign.forEach((campaign: any) => {
            console.log(`  ${campaign.name}: ${campaign.roi.toFixed(0)}% ROI`);
          });
        }
      }
    }

    // Test 7: ETL Pipeline
    logSection('7. ETL PIPELINE EXECUTION');
    
    const etlStartTime = performance.now();
    const etlResult = await businessIntelligenceAgent.executeETLPipeline();
    const etlTime = ((performance.now() - etlStartTime) / 1000).toFixed(2);
    
    if (etlResult.success) {
      log(`✅ ETL Pipeline completed successfully in ${etlTime}s`, colors.green);
      log(`Processed ${etlResult.processed} records`, colors.blue);
    } else {
      log(`❌ ETL Pipeline failed: ${etlResult.errors.join(', ')}`, colors.red);
    }

    // Test 8: Automated Reports
    logSection('8. AUTOMATED REPORT GENERATION');
    
    const reportStartTime = performance.now();
    const reports = await businessIntelligenceAgent.generateAutomatedReports();
    const reportTime = ((performance.now() - reportStartTime) / 1000).toFixed(2);
    
    log(`✅ Reports generated in ${reportTime}s`, colors.green);
    
    if (reports.executiveReport) {
      console.log(`\n${colors.bright}Executive Report:${colors.reset}`);
      console.log(`  Title: ${reports.executiveReport.title}`);
      console.log(`  Date: ${reports.executiveReport.date.toISOString()}`);
      console.log(`  Recommendations: ${reports.executiveReport.recommendations.length}`);
    }
    
    if (reports.operationalReport) {
      console.log(`\n${colors.bright}Operational Report:${colors.reset}`);
      console.log(`  Title: ${reports.operationalReport.title}`);
      console.log(`  Alerts: ${reports.operationalReport.alerts.length}`);
    }
    
    if (reports.financialReport) {
      console.log(`\n${colors.bright}Financial Report:${colors.reset}`);
      console.log(`  Title: ${reports.financialReport.title}`);
    }

    // Test 9: Strategic Recommendations
    logSection('9. STRATEGIC RECOMMENDATIONS');
    
    analysisResults.recommendations.forEach((recommendation: string, index: number) => {
      console.log(`\n${colors.bright}${index + 1}.${colors.reset} ${recommendation}`);
    });

    // Test 10: System Alerts
    logSection('10. SYSTEM ALERTS');
    
    if (analysisResults.alerts.length > 0) {
      analysisResults.alerts.forEach((alert: any) => {
        const alertColor = alert.severity === 'high' ? colors.red :
                          alert.severity === 'medium' ? colors.yellow : colors.green;
        
        console.log(`\n${alertColor}[${alert.type.toUpperCase()}] ${alert.metric || 'System'}${colors.reset}`);
        console.log(`Message: ${alert.message}`);
        if (alert.action) {
          console.log(`Action: ${alert.action}`);
        }
      });
    } else {
      log('✅ No critical alerts at this time', colors.green);
    }

    // Summary
    logSection('BUSINESS INTELLIGENCE ANALYSIS SUMMARY');
    
    console.log(`${colors.bright}Analysis Results:${colors.reset}`);
    console.log(`  ✅ Dashboards Generated: ${analysisResults.dashboards.length}`);
    console.log(`  ✅ Business Insights: ${analysisResults.insights.length}`);
    console.log(`  ✅ Strategic Recommendations: ${analysisResults.recommendations.length}`);
    console.log(`  ✅ Active Alerts: ${analysisResults.alerts.length}`);
    console.log(`  ✅ Total Analysis Time: ${analysisTime}s`);
    
    const highValueInsights = analysisResults.insights.filter(i => i.impact === 'high').length;
    const opportunities = analysisResults.insights.filter(i => i.type === 'opportunity').length;
    const risks = analysisResults.insights.filter(i => i.type === 'risk').length;
    
    console.log(`\n${colors.bright}Insight Breakdown:${colors.reset}`);
    console.log(`  🎯 High-Impact Insights: ${highValueInsights}`);
    console.log(`  💰 Opportunities: ${opportunities}`);
    console.log(`  ⚠️  Risks: ${risks}`);
    
    log('\n✅ Business Intelligence & Analytics Agent test completed successfully!', colors.green);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`\n❌ Error during business intelligence analysis: ${errorMessage}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Execute test
(async () => {
  try {
    await testBusinessIntelligence();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})();