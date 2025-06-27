/**
 * Experiment Provider
 * Context provider for A/B testing experiments
 */

'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  UserContext,
  AllocateUserResponse,
  ABTestingConfig
} from '../../types/ab-testing';

interface ExperimentContextValue {
  // Configuration
  config: ABTestingConfig;
  isEnabled: boolean;
  
  // User context
  userContext: UserContext;
  
  // Active experiments
  activeExperiments: Record<string, AllocateUserResponse>;
  
  // Methods
  enrollInExperiment: (experimentId: string, forceVariant?: string) => Promise<AllocateUserResponse>;
  trackEvent: (experimentId: string, eventType: string, eventValue?: number, eventData?: Record<string, any>) => Promise<void>;
  getVariant: (experimentId: string) => string | null;
  getConfiguration: (experimentId: string) => Record<string, any> | null;
  getFeatureFlag: (experimentId: string, flagKey: string, defaultValue?: any) => any;
  isInExperiment: (experimentId: string) => boolean;
  
  // Batch operations
  trackEvents: (events: Array<{
    experimentId: string;
    eventType: string;
    eventValue?: number;
    eventData?: Record<string, any>;
  }>) => Promise<void>;
  
  // Debugging
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  getDebugInfo: () => Record<string, any>;
}

const ExperimentContext = createContext<ExperimentContextValue | null>(null);

interface ExperimentProviderProps {
  children: React.ReactNode;
  config?: Partial<ABTestingConfig>;
  userContext?: Partial<UserContext>;
  debugMode?: boolean;
}

/**
 * Provider component for A/B testing experiments
 */
