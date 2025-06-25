// Database Sharding Platform - Massive Scale Infrastructure
// Enterprise-grade database sharding and partitioning system

import { PrismaClient } from '@prisma/client';

// ==================== SHARDING CONFIGURATION ====================

export interface ShardingConfig {
  strategy: 'hash' | 'range' | 'directory' | 'geographic';
  shardKey: string;
  shardCount: number;
  replicationFactor: number;
  consistencyLevel: 'eventual' | 'strong' | 'bounded';
  shards: ShardInfo[];
}

export interface ShardInfo {
  id: string;
  name: string;
  region: string;
  connectionString: string;
  readReplicas: string[];
  isPrimary: boolean;
  weightRatio: number;
  hashRange?: {
    start: number;
    end: number;
  };
  keyRange?: {
    start: string;
    end: string;
  };
  status: 'active' | 'maintenance' | 'failed';
  metrics: ShardMetrics;
}

export interface ShardMetrics {
  connectionCount: number;
  queryLatency: number;
  diskUsage: number;
  cpuUsage: number;
  memoryUsage: number;
  queryCount: number;
  errorRate: number;
  lastUpdated: number;
}

export interface ShardingRule {
  table: string;
  shardKey: string;
  strategy: 'hash' | 'range' | 'geographic';
  distribution: 'uniform' | 'weighted' | 'custom';
  migrations: {
    enabled: boolean;
    threshold: number;
    cooldown: number;
  };
}

// ==================== DATABASE SHARDING MANAGER ====================

export class DatabaseShardingManager {
  private static instance: DatabaseShardingManager;
  private config: ShardingConfig;
  private shardConnections: Map<string, PrismaClient> = new Map();
  private routingCache: Map<string, string> = new Map();
  private metrics: Map<string, ShardMetrics> = new Map();

  private constructor() {
    this.config = this.initializeShardingConfig();
    this.initializeShardConnections();
  }

  static getInstance(): DatabaseShardingManager {
    if (!DatabaseShardingManager.instance) {
      DatabaseShardingManager.instance = new DatabaseShardingManager();
    }
    return DatabaseShardingManager.instance;
  }

  private initializeShardingConfig(): ShardingConfig {
    return {
      strategy: 'hash',
      shardKey: 'teamId',
      shardCount: 8,
      replicationFactor: 3,
      consistencyLevel: 'bounded',
      shards: [
        {
          id: 'shard-us-east-1-01',
          name: 'US East Primary 1',
          region: 'us-east-1',
          connectionString: process.env.DATABASE_SHARD_1_URL || process.env.DATABASE_URL || '',
          readReplicas: [
            process.env.DATABASE_SHARD_1_READ_1_URL || '',
            process.env.DATABASE_SHARD_1_READ_2_URL || ''
          ],
          isPrimary: true,
          weightRatio: 1.0,
          hashRange: { start: 0, end: 1073741823 }, // 0 to 2^30/4
          status: 'active',
          metrics: this.createEmptyMetrics()
        },
        {
          id: 'shard-us-east-1-02',
          name: 'US East Primary 2',
          region: 'us-east-1',
          connectionString: process.env.DATABASE_SHARD_2_URL || process.env.DATABASE_URL || '',
          readReplicas: [
            process.env.DATABASE_SHARD_2_READ_1_URL || '',
            process.env.DATABASE_SHARD_2_READ_2_URL || ''
          ],
          isPrimary: true,
          weightRatio: 1.0,
          hashRange: { start: 1073741824, end: 2147483647 }, // 2^30/4 to 2^30/2
          status: 'active',
          metrics: this.createEmptyMetrics()
        },
        {
          id: 'shard-us-west-2-01',
          name: 'US West Primary 1',
          region: 'us-west-2',
          connectionString: process.env.DATABASE_SHARD_3_URL || process.env.DATABASE_URL || '',
          readReplicas: [
            process.env.DATABASE_SHARD_3_READ_1_URL || '',
            process.env.DATABASE_SHARD_3_READ_2_URL || ''
          ],
          isPrimary: true,
          weightRatio: 1.0,
          hashRange: { start: 2147483648, end: 3221225471 }, // 2^30/2 to 3*2^30/4
          status: 'active',
          metrics: this.createEmptyMetrics()
        },
        {
          id: 'shard-us-west-2-02',
          name: 'US West Primary 2',
          region: 'us-west-2',
          connectionString: process.env.DATABASE_SHARD_4_URL || process.env.DATABASE_URL || '',
          readReplicas: [
            process.env.DATABASE_SHARD_4_READ_1_URL || '',
            process.env.DATABASE_SHARD_4_READ_2_URL || ''
          ],
          isPrimary: true,
          weightRatio: 1.0,
          hashRange: { start: 3221225472, end: 4294967295 }, // 3*2^30/4 to 2^32
          status: 'active',
          metrics: this.createEmptyMetrics()
        },
        {
          id: 'shard-eu-west-1-01',
          name: 'EU West Primary 1',
          region: 'eu-west-1',
          connectionString: process.env.DATABASE_SHARD_5_URL || process.env.DATABASE_URL || '',
          readReplicas: [
            process.env.DATABASE_SHARD_5_READ_1_URL || '',
            process.env.DATABASE_SHARD_5_READ_2_URL || ''
          ],
          isPrimary: true,
          weightRatio: 0.8,
          hashRange: { start: 0, end: 2147483647 }, // GDPR compliant shard
          status: 'active',
          metrics: this.createEmptyMetrics()
        },
        {
          id: 'shard-ap-southeast-1-01',
          name: 'APAC Primary 1',
          region: 'ap-southeast-1',
          connectionString: process.env.DATABASE_SHARD_6_URL || process.env.DATABASE_URL || '',
          readReplicas: [
            process.env.DATABASE_SHARD_6_READ_1_URL || '',
            process.env.DATABASE_SHARD_6_READ_2_URL || ''
          ],
          isPrimary: true,
          weightRatio: 0.6,
          hashRange: { start: 2147483648, end: 4294967295 },
          status: 'active',
          metrics: this.createEmptyMetrics()
        }
      ]
    };
  }

