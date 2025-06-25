/**
 * Tests for Feature Flag API endpoints
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/feature-flags/route'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {
    providers: [],
    secret: 'test-secret',
  },
}))

const mockGetServerSession = require('next-auth').getServerSession as jest.MockedFunction<any>

describe('Feature Flags API', () => {
  beforeEach(() => {
    mockGetServerSession.mockClear()
    
    // Reset feature flags to default state
    FEATURE_FLAGS.ENHANCED_ANALYZER.enabled = true
    FEATURE_FLAGS.TEAM_MANAGEMENT.enabled = true
    FEATURE_FLAGS.AI_CONTENT_ANALYSIS.enabled = false
    FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.enabled = false
    FEATURE_FLAGS.DARK_MODE.enabled = true
  })

  describe('GET /api/feature-flags', () => {
    it('should return feature flags for anonymous user', async () => {
      mockGetServerSession.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('flags')
      expect(data).toHaveProperty('user', 'anonymous')
      expect(data).toHaveProperty('environment')
      expect(data.flags).toHaveProperty('DARK_MODE')
      expect(data.flags).toHaveProperty('ENHANCED_ANALYZER')
    })

    it('should return feature flags for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      })
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.user).toBe('user@example.com')
      expect(data.flags).toBeDefined()
      expect(typeof data.flags).toBe('object')
    })

    it('should return feature flags for admin user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      })
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.user).toBe('admin@zenith.engineer')
      expect(data.flags).toBeDefined()
    })

    it('should handle session errors gracefully', async () => {
      mockGetServerSession.mockRejectedValue(new Error('Session error'))
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to fetch feature flags')
    })

    it('should return correct flag status based on user permissions', async () => {
      // Test with beta user who should have access to AI content analysis
      FEATURE_FLAGS.AI_CONTENT_ANALYSIS.enabled = true
      
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'beta-123',
          email: 'beta@zenith.engineer',
        },
      })
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.flags.AI_CONTENT_ANALYSIS).toBe(true)
    })

    it('should respect environment restrictions', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })
      
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      })
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      // Team management should be disabled in production
      expect(data.flags.TEAM_MANAGEMENT).toBe(false)
      
      // Restore environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })
  })

  describe('POST /api/feature-flags', () => {
    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle',
          feature: 'DARK_MODE',
          value: false,
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error', 'Unauthorized')
    })

    it('should require admin privileges', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@example.com', // Not an admin email
        },
      })
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle',
          feature: 'DARK_MODE',
          value: false,
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error', 'Unauthorized')
    })

    it('should allow admin to toggle features', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      })
      
      const originalValue = FEATURE_FLAGS.DARK_MODE.enabled
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle',
          feature: 'DARK_MODE',
          value: false,
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.feature).toBe('DARK_MODE')
      expect(data.action).toBe('toggle')
      expect(data.value).toBe(false)
      expect(FEATURE_FLAGS.DARK_MODE.enabled).toBe(false)
      
      // Restore original value
      FEATURE_FLAGS.DARK_MODE.enabled = originalValue
    })

    it('should allow admin to update rollout percentage', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      })
      
      const originalValue = FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'rollout',
          feature: 'TEAM_MANAGEMENT',
          value: 75,
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.feature).toBe('TEAM_MANAGEMENT')
      expect(data.action).toBe('rollout')
      expect(data.value).toBe(75)
      expect(FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage).toBe(75)
      
      // Restore original value
      FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage = originalValue
    })

    it('should allow admin to add allowed users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      })
      
      const originalUsers = FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.allowedUsers
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'allowUser',
          feature: 'COMPETITIVE_INTELLIGENCE',
          value: 'new-user-123',
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.allowedUsers).toContain('new-user-123')
      
      // Restore original value
      FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.allowedUsers = originalUsers
    })

    it('should handle invalid feature names gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      })
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle',
          feature: 'NON_EXISTENT_FEATURE',
          value: true,
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      // Should still return success but not crash
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle invalid action types', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      })
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid_action',
          feature: 'DARK_MODE',
          value: true,
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      // Should still return success but not perform any action
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle malformed JSON gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      })
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: 'invalid json',
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to update feature flags')
    })

    it('should handle session errors during POST', async () => {
      mockGetServerSession.mockRejectedValue(new Error('Session error'))
      
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle',
          feature: 'DARK_MODE',
          value: false,
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to update feature flags')
    })

    it('should validate rollout percentage types', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      })
      
      const originalValue = FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage
      
      // Test with non-numeric value
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'rollout',
          feature: 'TEAM_MANAGEMENT',
          value: 'invalid',
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Rollout percentage should remain unchanged
      expect(FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage).toBe(originalValue)
    })

    it('should validate allowUser string types', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      })
      
      const originalUsers = FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.allowedUsers
      
      // Test with non-string value
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'allowUser',
          feature: 'COMPETITIVE_INTELLIGENCE',
          value: 123, // Should be string
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Allowed users should remain unchanged
      expect(FEATURE_FLAGS.COMPETITIVE_INTELLIGENCE.allowedUsers).toEqual(originalUsers)
    })
  })

  describe('API Integration Tests', () => {
    it('should maintain consistency between GET and POST operations', async () => {
      const adminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      }
      
      mockGetServerSession.mockResolvedValue(adminSession)
      
      // First, get current state
      const getRequest1 = new NextRequest('http://localhost:3000/api/feature-flags')
      const getResponse1 = await GET(getRequest1)
      const getData1 = await getResponse1.json()
      
      const originalDarkMode = getData1.flags.DARK_MODE
      
      // Toggle dark mode
      const postRequest = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle',
          feature: 'DARK_MODE',
          value: !originalDarkMode,
        }),
      })
      
      const postResponse = await POST(postRequest)
      expect(postResponse.status).toBe(200)
      
      // Get updated state
      const getRequest2 = new NextRequest('http://localhost:3000/api/feature-flags')
      const getResponse2 = await GET(getRequest2)
      const getData2 = await getResponse2.json()
      
      // Verify the change was applied
      expect(getData2.flags.DARK_MODE).toBe(!originalDarkMode)
      
      // Restore original state
      FEATURE_FLAGS.DARK_MODE.enabled = originalDarkMode
    })

    it('should handle concurrent requests safely', async () => {
      const adminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@zenith.engineer',
        },
      }
      
      mockGetServerSession.mockResolvedValue(adminSession)
      
      // Create multiple concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) => 
        new NextRequest('http://localhost:3000/api/feature-flags', {
          method: 'POST',
          body: JSON.stringify({
            action: 'rollout',
            feature: 'TEAM_MANAGEMENT',
            value: i * 10,
          }),
        })
      )
      
      // Execute all requests concurrently
      const responses = await Promise.all(
        requests.map(request => POST(request))
      )
      
      // All requests should succeed
      responses.forEach(async (response) => {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      })
      
      // The final value should be one of the requested values
      const finalValue = FEATURE_FLAGS.TEAM_MANAGEMENT.rolloutPercentage
      expect(finalValue).toBeGreaterThanOrEqual(0)
      expect(finalValue).toBeLessThanOrEqual(90)
    })
  })
})