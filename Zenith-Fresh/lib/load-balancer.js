/**
 * Advanced Load Balancer for Zenith-Fresh
 * Implements intelligent request distribution and failover mechanisms
 */

class LoadBalancer {
  constructor(options = {}) {
    this.servers = options.servers || [];
    this.algorithm = options.algorithm || 'round-robin';
    this.healthCheckInterval = options.healthCheckInterval || 30000; // 30 seconds
    this.requestTimeout = options.requestTimeout || 10000; // 10 seconds
    this.maxRetries = options.maxRetries || 3;
    
    // Server state tracking
    this.serverStates = new Map();
    this.currentIndex = 0;
    this.requestCounts = new Map();
    
    // Initialize server states
    this.initializeServers();
    
    // Start health checks
    this.startHealthChecks();
  }

  /**
   * Initialize server states
   */
  initializeServers() {
    this.servers.forEach(server => {
      this.serverStates.set(server.id, {
        ...server,
        isHealthy: true,
        responseTime: 0,
        requestCount: 0,
        errorCount: 0,
        lastChecked: Date.now()
      });
      this.requestCounts.set(server.id, 0);
    });
  }

  /**
   * Get next server based on load balancing algorithm
   */
  getNextServer(excludeServers = []) {
    const healthyServers = Array.from(this.serverStates.values())
      .filter(server => server.isHealthy && !excludeServers.includes(server.id));

    if (healthyServers.length === 0) {
      throw new Error('No healthy servers available');
    }

    switch (this.algorithm) {
      case 'round-robin':
        return this.roundRobin(healthyServers);
      case 'least-connections':
        return this.leastConnections(healthyServers);
      case 'weighted':
        return this.weightedRandom(healthyServers);
      case 'response-time':
        return this.fastestResponse(healthyServers);
      default:
        return this.roundRobin(healthyServers);
    }
  }

  /**
   * Round-robin selection
   */
  roundRobin(servers) {
    const server = servers[this.currentIndex % servers.length];
    this.currentIndex++;
    return server;
  }

  /**
   * Least connections selection
   */
  leastConnections(servers) {
    return servers.reduce((min, server) => {
      const serverState = this.serverStates.get(server.id);
      const minState = this.serverStates.get(min.id);
      return serverState.requestCount < minState.requestCount ? server : min;
    });
  }

