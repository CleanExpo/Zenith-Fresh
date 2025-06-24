/**
 * Auto-Scaling System for Zenith-Fresh
 * Implements predictive scaling based on traffic patterns and system load
 */

// Node.js fetch polyfill for compatibility
const fetch = globalThis.fetch || require('node-fetch');

class AutoScaler {
  constructor(options = {}) {
    this.minInstances = options.minInstances || 1;
    this.maxInstances = options.maxInstances || 10;
    this.targetCpuUtilization = options.targetCpuUtilization || 0.7;
    this.targetMemoryUtilization = options.targetMemoryUtilization || 0.8;
    this.scaleUpCooldown = options.scaleUpCooldown || 300000; // 5 minutes
    this.scaleDownCooldown = options.scaleDownCooldown || 600000; // 10 minutes
    this.predictionWindow = options.predictionWindow || 900000; // 15 minutes
    
    this.currentInstances = this.minInstances;
    this.lastScaleAction = 0;
    this.metricsHistory = [];
    this.trafficPredictions = [];
    
    // Store interval IDs for cleanup
    this.evaluationInterval = null;
    this.metricsInterval = null;
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Collect system metrics
   */
  async collectMetrics() {
    try {
      // In production, integrate with actual monitoring APIs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/system-monitor?endpoint=metrics', {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Zenith-Fresh-AutoScaler/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const metrics = await response.json();
      
      const timestamp = Date.now();
      const metricData = {
        timestamp,
        cpuLoad: this.validateMetric(metrics.resources?.cpuLoad, 0, 1, 0),
        memoryUsage: this.validateMetric(metrics.resources?.memoryUsage, 0, 1, 0),
        activeConnections: this.validateMetric(metrics.resources?.activeConnections, 0, 10000, 0),
        requestRate: this.validateMetric(metrics.requests?.rate, 0, 1000, 0),
        errorRate: this.validateMetric(metrics.performance?.errorRate, 0, 1, 0),
        responseTime: this.validateMetric(metrics.performance?.averageResponseTime, 0, 10000, 0)
      };
      
      this.metricsHistory.push(metricData);
      
      // Keep only last 24 hours of data to prevent memory leaks
      const dayAgo = timestamp - (24 * 60 * 60 * 1000);
      this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > dayAgo);
      
      // Additional safeguard: limit to max 2880 entries (30-second intervals for 24 hours)
      if (this.metricsHistory.length > 2880) {
        this.metricsHistory = this.metricsHistory.slice(-2880);
      }
      
      return metricData;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Metrics collection timeout - using defaults');
      } else {
        console.error('Failed to collect metrics:', error.message);
      }
      return this.getDefaultMetrics();
    }
  }

  /**
   * Validate and sanitize metric values
   */
  validateMetric(value, min, max, defaultValue) {
    if (typeof value !== 'number' || isNaN(value)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Get default metrics when monitoring fails
   */
  getDefaultMetrics() {
    return {
      timestamp: Date.now(),
      cpuLoad: 0.3,
      memoryUsage: 0.4,
      activeConnections: 50,
      requestRate: 10,
      errorRate: 0,
      responseTime: 200
    };
  }

  /**
   * Predict future traffic based on historical patterns
   */
  predictTraffic(futureMinutes = 15) {
    if (this.metricsHistory.length < 10) {
      return this.getCurrentLoad();
    }
    
    const now = Date.now();
    const currentHour = new Date(now).getHours();
    const currentDay = new Date(now).getDay();
    
    // Get historical data for same time periods
    const similarPeriods = this.metricsHistory.filter(m => {
      const date = new Date(m.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      
      // Same hour of day, same day of week (if enough data)
      return Math.abs(hour - currentHour) <= 1 && 
             (this.metricsHistory.length > 1000 ? day === currentDay : true);
    });
    
    if (similarPeriods.length === 0) {
      return this.getCurrentLoad();
    }
    
    // Calculate average load for similar periods
    const avgCpu = similarPeriods.reduce((sum, m) => sum + m.cpuLoad, 0) / similarPeriods.length;
    const avgMemory = similarPeriods.reduce((sum, m) => sum + m.memoryUsage, 0) / similarPeriods.length;
    const avgConnections = similarPeriods.reduce((sum, m) => sum + m.activeConnections, 0) / similarPeriods.length;
    
    // Apply trending factor
    const recentTrend = this.calculateTrend();
    
    return {
      predictedCpu: Math.min(1, avgCpu * (1 + recentTrend)),
      predictedMemory: Math.min(1, avgMemory * (1 + recentTrend)),
      predictedConnections: Math.max(0, avgConnections * (1 + recentTrend)),
      confidence: Math.min(0.9, similarPeriods.length / 100) // Higher confidence with more data
    };
  }

  /**
   * Calculate recent trend in metrics
   */
  calculateTrend() {
    const recentMetrics = this.metricsHistory.slice(-12); // Last 12 data points
    if (recentMetrics.length < 6) return 0;
    
    const mid = Math.floor(recentMetrics.length / 2);
    const firstHalf = recentMetrics.slice(0, mid);
    const secondHalf = recentMetrics.slice(mid);
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.cpuLoad + m.memoryUsage, 0) / (firstHalf.length * 2);
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.cpuLoad + m.memoryUsage, 0) / (secondHalf.length * 2);
    
    return (secondAvg - firstAvg) / firstAvg;
  }

  /**
   * Get current system load
   */
  getCurrentLoad() {
    if (this.metricsHistory.length === 0) {
      return { predictedCpu: 0.3, predictedMemory: 0.4, predictedConnections: 50, confidence: 0.1 };
    }
    
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    return {
      predictedCpu: latest.cpuLoad,
      predictedMemory: latest.memoryUsage,
      predictedConnections: latest.activeConnections,
      confidence: 0.8
    };
  }

  /**
   * Calculate optimal number of instances
   */
  calculateOptimalInstances(currentMetrics, prediction) {
    // Use higher of current load or predicted load for safety
    const cpuLoad = Math.max(currentMetrics.cpuLoad, prediction.predictedCpu);
    const memoryLoad = Math.max(currentMetrics.memoryUsage, prediction.predictedMemory);
    
    // Calculate instances needed based on CPU
    const cpuInstances = Math.ceil(cpuLoad / this.targetCpuUtilization);
    
    // Calculate instances needed based on memory
    const memoryInstances = Math.ceil(memoryLoad / this.targetMemoryUtilization);
    
    // Take the higher requirement
    let optimalInstances = Math.max(cpuInstances, memoryInstances);
    
    // Factor in request rate and connections
    const connectionFactor = Math.max(1, prediction.predictedConnections / 100);
    const requestFactor = Math.max(1, currentMetrics.requestRate / 50);
    
    optimalInstances = Math.ceil(optimalInstances * Math.max(connectionFactor, requestFactor));
    
    // Apply bounds
    optimalInstances = Math.max(this.minInstances, Math.min(this.maxInstances, optimalInstances));
    
    return optimalInstances;
  }

  /**
   * Check if scaling action is needed and allowed
   */
  shouldScale(targetInstances) {
    const now = Date.now();
    const timeSinceLastScale = now - this.lastScaleAction;
    
    if (targetInstances === this.currentInstances) {
      return { should: false, reason: 'Already at optimal size' };
    }
    
    if (targetInstances > this.currentInstances) {
      // Scale up
      if (timeSinceLastScale < this.scaleUpCooldown) {
        return { 
          should: false, 
          reason: `Scale up cooldown active (${Math.ceil((this.scaleUpCooldown - timeSinceLastScale) / 1000)}s remaining)` 
        };
      }
      return { should: true, action: 'scale-up', from: this.currentInstances, to: targetInstances };
    } else {
      // Scale down
      if (timeSinceLastScale < this.scaleDownCooldown) {
        return { 
          should: false, 
          reason: `Scale down cooldown active (${Math.ceil((this.scaleDownCooldown - timeSinceLastScale) / 1000)}s remaining)` 
        };
      }
      return { should: true, action: 'scale-down', from: this.currentInstances, to: targetInstances };
    }
  }

  /**
   * Execute scaling action
   */
  async executeScaling(targetInstances, action) {
    try {
      console.log(`🔄 Executing ${action}: ${this.currentInstances} -> ${targetInstances} instances`);
      
      // In production, integrate with Vercel, AWS, or other cloud providers
      const success = await this.simulateScaling(targetInstances, action);
      
      if (success) {
        this.currentInstances = targetInstances;
        this.lastScaleAction = Date.now();
        
        console.log(`✅ Scaling successful: Now running ${this.currentInstances} instances`);
        
        // Log scaling event
        this.logScalingEvent(action, targetInstances, 'success');
        
        return { success: true, instances: this.currentInstances };
      } else {
        console.error(`❌ Scaling failed: ${action}`);
        this.logScalingEvent(action, targetInstances, 'failed');
        
        return { success: false, error: 'Scaling operation failed' };
      }
      
    } catch (error) {
      console.error('Scaling execution error:', error);
      this.logScalingEvent(action, targetInstances, 'error', error.message);
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Simulate scaling operation (replace with actual cloud provider API)
   */
  async simulateScaling(targetInstances, action) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 95% success rate
    return Math.random() > 0.05;
  }

  /**
   * Log scaling events for audit and analysis
   */
  logScalingEvent(action, targetInstances, status, error = null) {
    const event = {
      timestamp: new Date().toISOString(),
      action,
      fromInstances: this.currentInstances,
      toInstances: targetInstances,
      status,
      error,
      trigger: 'auto-scaler'
    };
    
    console.log('Scaling event:', JSON.stringify(event));
    
    // In production, store in database or monitoring system
  }

  /**
   * Main scaling decision logic
   */
  async evaluateScaling() {
    try {
      // Collect current metrics
      const currentMetrics = await this.collectMetrics();
      
      // Predict future load
      const prediction = this.predictTraffic();
      
      // Calculate optimal instances
      const optimalInstances = this.calculateOptimalInstances(currentMetrics, prediction);
      
      // Check if scaling is needed and allowed
      const scalingDecision = this.shouldScale(optimalInstances);
      
      const evaluation = {
        timestamp: Date.now(),
        currentInstances: this.currentInstances,
        optimalInstances,
        currentMetrics,
        prediction,
        scalingDecision,
        recommendation: scalingDecision.should ? `${scalingDecision.action} recommended` : 'No scaling needed'
      };
      
      console.log('Scaling evaluation:', JSON.stringify(evaluation, null, 2));
      
      // Execute scaling if recommended
      if (scalingDecision.should) {
        const result = await this.executeScaling(optimalInstances, scalingDecision.action);
        evaluation.scalingResult = result;
      }
      
      return evaluation;
      
    } catch (error) {
      console.error('Scaling evaluation error:', error);
      return { error: error.message, timestamp: Date.now() };
    }
  }

  /**
   * Start continuous monitoring and scaling
   */
  startMonitoring() {
    console.log('🚀 Auto-scaler started');
    console.log(`📊 Configuration: ${this.minInstances}-${this.maxInstances} instances, target CPU: ${this.targetCpuUtilization * 100}%`);
    
    // Evaluate scaling every 2 minutes
    this.evaluationInterval = setInterval(() => {
      this.evaluateScaling().catch(error => {
        console.error('Scaling evaluation error:', error.message);
      });
    }, 120000);
    
    // Collect metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectMetrics().catch(error => {
        console.error('Metrics collection error:', error.message);
      });
    }, 30000);
  }

  /**
   * Stop monitoring and cleanup intervals
   */
  stopMonitoring() {
    console.log('🛑 Auto-scaler stopping');
    
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    console.log('✅ Auto-scaler stopped and cleaned up');
  }

  /**
   * Get current scaling status
   */
  getStatus() {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const prediction = this.predictTraffic();
    
    return {
      currentInstances: this.currentInstances,
      minInstances: this.minInstances,
      maxInstances: this.maxInstances,
      lastScaleAction: this.lastScaleAction ? new Date(this.lastScaleAction).toISOString() : null,
      currentMetrics: latestMetrics,
      prediction,
      isScalingAllowed: Date.now() - this.lastScaleAction > this.scaleUpCooldown,
      nextEvaluation: 'Every 2 minutes'
    };
  }

  /**
   * Manual scaling override
   */
  async manualScale(targetInstances, reason = 'Manual override') {
    if (targetInstances < this.minInstances || targetInstances > this.maxInstances) {
      throw new Error(`Instance count must be between ${this.minInstances} and ${this.maxInstances}`);
    }
    
    const action = targetInstances > this.currentInstances ? 'scale-up' : 'scale-down';
    console.log(`🔧 Manual scaling triggered: ${reason}`);
    
    const result = await this.executeScaling(targetInstances, action);
    result.trigger = 'manual';
    result.reason = reason;
    
    return result;
  }
}

module.exports = AutoScaler;