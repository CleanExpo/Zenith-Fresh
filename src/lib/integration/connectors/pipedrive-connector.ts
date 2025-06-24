/**
 * Pipedrive Enterprise Connector
 * 
 * Complete Pipedrive CRM integration with API token authentication,
 * comprehensive contact/deal/activity management, and webhook support.
 */

export interface PipedriveConfig {
  apiToken: string;
  companyDomain: string;
  webhookUrl?: string;
}

export interface PipedrivePerson {
  id?: number;
  name: string;
  first_name?: string;
  last_name?: string;
  phone?: Array<{ value: string; primary: boolean }>;
  email?: Array<{ value: string; primary: boolean }>;
  org_id?: number;
  owner_id?: number;
  add_time?: string;
  update_time?: string;
  [key: string]: any;
}

export interface PipedriveOrganization {
  id?: number;
  name: string;
  address?: string;
  address_country?: string;
  address_locality?: string;
  address_postal_code?: string;
  owner_id?: number;
  people_count?: number;
  add_time?: string;
  update_time?: string;
  [key: string]: any;
}

export interface PipedriveDeal {
  id?: number;
  title: string;
  value?: number;
  currency?: string;
  user_id?: number;
  person_id?: number;
  org_id?: number;
  stage_id?: number;
  status?: 'open' | 'won' | 'lost' | 'deleted';
  probability?: number;
  lost_reason?: string;
  add_time?: string;
  update_time?: string;
  close_time?: string;
  expected_close_date?: string;
  [key: string]: any;
}

export interface PipedriveActivity {
  id?: number;
  subject: string;
  type: string;
  done: boolean;
  due_date?: string;
  due_time?: string;
  duration?: string;
  user_id?: number;
  deal_id?: number;
  person_id?: number;
  org_id?: number;
  note?: string;
  add_time?: string;
  update_time?: string;
  [key: string]: any;
}

export interface PipedriveSearchRequest {
  term: string;
  fields?: string[];
  exact_match?: boolean;
  include_fields?: string[];
  start?: number;
  limit?: number;
}

export interface PipedriveResponse<T = any> {
  success: boolean;
  data: T;
  additional_data?: {
    pagination?: {
      start: number;
      limit: number;
      more_items_in_collection: boolean;
      next_start?: number;
    };
  };
  related_objects?: any;
}

export interface PipedriveListResponse<T = any> {
  success: boolean;
  data: T[];
  additional_data?: {
    pagination?: {
      start: number;
      limit: number;
      more_items_in_collection: boolean;
      next_start?: number;
    };
  };
}

export class PipedriveConnector {
  private config: PipedriveConfig;
  private baseUrl: string;

  constructor(config: PipedriveConfig) {
    this.config = config;
    this.baseUrl = `https://${config.companyDomain}.pipedrive.com/api/v1`;
  }

  // ==================== PERSONS ====================

  /**
   * Get all persons with pagination
   */
  async getPersons(start: number = 0, limit: number = 100, fields?: string[]): Promise<PipedriveListResponse<PipedrivePerson>> {
    const params: any = { start, limit };
    if (fields) params.fields = fields.join(',');

    return this.apiRequest('GET', '/persons', params);
  }

  /**
   * Search persons
   */
  async searchPersons(searchRequest: PipedriveSearchRequest): Promise<PipedriveListResponse<PipedrivePerson>> {
    const params = {
      term: searchRequest.term,
      fields: searchRequest.fields?.join(','),
      exact_match: searchRequest.exact_match,
      include_fields: searchRequest.include_fields?.join(','),
      start: searchRequest.start || 0,
      limit: searchRequest.limit || 100
    };

    return this.apiRequest('GET', '/persons/search', params);
  }

  /**
   * Get person by ID
   */
  async getPerson(personId: number): Promise<PipedriveResponse<PipedrivePerson>> {
    return this.apiRequest('GET', `/persons/${personId}`);
  }

  /**
   * Create new person
   */
  async createPerson(person: Omit<PipedrivePerson, 'id' | 'add_time' | 'update_time'>): Promise<PipedriveResponse<PipedrivePerson>> {
    return this.apiRequest('POST', '/persons', person);
  }

  /**
   * Update person
   */
  async updatePerson(personId: number, data: Partial<PipedrivePerson>): Promise<PipedriveResponse<PipedrivePerson>> {
    return this.apiRequest('PUT', `/persons/${personId}`, data);
  }

  /**
   * Delete person
   */
  async deletePerson(personId: number): Promise<PipedriveResponse<{ id: number }>> {
    return this.apiRequest('DELETE', `/persons/${personId}`);
  }

