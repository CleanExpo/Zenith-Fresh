/**
 * Salesforce Enterprise Connector
 * 
 * Complete Salesforce CRM integration with OAuth 2.0 authentication,
 * comprehensive CRUD operations, and enterprise-grade error handling.
 */

import { randomBytes } from 'crypto';

export interface SalesforceConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sandbox: boolean;
  apiVersion: string;
}

export interface SalesforceCredentials {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  tokenType: string;
  scope: string;
  expiresAt: Date;
}

export interface SalesforceObject {
  Id?: string;
  [key: string]: any;
}

export interface SalesforceQuery {
  fields: string[];
  from: string;
  where?: string;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface SalesforceResponse<T = any> {
  totalSize: number;
  done: boolean;
  records: T[];
  nextRecordsUrl?: string;
}

export class SalesforceConnector {
  private config: SalesforceConfig;
  private credentials?: SalesforceCredentials;
  private baseUrl: string;

  constructor(config: SalesforceConfig) {
    this.config = config;
    this.baseUrl = config.instanceUrl || (config.sandbox ? 
      'https://test.salesforce.com' : 
      'https://login.salesforce.com'
    );
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Generate OAuth 2.0 authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'full refresh_token offline_access',
      state: state || randomBytes(16).toString('hex')
    });

