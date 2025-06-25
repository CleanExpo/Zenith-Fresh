/**
 * Tests for React Feature Flag components and hooks
 */

import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { FeatureFlag, useFeatureFlags, FeatureFlagDebugger } from '@/components/FeatureFlag'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

// Mock the feature flags library
jest.mock('@/lib/feature-flags', () => ({
  useFeatureFlag: jest.fn(),
  FEATURE_FLAGS: {
    DARK_MODE: {
      name: 'Dark Mode',
      description: 'Dark theme support',
      enabled: true,
      rolloutPercentage: 100,
      environments: ['development', 'staging', 'production'],
    },
    ENHANCED_ANALYZER: {
      name: 'Enhanced Website Analyzer', 
      description: 'Advanced website analysis features',
      enabled: true,
      rolloutPercentage: 100,
      environments: ['development', 'staging', 'production'],
    },
    TEAM_MANAGEMENT: {
      name: 'Team Management',
      description: 'Team collaboration features',
      enabled: false,
      rolloutPercentage: 50,
      environments: ['development', 'staging'],
    },
    AI_CONTENT_ANALYSIS: {
      name: 'AI-Powered Content Analysis',
      description: 'AI-driven content optimization',
      enabled: false,
      rolloutPercentage: 10,
      environments: ['development', 'staging'],
    },
  },
}))

const mockUseFeatureFlag = require('@/lib/feature-flags').useFeatureFlag as jest.MockedFunction<any>