  /**
   * Get person by email
   */
  async getPersonByEmail(email: string): Promise<PipedriveListResponse<PipedrivePerson>> {
    return this.searchPersons({
      term: email,
      fields: ['email'],
      exact_match: true,
      limit: 1
    });
  }

  /**
   * Create or update person by email
   */
  async upsertPersonByEmail(email: string, personData: Partial<PipedrivePerson>): Promise<PipedriveResponse<PipedrivePerson>> {
    try {
      // Try to find existing person by email
      const searchResponse = await this.getPersonByEmail(email);
      
      if (searchResponse.success && searchResponse.data.length > 0) {
        // Update existing person
        const existingPerson = searchResponse.data[0];
        return this.updatePerson(existingPerson.id!, personData);
      } else {
        // Create new person
        const newPersonData = {
          ...personData,
          email: [{ value: email, primary: true }]
        };
        return this.createPerson(newPersonData);
      }
    } catch (error) {
      console.error('Failed to upsert person by email:', error);
      throw error;
    }
  }

  // ==================== ORGANIZATIONS ====================

  /**
   * Get all organizations with pagination
   */
  async getOrganizations(start: number = 0, limit: number = 100): Promise<PipedriveListResponse<PipedriveOrganization>> {
    return this.apiRequest('GET', '/organizations', { start, limit });
  }

  /**
   * Search organizations
   */
  async searchOrganizations(searchRequest: PipedriveSearchRequest): Promise<PipedriveListResponse<PipedriveOrganization>> {
    const params = {
      term: searchRequest.term,
      fields: searchRequest.fields?.join(','),
      exact_match: searchRequest.exact_match,
      start: searchRequest.start || 0,
      limit: searchRequest.limit || 100
    };

    return this.apiRequest('GET', '/organizations/search', params);
  }

  /**
   * Get organization by ID
   */
  async getOrganization(orgId: number): Promise<PipedriveResponse<PipedriveOrganization>> {
    return this.apiRequest('GET', `/organizations/${orgId}`);
  }

  /**
   * Create new organization
   */
  async createOrganization(org: Omit<PipedriveOrganization, 'id' | 'add_time' | 'update_time'>): Promise<PipedriveResponse<PipedriveOrganization>> {
    return this.apiRequest('POST', '/organizations', org);
  }

  /**
   * Update organization
   */
  async updateOrganization(orgId: number, data: Partial<PipedriveOrganization>): Promise<PipedriveResponse<PipedriveOrganization>> {
    return this.apiRequest('PUT', `/organizations/${orgId}`, data);
  }

  /**
   * Delete organization
   */
  async deleteOrganization(orgId: number): Promise<PipedriveResponse<{ id: number }>> {
    return this.apiRequest('DELETE', `/organizations/${orgId}`);
  }

  // ==================== DEALS ====================

  /**
   * Get all deals with pagination
   */
  async getDeals(start: number = 0, limit: number = 100, status?: 'open' | 'won' | 'lost'): Promise<PipedriveListResponse<PipedriveDeal>> {
    const params: any = { start, limit };
    if (status) params.status = status;

    return this.apiRequest('GET', '/deals', params);
  }

  /**
   * Search deals
   */
  async searchDeals(searchRequest: PipedriveSearchRequest): Promise<PipedriveListResponse<PipedriveDeal>> {
    const params = {
      term: searchRequest.term,
      fields: searchRequest.fields?.join(','),
      exact_match: searchRequest.exact_match,
      start: searchRequest.start || 0,
      limit: searchRequest.limit || 100
    };

    return this.apiRequest('GET', '/deals/search', params);
  }

  /**
   * Get deal by ID
   */
  async getDeal(dealId: number): Promise<PipedriveResponse<PipedriveDeal>> {
    return this.apiRequest('GET', `/deals/${dealId}`);
  }

  /**
   * Create new deal
   */
  async createDeal(deal: Omit<PipedriveDeal, 'id' | 'add_time' | 'update_time'>): Promise<PipedriveResponse<PipedriveDeal>> {
    return this.apiRequest('POST', '/deals', deal);
  }

  /**
   * Update deal
   */
  async updateDeal(dealId: number, data: Partial<PipedriveDeal>): Promise<PipedriveResponse<PipedriveDeal>> {
    return this.apiRequest('PUT', `/deals/${dealId}`, data);
  }

  /**
   * Delete deal
   */
  async deleteDeal(dealId: number): Promise<PipedriveResponse<{ id: number }>> {
    return this.apiRequest('DELETE', `/deals/${dealId}`);
  }

