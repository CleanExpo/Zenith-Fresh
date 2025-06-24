// Global Configuration for Multi-Region Deployment
// Centralized configuration management for Fortune 500-grade deployment

export const GLOBAL_REGIONS = {
  'us-east-1': {
    name: 'North America East',
    code: 'USE1',
    continent: 'North America',
    country: 'United States',
    city: 'Virginia',
    timezone: 'America/New_York',
    compliance: ['SOC2', 'HIPAA', 'PCI-DSS', 'FedRAMP'],
    dataResidency: true,
    primary: true,
    endpoints: {
      api: 'https://use1-api.zenith.engineer',
      cdn: 'https://use1-cdn.zenith.engineer',
      websocket: 'wss://use1-ws.zenith.engineer',
      database: 'postgres://use1-db.zenith.engineer:5432/zenith'
    },
    infrastructure: {
      provider: 'aws',
      instanceType: 'c6i.2xlarge',
      minInstances: 3,
      maxInstances: 100,
      diskType: 'gp3',
      networkTier: 'premium'
    }
  },
  'us-west-2': {
    name: 'North America West',
    code: 'USW2',
    continent: 'North America',
    country: 'United States',
    city: 'Oregon',
    timezone: 'America/Los_Angeles',
    compliance: ['SOC2', 'CCPA', 'PCI-DSS'],
    dataResidency: true,
    primary: false,
    endpoints: {
      api: 'https://usw2-api.zenith.engineer',
      cdn: 'https://usw2-cdn.zenith.engineer',
      websocket: 'wss://usw2-ws.zenith.engineer',
      database: 'postgres://usw2-db.zenith.engineer:5432/zenith'
    },
    infrastructure: {
      provider: 'aws',
      instanceType: 'c6i.2xlarge',
      minInstances: 2,
      maxInstances: 80,
      diskType: 'gp3',
      networkTier: 'premium'
    }
  },
  'eu-west-1': {
    name: 'Europe West',
    code: 'EUW1',
    continent: 'Europe',
    country: 'Ireland',
    city: 'Dublin',
    timezone: 'Europe/Dublin',
    compliance: ['GDPR', 'SOC2', 'ISO-27001', 'TISAX'],
    dataResidency: true,
    primary: false,
    endpoints: {
      api: 'https://euw1-api.zenith.engineer',
      cdn: 'https://euw1-cdn.zenith.engineer',
      websocket: 'wss://euw1-ws.zenith.engineer',
      database: 'postgres://euw1-db.zenith.engineer:5432/zenith'
    },
    infrastructure: {
      provider: 'aws',
      instanceType: 'c6i.2xlarge',
      minInstances: 2,
      maxInstances: 60,
      diskType: 'gp3',
      networkTier: 'premium'
    }
  },
  'ap-southeast-1': {
    name: 'Asia Pacific Southeast',
    code: 'APSE1',
    continent: 'Asia',
    country: 'Singapore',
    city: 'Singapore',
    timezone: 'Asia/Singapore',
    compliance: ['SOC2', 'PDPA', 'ISO-27001', 'MAS'],
    dataResidency: true,
    primary: false,
    endpoints: {
      api: 'https://apse1-api.zenith.engineer',
      cdn: 'https://apse1-cdn.zenith.engineer',
      websocket: 'wss://apse1-ws.zenith.engineer',
      database: 'postgres://apse1-db.zenith.engineer:5432/zenith'
    },
    infrastructure: {
      provider: 'aws',
      instanceType: 'c6i.xlarge',
      minInstances: 2,
      maxInstances: 40,
      diskType: 'gp3',
      networkTier: 'premium'
    }
  },
  'ap-northeast-1': {
    name: 'Asia Pacific Northeast',
    code: 'APNE1',
    continent: 'Asia',
    country: 'Japan',
    city: 'Tokyo',
    timezone: 'Asia/Tokyo',
    compliance: ['SOC2', 'APPI', 'ISO-27001', 'FISC'],
    dataResidency: true,
    primary: false,
    endpoints: {
      api: 'https://apne1-api.zenith.engineer',
      cdn: 'https://apne1-cdn.zenith.engineer',
      websocket: 'wss://apne1-ws.zenith.engineer',
      database: 'postgres://apne1-db.zenith.engineer:5432/zenith'
    },
    infrastructure: {
      provider: 'aws',
      instanceType: 'c6i.xlarge',
      minInstances: 2,
      maxInstances: 40,
      diskType: 'gp3',
      networkTier: 'premium'
    }
  },
  'sa-east-1': {
    name: 'South America East',
    code: 'SAE1',
    continent: 'South America',
    country: 'Brazil',
    city: 'São Paulo',
    timezone: 'America/Sao_Paulo',
    compliance: ['SOC2', 'LGPD', 'BCB'],
    dataResidency: true,
    primary: false,
    endpoints: {
      api: 'https://sae1-api.zenith.engineer',
      cdn: 'https://sae1-cdn.zenith.engineer',
      websocket: 'wss://sae1-ws.zenith.engineer',
      database: 'postgres://sae1-db.zenith.engineer:5432/zenith'
    },
    infrastructure: {
      provider: 'aws',
      instanceType: 'c6i.large',
      minInstances: 1,
      maxInstances: 20,
      diskType: 'gp3',
      networkTier: 'standard'
    }
  },
  'me-south-1': {
    name: 'Middle East South',
    code: 'MES1',
    continent: 'Middle East',
    country: 'Bahrain',
    city: 'Manama',
    timezone: 'Asia/Bahrain',
    compliance: ['SOC2', 'PDPL', 'SAMA'],
    dataResidency: true,
    primary: false,
    endpoints: {
      api: 'https://mes1-api.zenith.engineer',
      cdn: 'https://mes1-cdn.zenith.engineer',
      websocket: 'wss://mes1-ws.zenith.engineer',
      database: 'postgres://mes1-db.zenith.engineer:5432/zenith'
    },
    infrastructure: {
      provider: 'aws',
      instanceType: 'c6i.large',
      minInstances: 1,
      maxInstances: 15,
      diskType: 'gp3',
      networkTier: 'standard'
    }
  },
  'af-south-1': {
    name: 'Africa South',
    code: 'AFS1',
    continent: 'Africa',
    country: 'South Africa',
    city: 'Cape Town',
    timezone: 'Africa/Johannesburg',
    compliance: ['SOC2', 'POPIA'],
    dataResidency: true,
    primary: false,
    endpoints: {
      api: 'https://afs1-api.zenith.engineer',
      cdn: 'https://afs1-cdn.zenith.engineer',
      websocket: 'wss://afs1-ws.zenith.engineer',
      database: 'postgres://afs1-db.zenith.engineer:5432/zenith'
    },
    infrastructure: {
      provider: 'aws',
      instanceType: 'c6i.large',
      minInstances: 1,
      maxInstances: 10,
      diskType: 'gp3',
      networkTier: 'standard'
    }
  }
} as const;