describe('FeatureFlag Component', () => {
  beforeEach(() => {
    mockUseFeatureFlag.mockClear()
  })

  it('should render children when feature is enabled', () => {
    mockUseFeatureFlag.mockReturnValue(true)
    
    render(
      <FeatureFlag feature="DARK_MODE">
        <div>Feature is enabled!</div>
      </FeatureFlag>
    )
    
    expect(screen.getByText('Feature is enabled!')).toBeInTheDocument()
    expect(mockUseFeatureFlag).toHaveBeenCalledWith('DARK_MODE')
  })

  it('should not render children when feature is disabled', () => {
    mockUseFeatureFlag.mockReturnValue(false)
    
    render(
      <FeatureFlag feature="TEAM_MANAGEMENT">
        <div>Feature is enabled!</div>
      </FeatureFlag>
    )
    
    expect(screen.queryByText('Feature is enabled!')).not.toBeInTheDocument()
  })

  it('should render fallback when feature is disabled and fallback provided', () => {
    mockUseFeatureFlag.mockReturnValue(false)
    
    render(
      <FeatureFlag 
        feature="TEAM_MANAGEMENT" 
        fallback={<div>Feature coming soon!</div>}
      >
        <div>Feature is enabled!</div>
      </FeatureFlag>
    )
    
    expect(screen.queryByText('Feature is enabled!')).not.toBeInTheDocument()
    expect(screen.getByText('Feature coming soon!')).toBeInTheDocument()
  })

  it('should handle complex children content', () => {
    mockUseFeatureFlag.mockReturnValue(true)
    
    render(
      <FeatureFlag feature="ENHANCED_ANALYZER">
        <div>
          <h1>Enhanced Analyzer</h1>
          <p>Advanced features available!</p>
          <button>Get Started</button>
        </div>
      </FeatureFlag>
    )
    
    expect(screen.getByText('Enhanced Analyzer')).toBeInTheDocument()
    expect(screen.getByText('Advanced features available!')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('should handle nested feature flags', () => {
    mockUseFeatureFlag
      .mockReturnValueOnce(true)  // ENHANCED_ANALYZER
      .mockReturnValueOnce(false) // AI_CONTENT_ANALYSIS
    
    render(
      <FeatureFlag feature="ENHANCED_ANALYZER">
        <div>
          <h1>Enhanced Analyzer</h1>
          <FeatureFlag feature="AI_CONTENT_ANALYSIS">
            <p>AI features enabled</p>
          </FeatureFlag>
          <p>Basic features</p>
        </div>
      </FeatureFlag>
    )
    
    expect(screen.getByText('Enhanced Analyzer')).toBeInTheDocument()
    expect(screen.getByText('Basic features')).toBeInTheDocument()
    expect(screen.queryByText('AI features enabled')).not.toBeInTheDocument()
  })
})

describe('useFeatureFlags Hook', () => {
  beforeEach(() => {
    mockUseFeatureFlag.mockClear()
  })

  it('should return status for multiple features', () => {
    mockUseFeatureFlag
      .mockReturnValueOnce(true)  // DARK_MODE
      .mockReturnValueOnce(false) // TEAM_MANAGEMENT
      .mockReturnValueOnce(true)  // ENHANCED_ANALYZER
    
    const TestComponent = () => {
      const flags = useFeatureFlags(['DARK_MODE', 'TEAM_MANAGEMENT', 'ENHANCED_ANALYZER'])
      
      return (
        <div>
          {flags.DARK_MODE && <div>Dark mode enabled</div>}
          {flags.TEAM_MANAGEMENT && <div>Team management enabled</div>}
          {flags.ENHANCED_ANALYZER && <div>Enhanced analyzer enabled</div>}
        </div>
      )
    }
    
    render(<TestComponent />)
    
    expect(screen.getByText('Dark mode enabled')).toBeInTheDocument()
    expect(screen.queryByText('Team management enabled')).not.toBeInTheDocument()
    expect(screen.getByText('Enhanced analyzer enabled')).toBeInTheDocument()
    
    // Verify hook was called for each feature
    expect(mockUseFeatureFlag).toHaveBeenCalledTimes(3)
    expect(mockUseFeatureFlag).toHaveBeenCalledWith('DARK_MODE')
    expect(mockUseFeatureFlag).toHaveBeenCalledWith('TEAM_MANAGEMENT')
    expect(mockUseFeatureFlag).toHaveBeenCalledWith('ENHANCED_ANALYZER')
  })

  it('should handle empty feature array', () => {
    const TestComponent = () => {
      const flags = useFeatureFlags([])
      
      return (
        <div>
          Features count: {Object.keys(flags).length}
        </div>
      )
    }
    
    render(<TestComponent />)
    
    expect(screen.getByText('Features count: 0')).toBeInTheDocument()
    expect(mockUseFeatureFlag).not.toHaveBeenCalled()
  })

  it('should re-render when feature flags change', () => {
    let toggleFlag = true
    mockUseFeatureFlag.mockImplementation(() => toggleFlag)
    
    const TestComponent = () => {
      const flags = useFeatureFlags(['DARK_MODE'])
      
      return (
        <div>
          {flags.DARK_MODE ? 'Enabled' : 'Disabled'}
        </div>
      )
    }
    
    const { rerender } = render(<TestComponent />)
    expect(screen.getByText('Enabled')).toBeInTheDocument()
    
    // Change flag value and re-render
    toggleFlag = false
    rerender(<TestComponent />)
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })
})

describe('FeatureFlagDebugger Component', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    mockUseFeatureFlag.mockClear()
  })

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
      configurable: true
    })
  })

  it('should not render in production', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true
    })
    
    render(<FeatureFlagDebugger />)
    
    expect(screen.queryByText('Feature Flags')).not.toBeInTheDocument()
  })

  it('should render in development', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    })
    
    // Mock useFeatureFlags to return some flags
    mockUseFeatureFlag
      .mockReturnValueOnce(true)  // DARK_MODE
      .mockReturnValueOnce(false) // ENHANCED_ANALYZER
      .mockReturnValueOnce(true)  // TEAM_MANAGEMENT
      .mockReturnValueOnce(false) // AI_CONTENT_ANALYSIS
    
    render(<FeatureFlagDebugger />)
    
    expect(screen.getByText('Feature Flags')).toBeInTheDocument()
  })

  it('should show all feature flags with status', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    })
    
    // Mock the hook to return specific flag states
    mockUseFeatureFlag
      .mockReturnValueOnce(true)  // DARK_MODE
      .mockReturnValueOnce(true)  // ENHANCED_ANALYZER
      .mockReturnValueOnce(false) // TEAM_MANAGEMENT
      .mockReturnValueOnce(false) // AI_CONTENT_ANALYSIS
    
    render(<FeatureFlagDebugger />)
    
    expect(screen.getByText('Feature Flags')).toBeInTheDocument()
    
    // Check for feature names and their status
    const flagElements = screen.getByText('Feature Flags').parentElement
    expect(flagElements).toHaveTextContent('DARK_MODE')
    expect(flagElements).toHaveTextContent('ENHANCED_ANALYZER')
    expect(flagElements).toHaveTextContent('TEAM_MANAGEMENT')
    expect(flagElements).toHaveTextContent('AI_CONTENT_ANALYSIS')
    
    // Check for ON/OFF status indicators
    expect(flagElements).toHaveTextContent('ON')
    expect(flagElements).toHaveTextContent('OFF')
  })

  it('should update when flag states change', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    })
    
    let darkModeEnabled = true
    mockUseFeatureFlag.mockImplementation((flag: string) => {
      if (flag === 'DARK_MODE') return darkModeEnabled
      return false
    })
    
    const { rerender } = render(<FeatureFlagDebugger />)
    
    // Initially dark mode should be ON
    const debugger1 = screen.getByText('Feature Flags').parentElement
    expect(debugger1?.textContent).toContain('DARK_MODE')
    
    // Change flag state
    darkModeEnabled = false
    rerender(<FeatureFlagDebugger />)
    
    // Should reflect the change
    const debugger2 = screen.getByText('Feature Flags').parentElement
    expect(debugger2?.textContent).toContain('DARK_MODE')
  })
})