  /**
   * Move deal to different stage
   */
  async moveDeal(dealId: number, stageId: number): Promise<PipedriveResponse<PipedriveDeal>> {
    return this.updateDeal(dealId, { stage_id: stageId });
  }

  /**
   * Mark deal as won
   */
  async markDealWon(dealId: number): Promise<PipedriveResponse<PipedriveDeal>> {
    return this.updateDeal(dealId, { status: 'won' });
  }

  /**
   * Mark deal as lost
   */
  async markDealLost(dealId: number, lostReason?: string): Promise<PipedriveResponse<PipedriveDeal>> {
    const data: Partial<PipedriveDeal> = { status: 'lost' };
    if (lostReason) data.lost_reason = lostReason;
    
    return this.updateDeal(dealId, data);
  }

  // ==================== ACTIVITIES ====================

  /**
   * Get all activities with pagination
   */
  async getActivities(start: number = 0, limit: number = 100, done?: boolean): Promise<PipedriveListResponse<PipedriveActivity>> {
    const params: any = { start, limit };
    if (done !== undefined) params.done = done ? 1 : 0;

    return this.apiRequest('GET', '/activities', params);
  }

  /**
   * Get activity by ID
   */
  async getActivity(activityId: number): Promise<PipedriveResponse<PipedriveActivity>> {
    return this.apiRequest('GET', `/activities/${activityId}`);
  }

  /**
   * Create new activity
   */
  async createActivity(activity: Omit<PipedriveActivity, 'id' | 'add_time' | 'update_time'>): Promise<PipedriveResponse<PipedriveActivity>> {
    return this.apiRequest('POST', '/activities', activity);
  }

  /**
   * Update activity
   */
  async updateActivity(activityId: number, data: Partial<PipedriveActivity>): Promise<PipedriveResponse<PipedriveActivity>> {
    return this.apiRequest('PUT', `/activities/${activityId}`, data);
  }

  /**
   * Delete activity
   */
  async deleteActivity(activityId: number): Promise<PipedriveResponse<{ id: number }>> {
    return this.apiRequest('DELETE', `/activities/${activityId}`);
  }

  /**
   * Mark activity as done
   */
  async markActivityDone(activityId: number): Promise<PipedriveResponse<PipedriveActivity>> {
    return this.updateActivity(activityId, { done: true });
  }

  /**
   * Get activities for a deal
   */
  async getActivitiesForDeal(dealId: number): Promise<PipedriveListResponse<PipedriveActivity>> {
    return this.apiRequest('GET', `/deals/${dealId}/activities`);
  }

  /**
   * Get activities for a person
   */
  async getActivitiesForPerson(personId: number): Promise<PipedriveListResponse<PipedriveActivity>> {
    return this.apiRequest('GET', `/persons/${personId}/activities`);
  }

  // ==================== PIPELINES & STAGES ====================

  /**
   * Get all pipelines
   */
  async getPipelines(): Promise<PipedriveListResponse<any>> {
    return this.apiRequest('GET', '/pipelines');
  }

  /**
   * Get pipeline by ID
   */
  async getPipeline(pipelineId: number): Promise<PipedriveResponse<any>> {
    return this.apiRequest('GET', `/pipelines/${pipelineId}`);
  }

  /**
   * Get stages for a pipeline
   */
  async getStages(pipelineId?: number): Promise<PipedriveListResponse<any>> {
    const params = pipelineId ? { pipeline_id: pipelineId } : {};
    return this.apiRequest('GET', '/stages', params);
  }

  /**
   * Get stage by ID
   */
  async getStage(stageId: number): Promise<PipedriveResponse<any>> {
    return this.apiRequest('GET', `/stages/${stageId}`);
  }

  // ==================== USERS ====================

