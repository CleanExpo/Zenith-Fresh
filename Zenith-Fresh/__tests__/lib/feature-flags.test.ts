/**
 * Comprehensive tests for the feature flag system
 * Tests core functionality, edge cases, and user scenarios
 */

import {
  isFeatureEnabled,
  getEnabledFeatures,
  FEATURE_FLAGS,
  FeatureFlagAdmin,
} from '@/lib/feature-flags'

// Mock environment variables for testing
const originalEnv = process.env.NODE_ENV

describe('Feature Flags Core Functions', () => {
  beforeEach(() => {
    // Reset feature flags to default state - use development for compatibility
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    })
    
    // Reset all flags to their original state
    FEATURE_FLAGS.ENHANCED_ANALYZER.enabled = true
    FEATURE_FLAGS.TEAM_MANAGEMENT.enabled = true
    FEATURE_FLAGS.AI_CONTENT_ANALYSIS.enabled = true  // Set to true for tests
    FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.enabled = true  // Set to true for tests
    FEATURE_FLAGS.DARK_MODE.enabled = true
    
    // Reset rollout percentages
    FEATURE_FLAGS.ENHANCED_ANALYZER.rolloutPercentage = 100
    FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage = 50
    FEATURE_FLAGS.AI_CONTENT_ANALYSIS.rolloutPercentage = 100  // Set to 100% for testing
    FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.rolloutPercentage = 100  // Set to 100% for testing
    FEATURE_FLAGS.DARK_MODE.rolloutPercentage = 100
    
    // Reset allowed users/emails
    FEATURE_FLAGS.AI_CONTENT_ANALYSIS.allowedEmails = ['admin@zenith.engineer', 'beta@zenith.engineer']
    FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.allowedUsers = []
  })

  afterAll(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true
    })
  })

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      expect(isFeatureEnabled('DARK_MODE')).toBe(true)
      expect(isFeatureEnabled('ENHANCED_ANALYZER')).toBe(true)
    })

    it('should return false for disabled features', () => {
      // Temporarily disable these features for this test
      FEATURE_FLAGS.AI_CONTENT_ANALYSIS.enabled = false
      FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.enabled = false
      
      expect(isFeatureEnabled('AI_CONTENT_ANALYSIS')).toBe(false)
      expect(isFeatureEnabled('COMPETITIVE_INTELLIGENCE')).toBe(false)
      
      // Re-enable for other tests
      FEATURE_FLAGS.AI_CONTENT_ANALYSIS.enabled = true
      FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.enabled = true
    })

    it('should respect environment restrictions', () => {
      // Team management is only enabled in development and staging
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })
      expect(isFeatureEnabled('TEAM_MANAGEMENT')).toBe(false)
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })
      expect(isFeatureEnabled('TEAM_MANAGEMENT')).toBe(true)
    })

    it('should handle non-existent features', () => {
      expect(isFeatureEnabled('NON_EXISTENT_FEATURE' as any)).toBe(false)
    })

    it('should respect allowed emails', () => {
      // AI_CONTENT_ANALYSIS has specific allowed emails (should already be enabled from beforeEach)
      expect(isFeatureEnabled('AI_CONTENT_ANALYSIS', 'admin@zenith.engineer')).toBe(true)
      expect(isFeatureEnabled('AI_CONTENT_ANALYSIS', 'beta@zenith.engineer')).toBe(true)
      expect(isFeatureEnabled('AI_CONTENT_ANALYSIS', 'user@example.com')).toBe(false)
    })

    it('should respect allowed users', () => {
      // Set up allowed users for competitive intelligence (should already be enabled from beforeEach)
      FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.allowedUsers = ['user-123', 'user-456']
      
      expect(isFeatureEnabled('COMPETITIVE_INTELLIGENCE', null, 'user-123')).toBe(true)
      expect(isFeatureEnabled('COMPETITIVE_INTELLIGENCE', null, 'user-456')).toBe(true)
      expect(isFeatureEnabled('COMPETITIVE_INTELLIGENCE', null, 'user-789')).toBe(false)
    })

    it('should handle rollout percentages consistently', () => {
      // Test with a feature that has 50% rollout
      const testUser1 = 'test-user-1'
      const testUser2 = 'test-user-2'
      
      // Same user should always get same result
      const result1a = isFeatureEnabled('TEAM_MANAGEMENT', testUser1)
      const result1b = isFeatureEnabled('TEAM_MANAGEMENT', testUser1)
      expect(result1a).toBe(result1b)
      
      // Different users may get different results (but consistently for each user)
      const result2a = isFeatureEnabled('TEAM_MANAGEMENT', testUser2)
      const result2b = isFeatureEnabled('TEAM_MANAGEMENT', testUser2)
      expect(result2a).toBe(result2b)
    })

    it('should handle anonymous users with rollout percentages', () => {
      // Anonymous users should still get consistent results
      const result1 = isFeatureEnabled('TEAM_MANAGEMENT')
      const result2 = isFeatureEnabled('TEAM_MANAGEMENT')
      expect(result1).toBe(result2)
    })

    it('should handle 0% rollout', () => {
      // Competitive intelligence has 0% rollout
      FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.enabled = true
      FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.rolloutPercentage = 0
      expect(isFeatureEnabled('COMPETITIVE_INTELLIGENCE', 'any-user@example.com')).toBe(false)
    })

    it('should handle 100% rollout', () => {
      // Dark mode has 100% rollout
      expect(isFeatureEnabled('DARK_MODE', 'any-user@example.com')).toBe(true)
    })
  })

  describe('getEnabledFeatures', () => {
    it('should return all enabled features for a user', () => {
      const features = getEnabledFeatures()
      expect(features).toContain('DARK_MODE')
      expect(features).toContain('ENHANCED_ANALYZER')
      // AI_CONTENT_ANALYSIS should not be in the list for anonymous users (due to allowedEmails restriction)
      expect(features).not.toContain('AI_CONTENT_ANALYSIS')
    })

    it('should return features based on user email', () => {
      // AI content analysis should already be enabled from beforeEach
      const adminFeatures = getEnabledFeatures('admin@zenith.engineer')
      const regularFeatures = getEnabledFeatures('user@example.com')
      
      expect(adminFeatures).toContain('AI_CONTENT_ANALYSIS')
      expect(regularFeatures).not.toContain('AI_CONTENT_ANALYSIS')
    })

    it('should respect environment settings', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })
      const productionFeatures = getEnabledFeatures()
      expect(productionFeatures).not.toContain('TEAM_MANAGEMENT')
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })
      const devFeatures = getEnabledFeatures()
      expect(devFeatures).toContain('TEAM_MANAGEMENT')
    })
  })

  describe('FeatureFlagAdmin', () => {
    it('should enable features', () => {
      FeatureFlagAdmin.enableFeature('AI_CONTENT_ANALYSIS')
      expect(FEATURE_FLAGS.AI_CONTENT_ANALYSIS.enabled).toBe(true)
    })

    it('should disable features', () => {
      FeatureFlagAdmin.disableFeature('DARK_MODE')
      expect(FEATURE_FLAGS.DARK_MODE.enabled).toBe(false)
    })

    it('should update rollout percentages', () => {
      FeatureFlagAdmin.updateRolloutPercentage('TEAM_MANAGEMENT', 75)
      expect(FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage).toBe(75)
    })

    it('should clamp rollout percentages to valid range', () => {
      FeatureFlagAdmin.updateRolloutPercentage('TEAM_MANAGEMENT', 150)
      expect(FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage).toBe(100)
      
      FeatureFlagAdmin.updateRolloutPercentage('TEAM_MANAGEMENT', -10)
      expect(FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage).toBe(0)
    })

    it('should add allowed users', () => {
      FeatureFlagAdmin.addAllowedUser('COMPETITIVE_INTELLIGENCE', 'new-user-123')
      const feature = FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE
      expect(feature.allowedUsers).toContain('new-user-123')
    })

    it('should not add duplicate allowed users', () => {
      FeatureFlagAdmin.addAllowedUser('COMPETITIVE_INTELLIGENCE', 'user-123')
      FeatureFlagAdmin.addAllowedUser('COMPETITIVE_INTELLIGENCE', 'user-123')
      
      const feature = FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE
      const occurrences = feature.allowedUsers?.filter(u => u === 'user-123').length || 0
      expect(occurrences).toBe(1)
    })

    it('should handle non-existent features gracefully', () => {
      expect(() => {
        FeatureFlagAdmin.enableFeature('NON_EXISTENT' as any)
      }).not.toThrow()
      
      expect(() => {
        FeatureFlagAdmin.updateRolloutPercentage('NON_EXISTENT' as any, 50)
      }).not.toThrow()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined user data gracefully', () => {
      expect(isFeatureEnabled('DARK_MODE', undefined, undefined)).toBe(true)
      expect(isFeatureEnabled('DARK_MODE', null, null)).toBe(true)
    })

    it('should handle empty strings', () => {
      expect(isFeatureEnabled('DARK_MODE', '', '')).toBe(true)
    })

    it('should handle features without rollout percentage', () => {
      // Create a test feature without rollout percentage
      const originalFeature = { ...FEATURE_FLAGS.DARK_MODE }
      delete (FEATURE_FLAGS.DARK_MODE as any).rolloutPercentage
      
      expect(isFeatureEnabled('DARK_MODE')).toBe(true)
      
      // Restore original feature
      FEATURE_FLAGS.DARK_MODE = originalFeature
    })

    it('should handle features without allowed users/emails', () => {
      const feature = FEATURE_FLAGS.ENHANCED_ANALYZER
      const originalUsers = feature.allowedUsers
      const originalEmails = feature.allowedEmails
      
      delete (feature as any).allowedUsers
      delete (feature as any).allowedEmails
      
      expect(isFeatureEnabled('ENHANCED_ANALYZER', 'any@example.com', 'any-user')).toBe(true)
      
      // Restore original values
      if (originalUsers) feature.allowedUsers = originalUsers
      if (originalEmails) feature.allowedEmails = originalEmails
    })
  })

  describe('User Scenarios', () => {
    const scenarios = [
      {
        name: 'Anonymous User',
        email: null,
        userId: null,
        expectedFeatures: ['DARK_MODE', 'ENHANCED_ANALYZER']
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        userId: 'user-123',
        expectedFeatures: ['DARK_MODE', 'ENHANCED_ANALYZER']
      },
      {
        name: 'Admin User',
        email: 'admin@zenith.engineer',
        userId: 'admin-123',
        expectedFeatures: ['DARK_MODE', 'ENHANCED_ANALYZER']
      },
      {
        name: 'Beta User',
        email: 'beta@zenith.engineer',
        userId: 'beta-123',
        expectedFeatures: ['DARK_MODE', 'ENHANCED_ANALYZER']
      }
    ]

    scenarios.forEach(scenario => {
      it(`should handle ${scenario.name} correctly`, () => {
        const enabledFeatures = getEnabledFeatures(scenario.email, scenario.userId)
        
        scenario.expectedFeatures.forEach(feature => {
          expect(enabledFeatures).toContain(feature)
        })
      })
    })

    it('should handle beta user with AI content analysis enabled', () => {
      const betaFeatures = getEnabledFeatures('beta@zenith.engineer', 'beta-123')
      const regularFeatures = getEnabledFeatures('user@example.com', 'user-123')
      
      expect(betaFeatures).toContain('AI_CONTENT_ANALYSIS')
      expect(regularFeatures).not.toContain('AI_CONTENT_ANALYSIS')
    })
  })

  describe('Performance and Consistency', () => {
    it('should return consistent results for the same user', () => {
      const user = 'consistent-user@example.com'
      
      // Call multiple times and ensure consistent results
      const results = Array.from({ length: 100 }, () => 
        getEnabledFeatures(user, 'user-123')
      )
      
      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(results[0])
      })
    })

    it('should handle large numbers of feature checks efficiently', () => {
      const start = Date.now()
      
      // Perform many feature checks
      for (let i = 0; i < 1000; i++) {
        isFeatureEnabled('DARK_MODE', `user-${i}@example.com`, `user-${i}`)
        isFeatureEnabled('TEAM_MANAGEMENT', `user-${i}@example.com`, `user-${i}`)
        isFeatureEnabled('ENHANCED_ANALYZER', `user-${i}@example.com`, `user-${i}`)
      }
      
      const duration = Date.now() - start
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000) // 1 second
    })
  })
})