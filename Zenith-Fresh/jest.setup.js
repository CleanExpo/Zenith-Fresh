import '@testing-library/jest-dom'

// Simple polyfills for Next.js API tests
global.Request = global.Request || class Request {}
global.Response = global.Response || class Response {}
global.fetch = global.fetch || jest.fn()

// Mock Next.js headers function
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn(),
  })),
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER = 'true'
process.env.NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT = 'true'
process.env.NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS = 'true'
process.env.NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE = 'true'

// Global test utilities
global.console = {
  ...console,
  // Suppress console errors in tests unless needed
  error: jest.fn(),
  warn: jest.fn(),
}