  /**
   * Get all users
   */
  async getUsers(): Promise<PipedriveListResponse<any>> {
    return this.apiRequest('GET', '/users');
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<PipedriveResponse<any>> {
    return this.apiRequest('GET', '/users/me');
  }

  // ==================== NOTES ====================

  /**
   * Get all notes
   */
  async getNotes(start: number = 0, limit: number = 100): Promise<PipedriveListResponse<any>> {
    return this.apiRequest('GET', '/notes', { start, limit });
  }

  /**
   * Create note
   */
  async createNote(note: {
    content: string;
    deal_id?: number;
    person_id?: number;
    org_id?: number;
    user_id?: number;
  }): Promise<PipedriveResponse<any>> {
    return this.apiRequest('POST', '/notes', note);
  }

  /**
   * Get notes for deal
   */
  async getNotesForDeal(dealId: number): Promise<PipedriveListResponse<any>> {
    return this.apiRequest('GET', `/deals/${dealId}/notes`);
  }

  /**
   * Get notes for person
   */
  async getNotesForPerson(personId: number): Promise<PipedriveListResponse<any>> {
    return this.apiRequest('GET', `/persons/${personId}/notes`);
  }

  // ==================== WEBHOOKS ====================

  /**
   * Get all webhooks
   */
  async getWebhooks(): Promise<PipedriveListResponse<any>> {
    return this.apiRequest('GET', '/webhooks');
  }

  /**
   * Create webhook
   */
  async createWebhook(webhook: {
    subscription_url: string;
    event_action: 'added' | 'updated' | 'deleted' | '*';
    event_object: 'person' | 'deal' | 'organization' | 'activity' | '*';
    user_id?: number;
    http_auth_user?: string;
    http_auth_password?: string;
  }): Promise<PipedriveResponse<any>> {
    return this.apiRequest('POST', '/webhooks', webhook);
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: number): Promise<PipedriveResponse<any>> {
    return this.apiRequest('DELETE', `/webhooks/${webhookId}`);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Test connection to Pipedrive
   */
  async testConnection(): Promise<{ success: boolean; error?: string; userInfo?: any }> {
    try {
      const response = await this.getCurrentUser();
      
      if (response.success) {
        return { 
          success: true, 
          userInfo: {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            company: response.data.company_name,
            timezone: response.data.timezone_name
          }
        };
      } else {
        return { success: false, error: 'Failed to authenticate' };
      }
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
    data?: any
  ): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
    // Add API token to query params
    const separator = endpoint.includes('?') ? '&' : '?';
    url += `${separator}api_token=${this.config.apiToken}`;
    
    // For GET requests, add data as query params
    if (method === 'GET' && data) {
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      url += `&${params.toString()}`;
    }

    const headers: HeadersInit = {
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
          if (errorJson.error) {
            errorMessage = errorJson.error;
          } else if (errorJson.error_info) {
            errorMessage = errorJson.error_info;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Pipedrive returns success: false for errors
      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error(`Pipedrive API request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get recent deals (last 30 days)
   */
  async getRecentDeals(days: number = 30): Promise<PipedriveDeal[]> {
    try {
      const allDeals = await this.getDeals(0, 500); // Get more deals to filter
      
      if (allDeals.success) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return allDeals.data.filter(deal => {
          const addTime = deal.add_time ? new Date(deal.add_time) : null;
          return addTime && addTime >= cutoffDate;
        });
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get recent deals:', error);
      return [];
    }
  }

  /**
   * Get recent persons (last 30 days)
   */
  async getRecentPersons(days: number = 30): Promise<PipedrivePerson[]> {
    try {
      const allPersons = await this.getPersons(0, 500); // Get more persons to filter
      
      if (allPersons.success) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return allPersons.data.filter(person => {
          const addTime = person.add_time ? new Date(person.add_time) : null;
          return addTime && addTime >= cutoffDate;
        });
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get recent persons:', error);
      return [];
    }
  }

  /**
   * Get deals by stage
   */
  async getDealsByStage(stageId: number): Promise<PipedriveDeal[]> {
    try {
      const allDeals = await this.getDeals(0, 500);
      
      if (allDeals.success) {
        return allDeals.data.filter(deal => deal.stage_id === stageId);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get deals by stage:', error);
      return [];
    }
  }

  /**
   * Create person and organization together
   */
  async createPersonWithOrganization(
    personData: Omit<PipedrivePerson, 'id' | 'add_time' | 'update_time' | 'org_id'>,
    orgData: Omit<PipedriveOrganization, 'id' | 'add_time' | 'update_time'>
  ): Promise<{ person: PipedriveResponse<PipedrivePerson>; organization: PipedriveResponse<PipedriveOrganization> }> {
    try {
      // Create organization first
      const orgResponse = await this.createOrganization(orgData);
      
      if (orgResponse.success) {
        // Create person with organization reference
        const personWithOrg = {
          ...personData,
          org_id: orgResponse.data.id
        };
        
        const personResponse = await this.createPerson(personWithOrg);
        
        return {
          organization: orgResponse,
          person: personResponse
        };
      } else {
        throw new Error('Failed to create organization');
      }
    } catch (error) {
      console.error('Failed to create person with organization:', error);
      throw error;
    }
  }
}

export default PipedriveConnector;