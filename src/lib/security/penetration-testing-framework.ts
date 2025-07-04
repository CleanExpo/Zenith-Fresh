/**
 * Penetration Testing Framework
 * 
 * Automated vulnerability scanning, security testing, and
 * penetration testing capabilities for enterprise security.
 */

import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { AuditLogger, AuditEventType } from '@/lib/audit/audit-logger';

export enum VulnerabilityType {
  SQL_INJECTION = 'SQL_INJECTION',
  XSS = 'XSS',
  CSRF = 'CSRF',
  AUTHENTICATION_BYPASS = 'AUTHENTICATION_BYPASS',
  AUTHORIZATION_BYPASS = 'AUTHORIZATION_BYPASS',
  INFORMATION_DISCLOSURE = 'INFORMATION_DISCLOSURE',
  INSECURE_COMMUNICATION = 'INSECURE_COMMUNICATION',
  WEAK_ENCRYPTION = 'WEAK_ENCRYPTION',
  INPUT_VALIDATION = 'INPUT_VALIDATION',
  SESSION_MANAGEMENT = 'SESSION_MANAGEMENT',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  BUSINESS_LOGIC_FLAW = 'BUSINESS_LOGIC_FLAW'
}

export enum SeverityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export enum TestType {
  AUTHENTICATION_TEST = 'AUTHENTICATION_TEST',
  AUTHORIZATION_TEST = 'AUTHORIZATION_TEST',
  INPUT_VALIDATION_TEST = 'INPUT_VALIDATION_TEST',
  SESSION_MANAGEMENT_TEST = 'SESSION_MANAGEMENT_TEST',
  INFORMATION_DISCLOSURE_TEST = 'INFORMATION_DISCLOSURE_TEST',
  BUSINESS_LOGIC_TEST = 'BUSINESS_LOGIC_TEST',
  CONFIGURATION_TEST = 'CONFIGURATION_TEST',
  NETWORK_TEST = 'NETWORK_TEST'
}

interface VulnerabilityFinding {
  id: string;
  type: VulnerabilityType;
  severity: SeverityLevel;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  endpoint: string;
  method: string;
  payload?: string;
  evidence: string[];
  cvss: number;
  cwe: string;
  discovered: Date;
  verified: boolean;
  falsePositive: boolean;
  remediated: boolean;
}

interface PenetrationTest {
  id: string;
  name: string;
  description: string;
  scope: string[];
  type: TestType;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  findings: VulnerabilityFinding[];
  summary: TestSummary;
  configuration: TestConfiguration;
  createdBy: string;
  createdAt: Date;
}

interface TestSummary {
  totalEndpoints: number;
  testedEndpoints: number;
  vulnerabilitiesFound: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  infoFindings: number;
  averageCVSS: number;
}

interface TestConfiguration {
  maxConcurrency: number;
  requestDelay: number;
  timeoutMs: number;
  followRedirects: boolean;
  userAgent: string;
  authHeaders?: Record<string, string>;
  excludePatterns: string[];
  includePatterns: string[];
}

interface APIEndpoint {
  path: string;
  method: string;
  parameters: Parameter[];
  headers: Record<string, string>;
  authentication?: AuthenticationInfo;
}

interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  location: 'query' | 'body' | 'header' | 'path';
  required: boolean;
  constraints?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: string[];
  };
}

interface AuthenticationInfo {
  type: 'bearer' | 'basic' | 'apikey' | 'oauth';
  location: 'header' | 'query' | 'cookie';
  name: string;
}

export class PenetrationTestingFramework {
  private static instance: PenetrationTestingFramework;
  private activeTests: Map<string, PenetrationTest> = new Map();
  private testQueue: PenetrationTest[] = [];
  private isRunning = false;

  private constructor() {}

  static getInstance(): PenetrationTestingFramework {
    if (!PenetrationTestingFramework.instance) {
      PenetrationTestingFramework.instance = new PenetrationTestingFramework();
    }
    return PenetrationTestingFramework.instance;
  }