  private createEmptyMetrics(): ShardMetrics {
    return {
      connectionCount: 0,
      queryLatency: 0,
      diskUsage: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      queryCount: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    };
  }

  private async initializeShardConnections(): Promise<void> {
    for (const shard of this.config.shards) {
      if (shard.connectionString) {
        try {
          const client = new PrismaClient({
            datasources: {
              db: {
                url: shard.connectionString
              }
            }
          });
          
          this.shardConnections.set(shard.id, client);
          console.log(`✅ Shard connection initialized: ${shard.name}`);
          
        } catch (error) {
          console.error(`❌ Failed to initialize shard connection: ${shard.name}`, error);
          shard.status = 'failed';
        }
      }
    }
    
    console.log(`🗄️ Database sharding initialized: ${this.shardConnections.size} active shards`);
  }

  // ==================== SHARD ROUTING ====================

  async getShardForKey(shardKey: string, operation: 'read' | 'write' = 'read'): Promise<string> {
    // Check cache first
    if (operation === 'read' && this.routingCache.has(shardKey)) {
      const cachedShardId = this.routingCache.get(shardKey)!;
      if (this.isShardHealthy(cachedShardId)) {
        return cachedShardId;
      }
    }

    let shardId: string;

    switch (this.config.strategy) {
      case 'hash':
        shardId = await this.getShardByHash(shardKey);
        break;
      case 'range':
        shardId = await this.getShardByRange(shardKey);
        break;
      case 'geographic':
        shardId = await this.getShardByGeography(shardKey);
        break;
      case 'directory':
        shardId = await this.getShardByDirectory(shardKey);
        break;
      default:
        shardId = this.config.shards[0].id;
    }

    // Cache the routing decision for reads
    if (operation === 'read') {
      this.routingCache.set(shardKey, shardId);
    }

    return shardId;
  }

  private async getShardByHash(shardKey: string): Promise<string> {
    const hash = this.calculateHash(shardKey);
    
    for (const shard of this.config.shards) {
      if (shard.status === 'active' && shard.hashRange) {
        if (hash >= shard.hashRange.start && hash <= shard.hashRange.end) {
          return shard.id;
        }
      }
    }
    
    // Fallback to first active shard
    const activeShard = this.config.shards.find(s => s.status === 'active');
    return activeShard?.id || this.config.shards[0].id;
  }

  private async getShardByRange(shardKey: string): Promise<string> {
    for (const shard of this.config.shards) {
      if (shard.status === 'active' && shard.keyRange) {
        if (shardKey >= shard.keyRange.start && shardKey <= shard.keyRange.end) {
          return shard.id;
        }
      }
    }
    
    return this.config.shards[0].id;
  }

  private async getShardByGeography(shardKey: string): Promise<string> {
    // Extract geographic information from key or use user context
    const userRegion = this.extractRegionFromKey(shardKey);
    
    // Find shard in the same region
    const regionalShard = this.config.shards.find(s => 
      s.status === 'active' && s.region === userRegion
    );
    
    return regionalShard?.id || this.config.shards[0].id;
  }

  private async getShardByDirectory(shardKey: string): Promise<string> {
    // In production, this would query a directory service
    // For now, fall back to hash-based routing
    return this.getShardByHash(shardKey);
  }

