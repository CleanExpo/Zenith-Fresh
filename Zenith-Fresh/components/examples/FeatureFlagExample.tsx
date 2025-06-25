/**
 * Example component demonstrating feature flag usage
 * This shows real-world patterns for implementing feature flags
 */

'use client'

import React, { useState, useEffect } from 'react'
import { FeatureFlag, useFeatureFlags, FeatureFlagDebugger } from '@/components/FeatureFlag'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

/**
 * Main example dashboard showing different feature flag patterns
 */
export function FeatureFlagExampleDashboard() {
  const [darkMode, setDarkMode] = useState(false)
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'beta'>('user')
  
  // Use the hook to check multiple flags at once
  const flags = useFeatureFlags([
    'DARK_MODE',
    'ENHANCED_ANALYZER',
    'TEAM_MANAGEMENT',
    'AI_CONTENT_ANALYSIS',
    'COMPETITIVE_INTELLIGENCE'
  ])

  // Simulate user role change affecting feature access
  useEffect(() => {
    // In a real app, this would come from user context/session
    const roles = ['user', 'admin', 'beta'] as const
    const interval = setInterval(() => {
      setUserRole(roles[Math.floor(Math.random() * roles.length)])
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      flags.DARK_MODE && darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Feature Flag Demo Dashboard</h1>
          <p className="text-lg opacity-75">
            Current user role: <span className="font-semibold">{userRole}</span>
          </p>
          
          {/* Dark mode toggle - only shown if dark mode feature is enabled */}
          <FeatureFlag feature="DARK_MODE">
            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="rounded"
                />
                <span>Enable Dark Mode</span>
              </label>
            </div>
          </FeatureFlag>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Always available feature */}
          <FeatureCard
            title="Website Health Analyzer"
            description="Basic website analysis and health checks"
            status="Always Available"
            className="border-green-500"
          >
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors">
              Analyze Website
            </button>
          </FeatureCard>

          {/* Enhanced analyzer with feature flag */}
          <FeatureFlag 
            feature="ENHANCED_ANALYZER"
            fallback={
              <FeatureCard
                title="Enhanced Analyzer"
                description="Advanced analysis features"
                status="Coming Soon"
                className="border-gray-300 opacity-50"
              >
                <div className="w-full bg-gray-300 text-gray-600 py-2 px-4 rounded cursor-not-allowed">
                  Not Available
                </div>
              </FeatureCard>
            }
          >
            <FeatureCard
              title="Enhanced Website Analyzer"
              description="Advanced analysis with PDF reports, scheduling, and detailed insights"
              status="Enhanced Features"
              className="border-blue-500"
            >
              <div className="space-y-2">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                  Generate PDF Report
                </button>
                <button className="w-full bg-blue-100 text-blue-800 py-2 px-4 rounded hover:bg-blue-200 transition-colors">
                  Schedule Analysis
                </button>
              </div>
            </FeatureCard>
          </FeatureFlag>

          {/* Team management with role-based access */}
          <FeatureFlag 
            feature="TEAM_MANAGEMENT"
            fallback={
              <FeatureCard
                title="Team Management"
                description="Collaborate with team members"
                status="Beta Testing"
                className="border-orange-300 opacity-50"
              >
                <div className="w-full bg-orange-300 text-orange-800 py-2 px-4 rounded cursor-not-allowed">
                  Beta Access Only
                </div>
              </FeatureCard>
            }
          >
            <FeatureCard
              title="Team Management"
              description="Invite team members, manage permissions, and collaborate on projects"
              status="Beta Available"
              className="border-orange-500"
            >
              <div className="space-y-2">
                <button className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors">
                  Invite Team Members
                </button>
                <button className="w-full bg-orange-100 text-orange-800 py-2 px-4 rounded hover:bg-orange-200 transition-colors">
                  Manage Permissions
                </button>
              </div>
            </FeatureCard>
          </FeatureFlag>

          {/* AI content analysis - restricted feature */}
          <FeatureFlag 
            feature="AI_CONTENT_ANALYSIS"
            fallback={
              <FeatureCard
                title="AI Content Analysis"
                description="AI-powered content optimization"
                status="Limited Access"
                className="border-purple-300 opacity-50"
              >
                <div className="w-full bg-purple-300 text-purple-800 py-2 px-4 rounded cursor-not-allowed">
                  {userRole === 'admin' ? 'Enable in Settings' : 'Admin Access Required'}
                </div>
              </FeatureCard>
            }
          >
            <FeatureCard
              title="AI Content Analysis"
              description="Advanced AI-powered content optimization and recommendations"
              status="AI Enabled"
              className="border-purple-500"
            >
              <div className="space-y-2">
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors">
                  Analyze Content
                </button>
                <button className="w-full bg-purple-100 text-purple-800 py-2 px-4 rounded hover:bg-purple-200 transition-colors">
                  Get AI Recommendations
                </button>
              </div>
            </FeatureCard>
          </FeatureFlag>

          {/* Competitive intelligence - admin only */}
          <FeatureFlag 
            feature="COMPETITIVE_INTELLIGENCE"
            fallback={
              <FeatureCard
                title="Competitive Intelligence"
                description="Market analysis and competitor insights"
                status="Admin Only"
                className="border-red-300 opacity-50"
              >
                <div className="w-full bg-red-300 text-red-800 py-2 px-4 rounded cursor-not-allowed">
                  Admin Access Required
                </div>
              </FeatureCard>
            }
          >
            <FeatureCard
              title="Competitive Intelligence"
              description="Advanced market analysis, competitor tracking, and strategic insights"
              status="Enterprise Feature"
              className="border-red-500"
            >
              <div className="space-y-2">
                <button className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors">
                  View Competitor Analysis
                </button>
                <button className="w-full bg-red-100 text-red-800 py-2 px-4 rounded hover:bg-red-200 transition-colors">
                  Market Intelligence
                </button>
              </div>
            </FeatureCard>
          </FeatureFlag>

          {/* Feature flag status card */}
          <FeatureCard
            title="Feature Flag Status"
            description="Current feature availability"
            status="Debug Info"
            className="border-gray-500"
          >
            <div className="space-y-2 text-sm">
              {Object.entries(flags).map(([flag, enabled]) => (
                <div key={flag} className="flex justify-between items-center">
                  <span className="font-mono text-xs">{flag}:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </FeatureCard>
        </div>

        {/* Nested feature flags example */}
        <div className="mt-8">
          <FeatureFlag feature="ENHANCED_ANALYZER">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Enhanced Features Section</h2>
              <p className="mb-4">This section is only visible when enhanced analyzer is enabled.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureFlag feature="TEAM_MANAGEMENT">
                  <div className="bg-white p-4 rounded border">
                    <h3 className="font-semibold">Team Collaboration</h3>
                    <p className="text-sm text-gray-600">Share reports with team members</p>
                  </div>
                </FeatureFlag>
                
                <FeatureFlag feature="AI_CONTENT_ANALYSIS">
                  <div className="bg-white p-4 rounded border">
                    <h3 className="font-semibold">AI Insights</h3>
                    <p className="text-sm text-gray-600">Get AI-powered recommendations</p>
                  </div>
                </FeatureFlag>
              </div>
            </div>
          </FeatureFlag>
        </div>

        {/* Admin panel - only for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8">
            <AdminPanel />
          </div>
        )}
      </div>

      {/* Feature flag debugger */}
      <FeatureFlagDebugger />
    </div>
  )
}

/**
 * Reusable feature card component
 */
interface FeatureCardProps {
  title: string
  description: string
  status: string
  className?: string
  children: React.ReactNode
}

function FeatureCard({ title, description, status, className = '', children }: FeatureCardProps) {
  return (
    <div className={`border-2 rounded-lg p-6 transition-all duration-300 hover:shadow-lg ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm opacity-75 mb-2">{description}</p>
        <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
          {status}
        </span>
      </div>
      {children}
    </div>
  )
}

/**
 * Admin panel for testing feature flags
 */
function AdminPanel() {
  const [apiFlags, setApiFlags] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  const fetchFlags = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feature-flags')
      const data = await response.json()
      setApiFlags(data.flags)
    } catch (error) {
      console.error('Failed to fetch flags:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFlag = async (flagName: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          feature: flagName,
          value: enabled,
        }),
      })
      
      if (response.ok) {
        await fetchFlags() // Refresh flags
      }
    } catch (error) {
      console.error('Failed to toggle flag:', error)
    }
  }

  useEffect(() => {
    fetchFlags()
  }, [])

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Admin Panel (Development Only)</h3>
        <button
          onClick={fetchFlags}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(FEATURE_FLAGS).map(([flagName, flagConfig]) => (
          <div key={flagName} className="bg-white p-4 rounded border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-sm">{flagConfig.name}</h4>
              <span className={`px-2 py-1 text-xs rounded ${
                apiFlags[flagName] 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {apiFlags[flagName] ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3">{flagConfig.description}</p>
            <div className="space-y-2">
              <div className="text-xs">
                <span className="font-semibold">Rollout:</span> {flagConfig.rolloutPercentage}%
              </div>
              <div className="text-xs">
                <span className="font-semibold">Environments:</span> {flagConfig.environments?.join(', ')}
              </div>
              <button
                onClick={() => toggleFlag(flagName, !apiFlags[flagName])}
                className={`w-full px-3 py-1 text-xs rounded transition-colors ${
                  apiFlags[flagName]
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {apiFlags[flagName] ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Simple example showing basic usage patterns
 */
export function SimpleFeatureFlagExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Simple Feature Flag Examples</h2>
      
      {/* Basic usage */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Basic Usage</h3>
        <FeatureFlag feature="DARK_MODE">
          <div className="bg-gray-800 text-white p-4 rounded">
            Dark mode is enabled! This content is only visible when the dark mode feature flag is on.
          </div>
        </FeatureFlag>
      </div>

      {/* With fallback */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">With Fallback</h3>
        <FeatureFlag 
          feature="TEAM_MANAGEMENT"
          fallback={
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded">
              Team management features are coming soon!
            </div>
          }
        >
          <div className="bg-green-100 text-green-800 p-4 rounded">
            Team management is available! You can now invite team members.
          </div>
        </FeatureFlag>
      </div>

      {/* Using the hook */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Using useFeatureFlags Hook</h3>
        <FeatureFlagHookExample />
      </div>
    </div>
  )
}

/**
 * Example component using the useFeatureFlags hook
 */
function FeatureFlagHookExample() {
  const flags = useFeatureFlags(['DARK_MODE', 'ENHANCED_ANALYZER', 'TEAM_MANAGEMENT'])
  
  return (
    <div className="bg-gray-50 p-4 rounded">
      <h4 className="font-semibold mb-2">Current Feature Status:</h4>
      <ul className="space-y-1">
        <li>Dark Mode: {flags.DARK_MODE ? '✅ Enabled' : '❌ Disabled'}</li>
        <li>Enhanced Analyzer: {flags.ENHANCED_ANALYZER ? '✅ Enabled' : '❌ Disabled'}</li>
        <li>Team Management: {flags.TEAM_MANAGEMENT ? '✅ Enabled' : '❌ Disabled'}</li>
      </ul>
      
      {flags.ENHANCED_ANALYZER && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
          Enhanced features are available! You can access advanced analytics.
        </div>
      )}
    </div>
  )
}

export default FeatureFlagExampleDashboard