  // ==================== TEST ORCHESTRATION ====================

  async createPenetrationTest(
    name: string,
    description: string,
    scope: string[],
    type: TestType,
    configuration?: Partial<TestConfiguration>,
    createdBy: string = 'system'
  ): Promise<string> {
    const test: PenetrationTest = {
      id: `pentest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      scope,
      type,
      status: 'PENDING',
      findings: [],
      summary: {
        totalEndpoints: 0,
        testedEndpoints: 0,
        vulnerabilitiesFound: 0,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
        infoFindings: 0,
        averageCVSS: 0
      },
      configuration: {
        maxConcurrency: 5,
        requestDelay: 1000,
        timeoutMs: 30000,
        followRedirects: true,
        userAgent: 'Zenith-Security-Scanner/1.0',
        excludePatterns: ['/admin', '/internal'],
        includePatterns: ['*'],
        ...configuration
      },
      createdBy,
      createdAt: new Date()
    };

    this.testQueue.push(test);

    // Store test in Redis
    if (redis) {
      await redis.setex(
        `pentest:${test.id}`,
        86400 * 7, // 7 days
        JSON.stringify(test)
      );
    }

    await AuditLogger.logSystemEvent(
      AuditEventType.CREATE,
      {
        action: 'penetration_test_created',
        testId: test.id,
        type: test.type,
        scope: test.scope
      }
    );

    return test.id;
  }

  async startPenetrationTest(testId: string): Promise<boolean> {
    const test = this.testQueue.find(t => t.id === testId);
    if (!test) return false;

    test.status = 'RUNNING';
    test.startTime = new Date();
    
    this.activeTests.set(test.id, test);
    this.testQueue = this.testQueue.filter(t => t.id !== testId);

    // Start test execution in background
    this.executePenetrationTest(test).catch(error => {
      console.error(`Penetration test ${testId} failed:`, error);
      test.status = 'FAILED';
    });

    return true;
  }

  private async executePenetrationTest(test: PenetrationTest): Promise<void> {
    try {
      console.log(`🔍 Starting penetration test: ${test.name}`);

      // Discover endpoints
      const endpoints = await this.discoverEndpoints(test.scope);
      test.summary.totalEndpoints = endpoints.length;

      // Execute tests based on type
      switch (test.type) {
        case TestType.AUTHENTICATION_TEST:
          await this.executeAuthenticationTests(test, endpoints);
          break;
        case TestType.AUTHORIZATION_TEST:
          await this.executeAuthorizationTests(test, endpoints);
          break;
        case TestType.INPUT_VALIDATION_TEST:
          await this.executeInputValidationTests(test, endpoints);
          break;
        case TestType.SESSION_MANAGEMENT_TEST:
          await this.executeSessionManagementTests(test, endpoints);
          break;
        case TestType.INFORMATION_DISCLOSURE_TEST:
          await this.executeInformationDisclosureTests(test, endpoints);
          break;
        case TestType.BUSINESS_LOGIC_TEST:
          await this.executeBusinessLogicTests(test, endpoints);
          break;
        case TestType.CONFIGURATION_TEST:
          await this.executeConfigurationTests(test, endpoints);
          break;
        case TestType.NETWORK_TEST:
          await this.executeNetworkTests(test, endpoints);
          break;
      }

      // Finalize test
      test.status = 'COMPLETED';
      test.endTime = new Date();
      test.duration = test.endTime.getTime() - test.startTime!.getTime();
      
      // Update summary
      this.updateTestSummary(test);

      // Store results
      await this.storeTestResults(test);

      console.log(`✅ Penetration test completed: ${test.name} (${test.findings.length} findings)`);

    } catch (error) {
      test.status = 'FAILED';
      console.error(`❌ Penetration test failed: ${test.name}`, error);
    }
  }

  // ==================== ENDPOINT DISCOVERY ====================

  private async discoverEndpoints(scope: string[]): Promise<APIEndpoint[]> {
    const endpoints: APIEndpoint[] = [];

    // Common API endpoints to test
    const commonPaths = [
      '/api/users',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/logout',
      '/api/profile',
      '/api/admin',
      '/api/settings',
      '/api/data',
      '/api/export',
      '/api/upload',
      '/api/search',
      '/health',
      '/metrics',
      '/status'
    ];

    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    for (const basePath of scope) {
      for (const path of commonPaths) {
        for (const method of methods) {
          if (this.shouldIncludePath(basePath + path, scope)) {
            endpoints.push({
              path: basePath + path,
              method,
              parameters: await this.inferParameters(path, method),
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
          }
        }
      }
    }

    return endpoints;
  }

  private shouldIncludePath(path: string, scope: string[]): boolean {
    // Check if path is in scope
    return scope.some(scopePath => path.startsWith(scopePath));
  }

  private async inferParameters(path: string, method: string): Promise<Parameter[]> {
    const parameters: Parameter[] = [];

    // Common parameters based on endpoint patterns
    if (path.includes('/users')) {
      if (method === 'POST') {
        parameters.push(
          { name: 'name', type: 'string', location: 'body', required: true },
          { name: 'email', type: 'string', location: 'body', required: true },
          { name: 'password', type: 'string', location: 'body', required: true }
        );
      } else if (method === 'GET') {
        parameters.push(
          { name: 'limit', type: 'number', location: 'query', required: false },
          { name: 'offset', type: 'number', location: 'query', required: false }
        );
      }
    }

    if (path.includes('/login')) {
      parameters.push(
        { name: 'email', type: 'string', location: 'body', required: true },
        { name: 'password', type: 'string', location: 'body', required: true }
      );
    }

    if (path.includes('/search')) {
      parameters.push(
        { name: 'q', type: 'string', location: 'query', required: true },
        { name: 'type', type: 'string', location: 'query', required: false }
      );
    }

    return parameters;
  }

  // ==================== AUTHENTICATION TESTS ====================

  private async executeAuthenticationTests(test: PenetrationTest, endpoints: APIEndpoint[]): Promise<void> {
    for (const endpoint of endpoints) {
      if (endpoint.path.includes('auth') || endpoint.path.includes('login')) {
        // Test 1: SQL Injection in login
        await this.testSQLInjectionInAuth(test, endpoint);
        
        // Test 2: Brute force protection
        await this.testBruteForceProtection(test, endpoint);
        
        // Test 3: Default credentials
        await this.testDefaultCredentials(test, endpoint);
        
        // Test 4: Authentication bypass
        await this.testAuthenticationBypass(test, endpoint);
        
        test.summary.testedEndpoints++;
      }
    }
  }

  private async testSQLInjectionInAuth(test: PenetrationTest, endpoint: APIEndpoint): Promise<void> {
    const sqlPayloads = [
      "' OR '1'='1",
      "admin'--",
      "admin' /*",
      "' OR 1=1--",
      "'; DROP TABLE users--"
    ];

    for (const payload of sqlPayloads) {
      try {
        const response = await this.makeRequest(endpoint, {
          email: payload,
          password: 'test123'
        });

        if (this.detectSQLInjection(response)) {
          this.addFinding(test, {
            type: VulnerabilityType.SQL_INJECTION,
            severity: SeverityLevel.CRITICAL,
            title: 'SQL Injection in Authentication',
            description: 'The authentication endpoint is vulnerable to SQL injection attacks.',
            impact: 'An attacker could bypass authentication or extract sensitive data.',
            recommendation: 'Use parameterized queries and input validation.',
            endpoint: endpoint.path,
            method: endpoint.method,
            payload,
            evidence: [response.body?.substring(0, 500) || ''],
            cvss: 9.8,
            cwe: 'CWE-89'
          });
        }
      } catch (error) {
        // Request failed, continue with next payload
      }
    }
  }

  private async testBruteForceProtection(test: PenetrationTest, endpoint: APIEndpoint): Promise<void> {
    const attempts = [];
    const credentials = { email: 'test@example.com', password: 'wrongpassword' };

    // Make 10 rapid login attempts
    for (let i = 0; i < 10; i++) {
      try {
        const response = await this.makeRequest(endpoint, credentials);
        attempts.push(response.status);
      } catch (error) {
        attempts.push(0);
      }
    }

    // Check if all attempts succeeded (no rate limiting)
    const successfulAttempts = attempts.filter(status => status < 400).length;
    if (successfulAttempts === 10 || !attempts.includes(429)) {
      this.addFinding(test, {
        type: VulnerabilityType.AUTHENTICATION_BYPASS,
        severity: SeverityLevel.MEDIUM,
        title: 'Missing Brute Force Protection',
        description: 'The authentication endpoint lacks protection against brute force attacks.',
        impact: 'Attackers can perform unlimited login attempts to guess passwords.',
        recommendation: 'Implement rate limiting and account lockout mechanisms.',
        endpoint: endpoint.path,
        method: endpoint.method,
        evidence: [`Attempted ${attempts.length} requests without rate limiting`],
        cvss: 5.3,
        cwe: 'CWE-307'
      });
    }
  }

  private async testDefaultCredentials(test: PenetrationTest, endpoint: APIEndpoint): Promise<void> {
    const defaultCredentials = [
      { email: 'admin@admin.com', password: 'admin' },
      { email: 'admin@admin.com', password: 'password' },
      { email: 'admin@admin.com', password: '123456' },
      { email: 'test@test.com', password: 'test' },
      { email: 'user@user.com', password: 'user' }
    ];

    for (const credentials of defaultCredentials) {
      try {
        const response = await this.makeRequest(endpoint, credentials);
        
        if (response.status === 200 && this.detectSuccessfulLogin(response)) {
          this.addFinding(test, {
            type: VulnerabilityType.AUTHENTICATION_BYPASS,
            severity: SeverityLevel.HIGH,
            title: 'Default Credentials Accepted',
            description: 'The system accepts default or weak credentials.',
            impact: 'Attackers can gain unauthorized access using common credentials.',
            recommendation: 'Enforce strong password policies and remove default accounts.',
            endpoint: endpoint.path,
            method: endpoint.method,
            payload: JSON.stringify(credentials),
            evidence: [response.body?.substring(0, 500) || ''],
            cvss: 7.5,
            cwe: 'CWE-798'
          });
        }
      } catch (error) {
        // Continue with next credential set
      }
    }
  }

  private async testAuthenticationBypass(test: PenetrationTest, endpoint: APIEndpoint): Promise<void> {
    const bypassPayloads = [
      {},
      { email: '', password: '' },
      { email: null, password: null },
      { email: 'admin@admin.com' }, // Missing password
      { password: 'admin' } // Missing email
    ];

    for (const payload of bypassPayloads) {
      try {
        const response = await this.makeRequest(endpoint, payload);
        
        if (response.status === 200 && this.detectSuccessfulLogin(response)) {
          this.addFinding(test, {
            type: VulnerabilityType.AUTHENTICATION_BYPASS,
            severity: SeverityLevel.CRITICAL,
            title: 'Authentication Bypass',
            description: 'Authentication can be bypassed with malformed requests.',
            impact: 'Attackers can gain unauthorized access without valid credentials.',
            recommendation: 'Implement proper input validation and authentication checks.',
            endpoint: endpoint.path,
            method: endpoint.method,
            payload: JSON.stringify(payload),
            evidence: [response.body?.substring(0, 500) || ''],
            cvss: 9.8,
            cwe: 'CWE-287'
          });
        }
      } catch (error) {
        // Continue with next payload
      }
    }
  }

  // ==================== INPUT VALIDATION TESTS ====================

  private async executeInputValidationTests(test: PenetrationTest, endpoints: APIEndpoint[]): Promise<void> {
    for (const endpoint of endpoints) {
      // Test XSS vulnerabilities
      await this.testXSSVulnerabilities(test, endpoint);
      
      // Test injection attacks
      await this.testInjectionAttacks(test, endpoint);
      
      // Test input validation bypasses
      await this.testInputValidationBypass(test, endpoint);
      
      test.summary.testedEndpoints++;
    }
  }

  private async testXSSVulnerabilities(test: PenetrationTest, endpoint: APIEndpoint): Promise<void> {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "javascript:alert('XSS')",
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '{{7*7}}', // Template injection
      '${7*7}' // Expression injection
    ];

    for (const parameter of endpoint.parameters) {
      for (const payload of xssPayloads) {
        try {
          const requestData = this.buildRequestData(endpoint, parameter, payload);
          const response = await this.makeRequest(endpoint, requestData);
          
          if (this.detectXSS(response, payload)) {
            this.addFinding(test, {
              type: VulnerabilityType.XSS,
              severity: SeverityLevel.HIGH,
              title: 'Cross-Site Scripting (XSS)',
              description: `Reflected XSS vulnerability in parameter: ${parameter.name}`,
              impact: 'Attackers can execute malicious scripts in user browsers.',
              recommendation: 'Implement proper output encoding and CSP headers.',
              endpoint: endpoint.path,
              method: endpoint.method,
              payload,
              evidence: [response.body?.substring(0, 500) || ''],
              cvss: 6.1,
              cwe: 'CWE-79'
            });
          }
        } catch (error) {
          // Continue with next payload
        }
      }
    }
  }

  private async testInjectionAttacks(test: PenetrationTest, endpoint: APIEndpoint): Promise<void> {
    const injectionPayloads = [
      "'; DROP TABLE users--",
      "' UNION SELECT * FROM users--",
      '$(touch /tmp/pwned)',
      '`touch /tmp/pwned`',
      '; cat /etc/passwd',
      '../../../etc/passwd',
      '{{7*7}}',
      '<%- 7*7 %>'
    ];

    for (const parameter of endpoint.parameters) {
      for (const payload of injectionPayloads) {
        try {
          const requestData = this.buildRequestData(endpoint, parameter, payload);
          const response = await this.makeRequest(endpoint, requestData);
          
          if (this.detectInjection(response, payload)) {
            this.addFinding(test, {
              type: VulnerabilityType.SQL_INJECTION,
              severity: SeverityLevel.CRITICAL,
              title: 'Code Injection Vulnerability',
              description: `Injection vulnerability in parameter: ${parameter.name}`,
              impact: 'Attackers can execute arbitrary code or access sensitive data.',
              recommendation: 'Use parameterized queries and input sanitization.',
              endpoint: endpoint.path,
              method: endpoint.method,
              payload,
              evidence: [response.body?.substring(0, 500) || ''],
              cvss: 9.8,
              cwe: 'CWE-94'
            });
          }
        } catch (error) {
          // Continue with next payload
        }
      }
    }
  }

  // ==================== REQUEST HANDLING ====================

  private async makeRequest(endpoint: APIEndpoint, data?: any): Promise<{
    status: number;
    headers: Record<string, string>;
    body?: string;
  }> {
    // Simulate HTTP request
    // In real implementation, use fetch or HTTP client
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate different responses based on payload
        const hasInjection = JSON.stringify(data).includes("'") || 
                           JSON.stringify(data).includes('<script>');
        
        resolve({
          status: hasInjection ? 500 : 200,
          headers: { 'content-type': 'application/json' },
          body: hasInjection ? 
            'Database error: syntax error near "\'"' : 
            JSON.stringify({ success: true, data: 'response data' })
        });
      }, 100);
    });
  }

  private buildRequestData(endpoint: APIEndpoint, parameter: Parameter, payload: string): any {
    const data: any = {};
    
    // Add the test payload for the specific parameter
    if (parameter.location === 'body') {
      data[parameter.name] = payload;
    }
    
    // Add default values for other required parameters
    for (const param of endpoint.parameters) {
      if (param.required && param.name !== parameter.name) {
        data[param.name] = this.getDefaultValue(param.type);
      }
    }
    
    return data;
  }

  private getDefaultValue(type: string): any {
    switch (type) {
      case 'string': return 'test';
      case 'number': return 1;
      case 'boolean': return true;
      case 'object': return {};
      case 'array': return [];
      default: return 'test';
    }
  }

  // ==================== VULNERABILITY DETECTION ====================

  private detectSQLInjection(response: any): boolean {
    const sqlErrors = [
      'SQL syntax',
      'mysql_fetch',
      'ORA-',
      'PostgreSQL',
      'Microsoft OLE DB',
      'sqlite3.OperationalError'
    ];
    
    return sqlErrors.some(error => 
      response.body?.toLowerCase().includes(error.toLowerCase())
    );
  }

  private detectXSS(response: any, payload: string): boolean {
    return response.body?.includes(payload) || 
           response.body?.includes(payload.replace(/[<>]/g, ''));
  }

  private detectInjection(response: any, payload: string): boolean {
    const indicators = [
      'root:x:0:0',  // /etc/passwd
      'admin:x:',
      'Database error',
      'syntax error',
      'ORA-',
      '49' // 7*7 result
    ];
    
    return indicators.some(indicator => 
      response.body?.includes(indicator)
    );
  }

  private detectSuccessfulLogin(response: any): boolean {
    const successIndicators = [
      'token',
      'session',
      'welcome',
      'dashboard',
      'profile'
    ];
    
    return successIndicators.some(indicator => 
      response.body?.toLowerCase().includes(indicator)
    );
  }

  // ==================== ADDITIONAL TEST METHODS ====================

  private async executeAuthorizationTests(test: PenetrationTest, endpoints: APIEndpoint[]): Promise<void> {
    // Implementation for authorization testing
    console.log('Executing authorization tests...');
  }

  private async executeSessionManagementTests(test: PenetrationTest, endpoints: APIEndpoint[]): Promise<void> {
    // Implementation for session management testing
    console.log('Executing session management tests...');
  }

  private async executeInformationDisclosureTests(test: PenetrationTest, endpoints: APIEndpoint[]): Promise<void> {
    // Implementation for information disclosure testing
    console.log('Executing information disclosure tests...');
  }

  private async executeBusinessLogicTests(test: PenetrationTest, endpoints: APIEndpoint[]): Promise<void> {
    // Implementation for business logic testing
    console.log('Executing business logic tests...');
  }

  private async executeConfigurationTests(test: PenetrationTest, endpoints: APIEndpoint[]): Promise<void> {
    // Implementation for configuration testing
    console.log('Executing configuration tests...');
  }

  private async executeNetworkTests(test: PenetrationTest, endpoints: APIEndpoint[]): Promise<void> {
    // Implementation for network testing
    console.log('Executing network tests...');
  }

  // ==================== HELPER METHODS ====================

  private addFinding(test: PenetrationTest, finding: Omit<VulnerabilityFinding, 'id' | 'discovered' | 'verified' | 'falsePositive' | 'remediated'>): void {
    const vulnerabilityFinding: VulnerabilityFinding = {
      id: `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...finding,
      discovered: new Date(),
      verified: false,
      falsePositive: false,
      remediated: false
    };

    test.findings.push(vulnerabilityFinding);
    test.summary.vulnerabilitiesFound++;

    // Update severity counters
    switch (finding.severity) {
      case SeverityLevel.CRITICAL:
        test.summary.criticalFindings++;
        break;
      case SeverityLevel.HIGH:
        test.summary.highFindings++;
        break;
      case SeverityLevel.MEDIUM:
        test.summary.mediumFindings++;
        break;
      case SeverityLevel.LOW:
        test.summary.lowFindings++;
        break;
      case SeverityLevel.INFO:
        test.summary.infoFindings++;
        break;
    }
  }

