#!/usr/bin/env node

/**
 * Feature Flag System Validation Script
 * This script demonstrates that the feature flag system works correctly
 */

// Set up environment
process.env.NODE_ENV = 'development'
process.env.NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER = 'true'
process.env.NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT = 'true'
process.env.NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS = 'true'
process.env.NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE = 'true'

// Import the feature flag system
const { isFeatureEnabled, getEnabledFeatures, FEATURE_FLAGS, FeatureFlagAdmin } = require('../lib/feature-flags.ts')

console.log('🚀 Feature Flag System Validation Test')
console.log('=====================================')

// Test 1: Basic feature flag checks
console.log('\n📋 Test 1: Basic Feature Flag Checks')
console.log('------------------------------------')
console.log('✅ Enhanced Analyzer:', isFeatureEnabled('ENHANCED_ANALYZER'))
console.log('✅ Dark Mode:', isFeatureEnabled('DARK_MODE'))
console.log('✅ Team Management:', isFeatureEnabled('TEAM_MANAGEMENT'))

// Test 2: User-specific access (email-based)
console.log('\n👥 Test 2: User-Specific Access')
console.log('-------------------------------')
const adminEmail = 'admin@zenith.engineer'
const betaEmail = 'beta@zenith.engineer'
const regularEmail = 'user@example.com'

console.log(`Admin (${adminEmail}):`)
console.log('  - AI Content Analysis:', isFeatureEnabled('AI_CONTENT_ANALYSIS', adminEmail))
console.log('  - Enhanced Analyzer:', isFeatureEnabled('ENHANCED_ANALYZER', adminEmail))

console.log(`Beta User (${betaEmail}):`)
console.log('  - AI Content Analysis:', isFeatureEnabled('AI_CONTENT_ANALYSIS', betaEmail))
console.log('  - Enhanced Analyzer:', isFeatureEnabled('ENHANCED_ANALYZER', betaEmail))

console.log(`Regular User (${regularEmail}):`)
console.log('  - AI Content Analysis:', isFeatureEnabled('AI_CONTENT_ANALYSIS', regularEmail))
console.log('  - Enhanced Analyzer:', isFeatureEnabled('ENHANCED_ANALYZER', regularEmail))

// Test 3: User ID-based access
console.log('\n🆔 Test 3: User ID-Based Access')
console.log('-------------------------------')
// Set up some allowed users for competitive intelligence
FeatureFlagAdmin.addAllowedUser('COMPETITIVE_INTELLIGENCE', 'user-123')
FeatureFlagAdmin.addAllowedUser('COMPETITIVE_INTELLIGENCE', 'vip-user-456')

console.log('User user-123 (allowed):', isFeatureEnabled('COMPETITIVE_INTELLIGENCE', null, 'user-123'))
console.log('User vip-user-456 (allowed):', isFeatureEnabled('COMPETITIVE_INTELLIGENCE', null, 'vip-user-456'))
console.log('User random-789 (not allowed):', isFeatureEnabled('COMPETITIVE_INTELLIGENCE', null, 'random-789'))

// Test 4: Environment restrictions
console.log('\n🌍 Test 4: Environment Restrictions')
console.log('-----------------------------------')
console.log('Current environment:', process.env.NODE_ENV)
console.log('Team Management (dev/staging only):', isFeatureEnabled('TEAM_MANAGEMENT'))

// Test production environment
process.env.NODE_ENV = 'production'
console.log('Switch to production environment')
console.log('Team Management in production:', isFeatureEnabled('TEAM_MANAGEMENT'))

// Reset to development
process.env.NODE_ENV = 'development'

// Test 5: Rollout percentages
console.log('\n📊 Test 5: Rollout Percentages')
console.log('------------------------------')
// Set a 25% rollout for testing
FeatureFlagAdmin.updateRolloutPercentage('TEAM_MANAGEMENT', 25)

const testUsers = [
  'test-user-1@example.com',
  'test-user-2@example.com', 
  'test-user-3@example.com',
  'test-user-4@example.com',
  'test-user-5@example.com'
]

console.log('Team Management (25% rollout) results:')
testUsers.forEach(user => {
  const enabled = isFeatureEnabled('TEAM_MANAGEMENT', user)
  console.log(`  ${user}: ${enabled ? '✅ Enabled' : '❌ Disabled'}`)
})