  /**
   * Weighted random selection
   */
  weightedRandom(servers) {
    const totalWeight = servers.reduce((sum, server) => sum + (server.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const server of servers) {
      random -= (server.weight || 1);
      if (random <= 0) {
        return server;
      }
    }
    
    return servers[0];
  }

  /**
   * Fastest response time selection
   */
  fastestResponse(servers) {
    return servers.reduce((fastest, server) => {
      const serverState = this.serverStates.get(server.id);
      const fastestState = this.serverStates.get(fastest.id);
      return serverState.responseTime < fastestState.responseTime ? server : fastest;
    });
  }

  /**
   * Distribute request with failover
   */
  async distributeRequest(requestFn, requestData = {}) {
    const excludeServers = [];
    let lastError = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const server = this.getNextServer(excludeServers);
        const startTime = Date.now();
        
        // Increment request count
        const serverState = this.serverStates.get(server.id);
        serverState.requestCount++;
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), this.requestTimeout);
        });

        // Execute request with timeout
        const requestPromise = requestFn(server, requestData);
        const result = await Promise.race([requestPromise, timeoutPromise]);
        
        // Update server metrics
        const responseTime = Date.now() - startTime;
        this.updateServerMetrics(server.id, true, responseTime);
        
        return result;

      } catch (error) {
        lastError = error;
        
        // Get the server that failed
        const failedServer = this.getLastUsedServer();
        if (failedServer) {
          excludeServers.push(failedServer.id);
          this.updateServerMetrics(failedServer.id, false);
        }
        
        console.warn(`Request failed on attempt ${attempt + 1}:`, error.message);
        
        // Wait before retry
        if (attempt < this.maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    throw new Error(`All servers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Update server performance metrics
   */
  updateServerMetrics(serverId, success, responseTime = 0) {
    const serverState = this.serverStates.get(serverId);
    if (!serverState) return;

    serverState.requestCount = Math.max(0, serverState.requestCount - 1);
    serverState.lastChecked = Date.now();

    if (success) {
      // Update response time with weighted average
      serverState.responseTime = serverState.responseTime === 0 
        ? responseTime 
        : (serverState.responseTime * 0.8) + (responseTime * 0.2);
    } else {
      serverState.errorCount++;
      
      // Mark as unhealthy if error rate is too high
      const errorRate = serverState.errorCount / Math.max(1, serverState.errorCount + serverState.requestCount);
      if (errorRate > 0.5) {
        serverState.isHealthy = false;
        console.warn(`Server ${serverId} marked as unhealthy due to high error rate`);
      }
    }
  }

  /**
   * Health check for all servers
   */
  async performHealthCheck(server) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok && responseTime < 5000;
      
      const serverState = this.serverStates.get(server.id);
      serverState.isHealthy = isHealthy;
      serverState.responseTime = responseTime;
      serverState.lastChecked = Date.now();
      
      if (!isHealthy) {
        console.warn(`Health check failed for server ${server.id}: ${response.status}`);
      }
      
      return isHealthy;

    } catch (error) {
      console.error(`Health check error for server ${server.id}:`, error.message);
      const serverState = this.serverStates.get(server.id);
      serverState.isHealthy = false;
      serverState.lastChecked = Date.now();
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    setInterval(async () => {
      const healthPromises = this.servers.map(server => this.performHealthCheck(server));
      await Promise.allSettled(healthPromises);
      
      // Log health status
      const healthyCount = Array.from(this.serverStates.values())
        .filter(state => state.isHealthy).length;
      
      console.log(`Health check completed: ${healthyCount}/${this.servers.length} servers healthy`);
      
    }, this.healthCheckInterval);
  }

  /**
   * Get server statistics
   */
  getServerStats() {
    return Array.from(this.serverStates.entries()).map(([id, state]) => ({
      id,
      url: state.url,
      isHealthy: state.isHealthy,
      responseTime: Math.round(state.responseTime),
      requestCount: state.requestCount,
      errorCount: state.errorCount,
      lastChecked: new Date(state.lastChecked).toISOString()
    }));
  }

  /**
   * Add new server to the pool
   */
  addServer(server) {
    this.servers.push(server);
    this.serverStates.set(server.id, {
      ...server,
      isHealthy: true,
      responseTime: 0,
      requestCount: 0,
      errorCount: 0,
      lastChecked: Date.now()
    });
    this.requestCounts.set(server.id, 0);
    
    console.log(`Server ${server.id} added to load balancer`);
  }

  /**
   * Remove server from the pool
   */
  removeServer(serverId) {
    this.servers = this.servers.filter(server => server.id !== serverId);
    this.serverStates.delete(serverId);
    this.requestCounts.delete(serverId);
    
    console.log(`Server ${serverId} removed from load balancer`);
  }

  /**
   * Get the last used server (for error handling)
   */
  getLastUsedServer() {
    // This is a simplified implementation
    // In production, you'd track this more precisely
    return this.servers[Math.max(0, this.currentIndex - 1) % this.servers.length];
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get load balancer status
   */
  getStatus() {
    const totalServers = this.servers.length;
    const healthyServers = Array.from(this.serverStates.values())
      .filter(state => state.isHealthy).length;
    
    const avgResponseTime = Array.from(this.serverStates.values())
      .reduce((sum, state) => sum + state.responseTime, 0) / totalServers;

    return {
      algorithm: this.algorithm,
      totalServers,
      healthyServers,
      unhealthyServers: totalServers - healthyServers,
      averageResponseTime: Math.round(avgResponseTime),
      uptime: (healthyServers / totalServers) * 100,
      lastUpdate: new Date().toISOString()
    };
  }
}

module.exports = LoadBalancer;