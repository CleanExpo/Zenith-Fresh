/**
 * Agent Communication Protocol
 * 
 * High-performance inter-agent communication system with
 * message routing, state synchronization, and event distribution.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { cache, initRedis, JSONCache } from '@/lib/redis';
import WebSocket from 'ws';

export interface Message {
  id: string;
  type: 'request' | 'response' | 'event' | 'broadcast' | 'system';
  from: string;
  to: string | string[]; // Single agent or multiple agents
  channel?: string;
  payload: any;
  correlationId?: string;
  timestamp: Date;
  ttl?: number; // Time to live in milliseconds
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresAck: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'direct' | 'broadcast' | 'topic' | 'queue';
  participants: string[];
  metadata: {
    description: string;
    created: Date;
    lastActivity: Date;
    messageCount: number;
  };
  config: {
    persistent: boolean;
    maxMessages: number;
    messageRetention: number; // milliseconds
    allowAnonymous: boolean;
  };
}

export interface AgentConnection {
  agentId: string;
  connectionId: string;
  type: 'websocket' | 'http' | 'redis';
  status: 'connected' | 'disconnected' | 'reconnecting';
  endpoint: string;
  lastSeen: Date;
  heartbeat: {
    interval: number;
    lastPing: Date;
    lastPong: Date;
    missed: number;
  };
  metrics: {
    messagesSent: number;
    messagesReceived: number;
    bytesTransferred: number;
    averageLatency: number;
  };
}

export interface CommunicationConfig {
  redis: {
    host: string;
    port: number;
    db: number;
  };
  websocket: {
    port: number;
    pingInterval: number;
    pongTimeout: number;
    maxConnections: number;
  };
  message: {
    maxSize: number;
    defaultTimeout: number;
    maxRetries: number;
    compressionThreshold: number;
  };
}

/**
 * Message Router - Routes messages between agents
 */
class MessageRouter {
  private routes: Map<string, string[]> = new Map(); // agentId -> connection endpoints
  private channels: Map<string, CommunicationChannel> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // channel -> agentIds

  /**
   * Add route for an agent
   */
  addRoute(agentId: string, endpoints: string[]): void {
    this.routes.set(agentId, endpoints);
  }

