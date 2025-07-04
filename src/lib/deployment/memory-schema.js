/**
 * MongoDB Deployment Memory System Schema
 * 
 * This defines the collections and schemas for intelligent deployment tracking,
 * error pattern recognition, and automated problem resolution.
 */

const { getDatabase } = require('../mongodb.js');

/**
 * Deployment Attempts Collection Schema
 * Tracks every deployment with full context and outcomes
 */
const DeploymentAttemptSchema = {
  collection: 'deployment_attempts',
  schema: {
    _id: 'ObjectId',
    timestamp: 'Date',
    deploymentId: 'String', // Unique identifier for this deployment
    phase: 'Number', // 1-7 based on deployment phases
    projectName: 'String',
    environment: 'String', // "production", "staging", "development"
    status: 'String', // "success", "failed", "in-progress", "rolled-back"
    
    // Error tracking
    errors: [{
      file: 'String',
      errorType: 'String', // "syntax", "dependency", "build", "runtime"
      errorMessage: 'String',
      errorPattern: 'String', // Normalized pattern for matching
      lineNumber: 'Number',
      solution: 'String',
      resolved: 'Boolean',
      autoFixed: 'Boolean',
      timesToResolution: 'Number' // Minutes to fix
    }],
    
    // Build configuration snapshot
    buildConfig: {
      nodeVersion: 'String',
      nextjsVersion: 'String',
      buildCommand: 'String',
      installCommand: 'String',
      environmentVars: ['String'], // Keys only, not values for security
      dependencies: 'Object', // package.json dependencies
      devDependencies: 'Object',
      vercelConfig: 'Object',
      prismaSchema: 'String', // Hash of schema for DB changes
      gitCommitHash: 'String',
      gitBranch: 'String',
      filesChanged: ['String'] // List of changed files
    },
    
    // Solutions applied
    solutions: [{
      issue: 'String',
      resolution: 'String',
      resolutionCode: 'String', // Actual code applied
      effectiveness: 'Number', // 1-10 rating
      timesToSuccess: 'Number', // How many attempts before success
      confidence: 'Number', // AI confidence in solution
      appliedAutomatically: 'Boolean',
      userOverride: 'Boolean'
    }],
    
    // Performance metrics
    duration: 'Number', // Total deployment time in seconds
    buildTime: 'Number', // Build phase time
    deployTime: 'Number', // Actual deployment time
    
    // Logs and debugging
    buildLogs: 'String',
    deploymentLogs: 'String',
    errorLogs: 'String',
    
    // Learning data
    predictedSuccessRate: 'Number', // AI prediction before deployment
    actualOutcome: 'String',
    predictionAccuracy: 'Number',
    
    // Team and context
    triggeredBy: 'String', // User or automated
    team: 'String',
    rollbackPerformed: 'Boolean',
    rollbackReason: 'String'
  }
};

/**
 * Known Solutions Collection Schema
 * Database of error patterns and their proven solutions
 */
const KnownSolutionSchema = {
  collection: 'known_solutions',
  schema: {
    _id: 'ObjectId',
    createdAt: 'Date',
    updatedAt: 'Date',
    
    // Error identification
    errorPattern: 'String', // Regex pattern for matching
    errorType: 'String',
    file: 'String', // File path pattern
    framework: 'String', // "nextjs", "react", "node", etc.
    
    // Common causes
    commonCauses: ['String'],
    
    // Solutions ranked by effectiveness
    solutions: [{
      id: 'String',
      description: 'String',
      code: 'String', // Actual fix code
      commands: ['String'], // CLI commands to run
      fileChanges: [{
        file: 'String',
        operation: 'String', // "create", "update", "delete"
        content: 'String',
        searchPattern: 'String',
        replacePattern: 'String'
      }],
      successRate: 'Number', // 0-1
      lastUsed: 'Date',
      effectiveness: 'Number', // 1-10
      timesApplied: 'Number',
      timesSuccessful: 'Number',
      averageFixTime: 'Number', // Minutes
      userRating: 'Number', // User feedback
      automationSafe: 'Boolean' // Can be applied automatically
    }],
    
    // Prevention and related info
    preventionSteps: ['String'],
    relatedErrors: ['String'], // IDs of related error patterns
    
    // Learning metrics
    confidence: 'Number', // How confident we are in this pattern
    verified: 'Boolean', // Manually verified by humans
    tags: ['String'] // For categorization
  }
};

/**
 * Build Patterns Collection Schema
 * Analyzes successful vs failed build configurations
 */
const BuildPatternSchema = {
  collection: 'build_patterns',
  schema: {
    _id: 'ObjectId',
    timestamp: 'Date',
    
    // Pattern identification
    pattern: 'String', // Unique pattern identifier
    patternType: 'String', // "dependency", "config", "file-structure"
    
    // Configuration fingerprint
    configFingerprint: {
      nodeVersion: 'String',
      nextjsVersion: 'String',
      dependencies: 'Object', // Key dependencies and versions
      fileStructure: ['String'], // Important file paths
      envVarsCount: 'Number',
      apiRoutesCount: 'Number',
      componentCount: 'Number'
    },
    
    // Success metrics
    successCount: 'Number',
    failureCount: 'Number',
    successRate: 'Number',
    
    // Performance data
    averageBuildTime: 'Number',
    fastestBuildTime: 'Number',
    slowestBuildTime: 'Number',
    
    // Common issues with this pattern
    commonIssues: ['String'],
    recommendedFixes: ['String'],
    
    // Optimization suggestions
    optimizations: [{
      description: 'String',
      impact: 'String', // "high", "medium", "low"
      effort: 'String', // "high", "medium", "low"
      estimatedImprovement: 'Number' // Percentage
    }]
  }
};

