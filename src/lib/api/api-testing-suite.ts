/**
 * ZENITH API TESTING SUITE
 * Comprehensive API testing, validation, and performance benchmarking
 * Enterprise-grade testing for Fortune 500 deployment
 */

import { apiMonitor } from './api-performance-monitor';
import { z } from 'zod';

interface APITestCase {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  headers?: Record<string, string>;
  payload?: any;
  expectedStatus: number;
  expectedSchema?: z.ZodSchema;
  expectedResponseTime?: number; // max acceptable response time in ms
  expectedCacheHit?: boolean;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  retries?: number;
  timeout?: number;
}

interface APITestResult {
  testId: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  responseTime: number;
  actualStatus: number;
  expectedStatus: number;
  error?: string;
  warnings: string[];
  metadata: {
    endpoint: string;
    method: string;
    responseSize: number;
    cacheHit: boolean;
    retryCount: number;
  };
}

interface APITestSuite {
  id: string;
  name: string;
  description: string;
  tests: APITestCase[];
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
  parallel?: boolean;
  timeout?: number;
}

interface APITestReport {
  suiteId: string;
  suiteName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  results: APITestResult[];
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    slowestEndpoint: string;
    fastestEndpoint: string;
    errorRate: number;
    cacheHitRate: number;
  };
  recommendations: string[];
}