export function ExperimentProvider({
  children,
  config: userConfig = {},
  userContext: userProvidedContext = {},
  debugMode: initialDebugMode = false
}: ExperimentProviderProps) {
  const { data: session } = useSession();
  const [activeExperiments, setActiveExperiments] = useState<Record<string, AllocateUserResponse>>({});
  const [debugMode, setDebugMode] = useState(initialDebugMode);
  const [eventQueue, setEventQueue] = useState<Array<any>>([]);

  // Default configuration
  const defaultConfig: ABTestingConfig = {
    enabled: true,
    defaultConfidenceLevel: 0.95,
    defaultMinimumDetectableEffect: 0.05,
    defaultStatisticalPower: 0.8,
    defaultMinimumSampleSize: 100,
    defaultMinimumRuntime: 7,
    defaultMaxRuntime: 30,
    enableSequentialTesting: true,
    enableBayesianAnalysis: false,
    enableMultivariateTesting: true,
    enableHoldoutGroups: true,
    enableContaminationDetection: true,
    maxActiveExperiments: 10,
    allowedMetrics: ['conversion', 'click', 'signup', 'purchase', 'retention'],
    bucketing: {
      algorithm: 'deterministic',
      hashSalt: 'zenith-ab-test'
    },
    analytics: {
      provider: 'internal',
      batchSize: 10,
      flushInterval: 5000
    }
  };

  const config = { ...defaultConfig, ...userConfig };

  // Enhanced user context
  const userContext: UserContext = {
    userId: session?.user?.id,
    sessionId: typeof window !== 'undefined' ? getSessionId() : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ipAddress: undefined, // Will be set by server
    platform: 'web',
    ...userProvidedContext
  };

  // Load active experiments from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('ab_test_experiments');
      if (stored) {
        const experiments = JSON.parse(stored);
        // Filter out expired experiments (older than 24 hours)
        const now = Date.now();
        const validExperiments: Record<string, AllocateUserResponse> = {};
        
        for (const [id, data] of Object.entries(experiments)) {
          const experimentData = data as any;
          if (experimentData.timestamp && (now - experimentData.timestamp) < 24 * 60 * 60 * 1000) {
            validExperiments[id] = experimentData;
          }
        }
        
        setActiveExperiments(validExperiments);
      }
    } catch (error) {
      console.error('Error loading stored experiments:', error);
    }
  }, []);

  // Save active experiments to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const experimentsToStore = Object.fromEntries(
        Object.entries(activeExperiments).map(([id, data]) => [
          id,
          { ...data, timestamp: Date.now() }
        ])
      );
      localStorage.setItem('ab_test_experiments', JSON.stringify(experimentsToStore));
    } catch (error) {
      console.error('Error storing experiments:', error);
    }
  }, [activeExperiments]);

  // Flush event queue periodically
  useEffect(() => {
    if (eventQueue.length === 0) return;

    const timer = setTimeout(() => {
      flushEventQueue();
    }, config.analytics.flushInterval);

    return () => clearTimeout(timer);
  }, [eventQueue, config.analytics.flushInterval]);

  // Enroll user in experiment
  const enrollInExperiment = useCallback(async (
    experimentId: string,
    forceVariant?: string
  ): Promise<AllocateUserResponse> => {
    if (!config.enabled) {
      throw new Error('A/B testing is disabled');
    }

    // Check if already enrolled
    if (activeExperiments[experimentId]) {
      return activeExperiments[experimentId];
    }

    try {
      const response = await fetch('/api/experiments/allocate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experimentId,
          userContext,
          forceVariant
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll in experiment');
      }

      const result: AllocateUserResponse = await response.json();
      
      setActiveExperiments(prev => ({
        ...prev,
        [experimentId]: result
      }));

      if (debugMode) {
        console.log(`[A/B Test] Enrolled in experiment ${experimentId}:`, result);
      }

      return result;
    } catch (error) {
      console.error(`Error enrolling in experiment ${experimentId}:`, error);
      throw error;
    }
  }, [config.enabled, activeExperiments, userContext, debugMode]);

  // Track single event
  const trackEvent = useCallback(async (
    experimentId: string,
    eventType: string,
    eventValue?: number,
    eventData?: Record<string, any>
  ): Promise<void> => {
    if (!config.enabled) return;

    const experiment = activeExperiments[experimentId];
    if (!experiment) {
      console.warn(`Cannot track event for experiment ${experimentId}: not enrolled`);
      return;
    }

    const event = {
      experimentId,
      allocationId: experiment.allocationId,
      eventType,
      eventValue,
      eventData: {
        ...eventData,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined
      },
      userContext
    };

    // Add to queue for batch processing
    setEventQueue(prev => [...prev, event]);

    // Flush immediately if queue is full
    if (eventQueue.length >= config.analytics.batchSize) {
      await flushEventQueue();
    }

    if (debugMode) {
      console.log(`[A/B Test] Tracked event ${eventType} for experiment ${experimentId}:`, event);
    }
  }, [config.enabled, config.analytics.batchSize, activeExperiments, userContext, eventQueue, debugMode]);

  // Track multiple events in batch
  const trackEvents = useCallback(async (events: Array<{
    experimentId: string;
    eventType: string;
    eventValue?: number;
    eventData?: Record<string, any>;
  }>): Promise<void> => {
    if (!config.enabled) return;

    const validEvents = events.filter(event => {
      const experiment = activeExperiments[event.experimentId];
      if (!experiment) {
        console.warn(`Cannot track event for experiment ${event.experimentId}: not enrolled`);
        return false;
      }
      return true;
    });

    if (validEvents.length === 0) return;

    try {
      const response = await fetch('/api/experiments/track', {
        method: 'PUT', // Using PUT for batch operations
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: validEvents.map(event => ({
            experimentId: event.experimentId,
            allocationId: activeExperiments[event.experimentId].allocationId,
            eventType: event.eventType,
            eventValue: event.eventValue,
            eventData: {
              ...event.eventData,
              page: typeof window !== 'undefined' ? window.location.pathname : undefined
            },
            userContext
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to track events');
      }

      if (debugMode) {
        console.log(`[A/B Test] Tracked ${validEvents.length} events in batch`);
      }
    } catch (error) {
      console.error('Error tracking events in batch:', error);
    }
  }, [config.enabled, activeExperiments, userContext, debugMode]);

  // Flush event queue
  const flushEventQueue = useCallback(async () => {
    if (eventQueue.length === 0) return;

    const eventsToFlush = [...eventQueue];
    setEventQueue([]);

    try {
      const response = await fetch('/api/experiments/track', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToFlush })
      });

      if (!response.ok) {
        // Re-queue events on failure
        setEventQueue(prev => [...eventsToFlush, ...prev]);
        throw new Error('Failed to flush event queue');
      }

      if (debugMode) {
        console.log(`[A/B Test] Flushed ${eventsToFlush.length} events from queue`);
      }
    } catch (error) {
      console.error('Error flushing event queue:', error);
    }
  }, [eventQueue, debugMode]);

  // Get variant for experiment
  const getVariant = useCallback((experimentId: string): string | null => {
    return activeExperiments[experimentId]?.variantName || null;
  }, [activeExperiments]);

  // Get configuration for experiment
  const getConfiguration = useCallback((experimentId: string): Record<string, any> | null => {
    return activeExperiments[experimentId]?.configuration || null;
  }, [activeExperiments]);

  // Get feature flag value
  const getFeatureFlag = useCallback((
    experimentId: string,
    flagKey: string,
    defaultValue: any = false
  ): any => {
    const experiment = activeExperiments[experimentId];
    if (!experiment?.featureFlags) return defaultValue;
    
    return experiment.featureFlags[flagKey] ?? defaultValue;
  }, [activeExperiments]);

  // Check if user is in experiment
  const isInExperiment = useCallback((experimentId: string): boolean => {
    return experimentId in activeExperiments;
  }, [activeExperiments]);

  // Get debug information
  const getDebugInfo = useCallback((): Record<string, any> => {
    return {
      config,
      userContext,
      activeExperiments,
      eventQueueLength: eventQueue.length,
      debugMode
    };
  }, [config, userContext, activeExperiments, eventQueue.length, debugMode]);

  const contextValue: ExperimentContextValue = {
    config,
    isEnabled: config.enabled,
    userContext,
    activeExperiments,
    enrollInExperiment,
    trackEvent,
    getVariant,
    getConfiguration,
    getFeatureFlag,
    isInExperiment,
    trackEvents,
    debugMode,
    setDebugMode,
    getDebugInfo
  };

  return (
    <ExperimentContext.Provider value={contextValue}>
      {children}
    </ExperimentContext.Provider>
  );
}

/**
 * Hook to use the experiment context
 */
export function useExperimentContext(): ExperimentContextValue {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperimentContext must be used within an ExperimentProvider');
  }
  return context;
}

// Helper functions

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('ab_test_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    sessionStorage.setItem('ab_test_session_id', sessionId);
  }
  return sessionId;
}

export default ExperimentProvider;