export const DEPLOYMENT_STRATEGIES = {
  'rolling': {
    name: 'Rolling Deployment',
    description: 'Deploy to regions sequentially with validation',
    riskLevel: 'low',
    downtime: 'zero',
    rollbackTime: 'fast',
    suitableFor: ['minor-updates', 'patches', 'configuration-changes'],
    regions: {
      sequence: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1', 'sa-east-1', 'me-south-1', 'af-south-1'],
      waitTime: 30, // seconds between regions
      validationTime: 300 // 5 minutes validation per region
    }
  },
  'blue-green': {
    name: 'Blue-Green Deployment',
    description: 'Deploy to parallel environment then switch',
    riskLevel: 'medium',
    downtime: 'minimal',
    rollbackTime: 'instant',
    suitableFor: ['major-updates', 'database-changes', 'breaking-changes'],
    regions: {
      parallel: true,
      validationTime: 600, // 10 minutes validation
      switchTime: 30 // 30 seconds to switch
    }
  },
  'canary': {
    name: 'Canary Deployment',
    description: 'Gradually increase traffic to new version',
    riskLevel: 'very-low',
    downtime: 'zero',
    rollbackTime: 'fast',
    suitableFor: ['feature-releases', 'experiments', 'high-risk-changes'],
    regions: {
      trafficStages: [1, 5, 10, 25, 50, 100], // percentage stages
      stageWaitTime: 300, // 5 minutes per stage
      healthThreshold: 85 // minimum health score to proceed
    }
  }
} as const;