/**
 * Initialize MongoDB collections with proper indexes
 */
async function initializeDeploymentMemoryCollections() {
  try {
    const db = await getDatabase();
    
    console.log('🗄️ Initializing deployment memory collections...');
    
    // Create deployment_attempts indexes
    await db.collection('deployment_attempts').createIndex({ timestamp: -1 });
    await db.collection('deployment_attempts').createIndex({ deploymentId: 1 }, { unique: true });
    await db.collection('deployment_attempts').createIndex({ status: 1 });
    await db.collection('deployment_attempts').createIndex({ environment: 1 });
    await db.collection('deployment_attempts').createIndex({ 'errors.errorPattern': 1 });
    await db.collection('deployment_attempts').createIndex({ 'buildConfig.gitCommitHash': 1 });
    await db.collection('deployment_attempts').createIndex({ predictedSuccessRate: 1 });
    
    // Create known_solutions indexes
    await db.collection('known_solutions').createIndex({ errorPattern: 1 });
    await db.collection('known_solutions').createIndex({ errorType: 1 });
    await db.collection('known_solutions').createIndex({ 'solutions.successRate': -1 });
    await db.collection('known_solutions').createIndex({ 'solutions.effectiveness': -1 });
    await db.collection('known_solutions').createIndex({ verified: 1 });
    await db.collection('known_solutions').createIndex({ tags: 1 });
    
    // Create build_patterns indexes
    await db.collection('build_patterns').createIndex({ pattern: 1 }, { unique: true });
    await db.collection('build_patterns').createIndex({ patternType: 1 });
    await db.collection('build_patterns').createIndex({ successRate: -1 });
    await db.collection('build_patterns').createIndex({ 'configFingerprint.nextjsVersion': 1 });
    
    console.log('✅ Deployment memory collections initialized successfully');
    
    // Insert initial known solutions
    await seedInitialSolutions();
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize deployment memory collections:', error);
    throw error;
  }
}

/**
 * Seed initial known solutions from common deployment issues
 */
async function seedInitialSolutions() {
  const db = await getDatabase();
  const solutions = db.collection('known_solutions');
  
  // Check if we already have solutions
  const count = await solutions.countDocuments();
  if (count > 0) {
    console.log('📊 Known solutions already exist, skipping seed');
    return;
  }
  
  console.log('🌱 Seeding initial known solutions...');
  
  const initialSolutions = [
    {
      errorPattern: 'Expression expected.*\\.\\.\\..*Syntax Error',
      errorType: 'syntax',
      file: '**/*.ts',
      framework: 'nextjs',
      commonCauses: [
        'File corruption during git operations',
        'Incomplete copy-paste operations',
        'Merge conflict markers not resolved',
        'Invalid UTF-8 encoding'
      ],
      solutions: [{
        id: 'regenerate-corrupted-file',
        description: 'Regenerate corrupted file with proper syntax',
        code: 'File regeneration required',
        commands: ['git checkout HEAD -- {{file}}'],
        fileChanges: [],
        successRate: 0.95,
        effectiveness: 9,
        timesApplied: 0,
        timesSuccessful: 0,
        averageFixTime: 2,
        automationSafe: true
      }],
      preventionSteps: [
        'Use proper git merge conflict resolution',
        'Validate file syntax before commits',
        'Use IDE with syntax checking'
      ],
      confidence: 0.9,
      verified: true,
      tags: ['syntax', 'corruption', 'nextjs'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      errorPattern: 'Module not found.*Cannot resolve',
      errorType: 'dependency',
      file: '**/*.{ts,js,tsx,jsx}',
      framework: 'nextjs',
      commonCauses: [
        'Missing npm package installation',
        'Incorrect import path',
        'Package version mismatch',
        'TypeScript path mapping issues'
      ],
      solutions: [{
        id: 'install-missing-dependency',
        description: 'Install missing dependency and clear cache',
        commands: [
          'npm install',
          'npm run build'
        ],
        successRate: 0.85,
        effectiveness: 8,
        automationSafe: true
      }],
      confidence: 0.95,
      verified: true,
      tags: ['dependency', 'import', 'nextjs'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      errorPattern: 'routes-manifest\\.json.*couldn\'t be found',
      errorType: 'build',
      file: 'vercel.json',
      framework: 'nextjs',
      commonCauses: [
        'Vercel build cache corruption',
        'Next.js configuration issues',
        'Custom build configuration conflicts'
      ],
      solutions: [{
        id: 'clear-vercel-cache',
        description: 'Clear Vercel cache and use default configuration',
        fileChanges: [{
          file: 'vercel.json',
          operation: 'update',
          content: '{}',
          searchPattern: '.*',
          replacePattern: '{}'
        }],
        successRate: 0.9,
        effectiveness: 9,
        automationSafe: true
      }],
      confidence: 0.85,
      verified: true,
      tags: ['vercel', 'build', 'cache'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await solutions.insertMany(initialSolutions);
  console.log(`✅ Seeded ${initialSolutions.length} initial solutions`);
}

module.exports = {
  DeploymentAttemptSchema,
  KnownSolutionSchema,
  BuildPatternSchema,
  initializeDeploymentMemoryCollections
};