describe('Integration Tests', () => {
  beforeEach(() => {
    mockUseFeatureFlag.mockClear()
  })

  it('should work together in a realistic component', () => {
    // Simulate a dashboard with multiple feature-flagged sections
    mockUseFeatureFlag
      .mockReturnValueOnce(true)  // ENHANCED_ANALYZER
      .mockReturnValueOnce(false) // TEAM_MANAGEMENT
      .mockReturnValueOnce(true)  // DARK_MODE
      .mockReturnValueOnce(false) // AI_CONTENT_ANALYSIS
    
    const Dashboard = () => {
      const flags = useFeatureFlags(['DARK_MODE', 'TEAM_MANAGEMENT'])
      
      return (
        <div className={flags.DARK_MODE ? 'dark' : 'light'}>
          <h1>Dashboard</h1>
          
          <FeatureFlag feature="ENHANCED_ANALYZER">
            <section>Enhanced Website Analyzer</section>
          </FeatureFlag>
          
          <FeatureFlag 
            feature="TEAM_MANAGEMENT" 
            fallback={<div>Team features coming soon!</div>}
          >
            <section>Team Management</section>
          </FeatureFlag>
          
          <FeatureFlag feature="AI_CONTENT_ANALYSIS">
            <section>AI Content Analysis</section>
          </FeatureFlag>
          
          <FeatureFlagDebugger />
        </div>
      )
    }
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    })
    render(<Dashboard />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Enhanced Website Analyzer')).toBeInTheDocument()
    expect(screen.getByText('Team features coming soon!')).toBeInTheDocument()
    expect(screen.queryByText('Team Management')).not.toBeInTheDocument()
    expect(screen.queryByText('AI Content Analysis')).not.toBeInTheDocument()
    
    // Should have dark theme class
    const dashboard = screen.getByText('Dashboard').parentElement
    expect(dashboard).toHaveClass('dark')
  })

  it('should handle rapid flag changes gracefully', () => {
    let enabled = true
    mockUseFeatureFlag.mockImplementation(() => enabled)
    
    const TestComponent = () => (
      <FeatureFlag feature="DARK_MODE">
        <div>Content</div>
      </FeatureFlag>
    )
    
    const { rerender } = render(<TestComponent />)
    expect(screen.getByText('Content')).toBeInTheDocument()
    
    // Rapidly toggle flag
    for (let i = 0; i < 10; i++) {
      enabled = !enabled
      rerender(<TestComponent />)
      
      if (enabled) {
        expect(screen.getByText('Content')).toBeInTheDocument()
      } else {
        expect(screen.queryByText('Content')).not.toBeInTheDocument()
      }
    }
  })
})