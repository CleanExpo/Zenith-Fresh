/**
 * Integration tests for Website Scanner service
 * Tests real service interactions with mocked external dependencies
 */

import { jest } from '@jest/globals'
import { websiteScanner } from '@/lib/services/website-scanner'

// Mock external dependencies
jest.mock('puppeteer-core', () => ({
  launch: jest.fn(),
}))

jest.mock('lighthouse', () => ({
  lighthouse: jest.fn(),
}))

jest.mock('cheerio', () => ({
  load: jest.fn(),
}))

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    scanResult: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock Chrome Launcher
jest.mock('chrome-launcher', () => ({
  launch: jest.fn(),
  kill: jest.fn(),
}))

const mockPuppeteer = require('puppeteer-core')
const mockLighthouse = require('lighthouse')
const mockCheerio = require('cheerio')
const mockRedis = require('@/lib/redis')
const mockPrisma = require('@/lib/prisma')
const mockChrome = require('chrome-launcher')

describe('Website Scanner Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockPuppeteer.launch.mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        goto: jest.fn(),
        content: jest.fn().mockResolvedValue('<html><body>Test</body></html>'),
        evaluate: jest.fn(),
        close: jest.fn(),
      }),
      close: jest.fn(),
    })

    mockLighthouse.lighthouse.mockResolvedValue({
      lhr: {
        categories: {
          performance: { score: 0.85 },
          accessibility: { score: 0.90 },
          'best-practices': { score: 0.95 },
          seo: { score: 0.80 },
        },
        audits: {
          'first-contentful-paint': { numericValue: 1200 },
          'largest-contentful-paint': { numericValue: 2400 },
          'first-input-delay': { numericValue: 100 },
          'cumulative-layout-shift': { numericValue: 0.1 },
        },
      },
    })

    mockCheerio.load.mockReturnValue({
      $: jest.fn(),
      html: jest.fn(),
    })

    mockRedis.redis.get.mockResolvedValue(null)
    mockRedis.redis.set.mockResolvedValue('OK')

    mockPrisma.prisma.scanResult.create.mockResolvedValue({
      id: 'scan-123',
      url: 'https://example.com',
      results: {},
      createdAt: new Date(),
    })

    mockChrome.launch.mockResolvedValue({
      port: 9222,
      pid: 1234,
    })
  })

  describe('scanWebsite', () => {
    it('should successfully scan a website', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      const result = await websiteScanner.scanWebsite(url, userId)

      expect(result).toHaveProperty('url', url)
      expect(result).toHaveProperty('performance')
      expect(result).toHaveProperty('seo')
      expect(result).toHaveProperty('accessibility')
      expect(result).toHaveProperty('security')
      expect(result).toHaveProperty('timestamp')
    })

    it('should handle invalid URLs', async () => {
      const invalidUrl = 'not-a-valid-url'
      const userId = 'user-123'

      await expect(websiteScanner.scanWebsite(invalidUrl, userId))
        .rejects.toThrow('Invalid URL')
    })

    it('should use cached results when available', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'
      const cachedResult = {
        url,
        performance: { score: 90 },
        timestamp: Date.now(),
      }

      mockRedis.redis.get.mockResolvedValue(JSON.stringify(cachedResult))

      const result = await websiteScanner.scanWebsite(url, userId)

      expect(result).toEqual(cachedResult)
      expect(mockPuppeteer.launch).not.toHaveBeenCalled()
    })

    it('should cache scan results', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      await websiteScanner.scanWebsite(url, userId)

      expect(mockRedis.redis.set).toHaveBeenCalledWith(
        expect.stringContaining(url),
        expect.any(String),
        'EX',
        3600 // 1 hour cache
      )
    })

    it('should save results to database', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      await websiteScanner.scanWebsite(url, userId)

      expect(mockPrisma.prisma.scanResult.create).toHaveBeenCalledWith({
        data: {
          url,
          userId,
          results: expect.any(Object),
          performanceScore: expect.any(Number),
          seoScore: expect.any(Number),
          accessibilityScore: expect.any(Number),
          securityScore: expect.any(Number),
        },
      })
    })

    it('should handle Lighthouse failures gracefully', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      mockLighthouse.lighthouse.mockRejectedValue(new Error('Lighthouse failed'))

      const result = await websiteScanner.scanWebsite(url, userId)

      // Should still return partial results
      expect(result).toHaveProperty('url', url)
      expect(result.performance.score).toBe(0) // Default score when Lighthouse fails
    })

    it('should handle Puppeteer failures', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      mockPuppeteer.launch.mockRejectedValue(new Error('Puppeteer failed'))

      await expect(websiteScanner.scanWebsite(url, userId))
        .rejects.toThrow('Scan failed')
    })

    it('should respect rate limiting', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      // Mock rate limit exceeded
      mockRedis.redis.get.mockResolvedValue('5') // 5 scans in time window

      await expect(websiteScanner.scanWebsite(url, userId))
        .rejects.toThrow('Rate limit exceeded')
    })

    it('should handle timeout properly', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      // Mock timeout
      mockPuppeteer.launch.mockImplementation(() =>
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      await expect(websiteScanner.scanWebsite(url, userId))
        .rejects.toThrow('Scan timeout')
    }, 10000) // 10 second timeout for this test
  })

  describe('getScanHistory', () => {
    it('should retrieve scan history for user', async () => {
      const userId = 'user-123'
      const mockScans = [
        {
          id: 'scan-1',
          url: 'https://example.com',
          performanceScore: 85,
          createdAt: new Date(),
        },
        {
          id: 'scan-2',
          url: 'https://test.com',
          performanceScore: 90,
          createdAt: new Date(),
        },
      ]

      mockPrisma.prisma.scanResult.findMany.mockResolvedValue(mockScans)

      const history = await websiteScanner.getScanHistory(userId)

      expect(history).toEqual(mockScans)
      expect(mockPrisma.prisma.scanResult.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    })

    it('should handle empty scan history', async () => {
      const userId = 'user-123'

      mockPrisma.prisma.scanResult.findMany.mockResolvedValue([])

      const history = await websiteScanner.getScanHistory(userId)

      expect(history).toEqual([])
    })

    it('should handle database errors', async () => {
      const userId = 'user-123'

      mockPrisma.prisma.scanResult.findMany.mockRejectedValue(
        new Error('Database error')
      )

      await expect(websiteScanner.getScanHistory(userId))
        .rejects.toThrow('Failed to retrieve scan history')
    })
  })

  describe('Performance Analysis', () => {
    it('should analyze Core Web Vitals correctly', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      mockLighthouse.lighthouse.mockResolvedValue({
        lhr: {
          categories: {
            performance: { score: 0.85 },
          },
          audits: {
            'first-contentful-paint': { numericValue: 1200 },
            'largest-contentful-paint': { numericValue: 2400 },
            'first-input-delay': { numericValue: 100 },
            'cumulative-layout-shift': { numericValue: 0.1 },
            'speed-index': { numericValue: 2000 },
          },
        },
      })

      const result = await websiteScanner.scanWebsite(url, userId)

      expect(result.performance.metrics).toEqual({
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2400,
        firstInputDelay: 100,
        cumulativeLayoutShift: 0.1,
        speedIndex: 2000,
      })
    })

    it('should identify performance opportunities', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      mockLighthouse.lighthouse.mockResolvedValue({
        lhr: {
          categories: {
            performance: { score: 0.60 }, // Low score
          },
          audits: {
            'unused-css-rules': {
              score: 0.5,
              details: { overallSavingsMs: 500 },
            },
            'optimize-images': {
              score: 0.3,
              details: { overallSavingsBytes: 1000000 },
            },
          },
        },
      })

      const result = await websiteScanner.scanWebsite(url, userId)

      expect(result.performance.opportunities).toContainEqual(
        expect.objectContaining({
          id: 'optimize-images',
          impact: 'high',
        })
      )
    })
  })

  describe('SEO Analysis', () => {
    it('should analyze SEO fundamentals', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'
      const mockHtml = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
          </head>
          <body>
            <h1>Main Title</h1>
            <p>Content</p>
          </body>
        </html>
      `

      const mockCheerioInstance = {
        $: jest.fn(),
        html: jest.fn().mockReturnValue(mockHtml),
      }

      mockCheerio.load.mockReturnValue(mockCheerioInstance)
      mockCheerioInstance.$.mockImplementation((selector) => {
        const elements = {
          'title': { text: () => 'Test Page', length: 1 },
          'meta[name="description"]': { attr: () => 'Test description', length: 1 },
          'h1': { length: 1 },
          'img:not([alt])': { length: 0 },
        }
        return elements[selector] || { length: 0 }
      })

      mockPuppeteer.launch.mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
          goto: jest.fn(),
          content: jest.fn().mockResolvedValue(mockHtml),
          evaluate: jest.fn(),
          close: jest.fn(),
        }),
        close: jest.fn(),
      })

      const result = await websiteScanner.scanWebsite(url, userId)

      expect(result.seo.score).toBeGreaterThan(0)
      expect(result.seo.issues).toEqual(expect.any(Array))
    })

    it('should detect missing meta tags', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'
      const mockHtml = '<html><head><title>Test</title></head><body></body></html>'

      const mockCheerioInstance = {
        $: jest.fn(),
        html: jest.fn().mockReturnValue(mockHtml),
      }

      mockCheerio.load.mockReturnValue(mockCheerioInstance)
      mockCheerioInstance.$.mockImplementation((selector) => {
        if (selector === 'meta[name="description"]') {
          return { length: 0 } // No meta description
        }
        return { length: 1 }
      })

      mockPuppeteer.launch.mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
          goto: jest.fn(),
          content: jest.fn().mockResolvedValue(mockHtml),
          evaluate: jest.fn(),
          close: jest.fn(),
        }),
        close: jest.fn(),
      })

      const result = await websiteScanner.scanWebsite(url, userId)

      expect(result.seo.issues).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('meta description'),
        })
      )
    })
  })

  describe('Security Analysis', () => {
    it('should check for HTTPS', async () => {
      const url = 'http://example.com' // HTTP instead of HTTPS
      const userId = 'user-123'

      const result = await websiteScanner.scanWebsite(url, userId)

      expect(result.security.vulnerabilities).toContainEqual(
        expect.objectContaining({
          severity: 'high',
          type: 'insecure-protocol',
        })
      )
    })

    it('should analyze security headers', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      mockPuppeteer.launch.mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
          goto: jest.fn().mockResolvedValue({
            headers: () => ({
              'content-security-policy': 'default-src \'self\'',
              'x-frame-options': 'DENY',
            }),
          }),
          content: jest.fn().mockResolvedValue('<html></html>'),
          evaluate: jest.fn(),
          close: jest.fn(),
        }),
        close: jest.fn(),
      })

      const result = await websiteScanner.scanWebsite(url, userId)

      expect(result.security.score).toBeGreaterThan(0)
      expect(result.security.recommendations).toEqual(expect.any(Array))
    })
  })

  describe('Accessibility Analysis', () => {
    it('should use axe-core for accessibility testing', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      mockPuppeteer.launch.mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
          goto: jest.fn(),
          content: jest.fn().mockResolvedValue('<html></html>'),
          evaluate: jest.fn().mockResolvedValue({
            violations: [
              {
                id: 'color-contrast',
                impact: 'moderate',
                description: 'Low color contrast',
                nodes: [{ target: ['button'] }],
              },
            ],
            passes: [],
            incomplete: [],
          }),
          close: jest.fn(),
        }),
        close: jest.fn(),
      })

      const result = await websiteScanner.scanWebsite(url, userId)

      expect(result.accessibility.violations).toContainEqual(
        expect.objectContaining({
          id: 'color-contrast',
          impact: 'moderate',
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should cleanup resources on error', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      const mockBrowser = {
        newPage: jest.fn(),
        close: jest.fn(),
      }

      mockPuppeteer.launch.mockResolvedValue(mockBrowser)
      mockBrowser.newPage.mockRejectedValue(new Error('Page error'))

      await expect(websiteScanner.scanWebsite(url, userId))
        .rejects.toThrow()

      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('should handle Chrome launcher failures', async () => {
      const url = 'https://example.com'
      const userId = 'user-123'

      mockChrome.launch.mockRejectedValue(new Error('Chrome failed to launch'))

      await expect(websiteScanner.scanWebsite(url, userId))
        .rejects.toThrow('Chrome failed to launch')
    })
  })

  describe('Concurrent Scanning', () => {
    it('should handle multiple concurrent scans', async () => {
      const urls = [
        'https://example1.com',
        'https://example2.com',
        'https://example3.com',
      ]
      const userId = 'user-123'

      const promises = urls.map(url => websiteScanner.scanWebsite(url, userId))
      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.url).toBe(urls[index])
      })
    })

    it('should respect concurrent scan limits', async () => {
      const urls = Array.from({ length: 10 }, (_, i) => `https://example${i}.com`)
      const userId = 'user-123'

      // Mock concurrent limit exceeded
      mockRedis.redis.get.mockImplementation((key) => {
        if (key.includes('concurrent')) {
          return Promise.resolve('5') // Max concurrent scans
        }
        return Promise.resolve(null)
      })

      const promises = urls.map(url => websiteScanner.scanWebsite(url, userId))
      
      await expect(Promise.all(promises))
        .rejects.toThrow('Too many concurrent scans')
    })
  })
})