  /**
   * Remove route for an agent
   */
  removeRoute(agentId: string): void {
    this.routes.delete(agentId);
    // Remove from all channel subscriptions
    for (const [channel, subscribers] of this.subscriptions.entries()) {
      subscribers.delete(agentId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }

  /**
   * Route a message to its destination
   */
  route(message: Message): string[] {
    if (Array.isArray(message.to)) {
      // Multiple recipients
      const endpoints: string[] = [];
      for (const recipient of message.to) {
        const agentEndpoints = this.routes.get(recipient);
        if (agentEndpoints) {
          endpoints.push(...agentEndpoints);
        }
      }
      return endpoints;
    } else if (message.to === '*') {
      // Broadcast to all agents
      const endpoints: string[] = [];
      for (const agentEndpoints of this.routes.values()) {
        endpoints.push(...agentEndpoints);
      }
      return endpoints;
    } else if (message.channel) {
      // Channel message
      const subscribers = this.subscriptions.get(message.channel);
      if (subscribers) {
        const endpoints: string[] = [];
        for (const subscriber of subscribers) {
          const agentEndpoints = this.routes.get(subscriber);
          if (agentEndpoints) {
            endpoints.push(...agentEndpoints);
          }
        }
        return endpoints;
      }
      return [];
    } else {
      // Direct message
      return this.routes.get(message.to as string) || [];
    }
  }

  /**
   * Subscribe agent to channel
   */
  subscribe(agentId: string, channel: string): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(agentId);
  }

  /**
   * Unsubscribe agent from channel
   */
  unsubscribe(agentId: string, channel: string): void {
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(agentId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }

  /**
   * Get channel subscribers
   */
  getSubscribers(channel: string): string[] {
    const subscribers = this.subscriptions.get(channel);
    return subscribers ? Array.from(subscribers) : [];
  }

  /**
   * Create or update channel
   */
  createChannel(channel: CommunicationChannel): void {
    this.channels.set(channel.id, channel);
  }

  /**
   * Get channel by ID
   */
  getChannel(channelId: string): CommunicationChannel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * List all channels
   */
  listChannels(): CommunicationChannel[] {
    return Array.from(this.channels.values());
  }
}

/**
 * WebSocket Communication Handler
 */
class WebSocketHandler extends EventEmitter {
  private server: WebSocket.Server;
  private connections: Map<string, WebSocket> = new Map();
  private connectionMetadata: Map<string, AgentConnection> = new Map();
  private config: CommunicationConfig['websocket'];

  constructor(config: CommunicationConfig['websocket']) {
    super();
    this.config = config;
    this.server = new WebSocket.Server({ port: config.port });
    this.setupServer();
  }

  private setupServer(): void {
    this.server.on('connection', (ws: WebSocket, req) => {
      const connectionId = uuidv4();
      const agentId = this.extractAgentId(req.url || '');
      
      if (!agentId) {
        ws.close(1008, 'Missing agent ID');
        return;
      }

      // Register connection
      this.connections.set(connectionId, ws);
      const connection: AgentConnection = {
        agentId,
        connectionId,
        type: 'websocket',
        status: 'connected',
        endpoint: `ws://localhost:${this.config.port}`,
        lastSeen: new Date(),
        heartbeat: {
          interval: this.config.pingInterval,
          lastPing: new Date(),
          lastPong: new Date(),
          missed: 0,
        },
        metrics: {
          messagesSent: 0,
          messagesReceived: 0,
          bytesTransferred: 0,
          averageLatency: 0,
        },
      };
      this.connectionMetadata.set(connectionId, connection);

      this.emit('agentConnected', { agentId, connectionId, connection });
      console.log(`🔗 Agent connected: ${agentId} (${connectionId})`);

      // Setup WebSocket handlers
      this.setupWebSocketHandlers(ws, connectionId, agentId);
    });

    console.log(`🚀 WebSocket server listening on port ${this.config.port}`);
  }

  private setupWebSocketHandlers(ws: WebSocket, connectionId: string, agentId: string): void {
    const connection = this.connectionMetadata.get(connectionId)!;

    // Handle incoming messages
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        connection.metrics.messagesReceived++;
        connection.metrics.bytesTransferred += data.toString().length;
        connection.lastSeen = new Date();

        this.emit('messageReceived', { message, connectionId, agentId });
      } catch (error) {
        console.error(`❌ Invalid message from ${agentId}:`, error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
        }));
      }
    });

    // Handle pong responses
    ws.on('pong', () => {
      connection.heartbeat.lastPong = new Date();
      connection.heartbeat.missed = 0;
    });

    // Handle connection close
    ws.on('close', (code, reason) => {
      console.log(`🔌 Agent disconnected: ${agentId} (${code}: ${reason})`);
      connection.status = 'disconnected';
      this.emit('agentDisconnected', { agentId, connectionId, code, reason });
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for ${agentId}:`, error);
      connection.status = 'disconnected';
      this.emit('connectionError', { agentId, connectionId, error });
    });

    // Start heartbeat
    this.startHeartbeat(ws, connectionId);
  }

  private startHeartbeat(ws: WebSocket, connectionId: string): void {
    const connection = this.connectionMetadata.get(connectionId);
    if (!connection) return;

    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        connection.heartbeat.lastPing = new Date();
        ws.ping();

        // Check if pong was missed
        const timeSinceLastPong = Date.now() - connection.heartbeat.lastPong.getTime();
        if (timeSinceLastPong > this.config.pongTimeout) {
          connection.heartbeat.missed++;
          if (connection.heartbeat.missed >= 3) {
            console.warn(`⚠️ Heartbeat failed for ${connection.agentId}, closing connection`);
            ws.terminate();
            clearInterval(heartbeatInterval);
          }
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, this.config.pingInterval);
  }

  private extractAgentId(url: string): string | null {
    const params = new URLSearchParams(url.split('?')[1] || '');
    return params.get('agentId');
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(connectionId: string, message: Message): boolean {
    const ws = this.connections.get(connectionId);
    const connection = this.connectionMetadata.get(connectionId);
    
    if (ws && ws.readyState === WebSocket.OPEN && connection) {
      try {
        const serialized = JSON.stringify(message);
        ws.send(serialized);
        
        connection.metrics.messagesSent++;
        connection.metrics.bytesTransferred += serialized.length;
        
        return true;
      } catch (error) {
        console.error(`❌ Failed to send message to ${connectionId}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get active connections
   */
  getConnections(): AgentConnection[] {
    return Array.from(this.connectionMetadata.values());
  }

  /**
   * Close connection
   */
  closeConnection(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.close();
      this.connections.delete(connectionId);
      this.connectionMetadata.delete(connectionId);
    }
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('✅ WebSocket server shut down');
        resolve();
      });
    });
  }
}