    return `${this.baseUrl}/services/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<SalesforceCredentials> {
    try {
      const response = await fetch(`${this.baseUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const data = await response.json();
      
      this.credentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        instanceUrl: data.instance_url,
        tokenType: data.token_type,
        scope: data.scope,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000))
      };

      return this.credentials;
    } catch (error) {
      console.error('Salesforce token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<SalesforceCredentials> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.credentials.refreshToken
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();
      
      this.credentials = {
        ...this.credentials,
        accessToken: data.access_token,
        instanceUrl: data.instance_url || this.credentials.instanceUrl,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000))
      };

      return this.credentials;
    } catch (error) {
      console.error('Salesforce token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Set credentials manually
   */
  setCredentials(credentials: SalesforceCredentials): void {
    this.credentials = credentials;
  }

  // ==================== SOBJECT OPERATIONS ====================

  /**
   * Query Salesforce objects using SOQL
   */
  async query<T = SalesforceObject>(soql: string): Promise<SalesforceResponse<T>> {
    return this.apiRequest<SalesforceResponse<T>>('GET', `/services/data/v${this.config.apiVersion}/query`, {
      q: soql
    });
  }

  /**
   * Query Salesforce objects with builder pattern
   */
  async queryBuilder<T = SalesforceObject>(query: SalesforceQuery): Promise<SalesforceResponse<T>> {
    let soql = `SELECT ${query.fields.join(', ')} FROM ${query.from}`;
    
    if (query.where) {
      soql += ` WHERE ${query.where}`;
    }
    
    if (query.orderBy) {
      soql += ` ORDER BY ${query.orderBy}`;
    }
    
    if (query.limit) {
      soql += ` LIMIT ${query.limit}`;
    }
    
    if (query.offset) {
      soql += ` OFFSET ${query.offset}`;
    }

    return this.query<T>(soql);
  }

  /**
   * Get all records with automatic pagination
   */
  async queryAll<T = SalesforceObject>(soql: string): Promise<T[]> {
    const allRecords: T[] = [];
    let response = await this.query<T>(soql);
    
    allRecords.push(...response.records);
    
    while (!response.done && response.nextRecordsUrl) {
      response = await this.apiRequest<SalesforceResponse<T>>('GET', response.nextRecordsUrl);
      allRecords.push(...response.records);
    }
    
    return allRecords;
  }

  /**
   * Create a new Salesforce object
   */
  async create(sobjectType: string, data: Partial<SalesforceObject>): Promise<{ id: string; success: boolean; errors: any[] }> {
    return this.apiRequest('POST', `/services/data/v${this.config.apiVersion}/sobjects/${sobjectType}`, data);
  }

  /**
   * Update an existing Salesforce object
   */
  async update(sobjectType: string, id: string, data: Partial<SalesforceObject>): Promise<void> {
    await this.apiRequest('PATCH', `/services/data/v${this.config.apiVersion}/sobjects/${sobjectType}/${id}`, data);
  }

  /**
   * Delete a Salesforce object
   */
  async delete(sobjectType: string, id: string): Promise<void> {
    await this.apiRequest('DELETE', `/services/data/v${this.config.apiVersion}/sobjects/${sobjectType}/${id}`);
  }

  /**
   * Get a single Salesforce object by ID
   */
  async getById<T = SalesforceObject>(sobjectType: string, id: string, fields?: string[]): Promise<T> {
    const fieldParam = fields ? `?fields=${fields.join(',')}` : '';
    return this.apiRequest<T>('GET', `/services/data/v${this.config.apiVersion}/sobjects/${sobjectType}/${id}${fieldParam}`);
  }

  /**
   * Upsert operation (insert or update based on external ID)
   */
  async upsert(sobjectType: string, externalIdField: string, externalId: string, data: Partial<SalesforceObject>): Promise<{
    id: string;
    success: boolean;
    errors: any[];
    created: boolean;
  }> {
    return this.apiRequest('PATCH', 
      `/services/data/v${this.config.apiVersion}/sobjects/${sobjectType}/${externalIdField}/${externalId}`, 
      data
    );
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Create multiple records in bulk
   */
  async bulkCreate(sobjectType: string, records: Partial<SalesforceObject>[]): Promise<{
    hasErrors: boolean;
    results: Array<{ id?: string; success: boolean; errors: any[] }>;
  }> {
    const chunks = this.chunkArray(records, 200); // Salesforce REST API limit
    const allResults: any[] = [];

    for (const chunk of chunks) {
      const response = await this.apiRequest('POST', 
        `/services/data/v${this.config.apiVersion}/composite/sobjects`, 
        {
          allOrNone: false,
          records: chunk.map(record => ({
            attributes: { type: sobjectType },
            ...record
          }))
        }
      );
      allResults.push(...response);
    }

    return {
      hasErrors: allResults.some(r => !r.success),
      results: allResults
    };
  }

  /**
   * Update multiple records in bulk
   */
  async bulkUpdate(sobjectType: string, records: Array<Partial<SalesforceObject> & { Id: string }>): Promise<{
    hasErrors: boolean;
    results: Array<{ id?: string; success: boolean; errors: any[] }>;
  }> {
    const chunks = this.chunkArray(records, 200);
    const allResults: any[] = [];

    for (const chunk of chunks) {
      const response = await this.apiRequest('PATCH', 
        `/services/data/v${this.config.apiVersion}/composite/sobjects`, 
        {
          allOrNone: false,
          records: chunk.map(record => ({
            attributes: { type: sobjectType },
            ...record
          }))
        }
      );
      allResults.push(...response);
    }

    return {
      hasErrors: allResults.some(r => !r.success),
      results: allResults
    };
  }

  // ==================== METADATA OPERATIONS ====================

  /**
   * Get object metadata
   */
  async getObjectMetadata(sobjectType: string): Promise<any> {
    return this.apiRequest('GET', `/services/data/v${this.config.apiVersion}/sobjects/${sobjectType}/describe`);
  }

  /**
   * Get all available objects
   */
  async getAllObjects(): Promise<any> {
    return this.apiRequest('GET', `/services/data/v${this.config.apiVersion}/sobjects`);
  }

  /**
   * Get organization information
   */
  async getOrganization(): Promise<any> {
    const response = await this.query('SELECT Id, Name, InstanceName, OrganizationType, IsSandbox FROM Organization LIMIT 1');
    return response.records[0];
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Test connection to Salesforce
   */
  async testConnection(): Promise<{ success: boolean; error?: string; organization?: any }> {
    try {
      await this.ensureValidToken();
      const org = await this.getOrganization();
      return { success: true, organization: org };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T = any>(
    method: string, 
    endpoint: string, 
    data?: any,
    queryParams?: Record<string, string>
  ): Promise<T> {
    await this.ensureValidToken();

    if (!this.credentials) {
      throw new Error('No valid credentials available');
    }

    let url = endpoint.startsWith('http') ? endpoint : `${this.credentials.instanceUrl}${endpoint}`;
    
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    const headers: HeadersInit = {
      'Authorization': `${this.credentials.tokenType} ${this.credentials.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config: RequestInit = {
      method,
      headers
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (Array.isArray(errorJson) && errorJson[0]?.message) {
            errorMessage = errorJson[0].message;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }

        throw new Error(errorMessage);
      }

      // Handle no content responses
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      console.error(`Salesforce API request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.credentials) {
      throw new Error('No credentials available. Please authenticate first.');
    }

    // Check if token is expired (with 5-minute buffer)
    const now = new Date();
    const expiryBuffer = new Date(this.credentials.expiresAt.getTime() - 5 * 60 * 1000);

    if (now > expiryBuffer) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get all contacts
   */
  async getContacts(limit: number = 100): Promise<SalesforceResponse<any>> {
    return this.queryBuilder({
      fields: ['Id', 'FirstName', 'LastName', 'Email', 'Phone', 'Account.Name'],
      from: 'Contact',
      limit
    });
  }

  /**
   * Get all leads
   */
  async getLeads(limit: number = 100): Promise<SalesforceResponse<any>> {
    return this.queryBuilder({
      fields: ['Id', 'FirstName', 'LastName', 'Email', 'Phone', 'Company', 'Status'],
      from: 'Lead',
      limit
    });
  }

  /**
   * Get all accounts
   */
  async getAccounts(limit: number = 100): Promise<SalesforceResponse<any>> {
    return this.queryBuilder({
      fields: ['Id', 'Name', 'Type', 'Industry', 'Phone', 'Website'],
      from: 'Account',
      limit
    });
  }

  /**
   * Get all opportunities
   */
  async getOpportunities(limit: number = 100): Promise<SalesforceResponse<any>> {
    return this.queryBuilder({
      fields: ['Id', 'Name', 'Account.Name', 'Amount', 'CloseDate', 'StageName', 'Probability'],
      from: 'Opportunity',
      limit
    });
  }

  /**
   * Create a new contact
   */
  async createContact(contact: {
    FirstName?: string;
    LastName: string;
    Email?: string;
    Phone?: string;
    AccountId?: string;
    [key: string]: any;
  }): Promise<{ id: string; success: boolean; errors: any[] }> {
    return this.create('Contact', contact);
  }

  /**
   * Create a new lead
   */
  async createLead(lead: {
    FirstName?: string;
    LastName: string;
    Company: string;
    Email?: string;
    Phone?: string;
    Status?: string;
    [key: string]: any;
  }): Promise<{ id: string; success: boolean; errors: any[] }> {
    return this.create('Lead', lead);
  }

  /**
   * Create a new account
   */
  async createAccount(account: {
    Name: string;
    Type?: string;
    Industry?: string;
    Phone?: string;
    Website?: string;
    [key: string]: any;
  }): Promise<{ id: string; success: boolean; errors: any[] }> {
    return this.create('Account', account);
  }

  /**
   * Create a new opportunity
   */
  async createOpportunity(opportunity: {
    Name: string;
    AccountId: string;
    Amount?: number;
    CloseDate: string;
    StageName: string;
    [key: string]: any;
  }): Promise<{ id: string; success: boolean; errors: any[] }> {
    return this.create('Opportunity', opportunity);
  }
}

export default SalesforceConnector;