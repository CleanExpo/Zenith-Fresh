/**
 * HubSpot Enterprise Connector
 * 
 * Complete HubSpot CRM integration with OAuth 2.0 authentication,
 * comprehensive contact/company/deal management, and marketing automation.
 */

import { randomBytes } from 'crypto';

export interface HubSpotConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  portalId?: string;
}

export interface HubSpotCredentials {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: Date;
  portalId: string;
}

export interface HubSpotContact {
  id?: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    website?: string;
    jobtitle?: string;
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface HubSpotCompany {
  id?: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface HubSpotDeal {
  id?: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    pipeline?: string;
    hubspot_owner_id?: string;
    [key: string]: any;
  };
  associations?: {
    contacts?: string[];
    companies?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface HubSpotSearchRequest {
  filterGroups: Array<{
    filters: Array<{
      propertyName: string;
      operator: string;
      value: string;
    }>;
  }>;
  sorts?: Array<{
    propertyName: string;
    direction: 'ASCENDING' | 'DESCENDING';
  }>;
  properties?: string[];
  limit?: number;
  after?: string;
}

export interface HubSpotSearchResponse<T = any> {
  total: number;
  results: T[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

export class HubSpotConnector {
  private config: HubSpotConfig;
  private credentials?: HubSpotCredentials;
  private baseUrl = 'https://api.hubapi.com';

  constructor(config: HubSpotConfig) {
    this.config = config;
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Generate OAuth 2.0 authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state || randomBytes(16).toString('hex')
    });

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<HubSpotCredentials> {
    try {
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
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
        tokenType: data.token_type || 'Bearer',
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
        portalId: data.hub_id || this.config.portalId || ''
      };

      return this.credentials;
    } catch (error) {
      console.error('HubSpot token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<HubSpotCredentials> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
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
        refreshToken: data.refresh_token || this.credentials.refreshToken,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000))
      };

      return this.credentials;
    } catch (error) {
      console.error('HubSpot token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Set credentials manually
   */
  setCredentials(credentials: HubSpotCredentials): void {
    this.credentials = credentials;
  }

  // ==================== CONTACTS ====================

  /**
   * Get all contacts with pagination
   */
  async getContacts(limit: number = 100, after?: string, properties?: string[]): Promise<HubSpotSearchResponse<HubSpotContact>> {
    const url = '/crm/v3/objects/contacts';
    const params: any = { limit };
    
    if (after) params.after = after;
    if (properties) params.properties = properties.join(',');

    return this.apiRequest('GET', url, undefined, params);
  }

  /**
   * Search contacts
   */
  async searchContacts(searchRequest: HubSpotSearchRequest): Promise<HubSpotSearchResponse<HubSpotContact>> {
    return this.apiRequest('POST', '/crm/v3/objects/contacts/search', searchRequest);
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: string, properties?: string[]): Promise<HubSpotContact> {
    const params = properties ? { properties: properties.join(',') } : undefined;
    return this.apiRequest('GET', `/crm/v3/objects/contacts/${contactId}`, undefined, params);
  }

  /**
   * Create new contact
   */
  async createContact(contact: Omit<HubSpotContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<HubSpotContact> {
    return this.apiRequest('POST', '/crm/v3/objects/contacts', contact);
  }

  /**
   * Update contact
   */
  async updateContact(contactId: string, properties: Partial<HubSpotContact['properties']>): Promise<HubSpotContact> {
    return this.apiRequest('PATCH', `/crm/v3/objects/contacts/${contactId}`, { properties });
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId: string): Promise<void> {
    await this.apiRequest('DELETE', `/crm/v3/objects/contacts/${contactId}`);
  }

  /**
   * Create or update contact by email
   */
  async upsertContactByEmail(email: string, properties: Partial<HubSpotContact['properties']>): Promise<HubSpotContact> {
    try {
      // Try to find existing contact by email
      const searchResponse = await this.searchContacts({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }],
        properties: ['email', 'firstname', 'lastname'],
        limit: 1
      });

      if (searchResponse.results.length > 0) {
        // Update existing contact
        const contactId = searchResponse.results[0].id!;
        return this.updateContact(contactId, properties);
      } else {
        // Create new contact
        return this.createContact({
          properties: { ...properties, email }
        });
      }
    } catch (error) {
      console.error('Failed to upsert contact by email:', error);
      throw error;
    }
  }

  // ==================== COMPANIES ====================

  /**
   * Get all companies with pagination
   */
  async getCompanies(limit: number = 100, after?: string, properties?: string[]): Promise<HubSpotSearchResponse<HubSpotCompany>> {
    const url = '/crm/v3/objects/companies';
    const params: any = { limit };
    
    if (after) params.after = after;
    if (properties) params.properties = properties.join(',');

    return this.apiRequest('GET', url, undefined, params);
  }

  /**
   * Search companies
   */
  async searchCompanies(searchRequest: HubSpotSearchRequest): Promise<HubSpotSearchResponse<HubSpotCompany>> {
    return this.apiRequest('POST', '/crm/v3/objects/companies/search', searchRequest);
  }

  /**
   * Get company by ID
   */
  async getCompany(companyId: string, properties?: string[]): Promise<HubSpotCompany> {
    const params = properties ? { properties: properties.join(',') } : undefined;
    return this.apiRequest('GET', `/crm/v3/objects/companies/${companyId}`, undefined, params);
  }

  /**
   * Create new company
   */
  async createCompany(company: Omit<HubSpotCompany, 'id' | 'createdAt' | 'updatedAt'>): Promise<HubSpotCompany> {
    return this.apiRequest('POST', '/crm/v3/objects/companies', company);
  }

  /**
   * Update company
   */
  async updateCompany(companyId: string, properties: Partial<HubSpotCompany['properties']>): Promise<HubSpotCompany> {
    return this.apiRequest('PATCH', `/crm/v3/objects/companies/${companyId}`, { properties });
  }

  /**
   * Delete company
   */
  async deleteCompany(companyId: string): Promise<void> {
    await this.apiRequest('DELETE', `/crm/v3/objects/companies/${companyId}`);
  }

  // ==================== DEALS ====================

  /**
   * Get all deals with pagination
   */
  async getDeals(limit: number = 100, after?: string, properties?: string[]): Promise<HubSpotSearchResponse<HubSpotDeal>> {
    const url = '/crm/v3/objects/deals';
    const params: any = { limit };
    
    if (after) params.after = after;
    if (properties) params.properties = properties.join(',');

    return this.apiRequest('GET', url, undefined, params);
  }

  /**
   * Search deals
   */
  async searchDeals(searchRequest: HubSpotSearchRequest): Promise<HubSpotSearchResponse<HubSpotDeal>> {
    return this.apiRequest('POST', '/crm/v3/objects/deals/search', searchRequest);
  }

  /**
   * Get deal by ID
   */
  async getDeal(dealId: string, properties?: string[]): Promise<HubSpotDeal> {
    const params = properties ? { properties: properties.join(',') } : undefined;
    return this.apiRequest('GET', `/crm/v3/objects/deals/${dealId}`, undefined, params);
  }

  /**
   * Create new deal
   */
  async createDeal(deal: Omit<HubSpotDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<HubSpotDeal> {
    return this.apiRequest('POST', '/crm/v3/objects/deals', deal);
  }

  /**
   * Update deal
   */
  async updateDeal(dealId: string, properties: Partial<HubSpotDeal['properties']>): Promise<HubSpotDeal> {
    return this.apiRequest('PATCH', `/crm/v3/objects/deals/${dealId}`, { properties });
  }

  /**
   * Delete deal
   */
  async deleteDeal(dealId: string): Promise<void> {
    await this.apiRequest('DELETE', `/crm/v3/objects/deals/${dealId}`);
  }

  // ==================== ASSOCIATIONS ====================

  /**
   * Associate two objects
   */
  async createAssociation(
    fromObjectType: string,
    fromObjectId: string,
    toObjectType: string,
    toObjectId: string,
    associationType: string
  ): Promise<void> {
    await this.apiRequest('PUT', 
      `/crm/v3/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}/${toObjectId}/${associationType}`
    );
  }

  /**
   * Remove association between two objects
   */
  async removeAssociation(
    fromObjectType: string,
    fromObjectId: string,
    toObjectType: string,
    toObjectId: string,
    associationType: string
  ): Promise<void> {
    await this.apiRequest('DELETE', 
      `/crm/v3/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}/${toObjectId}/${associationType}`
    );
  }

  /**
   * Get associations for an object
   */
  async getAssociations(objectType: string, objectId: string, toObjectType: string): Promise<any> {
    return this.apiRequest('GET', `/crm/v3/objects/${objectType}/${objectId}/associations/${toObjectType}`);
  }

  // ==================== PIPELINES ====================

  /**
   * Get all pipelines for deals
   */
  async getDealPipelines(): Promise<any> {
    return this.apiRequest('GET', '/crm/v3/pipelines/deals');
  }

  /**
   * Get pipeline stages for a specific pipeline
   */
  async getPipelineStages(pipelineId: string): Promise<any> {
    return this.apiRequest('GET', `/crm/v3/pipelines/deals/${pipelineId}/stages`);
  }

  // ==================== OWNERS ====================

  /**
   * Get all owners
   */
  async getOwners(limit: number = 100, after?: string): Promise<any> {
    const params: any = { limit };
    if (after) params.after = after;
    
    return this.apiRequest('GET', '/crm/v3/owners', undefined, params);
  }

  /**
   * Get owner by ID
   */
  async getOwner(ownerId: string): Promise<any> {
    return this.apiRequest('GET', `/crm/v3/owners/${ownerId}`);
  }

  // ==================== PROPERTIES ====================

  /**
   * Get properties for an object type
   */
  async getProperties(objectType: string): Promise<any> {
    return this.apiRequest('GET', `/crm/v3/properties/${objectType}`);
  }

  /**
   * Create custom property
   */
  async createProperty(objectType: string, property: any): Promise<any> {
    return this.apiRequest('POST', `/crm/v3/properties/${objectType}`, property);
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Create multiple contacts in batch
   */
  async batchCreateContacts(contacts: Array<Omit<HubSpotContact, 'id' | 'createdAt' | 'updatedAt'>>): Promise<any> {
    return this.apiRequest('POST', '/crm/v3/objects/contacts/batch/create', {
      inputs: contacts
    });
  }

  /**
   * Update multiple contacts in batch
   */
  async batchUpdateContacts(updates: Array<{ id: string; properties: Partial<HubSpotContact['properties']> }>): Promise<any> {
    return this.apiRequest('POST', '/crm/v3/objects/contacts/batch/update', {
      inputs: updates
    });
  }

  /**
   * Read multiple contacts in batch
   */
  async batchReadContacts(contactIds: string[], properties?: string[]): Promise<any> {
    const inputs = contactIds.map(id => ({ id }));
    const body: any = { inputs };
    if (properties) body.properties = properties;
    
    return this.apiRequest('POST', '/crm/v3/objects/contacts/batch/read', body);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Test connection to HubSpot
   */
  async testConnection(): Promise<{ success: boolean; error?: string; portalInfo?: any }> {
    try {
      await this.ensureValidToken();
      
      // Get account info to test connection
      const accountInfo = await this.apiRequest('GET', '/integrations/v1/me');
      
      return { 
        success: true, 
        portalInfo: {
          portalId: accountInfo.portalId,
          hubDomain: accountInfo.hubDomain,
          appId: accountInfo.appId
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    return this.apiRequest('GET', '/integrations/v1/me');
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

    let url = `${this.baseUrl}${endpoint}`;
    
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    const headers: HeadersInit = {
      'Authorization': `${this.credentials.tokenType} ${this.credentials.accessToken}`,
      'Content-Type': 'application/json'
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
          } else if (errorJson.errors && errorJson.errors[0]?.message) {
            errorMessage = errorJson.errors[0].message;
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
      console.error(`HubSpot API request failed: ${method} ${url}`, error);
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

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get recent contacts (last 30 days)
   */
  async getRecentContacts(days: number = 30): Promise<HubSpotContact[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const timestamp = date.getTime().toString();

    const response = await this.searchContacts({
      filterGroups: [{
        filters: [{
          propertyName: 'createdate',
          operator: 'GTE',
          value: timestamp
        }]
      }],
      sorts: [{
        propertyName: 'createdate',
        direction: 'DESCENDING'
      }],
      properties: ['email', 'firstname', 'lastname', 'phone', 'company', 'createdate'],
      limit: 100
    });

    return response.results;
  }

  /**
   * Get recent deals (last 30 days)
   */
  async getRecentDeals(days: number = 30): Promise<HubSpotDeal[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const timestamp = date.getTime().toString();

    const response = await this.searchDeals({
      filterGroups: [{
        filters: [{
          propertyName: 'createdate',
          operator: 'GTE',
          value: timestamp
        }]
      }],
      sorts: [{
        propertyName: 'createdate',
        direction: 'DESCENDING'
      }],
      properties: ['dealname', 'amount', 'dealstage', 'closedate', 'createdate'],
      limit: 100
    });

    return response.results;
  }

  /**
   * Search contacts by email domain
   */
  async searchContactsByDomain(domain: string): Promise<HubSpotContact[]> {
    const response = await this.searchContacts({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'CONTAINS_TOKEN',
          value: domain
        }]
      }],
      properties: ['email', 'firstname', 'lastname', 'phone', 'company'],
      limit: 100
    });

    return response.results;
  }
}

export default HubSpotConnector;