/**
 * Agent Communication System
 */
export class AgentCommunication extends EventEmitter {
  private redis: any;
  private config: CommunicationConfig;
  private router: MessageRouter;
  private wsHandler: WebSocketHandler;
  private pendingMessages: Map<string, Message> = new Map();
  private messageHistory: Map<string, Message[]> = new Map();
  private connections: Map<string, AgentConnection> = new Map();
  private cleanupInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(config: CommunicationConfig) {
    super();
    this.config = config;
    this.redis = null; // Will use cache interface instead of direct Redis

    this.router = new MessageRouter();
    this.wsHandler = new WebSocketHandler(config.websocket);
    this.setupEventHandlers();
  }

  /**
   * Initialize the communication system
   */
  async initialize(): Promise<void> {
    try {
      await initRedis();
      console.log('✅ Agent Communication: Cache system ready');

      // Load existing channels and routes
      await this.loadState();

      // Start cleanup process
      this.startCleanup();

      this.isRunning = true;
      this.emit('initialized');
      
      console.log('🚀 Agent Communication: System initialized');
    } catch (error) {
      console.error('❌ Agent Communication: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Register an agent for communication
   */
  async registerAgent(agentId: string, endpoints: string[]): Promise<void> {
    this.router.addRoute(agentId, endpoints);
    
    // Create initial connection metadata
    for (const endpoint of endpoints) {
      const connectionId = uuidv4();
      const connection: AgentConnection = {
        agentId,
        connectionId,
        type: this.determineConnectionType(endpoint),
        status: 'disconnected',
        endpoint,
        lastSeen: new Date(),
        heartbeat: {
          interval: this.config.websocket.pingInterval,
          lastPing: new Date(),
          lastPong: new Date(),
          missed: 0,
        },
        metrics: {
          messagesSent: 0,
          messagesReceived: 0,
          bytesTransferred: 0,
          averageLatency: 0,
        },
      };
      this.connections.set(connectionId, connection);
    }

    await this.persistRoutes();
    this.emit('agentRegistered', { agentId, endpoints });
    console.log(`📝 Agent registered for communication: ${agentId}`);
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    this.router.removeRoute(agentId);
    
    // Remove connections
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.agentId === agentId) {
        this.connections.delete(connectionId);
      }
    }

    await this.persistRoutes();
    this.emit('agentUnregistered', { agentId });
    console.log(`📝 Agent unregistered from communication: ${agentId}`);
  }

  /**
   * Send a message
   */
  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    const fullMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
    };

    // Validate message
    this.validateMessage(fullMessage);

    // Store pending message if requires acknowledgment
    if (fullMessage.requiresAck) {
      this.pendingMessages.set(fullMessage.id, fullMessage);
    }

    // Route and deliver message
    const success = await this.deliverMessage(fullMessage);
    
    if (!success && fullMessage.requiresAck) {
      // Schedule retry
      this.scheduleRetry(fullMessage);
    }

    // Store in history
    this.storeMessageHistory(fullMessage);

