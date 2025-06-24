/**
 * A/B Testing utilities
 */

export interface ABTestConfig {
  experimentId: string;
  variants: string[];
  userId?: string;
  teamId?: string;
}

export interface ConversionEvent {
  experimentId: string;
  variant: string;
  userId?: string;
  eventType: string;
  properties?: Record<string, any>;
}

/**
 * Get the assigned variant for a user in an A/B test
 */
export function getUserVariant(config: ABTestConfig): string {
  // Simple hash-based assignment for consistent user experience
  const { experimentId, variants, userId } = config;
  
  if (!userId || variants.length === 0) {
    return variants[0] || 'control';
  }
  
  // Create a simple hash from userId and experimentId
  let hash = 0;
  const input = `${userId}-${experimentId}`;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % variants.length;
  return variants[index];
}

/**
 * Track a conversion event for an A/B test
 */
export async function trackConversion(event: ConversionEvent): Promise<void> {
  try {
    // In a real implementation, this would send data to an analytics service
    console.log('AB Test Conversion:', event);
    
    // Store in localStorage for demo purposes
    const key = `ab-test-${event.experimentId}`;
    const existing = localStorage.getItem(key);
    const data = existing ? JSON.parse(existing) : { conversions: [] };
    
    data.conversions.push({
      ...event,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to track A/B test conversion:', error);
  }
}

/**
 * Get A/B test results (for admin/analytics)
 */
export function getExperimentResults(experimentId: string) {
  try {
    const key = `ab-test-${experimentId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get experiment results:', error);
    return null;
  }
}

export default {
  getUserVariant,
  trackConversion,
  getExperimentResults
};