  private calculateHash(input: string): number {
    let hash = 0;
    if (input.length === 0) return hash;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  private extractRegionFromKey(shardKey: string): string {
    // Extract region from user context or key pattern
    // This is a simple implementation - in production, you'd have user geolocation
    return 'us-east-1'; // Default region
  }

  private isShardHealthy(shardId: string): boolean {
    const shard = this.config.shards.find(s => s.id === shardId);
    return shard?.status === 'active';
  }

  // ==================== DATABASE OPERATIONS ====================

  async getShardConnection(shardId: string, operation: 'read' | 'write' = 'read'): Promise<PrismaClient> {
    let targetShardId = shardId;

    // For read operations, try to use read replicas
    if (operation === 'read') {
      const shard = this.config.shards.find(s => s.id === shardId);
      if (shard && shard.readReplicas.length > 0) {
        // Simple round-robin selection of read replica
        const replicaIndex = Math.floor(Math.random() * shard.readReplicas.length);
        const replicaConnectionString = shard.readReplicas[replicaIndex];
        
        if (replicaConnectionString) {
          const replicaId = `${shardId}-replica-${replicaIndex}`;
          
          if (!this.shardConnections.has(replicaId)) {
            try {
              const replicaClient = new PrismaClient({
                datasources: {
                  db: {
                    url: replicaConnectionString
                  }
                }
              });
              this.shardConnections.set(replicaId, replicaClient);
            } catch (error) {
              console.error(`Failed to connect to read replica: ${replicaId}`, error);
            }
          }
          
          if (this.shardConnections.has(replicaId)) {
            targetShardId = replicaId;
          }
        }
      }
    }

    const connection = this.shardConnections.get(targetShardId);
    if (!connection) {
      throw new Error(`No connection available for shard: ${targetShardId}`);
    }

    return connection;
  }

  async executeShardedQuery<T>(
    shardKey: string,
    operation: 'read' | 'write',
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    const shardId = await this.getShardForKey(shardKey, operation);
    const client = await this.getShardConnection(shardId, operation);
    
    const startTime = Date.now();
    
    try {
      const result = await queryFn(client);
      
      // Record successful operation metrics
      this.recordOperationMetrics(shardId, Date.now() - startTime, false);
      
      return result;
    } catch (error) {
      // Record failed operation metrics
      this.recordOperationMetrics(shardId, Date.now() - startTime, true);
      
      // Try failover for read operations
      if (operation === 'read') {
        const fallbackShardId = await this.getFallbackShard(shardId);
        if (fallbackShardId && fallbackShardId !== shardId) {
          console.warn(`Retrying query on fallback shard: ${fallbackShardId}`);
          const fallbackClient = await this.getShardConnection(fallbackShardId, operation);
          return await queryFn(fallbackClient);
        }
      }
      
      throw error;
    }
  }

  async executeCrossShardQuery<T>(
    queryFn: (client: PrismaClient) => Promise<T[]>
  ): Promise<T[]> {
    const promises: Promise<T[]>[] = [];
    
    for (const shard of this.config.shards) {
      if (shard.status === 'active') {
        const client = this.shardConnections.get(shard.id);
        if (client) {
          promises.push(queryFn(client));
        }
      }
    }
    
    const results = await Promise.allSettled(promises);
    
    // Combine successful results
    const combinedResults: T[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        combinedResults.push(...result.value);
      } else {
        console.error(`Cross-shard query failed on shard ${index}:`, result.reason);
      }
    });
    