export const SLA_TARGETS = {
  availability: {
    tier1: 99.99, // Four nines - Critical regions
    tier2: 99.95, // High availability - Major regions
    tier3: 99.9   // Standard - Secondary regions
  },
  latency: {
    api: {
      p50: 50,   // 50ms median
      p95: 150,  // 150ms 95th percentile
      p99: 500   // 500ms 99th percentile
    },
    database: {
      read: 10,  // 10ms read queries
      write: 50  // 50ms write queries
    },
    cdn: {
      static: 20,  // 20ms static assets
      dynamic: 100 // 100ms dynamic content
    }
  },
  throughput: {
    'us-east-1': 10000,    // 10K RPS
    'us-west-2': 8000,     // 8K RPS
    'eu-west-1': 6000,     // 6K RPS
    'ap-southeast-1': 4000, // 4K RPS
    'ap-northeast-1': 4000, // 4K RPS
    'sa-east-1': 2000,     // 2K RPS
    'me-south-1': 1000,    // 1K RPS
    'af-south-1': 500      // 500 RPS
  }
} as const;

export const COMPLIANCE_MATRIX = {
  'GDPR': {
    regions: ['eu-west-1', 'eu-central-1', 'eu-north-1'],
    dataTypes: ['PII', 'cookies', 'behavioral'],
    requirements: {
      dataLocation: 'eu-only',
      encryption: 'aes-256',
      retention: 1825, // 5 years max
      consent: 'explicit',
      rightToErasure: true,
      dataPortability: true
    },
    penalties: {
      tier1: '€10M or 2% revenue',
      tier2: '€20M or 4% revenue'
    }
  },
  'CCPA': {
    regions: ['us-west-1', 'us-west-2'],
    dataTypes: ['PII', 'behavioral', 'biometric'],
    requirements: {
      dataLocation: 'us-california',
      disclosure: 'mandatory',
      optOut: 'do-not-sell',
      deletion: 'on-request',
      discrimination: 'prohibited'
    },
    penalties: {
      unintentional: '$2,500',
      intentional: '$7,500'
    }
  },
  'HIPAA': {
    regions: ['us-east-1', 'us-west-2', 'us-central-1'],
    dataTypes: ['PHI', 'medical-records', 'health-data'],
    requirements: {
      dataLocation: 'us-only',
      encryption: 'aes-256-gcm',
      accessControl: 'rbac',
      auditTrail: 'immutable',
      businessAssociate: 'agreement-required'
    },
    penalties: {
      minor: '$100-$50K',
      major: '$1.5M'
    }
  },
  'PCI-DSS': {
    regions: ['all'],
    dataTypes: ['payment-card', 'financial'],
    requirements: {
      encryption: 'tokenization',
      network: 'segmented',
      access: 'need-to-know',
      monitoring: 'continuous',
      testing: 'quarterly'
    },
    penalties: {
      monthly: '$5K-$100K'
    }
  }
} as const;

export const MONITORING_CONFIG = {
  healthChecks: {
    interval: 30, // seconds
    timeout: 5,   // seconds
    retries: 3,
    endpoints: [
      '/health',
      '/api/health',
      '/api/ready',
      '/metrics'
    ]
  },
  metrics: {
    collection: {
      interval: 10, // seconds
      retention: 90, // days
      aggregation: ['1m', '5m', '1h', '1d']
    },
    alerting: {
      evaluation: 60, // seconds
      cooldown: 300,  // seconds
      escalation: [
        { level: 1, delay: 0 },     // immediate
        { level: 2, delay: 300 },   // 5 minutes
        { level: 3, delay: 900 }    // 15 minutes
      ]
    }
  },
  dashboards: {
    global: {
      name: 'Global Overview',
      panels: ['availability', 'latency', 'throughput', 'errors', 'costs']
    },
    regional: {
      name: 'Regional Performance',
      panels: ['health', 'traffic', 'resources', 'incidents']
    },
    compliance: {
      name: 'Compliance Status',
      panels: ['violations', 'audits', 'data-location', 'encryption']
    }
  }
} as const;

export const DISASTER_RECOVERY = {
  rto: 15, // Recovery Time Objective - 15 minutes
  rpo: 5,  // Recovery Point Objective - 5 minutes
  backup: {
    frequency: 'continuous',
    retention: {
      daily: 30,    // 30 days
      weekly: 12,   // 12 weeks
      monthly: 12,  // 12 months
      yearly: 7     // 7 years
    },
    encryption: 'aes-256-gcm',
    crossRegion: true,
    testing: 'monthly'
  },
  failover: {
    automatic: true,
    threshold: 3, // consecutive failures
    cooldown: 300, // 5 minutes
    priority: [
      'us-west-2',      // Primary failover for us-east-1
      'eu-west-1',      // Secondary failover
      'ap-southeast-1', // Tertiary failover
      'ap-northeast-1'
    ]
  },
  testing: {
    schedule: 'monthly',
    scenarios: [
      'region-failure',
      'database-corruption',
      'network-partition',
      'cascading-failure',
      'security-incident'
    ],
    reporting: {
      stakeholders: ['ops-team', 'management', 'compliance'],
      format: 'detailed-report',
      sla: '48-hours'
    }
  }
} as const;