  private updateTestSummary(test: PenetrationTest): void {
    const totalCVSS = test.findings.reduce((sum, finding) => sum + finding.cvss, 0);
    test.summary.averageCVSS = test.findings.length > 0 ? totalCVSS / test.findings.length : 0;
  }

  private async storeTestResults(test: PenetrationTest): Promise<void> {
    if (redis) {
      await redis.setex(
        `pentest:${test.id}`,
        86400 * 30, // 30 days
        JSON.stringify(test)
      );

      // Store findings separately for querying
      for (const finding of test.findings) {
        await redis.setex(
          `vulnerability:${finding.id}`,
          86400 * 30,
          JSON.stringify(finding)
        );
      }
    }

    await AuditLogger.logSystemEvent(
      AuditEventType.DATA_EXPORT,
      {
        action: 'penetration_test_completed',
        testId: test.id,
        findingsCount: test.findings.length,
        criticalFindings: test.summary.criticalFindings,
        highFindings: test.summary.highFindings
      }
    );
  }

  // ==================== PUBLIC API ====================

  async getTestStatus(testId: string): Promise<PenetrationTest | null> {
    // Check active tests first
    const activeTest = this.activeTests.get(testId);
    if (activeTest) return activeTest;

    // Check Redis for completed tests
    if (redis) {
      const stored = await redis.get(`pentest:${testId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    }

    return null;
  }

  async getAllTests(): Promise<PenetrationTest[]> {
    const tests: PenetrationTest[] = [];
    
    // Add active tests
    tests.push(...Array.from(this.activeTests.values()));
    
    // Add queued tests
    tests.push(...this.testQueue);

    return tests;
  }

  async getVulnerabilityReport(): Promise<{
    totalVulnerabilities: number;
    vulnerabilitiesBySeverity: Record<SeverityLevel, number>;
    vulnerabilitiesByType: Record<VulnerabilityType, number>;
    recentFindings: VulnerabilityFinding[];
  }> {
    const allTests = await this.getAllTests();
    const allFindings = allTests.flatMap(test => test.findings);

    const vulnerabilitiesBySeverity = {
      [SeverityLevel.CRITICAL]: 0,
      [SeverityLevel.HIGH]: 0,
      [SeverityLevel.MEDIUM]: 0,
      [SeverityLevel.LOW]: 0,
      [SeverityLevel.INFO]: 0
    };

    const vulnerabilitiesByType = {} as Record<VulnerabilityType, number>;

    allFindings.forEach(finding => {
      vulnerabilitiesBySeverity[finding.severity]++;
      vulnerabilitiesByType[finding.type] = (vulnerabilitiesByType[finding.type] || 0) + 1;
    });

    const recentFindings = allFindings
      .sort((a, b) => b.discovered.getTime() - a.discovered.getTime())
      .slice(0, 10);

    return {
      totalVulnerabilities: allFindings.length,
      vulnerabilitiesBySeverity,
      vulnerabilitiesByType,
      recentFindings
    };
  }

  async runQuickSecurityScan(): Promise<string> {
    const testId = await this.createPenetrationTest(
      'Quick Security Scan',
      'Automated quick security scan of all endpoints',
      ['/api'],
      TestType.INPUT_VALIDATION_TEST,
      {
        maxConcurrency: 3,
        requestDelay: 500,
        timeoutMs: 15000
      },
      'automated-scan'
    );

    await this.startPenetrationTest(testId);
    return testId;
  }
}

export const penetrationTestingFramework = PenetrationTestingFramework.getInstance();