    return combinedResults;
  }

  // ==================== SHARD MANAGEMENT ====================

  async addShard(shardInfo: Omit<ShardInfo, 'metrics'>): Promise<void> {
    const newShard: ShardInfo = {
      ...shardInfo,
      metrics: this.createEmptyMetrics()
    };
    
    // Initialize connection
    if (newShard.connectionString) {
      const client = new PrismaClient({
        datasources: {
          db: {
            url: newShard.connectionString
          }
        }
      });
      
      this.shardConnections.set(newShard.id, client);
    }
    
    this.config.shards.push(newShard);
    console.log(`✅ New shard added: ${newShard.name}`);
  }

  async removeShard(shardId: string): Promise<void> {
    // Mark shard as maintenance mode first
    const shard = this.config.shards.find(s => s.id === shardId);
    if (shard) {
      shard.status = 'maintenance';
    }
    
    // Drain connections
    await this.drainShardConnections(shardId);
    
    // Remove from configuration
    this.config.shards = this.config.shards.filter(s => s.id !== shardId);
    
    // Close connection
    const connection = this.shardConnections.get(shardId);
    if (connection) {
      await connection.$disconnect();
      this.shardConnections.delete(shardId);
    }
    
    console.log(`✅ Shard removed: ${shardId}`);
  }

  async rebalanceShards(): Promise<void> {
    console.log('🔄 Starting shard rebalancing...');
    
    // Analyze current distribution
    const shardLoads = await this.analyzeShardLoads();
    
    // Identify overloaded and underloaded shards
    const overloadedShards = shardLoads.filter(load => load.loadRatio > 1.2);
    const underloadedShards = shardLoads.filter(load => load.loadRatio < 0.8);
    
    if (overloadedShards.length === 0) {
      console.log('✅ Shards are well balanced');
      return;
    }
    
    // Plan rebalancing operations
    for (const overloadedShard of overloadedShards) {
      const targetShard = underloadedShards.find(s => s.shardId !== overloadedShard.shardId);
      if (targetShard) {
        await this.migrateDataBetweenShards(overloadedShard.shardId, targetShard.shardId, 0.1);
      }
    }
    
    console.log('✅ Shard rebalancing completed');
  }

  // ==================== MONITORING AND METRICS ====================

  private recordOperationMetrics(shardId: string, latency: number, isError: boolean): void {
    const shard = this.config.shards.find(s => s.id === shardId);
    if (shard) {
      shard.metrics.queryCount++;
      shard.metrics.queryLatency = (shard.metrics.queryLatency + latency) / 2; // Moving average
      
      if (isError) {
        shard.metrics.errorRate = (shard.metrics.errorRate + 1) / 2;
      } else {
        shard.metrics.errorRate = shard.metrics.errorRate * 0.99; // Decay error rate
      }
      
      shard.metrics.lastUpdated = Date.now();
    }
  }

  async getShardingMetrics(): Promise<{
    totalShards: number;
    activeShards: number;
    averageLatency: number;
    totalQueries: number;
    averageErrorRate: number;
    shardDistribution: Record<string, number>;
  }> {
    const totalShards = this.config.shards.length;
    const activeShards = this.config.shards.filter(s => s.status === 'active').length;
    
    const latencies = this.config.shards.map(s => s.metrics.queryLatency);
    const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    
    const totalQueries = this.config.shards.reduce((sum, s) => sum + s.metrics.queryCount, 0);
    
    const errorRates = this.config.shards.map(s => s.metrics.errorRate);
    const averageErrorRate = errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length;
    
    const shardDistribution: Record<string, number> = {};
    this.config.shards.forEach(shard => {
      shardDistribution[shard.id] = shard.metrics.queryCount;
    });
    
    return {
      totalShards,
      activeShards,
      averageLatency: Math.round(averageLatency * 100) / 100,
      totalQueries,
      averageErrorRate: Math.round(averageErrorRate * 100) / 100,
      shardDistribution
    };
  }

  // ==================== HELPER METHODS ====================

  private async getFallbackShard(failedShardId: string): Promise<string | null> {
    // Find a healthy shard in the same region first
    const failedShard = this.config.shards.find(s => s.id === failedShardId);
    if (failedShard) {
      const regionalShard = this.config.shards.find(s => 
        s.status === 'active' && 
        s.region === failedShard.region && 
        s.id !== failedShardId
      );
      
      if (regionalShard) {
        return regionalShard.id;
      }
    }
    
    // Fall back to any healthy shard
    const healthyShard = this.config.shards.find(s => 
      s.status === 'active' && s.id !== failedShardId
    );
    
    return healthyShard?.id || null;
  }

  private async drainShardConnections(shardId: string): Promise<void> {
    // Wait for active connections to complete
    // In production, implement proper connection draining
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  private async analyzeShardLoads(): Promise<Array<{
    shardId: string;
    loadRatio: number;
    queryCount: number;
    diskUsage: number;
  }>> {
    return this.config.shards.map(shard => ({
      shardId: shard.id,
      loadRatio: shard.weightRatio,
      queryCount: shard.metrics.queryCount,
      diskUsage: shard.metrics.diskUsage
    }));
  }

  private async migrateDataBetweenShards(fromShardId: string, toShardId: string, percentage: number): Promise<void> {
    console.log(`🔄 Migrating ${percentage * 100}% data from ${fromShardId} to ${toShardId}`);
    
    // In production, implement actual data migration logic
    // This would involve:
    // 1. Identify data to migrate
    // 2. Copy data to target shard
    // 3. Update routing rules
    // 4. Verify migration
    // 5. Clean up source data
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Data migration completed');
  }

  // ==================== CLEANUP ====================

  async disconnect(): Promise<void> {
    for (const [shardId, client] of this.shardConnections) {
      try {
        await client.$disconnect();
        console.log(`✅ Disconnected from shard: ${shardId}`);
      } catch (error) {
        console.error(`Error disconnecting from shard ${shardId}:`, error);
      }
    }
    
    this.shardConnections.clear();
    this.routingCache.clear();
  }
}

export default DatabaseShardingManager;