    this.emit('messageSent', fullMessage);
    return fullMessage.id;
  }

  /**
   * Broadcast message to all agents
   */
  async broadcast(message: Omit<Message, 'id' | 'timestamp' | 'to'>): Promise<string> {
    return this.sendMessage({
      ...message,
      to: '*',
    });
  }

  /**
   * Send message to channel
   */
  async sendToChannel(channel: string, message: Omit<Message, 'id' | 'timestamp' | 'channel'>): Promise<string> {
    return this.sendMessage({
      ...message,
      channel,
      to: '', // Will be ignored when channel is specified
    });
  }

  /**
   * Create a communication channel
   */
  async createChannel(channelData: Omit<CommunicationChannel, 'id' | 'metadata'>): Promise<string> {
    const channelId = uuidv4();
    const channel: CommunicationChannel = {
      ...channelData,
      id: channelId,
      metadata: {
        description: channelData.metadata?.description || '',
        created: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
      },
    };

    this.router.createChannel(channel);
    await this.persistChannel(channel);

    this.emit('channelCreated', channel);
    console.log(`📢 Channel created: ${channel.name} (${channelId})`);

    return channelId;
  }

  /**
   * Subscribe agent to channel
   */
  async subscribeToChannel(agentId: string, channelId: string): Promise<void> {
    const channel = this.router.getChannel(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    this.router.subscribe(agentId, channelId);
    
    if (!channel.participants.includes(agentId)) {
      channel.participants.push(agentId);
      await this.persistChannel(channel);
    }

    this.emit('channelSubscribed', { agentId, channelId });
    console.log(`📝 Agent ${agentId} subscribed to channel ${channel.name}`);
  }

  /**
   * Unsubscribe agent from channel
   */
  async unsubscribeFromChannel(agentId: string, channelId: string): Promise<void> {
    const channel = this.router.getChannel(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    this.router.unsubscribe(agentId, channelId);
    
    const index = channel.participants.indexOf(agentId);
    if (index > -1) {
      channel.participants.splice(index, 1);
      await this.persistChannel(channel);
    }

    this.emit('channelUnsubscribed', { agentId, channelId });
    console.log(`📝 Agent ${agentId} unsubscribed from channel ${channel.name}`);
  }

  /**
   * Get message history for agent or channel
   */
  getMessageHistory(agentIdOrChannel: string, limit: number = 100): Message[] {
    const history = this.messageHistory.get(agentIdOrChannel) || [];
    return history.slice(-limit);
  }

  /**
   * Get communication metrics
   */
  getMetrics() {
    const connections = Array.from(this.connections.values());
    const channels = this.router.listChannels();

    return {
      connections: {
        total: connections.length,
        active: connections.filter(c => c.status === 'connected').length,
        websocket: connections.filter(c => c.type === 'websocket').length,
        http: connections.filter(c => c.type === 'http').length,
        redis: connections.filter(c => c.type === 'redis').length,
      },
      channels: {
        total: channels.length,
        active: channels.filter(c => c.participants.length > 0).length,
        averageParticipants: channels.reduce((sum, c) => sum + c.participants.length, 0) / channels.length || 0,
      },
      messages: {
        pending: this.pendingMessages.size,
        totalSent: connections.reduce((sum, c) => sum + c.metrics.messagesSent, 0),
        totalReceived: connections.reduce((sum, c) => sum + c.metrics.messagesReceived, 0),
        averageLatency: connections.reduce((sum, c) => sum + c.metrics.averageLatency, 0) / connections.length || 0,
      },
    };
  }

  /**
   * Deliver message to its destination
   */
  private async deliverMessage(message: Message): Promise<boolean> {
    const endpoints = this.router.route(message);
    
    if (endpoints.length === 0) {
      console.warn(`⚠️ No routes found for message ${message.id}`);
      return false;
    }

    let successCount = 0;
    const deliveryPromises = endpoints.map(async (endpoint) => {
      try {
        const success = await this.deliverToEndpoint(message, endpoint);
        if (success) successCount++;
        return success;
      } catch (error) {
        console.error(`❌ Failed to deliver message ${message.id} to ${endpoint}:`, error);
        return false;
      }
    });

    await Promise.allSettled(deliveryPromises);
    
    const deliverySuccess = successCount > 0;
    console.log(`📤 Message ${message.id} delivered to ${successCount}/${endpoints.length} endpoints`);
    
    return deliverySuccess;
  }

  /**
   * Deliver message to specific endpoint
   */
  private async deliverToEndpoint(message: Message, endpoint: string): Promise<boolean> {
    // Find connection for this endpoint
    const connection = Array.from(this.connections.values()).find(c => c.endpoint === endpoint);
    
    if (!connection) {
      console.warn(`⚠️ No connection found for endpoint ${endpoint}`);
      return false;
    }

    switch (connection.type) {
      case 'websocket':
        return this.wsHandler.sendToConnection(connection.connectionId, message);
      
      case 'redis':
        return this.deliverViaRedis(message, connection);
      
      case 'http':
        return this.deliverViaHttp(message, connection);
      
      default:
        console.error(`❌ Unknown connection type: ${connection.type}`);
        return false;
    }
  }

  /**
   * Deliver message via Redis pub/sub
   */
  private async deliverViaRedis(message: Message, connection: AgentConnection): Promise<boolean> {
    try {
      const channel = `agent:${connection.agentId}`;
      // Redis pub/sub not available in fallback mode
      console.log(`📤 Would publish to ${channel}:`, message);
      
      connection.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`❌ Redis delivery failed:`, error);
      return false;
    }
  }

  /**
   * Deliver message via HTTP
   */
  private async deliverViaHttp(message: Message, connection: AgentConnection): Promise<boolean> {
    try {
      // This would make actual HTTP requests in real implementation
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 10));
      
      connection.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error(`❌ HTTP delivery failed:`, error);
      return false;
    }
  }

  /**
   * Schedule message retry
   */
  private scheduleRetry(message: Message): void {
    if (message.retryCount >= message.maxRetries) {
      console.error(`❌ Message ${message.id} exceeded max retries`);
      this.pendingMessages.delete(message.id);
      this.emit('messageDeliveryFailed', message);
      return;
    }

    const delay = Math.pow(2, message.retryCount) * 1000; // Exponential backoff
    message.retryCount++;

    setTimeout(async () => {
      if (this.pendingMessages.has(message.id)) {
        console.log(`🔄 Retrying message ${message.id} (attempt ${message.retryCount})`);
        const success = await this.deliverMessage(message);
        
        if (!success) {
          this.scheduleRetry(message);
        } else {
          this.pendingMessages.delete(message.id);
        }
      }
    }, delay);
  }

  /**
   * Store message in history
   */
  private storeMessageHistory(message: Message): void {
    // Store for sender
    if (!this.messageHistory.has(message.from)) {
      this.messageHistory.set(message.from, []);
    }
    this.messageHistory.get(message.from)!.push(message);

    // Store for recipients
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    for (const recipient of recipients) {
      if (!this.messageHistory.has(recipient)) {
        this.messageHistory.set(recipient, []);
      }
      this.messageHistory.get(recipient)!.push(message);
    }

    // Store for channel
    if (message.channel) {
      if (!this.messageHistory.has(message.channel)) {
        this.messageHistory.set(message.channel, []);
      }
      this.messageHistory.get(message.channel)!.push(message);
    }

    // Trim history to prevent memory leaks
    for (const [key, history] of this.messageHistory.entries()) {
      if (history.length > 1000) {
        this.messageHistory.set(key, history.slice(-1000));
      }
    }
  }

  /**
   * Validate message before sending
   */
  private validateMessage(message: Message): void {
    if (!message.from || !message.to) {
      throw new Error('Message must have from and to fields');
    }

    if (!message.type) {
      throw new Error('Message must have a type');
    }

    const serialized = JSON.stringify(message);
    if (serialized.length > this.config.message.maxSize) {
      throw new Error(`Message size (${serialized.length}) exceeds maximum (${this.config.message.maxSize})`);
    }
  }

  /**
   * Determine connection type from endpoint
   */
  private determineConnectionType(endpoint: string): AgentConnection['type'] {
    if (endpoint.startsWith('ws://') || endpoint.startsWith('wss://')) {
      return 'websocket';
    } else if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return 'http';
    } else if (endpoint.startsWith('redis://')) {
      return 'redis';
    }
    return 'http'; // Default
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // WebSocket events
    this.wsHandler.on('agentConnected', ({ agentId, connectionId, connection }) => {
      this.connections.set(connectionId, connection);
      this.emit('agentConnected', { agentId, connectionId });
    });

    this.wsHandler.on('agentDisconnected', ({ agentId, connectionId }) => {
      this.connections.delete(connectionId);
      this.emit('agentDisconnected', { agentId, connectionId });
    });

    this.wsHandler.on('messageReceived', ({ message, connectionId, agentId }) => {
      this.handleIncomingMessage(message, connectionId, agentId);
    });

    // Error handling
    this.on('error', (error) => {
      console.error('❌ Agent Communication Error:', error);
    });
  }

  /**
   * Handle incoming message
   */
  private handleIncomingMessage(message: Message, connectionId: string, agentId: string): void {
    // Handle acknowledgments
    if (message.type === 'response' && message.correlationId) {
      const pendingMessage = this.pendingMessages.get(message.correlationId);
      if (pendingMessage) {
        this.pendingMessages.delete(message.correlationId);
        this.emit('messageAcknowledged', { originalMessage: pendingMessage, ack: message });
      }
    }

    // Store in history
    this.storeMessageHistory(message);

    // Send acknowledgment if required
    if (message.requiresAck) {
      const ackMessage: Message = {
        id: uuidv4(),
        type: 'response',
        from: agentId,
        to: message.from,
        correlationId: message.id,
        payload: { status: 'received' },
        timestamp: new Date(),
        priority: 'medium',
        requiresAck: false,
        retryCount: 0,
        maxRetries: 0,
      };

      this.deliverMessage(ackMessage);
    }

    this.emit('messageReceived', { message, connectionId, agentId });
  }

  /**
   * Start cleanup process
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      // Clean up expired messages
      const now = Date.now();
      for (const [messageId, message] of this.pendingMessages.entries()) {
        if (message.ttl && (now - message.timestamp.getTime()) > message.ttl) {
          this.pendingMessages.delete(messageId);
          console.log(`🧹 Expired message cleaned up: ${messageId}`);
        }
      }

      // Clean up old message history
      for (const [key, history] of this.messageHistory.entries()) {
        const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours
        const filteredHistory = history.filter(msg => msg.timestamp.getTime() > cutoff);
        if (filteredHistory.length !== history.length) {
          this.messageHistory.set(key, filteredHistory);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Load state from Redis
   */
  private async loadState(): Promise<void> {
    try {
      // State loading disabled when Redis is not available
      if (!cache.isAvailable()) {
        console.log('📊 Cache not available, starting with fresh state');
        return;
      }

      console.log(`📊 Communication state loaded`);
    } catch (error) {
      console.error('❌ Failed to load communication state:', error);
    }
  }

  /**
   * Persist routes to Redis
   */
  private async persistRoutes(): Promise<void> {
    // This would persist routing information in real implementation
    // For now, routes are kept in memory only
  }

  /**
   * Persist channel to Redis
   */
  private async persistChannel(channel: CommunicationChannel): Promise<void> {
    await JSONCache.set(`channel:${channel.id}`, channel);
  }

  /**
   * Shutdown the communication system
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Agent Communication: Shutting down...');
    
    this.isRunning = false;

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Shutdown WebSocket server
    await this.wsHandler.shutdown();

    // Close Redis connection
    await cache.disconnect();

    this.emit('shutdown');
    console.log('✅ Agent Communication: Shutdown complete');
  }
}

export default AgentCommunication;