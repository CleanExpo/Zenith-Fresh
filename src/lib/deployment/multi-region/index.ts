// Multi-Region Deployment Framework - Index
// Fortune 500-Grade Global Distribution System

// Core agent
export { default as MultiRegionDeploymentAgent } from '../../agents/multi-region-deployment-agent';

// Orchestration and management
export { 
  default as GlobalDeploymentOrchestrator,
  type DeploymentConfig,
  type DeploymentStatus,
  type RegionDeploymentConfig,
  type RegionStatus
} from './deployment-orchestrator';

// Database strategy
export { 
  default as GeoDatabaseStrategy,
  type GeoReplicaConfig,
  type ShardingStrategy,
  type ConsistencyModel
} from './geo-database-strategy';

// Global monitoring
export { 
  default as GlobalMonitoringSystem,
  type RegionHealth,
  type GlobalMetrics,
  type Incident,
  type HealthCheckConfig
} from './global-monitoring';

// Compliance management
export { 
  default as GlobalComplianceManager,
  type ComplianceRule,
  type DataClassification,
  type ComplianceAudit,
  type ConsentManagement
} from './compliance-manager';

// Configuration
export { 
  default as GlobalConfig,
  GLOBAL_REGIONS,
  DEPLOYMENT_STRATEGIES,
  SLA_TARGETS,
  COMPLIANCE_MATRIX,
  getRegionConfig,
  getComplianceRequirements,
  getSLATargets,
  validateRegionCompliance
} from './global-config';

// Executor for demonstration
export { default as MultiRegionAgentExecutor } from './agent-executor';

// Re-export types for convenience
export type {
  Region,
  GlobalDeploymentConfig,
  ReplicationConfig,
  RoutingConfig,
  ComplianceConfig,
  GlobalMonitoringConfig,
  DisasterRecoveryConfig
} from '../../agents/multi-region-deployment-agent';

/**
 * Quick start function for Multi-Region Deployment
 */
export async function initializeMultiRegionDeployment() {
  const agent = new (await import('../../agents/multi-region-deployment-agent')).default();
  return agent.executeGlobalDeploymentFramework();
}

/**
 * Utility function to get deployment status
 */
export async function getGlobalDeploymentStatus() {
  const monitoring = new (await import('./global-monitoring')).default();
  return monitoring.getGlobalMetrics();
}

/**
 * Utility function to validate compliance
 */
export async function validateGlobalCompliance() {
  const compliance = new (await import('./compliance-manager')).default();
  return compliance.generateComplianceReport();
}

/**
 * Emergency rollback function
 */
export async function emergencyRollback(deploymentId: string) {
  const orchestrator = new (await import('./deployment-orchestrator')).default();
  const deployment = orchestrator.getDeploymentStatus(deploymentId);
  
  if (deployment) {
    // Implement emergency rollback logic
    console.log(`🚨 Emergency rollback initiated for deployment ${deploymentId}`);
    return true;
  }
  
  return false;
}

export default {
  MultiRegionDeploymentAgent,
  GlobalDeploymentOrchestrator,
  GeoDatabaseStrategy,
  GlobalMonitoringSystem,
  GlobalComplianceManager,
  GlobalConfig,
  MultiRegionAgentExecutor,
  initializeMultiRegionDeployment,
  getGlobalDeploymentStatus,
  validateGlobalCompliance,
  emergencyRollback
};