export const SECURITY_CONFIG = {
  encryption: {
    atRest: {
      algorithm: 'AES-256-GCM',
      keyRotation: 90, // days
      keyManagement: 'HSM'
    },
    inTransit: {
      protocol: 'TLS 1.3',
      cipherSuites: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_AES_128_GCM_SHA256'
      ],
      hsts: true
    }
  },
  authentication: {
    mfa: 'required',
    sessionTimeout: 3600, // 1 hour
    passwordPolicy: {
      minLength: 12,
      complexity: 'high',
      expiry: 90 // days
    }
  },
  network: {
    firewall: 'stateful',
    ddosProtection: 'enabled',
    rateLimiting: {
      api: 1000,    // requests per minute
      auth: 10,     // attempts per minute
      global: 50000 // requests per minute
    }
  },
  monitoring: {
    siem: 'enabled',
    threatDetection: 'ml-powered',
    incidentResponse: 'automated',
    forensics: 'immutable-logs'
  }
} as const;

export const COST_OPTIMIZATION = {
  autoScaling: {
    scaleUp: {
      cpu: 70,      // percentage
      memory: 80,   // percentage
      requests: 80  // percentage of capacity
    },
    scaleDown: {
      cpu: 30,      // percentage
      memory: 40,   // percentage
      requests: 30, // percentage of capacity
      cooldown: 600 // 10 minutes
    }
  },
  scheduling: {
    devEnvironments: {
      shutdown: '18:00',
      startup: '08:00',
      timezone: 'local',
      weekends: 'off'
    },
    batchJobs: {
      preferredHours: ['22:00', '06:00'],
      spotInstances: true,
      preemptible: true
    }
  },
  storage: {
    lifecycle: {
      hotStorage: 30,  // days
      warmStorage: 90, // days
      coldStorage: 365, // days
      archival: 2555   // 7 years
    },
    compression: 'enabled',
    deduplication: 'enabled'
  }
} as const;

// Helper functions for configuration access
export function getRegionConfig(regionId: string) {
  return GLOBAL_REGIONS[regionId as keyof typeof GLOBAL_REGIONS];
}

export function getComplianceRequirements(region: string): string[] {
  const regionConfig = getRegionConfig(region);
  return regionConfig?.compliance || [];
}

export function getSLATargets(region: string) {
  const regionConfig = getRegionConfig(region);
  if (!regionConfig) return SLA_TARGETS;
  
  // Determine tier based on region priority
  const tier = regionConfig.primary ? 'tier1' : 
               ['us-west-2', 'eu-west-1'].includes(region) ? 'tier2' : 'tier3';
  
  return {
    availability: SLA_TARGETS.availability[tier],
    latency: SLA_TARGETS.latency,
    throughput: SLA_TARGETS.throughput[region as keyof typeof SLA_TARGETS.throughput] || 1000
  };
}

export function getDeploymentStrategy(strategy: string) {
  return DEPLOYMENT_STRATEGIES[strategy as keyof typeof DEPLOYMENT_STRATEGIES];
}

export function validateRegionCompliance(region: string, dataType: string): boolean {
  const regionConfig = getRegionConfig(region);
  if (!regionConfig) return false;
  
  // Check if region supports the data type based on compliance
  for (const [regulation, config] of Object.entries(COMPLIANCE_MATRIX)) {
    if (config.regions.includes(region) && config.dataTypes.includes(dataType)) {
      return true;
    }
  }
  
  return false;
}

export default {
  GLOBAL_REGIONS,
  DEPLOYMENT_STRATEGIES,
  SLA_TARGETS,
  COMPLIANCE_MATRIX,
  MONITORING_CONFIG,
  DISASTER_RECOVERY,
  SECURITY_CONFIG,
  COST_OPTIMIZATION,
  getRegionConfig,
  getComplianceRequirements,
  getSLATargets,
  getDeploymentStrategy,
  validateRegionCompliance
};