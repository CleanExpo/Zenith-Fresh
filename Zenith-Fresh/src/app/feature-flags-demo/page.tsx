/**
 * Feature Flag Demo Page
 * This page demonstrates the feature flag system in action
 */

import { FeatureFlagExampleDashboard } from '@/components/examples/FeatureFlagExample'

export default function FeatureFlagDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FeatureFlagExampleDashboard />
    </div>
  )
}

export const metadata = {
  title: 'Feature Flag Demo - Zenith Platform',
  description: 'Interactive demonstration of the feature flag system',
}