export class APITestingSuite {
  private testSuites: Map<string, APITestSuite> = new Map();
  private testResults: Map<string, APITestResult[]> = new Map();
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
    console.log('🧪 APITestingSuite: Initialized - Enterprise API Testing Framework');
  }

  // ==================== TEST SUITE MANAGEMENT ====================

  /**
   * Register a test suite
   */
  registerSuite(suite: APITestSuite): void {
    this.testSuites.set(suite.id, suite);
    console.log(`📝 Registered test suite: ${suite.name} (${suite.tests.length} tests)`);
  }

  /**
   * Run all test suites
   */
  async runAllSuites(): Promise<APITestReport[]> {
    console.log('🚀 Running all API test suites...');
    
    const reports: APITestReport[] = [];
    
    for (const suite of Array.from(this.testSuites.values())) {
      const report = await this.runSuite(suite.id);
      reports.push(report);
    }
    
    console.log(`✅ Completed ${reports.length} test suites`);
    return reports;
  }

  /**
   * Run specific test suite
   */
  async runSuite(suiteId: string): Promise<APITestReport> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }
    
    console.log(`🧪 Running test suite: ${suite.name}`);
    
    const startTime = new Date();
    const results: APITestResult[] = [];
    
    try {
      // Run beforeAll hook
      if (suite.beforeAll) {
        await suite.beforeAll();
      }
      
      // Run tests
      if (suite.parallel) {
        const testPromises = suite.tests.map(test => this.runTest(test));
        const testResults = await Promise.allSettled(testPromises);
        
        testResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              testId: suite.tests[index].id,
              name: suite.tests[index].name,
              status: 'failed',
              duration: 0,
              responseTime: 0,
              actualStatus: 0,
              expectedStatus: suite.tests[index].expectedStatus,
              error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
              warnings: [],
              metadata: {
                endpoint: suite.tests[index].endpoint,
                method: suite.tests[index].method,
                responseSize: 0,
                cacheHit: false,
                retryCount: 0
              }
            });
          }
        });
      } else {
        // Run tests sequentially
        for (const test of suite.tests) {
          try {
            const result = await this.runTest(test);
            results.push(result);
          } catch (error) {
            results.push({
              testId: test.id,
              name: test.name,
              status: 'failed',
              duration: 0,
              responseTime: 0,
              actualStatus: 0,
              expectedStatus: test.expectedStatus,
              error: error instanceof Error ? error.message : 'Unknown error',
              warnings: [],
              metadata: {
                endpoint: test.endpoint,
                method: test.method,
                responseSize: 0,
                cacheHit: false,
                retryCount: 0
              }
            });
          }
        }
      }
      
      // Run afterAll hook
      if (suite.afterAll) {
        await suite.afterAll();
      }
      
    } catch (error) {
      console.error(`Test suite ${suite.name} failed:`, error);
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    // Store results
    this.testResults.set(suiteId, results);
    
    // Generate report
    const report = this.generateReport(suite, results, startTime, endTime, duration);
    
    console.log(`📊 Test suite completed: ${suite.name}`);
    console.log(`  ✅ Passed: ${report.passed}`);
    console.log(`  ❌ Failed: ${report.failed}`);
    console.log(`  ⏱️ Duration: ${duration}ms`);
    
    return report;
  }

  /**
   * Run individual test
   */
  async runTest(test: APITestCase): Promise<APITestResult> {
    console.log(`🧪 Running test: ${test.name}`);
    
    const startTime = Date.now();
    let retryCount = 0;
    const maxRetries = test.retries || 0;
    const timeout = test.timeout || 30000;
    
    while (retryCount <= maxRetries) {
      try {
        // Setup
        if (test.setup) {
          await test.setup();
        }
        
        // Execute request
        const requestStart = Date.now();
        const response = await this.executeRequest(test, timeout);
        const responseTime = Date.now() - requestStart;
        
        // Get response data
        const responseText = await response.text();
        const responseData = this.parseResponse(responseText);
        const responseSize = new TextEncoder().encode(responseText).length;
        
        // Validate response
        const validationResult = this.validateResponse(test, response, responseData);
        
        // Check performance
        const performanceWarnings = this.checkPerformance(test, responseTime);
        
        // Record metrics
        await apiMonitor.recordMetric({
          endpoint: test.endpoint,
          method: test.method,
          responseTime,
          statusCode: response.status,
          payloadSize: test.payload ? JSON.stringify(test.payload).length : 0,
          responseSize,
          cacheHit: response.headers.get('x-cache') === 'HIT'
        });
        
        // Teardown
        if (test.teardown) {
          await test.teardown();
        }
        
        const duration = Date.now() - startTime;
        
        return {
          testId: test.id,
          name: test.name,
          status: validationResult.valid ? 'passed' : 'failed',
          duration,
          responseTime,
          actualStatus: response.status,
          expectedStatus: test.expectedStatus,
          error: validationResult.error,
          warnings: [...validationResult.warnings, ...performanceWarnings],
          metadata: {
            endpoint: test.endpoint,
            method: test.method,
            responseSize,
            cacheHit: response.headers.get('x-cache') === 'HIT',
            retryCount
          }
        };
        
      } catch (error) {
        retryCount++;
        
        if (retryCount > maxRetries) {
          const duration = Date.now() - startTime;
          
          return {
            testId: test.id,
            name: test.name,
            status: 'failed',
            duration,
            responseTime: 0,
            actualStatus: 0,
            expectedStatus: test.expectedStatus,
            error: error instanceof Error ? error.message : 'Unknown error',
            warnings: [],
            metadata: {
              endpoint: test.endpoint,
              method: test.method,
              responseSize: 0,
              cacheHit: false,
              retryCount: retryCount - 1
            }
          };
        }
        
        console.log(`⚠️ Test ${test.name} failed, retrying (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
      }
    }
    
    throw new Error('Test execution failed after retries');
  }

  // ==================== REQUEST EXECUTION ====================

  private async executeRequest(test: APITestCase, timeout: number): Promise<Response> {
    const url = `${this.baseURL}${test.endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...test.headers
    };
    
    const options: RequestInit = {
      method: test.method,
      headers,
      signal: AbortSignal.timeout(timeout)
    };
    
    if (test.payload && ['POST', 'PUT', 'PATCH'].includes(test.method)) {
      options.body = JSON.stringify(test.payload);
    }
    
    return fetch(url, options);
  }

  private parseResponse(responseText: string): any {
    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  }

  // ==================== VALIDATION ====================

  private validateResponse(test: APITestCase, response: Response, data: any): {
    valid: boolean;
    error?: string;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    // Status code validation
    if (response.status !== test.expectedStatus) {
      return {
        valid: false,
        error: `Expected status ${test.expectedStatus}, got ${response.status}`,
        warnings
      };
    }
    
    // Schema validation
    if (test.expectedSchema) {
      const result = test.expectedSchema.safeParse(data);
      if (!result.success) {
        return {
          valid: false,
          error: `Schema validation failed: ${result.error.message}`,
          warnings
        };
      }
    }
    
    // Cache validation
    if (test.expectedCacheHit !== undefined) {
      const cacheHit = response.headers.get('x-cache') === 'HIT';
      if (cacheHit !== test.expectedCacheHit) {
        warnings.push(`Expected cache ${test.expectedCacheHit ? 'HIT' : 'MISS'}, got ${cacheHit ? 'HIT' : 'MISS'}`);
      }
    }
    
    // Security headers validation
    this.validateSecurityHeaders(response, warnings);
    
    return { valid: true, warnings };
  }

  private validateSecurityHeaders(response: Response, warnings: string[]): void {
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy'
    ];
    
    securityHeaders.forEach(header => {
      if (!response.headers.get(header)) {
        warnings.push(`Missing security header: ${header}`);
      }
    });
  }

  private checkPerformance(test: APITestCase, responseTime: number): string[] {
    const warnings: string[] = [];
    
    if (test.expectedResponseTime && responseTime > test.expectedResponseTime) {
      warnings.push(`Response time ${responseTime}ms exceeds expected ${test.expectedResponseTime}ms`);
    }
    
    if (responseTime > 1000) {
      warnings.push(`Very slow response time: ${responseTime}ms`);
    } else if (responseTime > 500) {
      warnings.push(`Slow response time: ${responseTime}ms`);
    }
    
    return warnings;
  }

  // ==================== REPORTING ====================

  private generateReport(
    suite: APITestSuite,
    results: APITestResult[],
    startTime: Date,
    endTime: Date,
    duration: number
  ): APITestReport {
    
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    
    const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length || 0;
    const p95ResponseTime = this.calculatePercentile(responseTimes.sort((a, b) => a - b), 95);
    
    const errorRate = failed / results.length;
    const cacheHits = results.filter(r => r.metadata.cacheHit).length;
    const cacheHitRate = cacheHits / results.length;
    
    const slowestEndpoint = results.reduce((slowest, result) => 
      result.responseTime > slowest.responseTime ? result : slowest
    ).metadata.endpoint;
    
    const fastestEndpoint = results.reduce((fastest, result) => 
      result.responseTime < fastest.responseTime ? result : fastest
    ).metadata.endpoint;
    
    const recommendations = this.generateRecommendations(results);
    
    return {
      suiteId: suite.id,
      suiteName: suite.name,
      startTime,
      endTime,
      duration,
      totalTests: results.length,
      passed,
      failed,
      skipped,
      results,
      performance: {
        averageResponseTime,
        p95ResponseTime,
        slowestEndpoint,
        fastestEndpoint,
        errorRate,
        cacheHitRate
      },
      recommendations
    };
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private generateRecommendations(results: APITestResult[]): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    const slowTests = results.filter(r => r.responseTime > 500);
    if (slowTests.length > 0) {
      recommendations.push(`Optimize ${slowTests.length} slow endpoints (>500ms response time)`);
    }
    
    // Error rate recommendations
    const failedTests = results.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      recommendations.push(`Fix ${failedTests.length} failing tests`);
    }
    
    // Caching recommendations
    const uncachedTests = results.filter(r => r.metadata.method === 'GET' && !r.metadata.cacheHit);
    if (uncachedTests.length > 0) {
      recommendations.push(`Implement caching for ${uncachedTests.length} GET endpoints`);
    }
    
    // Security recommendations
    const securityWarnings = results.flatMap(r => r.warnings.filter(w => w.includes('security')));
    if (securityWarnings.length > 0) {
      recommendations.push('Add missing security headers to API responses');
    }
    
    return recommendations;
  }

  // ==================== PREDEFINED TEST SUITES ====================

  /**
   * Create performance test suite
   */
  createPerformanceTestSuite(): APITestSuite {
    return {
      id: 'performance-tests',
      name: 'API Performance Tests',
      description: 'Tests for API performance and response times',
      tests: [
        {
          id: 'health-check-perf',
          name: 'Health Check Performance',
          description: 'Verify health check endpoint performance',
          endpoint: '/api/health',
          method: 'GET',
          expectedStatus: 200,
          expectedResponseTime: 100,
          expectedCacheHit: false
        },
        {
          id: 'analytics-perf',
          name: 'Analytics Endpoint Performance',
          description: 'Verify analytics endpoint performance',
          endpoint: '/api/analytics/test-team',
          method: 'GET',
          expectedStatus: 200,
          expectedResponseTime: 500,
          expectedCacheHit: true
        },
        {
          id: 'projects-perf',
          name: 'Projects List Performance',
          description: 'Verify projects list performance',
          endpoint: '/api/projects',
          method: 'GET',
          expectedStatus: 200,
          expectedResponseTime: 300,
          expectedCacheHit: true
        }
      ],
      parallel: true,
      timeout: 30000
    };
  }

  /**
   * Create security test suite
   */
  createSecurityTestSuite(): APITestSuite {
    return {
      id: 'security-tests',
      name: 'API Security Tests',
      description: 'Tests for API security and authentication',
      tests: [
        {
          id: 'auth-required',
          name: 'Authentication Required',
          description: 'Verify protected endpoints require authentication',
          endpoint: '/api/admin/truth-assessment',
          method: 'GET',
          expectedStatus: 401
        },
        {
          id: 'rate-limiting',
          name: 'Rate Limiting',
          description: 'Verify rate limiting is enforced',
          endpoint: '/api/health',
          method: 'GET',
          expectedStatus: 200,
          retries: 0
        },
        {
          id: 'cors-headers',
          name: 'CORS Headers',
          description: 'Verify CORS headers are present',
          endpoint: '/api/health',
          method: 'OPTIONS',
          expectedStatus: 200
        }
      ],
      parallel: false,
      timeout: 15000
    };
  }

  /**
   * Create functionality test suite
   */
  createFunctionalityTestSuite(): APITestSuite {
    return {
      id: 'functionality-tests',
      name: 'API Functionality Tests',
      description: 'Tests for API functionality and data integrity',
      tests: [
        {
          id: 'health-check',
          name: 'Health Check',
          description: 'Verify health check endpoint returns correct status',
          endpoint: '/api/health',
          method: 'GET',
          expectedStatus: 200,
          expectedSchema: z.object({
            status: z.string(),
            timestamp: z.string(),
            version: z.string().optional()
          })
        },
        {
          id: 'user-registration',
          name: 'User Registration',
          description: 'Verify user registration endpoint',
          endpoint: '/api/user/register',
          method: 'POST',
          payload: {
            email: 'test@example.com',
            name: 'Test User',
            password: 'testpassword123'
          },
          expectedStatus: 201,
          expectedSchema: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string()
          })
        },
        {
          id: 'upload-test',
          name: 'File Upload',
          description: 'Verify file upload endpoint',
          endpoint: '/api/upload',
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          expectedStatus: 200
        }
      ],
      parallel: false,
      timeout: 30000
    };
  }

  // ==================== PUBLIC API ====================

  /**
   * Initialize with common test suites
   */
  initializeCommonSuites(): void {
    this.registerSuite(this.createPerformanceTestSuite());
    this.registerSuite(this.createSecurityTestSuite());
    this.registerSuite(this.createFunctionalityTestSuite());
  }

  /**
   * Generate comprehensive test report
   */
  async generateComprehensiveReport(): Promise<string> {
    const reports = await this.runAllSuites();
    
    const totalTests = reports.reduce((sum, report) => sum + report.totalTests, 0);
    const totalPassed = reports.reduce((sum, report) => sum + report.passed, 0);
    const totalFailed = reports.reduce((sum, report) => sum + report.failed, 0);
    const totalDuration = reports.reduce((sum, report) => sum + report.duration, 0);
    
    const overallSuccessRate = (totalPassed / totalTests) * 100;
    const averageResponseTime = reports.reduce((sum, report) => sum + report.performance.averageResponseTime, 0) / reports.length;
    
    return `
🧪 ZENITH API TESTING COMPREHENSIVE REPORT

📊 OVERALL RESULTS:
  🎯 Total Tests: ${totalTests}
  ✅ Passed: ${totalPassed}
  ❌ Failed: ${totalFailed}
  📈 Success Rate: ${overallSuccessRate.toFixed(2)}%
  ⏱️ Total Duration: ${totalDuration}ms

⚡ PERFORMANCE SUMMARY:
  🏃 Average Response Time: ${averageResponseTime.toFixed(2)}ms
  📊 P95 Response Time: ${reports.reduce((max, report) => Math.max(max, report.performance.p95ResponseTime), 0).toFixed(2)}ms
  📦 Cache Hit Rate: ${(reports.reduce((sum, report) => sum + report.performance.cacheHitRate, 0) / reports.length * 100).toFixed(1)}%
  ❌ Error Rate: ${(reports.reduce((sum, report) => sum + report.performance.errorRate, 0) / reports.length * 100).toFixed(2)}%

📋 SUITE BREAKDOWN:
${reports.map(report => `
  📁 ${report.suiteName}:
    ✅ Passed: ${report.passed}/${report.totalTests}
    ⏱️ Duration: ${report.duration}ms
    🏃 Avg Response: ${report.performance.averageResponseTime.toFixed(2)}ms
`).join('')}

🎯 TOP RECOMMENDATIONS:
${reports.flatMap(report => report.recommendations).slice(0, 10).map(rec => `  • ${rec}`).join('\n')}

🚀 API Testing Status: ${overallSuccessRate > 95 ? '🟢 EXCELLENT' : overallSuccessRate > 90 ? '🟡 GOOD' : overallSuccessRate > 80 ? '🟠 NEEDS IMPROVEMENT' : '🔴 CRITICAL'}
    `;
  }

  /**
   * Get test results for a specific suite
   */
  getTestResults(suiteId: string): APITestResult[] | undefined {
    return this.testResults.get(suiteId);
  }

  /**
   * Get all registered suites
   */
  getRegisteredSuites(): APITestSuite[] {
    return Array.from(this.testSuites.values());
  }

  /**
   * Clear all test results
   */
  clearResults(): void {
    this.testResults.clear();
    console.log('🧹 Cleared all test results');
  }
}

// Create singleton instance
export const apiTestingSuite = new APITestingSuite();

export type {
  APITestCase,
  APITestResult,
  APITestSuite,
  APITestReport
};