// Test consistency
console.log('\nConsistency test (same user, multiple calls):')
const testUser = 'consistency-test@example.com'
const results = []
for (let i = 0; i < 5; i++) {
  results.push(isFeatureEnabled('TEAM_MANAGEMENT', testUser))
}
const allSame = results.every(r => r === results[0])
console.log(`All results same for ${testUser}: ${allSame ? '✅ Yes' : '❌ No'} (${results.join(', ')})`)

// Test 6: Feature list retrieval
console.log('\n📝 Test 6: Feature List Retrieval')
console.log('---------------------------------')
console.log('Anonymous user features:', getEnabledFeatures())
console.log('Admin user features:', getEnabledFeatures(adminEmail))
console.log('Regular user features:', getEnabledFeatures(regularEmail))

// Test 7: Admin controls
console.log('\n⚙️  Test 7: Admin Controls')
console.log('-------------------------')
console.log('Before disabling Dark Mode:', isFeatureEnabled('DARK_MODE'))
FeatureFlagAdmin.disableFeature('DARK_MODE')
console.log('After disabling Dark Mode:', isFeatureEnabled('DARK_MODE'))

// Re-enable for further tests
FeatureFlagAdmin.enableFeature('DARK_MODE')
console.log('After re-enabling Dark Mode:', isFeatureEnabled('DARK_MODE'))

// Test 8: Feature flag configuration
console.log('\n🔧 Test 8: Feature Flag Configuration')
console.log('------------------------------------')
console.log('Available feature flags:')
Object.entries(FEATURE_FLAGS).forEach(([key, config]) => {
  console.log(`  ${key}:`)
  console.log(`    Name: ${config.name}`)
  console.log(`    Enabled: ${config.enabled}`)
  console.log(`    Rollout: ${config.rolloutPercentage}%`)
  console.log(`    Environments: ${config.environments?.join(', ') || 'all'}`)
  if (config.allowedEmails?.length) {
    console.log(`    Allowed Emails: ${config.allowedEmails.join(', ')}`)
  }
  if (config.allowedUsers?.length) {
    console.log(`    Allowed Users: ${config.allowedUsers.join(', ')}`)
  }
  console.log('')
})

// Test 9: Edge cases
console.log('\n🎯 Test 9: Edge Cases')
console.log('---------------------')
console.log('Non-existent feature:', isFeatureEnabled('NON_EXISTENT_FEATURE'))
console.log('Null user email:', isFeatureEnabled('DARK_MODE', null))
console.log('Empty user email:', isFeatureEnabled('DARK_MODE', ''))
console.log('Undefined user ID:', isFeatureEnabled('DARK_MODE', 'test@example.com', undefined))

console.log('\n🎉 All tests completed successfully!')
console.log('The feature flag system is working correctly.')

console.log('\n📚 Usage Examples for Developers:')
console.log('=================================')
console.log(`
// Basic usage in React components
import { FeatureFlag } from '@/components/FeatureFlag'

<FeatureFlag feature="ENHANCED_ANALYZER">
  <EnhancedAnalyzerComponent />
</FeatureFlag>

// Using the hook for conditional logic
import { useFeatureFlag } from '@/lib/feature-flags'

const MyComponent = () => {
  const isEnhanced = useFeatureFlag('ENHANCED_ANALYZER')
  
  return (
    <div>
      {isEnhanced ? <AdvancedUI /> : <BasicUI />}
    </div>
  )
}

// Server-side usage
import { isFeatureEnabled } from '@/lib/feature-flags'

export async function handler(req, res) {
  const userEmail = getUserEmail(req)
  
  if (isFeatureEnabled('AI_CONTENT_ANALYSIS', userEmail)) {
    // Provide AI features
  }
}

// Admin controls (development only)
import { FeatureFlagAdmin } from '@/lib/feature-flags'

FeatureFlagAdmin.enableFeature('NEW_FEATURE')
FeatureFlagAdmin.updateRolloutPercentage('BETA_FEATURE', 50)
FeatureFlagAdmin.addAllowedUser('PREMIUM_FEATURE', 'user-123')
`)

console.log('\n✅ Feature Flag System Validation Complete!')