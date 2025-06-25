/**
 * @jest-environment jsdom
 */

import { FeatureFlagService, FeatureFlagContext } from '../feature-flags';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let mockContext: FeatureFlagContext;

  beforeEach(() => {
    service = new FeatureFlagService();
    mockContext = {
      userId: 'test-user-123',
      userRole: 'USER',
      environment: 'development',
      timestamp: new Date(),
    };
  });

  describe('isFeatureEnabled', () => {
    it('should return false for non-existent feature flags', () => {
      const result = service.isFeatureEnabled('non_existent_flag', mockContext);
      expect(result).toBe(false);
    });

    it('should return false for disabled feature flags', () => {
      const result = service.isFeatureEnabled('competitive_intelligence', mockContext);
      expect(result).toBe(false);
    });

    it('should return true for enabled feature flags with 100% rollout', () => {
      const result = service.isFeatureEnabled('enhanced_website_analyzer', mockContext);
      expect(result).toBe(true);
    });

    it('should respect environment restrictions', () => {
      const productionContext = { ...mockContext, environment: 'production' };
      const result = service.isFeatureEnabled('team_management', productionContext);
      expect(result).toBe(false); // Only enabled in dev/staging
    });

    it('should handle user targeting correctly', () => {
      // Update flag to target specific users
      service.updateFlag('team_management', {
        enabled: true,
        rolloutPercentage: 0,
        targetUsers: ['test-user-123'],
      });

      const result = service.isFeatureEnabled('team_management', mockContext);
      expect(result).toBe(true);
    });

    it('should handle role targeting correctly', () => {
      // Update flag to target specific roles
      service.updateFlag('ai_content_analysis', {
        enabled: true,
        rolloutPercentage: 0,
        targetRoles: ['ADMIN'],
      });

      const userContext = { ...mockContext, userRole: 'USER' };
      const adminContext = { ...mockContext, userRole: 'ADMIN' };

      expect(service.isFeatureEnabled('ai_content_analysis', userContext)).toBe(false);
      expect(service.isFeatureEnabled('ai_content_analysis', adminContext)).toBe(true);
    });

    it('should handle date restrictions', () => {
      const futureDate = new Date('2025-12-31');
      const pastDate = new Date('2024-01-01');

      // Update flag with date restrictions
      service.updateFlag('enhanced_website_analyzer', {
        startDate: futureDate,
        endDate: new Date('2026-01-01'),
      });

      const result = service.isFeatureEnabled('enhanced_website_analyzer', mockContext);
      expect(result).toBe(false); // Should be false because start date is in future
    });
  });

  describe('getEnabledFeatures', () => {
    it('should return list of enabled features for context', () => {
      const features = service.getEnabledFeatures(mockContext);
      expect(features).toContain('enhanced_website_analyzer');
      expect(features).not.toContain('competitive_intelligence');
    });
  });

  describe('updateFlag', () => {
    it('should update existing feature flag', () => {
      const success = service.updateFlag('team_management', {
        enabled: true,
        rolloutPercentage: 50,
      });

      expect(success).toBe(true);
      
      const flags = service.getAllFlags();
      const teamFlag = flags.find(f => f.key === 'team_management');
      expect(teamFlag?.enabled).toBe(true);
      expect(teamFlag?.rolloutPercentage).toBe(50);
    });

    it('should return false for non-existent feature flag', () => {
      const success = service.updateFlag('non_existent_flag', {
        enabled: true,
      });

      expect(success).toBe(false);
    });
  });

  describe('getAllFlags', () => {
    it('should return all available feature flags', () => {
      const flags = service.getAllFlags();
      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(f => f.key === 'enhanced_website_analyzer')).toBe(true);
    });
  });
});