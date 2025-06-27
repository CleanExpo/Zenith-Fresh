'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { FunnelEventType, TrackFunnelEventRequest } from '../../types/funnel';

interface FunnelTrackerProps {
  funnelId: string;
  sessionId: string;
  userId?: string;
  isEnabled?: boolean;
  debug?: boolean;
  onEventTracked?: (eventId: string, event: TrackFunnelEventRequest) => void;
  onError?: (error: Error, event: TrackFunnelEventRequest) => void;
}

interface FunnelStep {
  id: string;
  stepNumber: number;
  name: string;
  eventType: string;
  eventCriteria: any;
  isRequired: boolean;
  timeLimit?: number;
}

interface TrackingState {
  currentStep: number;
  completedSteps: Set<string>;
  startTime: number;
  lastStepTime: number;
  events: TrackFunnelEventRequest[];
}

export default function FunnelTracker({
  funnelId,
  sessionId,
  userId,
  isEnabled = true,
  debug = false,
  onEventTracked,
  onError
}: FunnelTrackerProps) {
  const trackingState = useRef<TrackingState>({
    currentStep: 0,
    completedSteps: new Set(),
    startTime: Date.now(),
    lastStepTime: Date.now(),
    events: []
  });

  const funnelSteps = useRef<FunnelStep[]>([]);
  const observers = useRef<{
    intersectionObserver?: IntersectionObserver;
    mutationObserver?: MutationObserver;
    clickHandlers: Map<string, (event: Event) => void>;
    formHandlers: Map<string, (event: Event) => void>;
  }>({
    clickHandlers: new Map(),
    formHandlers: new Map()
  });

  const debugLog = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[FunnelTracker:${funnelId}] ${message}`, data);
    }
  }, [debug, funnelId]);

  // Track a funnel event
  const trackEvent = useCallback(async (request: TrackFunnelEventRequest) => {
    if (!isEnabled) {
      debugLog('Tracking disabled, skipping event', request);
      return;
    }

    try {
      debugLog('Tracking event', request);
      
      const response = await fetch('/api/funnels/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to track event: ${response.statusText}`);
      }

      const result = await response.json();
      debugLog('Event tracked successfully', result);
      
      // Update tracking state
      trackingState.current.events.push(request);
      trackingState.current.lastStepTime = Date.now();
      
      // Update completed steps
      const step = funnelSteps.current.find(s => s.id === request.stepId);
      if (step) {
        trackingState.current.completedSteps.add(step.id);
        trackingState.current.currentStep = Math.max(
          trackingState.current.currentStep,
          step.stepNumber
        );
      }

      onEventTracked?.(result.eventId, request);
      
      return result.eventId;
    } catch (error) {
      debugLog('Error tracking event', error);
      onError?.(error as Error, request);
      throw error;
    }
  }, [isEnabled, debugLog, onEventTracked, onError]);

  // Load funnel configuration
  const loadFunnelConfig = useCallback(async () => {
    try {
      debugLog('Loading funnel configuration');
      
      const response = await fetch(`/api/funnels/${funnelId}`);
      if (!response.ok) {
        throw new Error(`Failed to load funnel: ${response.statusText}`);
      }

      const funnel = await response.json();
      funnelSteps.current = funnel.steps || [];
      
      debugLog('Funnel configuration loaded', {
        steps: funnelSteps.current.length,
        funnel: funnel.name
      });
      
      return funnel;
    } catch (error) {
      debugLog('Error loading funnel configuration', error);
      throw error;
    }
  }, [funnelId, debugLog]);

  // Check if URL matches pattern
  const matchesUrlPattern = useCallback((pattern: string, url: string): boolean => {
    if (!pattern) return false;
    
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*') // ** matches any characters
      .replace(/\*/g, '[^/]*') // * matches any characters except /
      .replace(/\?/g, '\\?') // Escape question marks
      .replace(/\+/g, '\\+'); // Escape plus signs
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  }, []);

  // Check if element matches selector and criteria
  const matchesElementCriteria = useCallback((element: Element, criteria: any): boolean => {
    if (criteria.elementSelector && !element.matches(criteria.elementSelector)) {
      return false;
    }
    
    if (criteria.elementText) {
      const text = element.textContent?.trim().toLowerCase();
      const targetText = criteria.elementText.toLowerCase();
      if (!text || !text.includes(targetText)) {
        return false;
      }
    }
    
    if (criteria.elementAttributes) {
      for (const [attr, value] of Object.entries(criteria.elementAttributes)) {
        if (element.getAttribute(attr) !== value) {
          return false;
        }
      }
    }
    
    return true;
  }, []);

  // Handle page view tracking
  const handlePageView = useCallback((url?: string) => {
    const currentUrl = url || window.location.href;
    debugLog('Checking page view', { url: currentUrl });
    
    for (const step of funnelSteps.current) {
      if (step.eventType !== FunnelEventType.PAGE_VIEW) continue;
      if (trackingState.current.completedSteps.has(step.id)) continue;
      
      if (matchesUrlPattern(step.eventCriteria.urlPattern, currentUrl)) {
        debugLog('Page view matched step', { step: step.name, url: currentUrl });
        
        trackEvent({
          funnelId,
          stepId: step.id,
          sessionId,
          userId,
          eventType: FunnelEventType.PAGE_VIEW,
          eventData: { url: currentUrl, referrer: document.referrer },
          properties: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          }
        });
        
        break; // Only track the first matching step
      }
    }
  }, [funnelId, sessionId, userId, trackEvent, matchesUrlPattern, debugLog]);

  // Handle click tracking
  const handleClick = useCallback((event: Event) => {
    const target = event.target as Element;
    if (!target) return;
    
    debugLog('Click detected', { target: target.tagName, id: target.id });
    
    for (const step of funnelSteps.current) {
      if (step.eventType !== FunnelEventType.BUTTON_CLICK) continue;
      if (trackingState.current.completedSteps.has(step.id)) continue;
      
      if (matchesElementCriteria(target, step.eventCriteria)) {
        debugLog('Click matched step', { step: step.name, element: target });
        
        trackEvent({
          funnelId,
          stepId: step.id,
          sessionId,
          userId,
          eventType: FunnelEventType.BUTTON_CLICK,
          eventData: {
            element: step.eventCriteria.elementSelector,
            text: target.textContent?.trim(),
            href: target.getAttribute('href'),
            coordinates: {
              x: (event as MouseEvent).clientX,
              y: (event as MouseEvent).clientY
            }
          },
          properties: {
            timestamp: new Date().toISOString()
          }
        });
        
        break;
      }
    }
  }, [funnelId, sessionId, userId, trackEvent, matchesElementCriteria, debugLog]);

  // Handle form submission tracking
  const handleFormSubmit = useCallback((event: Event) => {
    const target = event.target as HTMLFormElement;
    if (!target) return;
    
    debugLog('Form submission detected', { target: target.tagName, id: target.id });
    
    for (const step of funnelSteps.current) {
      if (step.eventType !== FunnelEventType.FORM_SUBMIT) continue;
      if (trackingState.current.completedSteps.has(step.id)) continue;
      
      const criteria = step.eventCriteria;
      if (criteria.formSelector && !target.matches(criteria.formSelector)) {
        continue;
      }
      
      debugLog('Form submission matched step', { step: step.name, form: target });
      
      // Extract form data
      const formData = new FormData(target);
      const formFields: Record<string, any> = {};
      
      for (const [key, value] of formData.entries()) {
        if (criteria.formFields && !criteria.formFields.includes(key)) {
          continue; // Only include specified fields
        }
        formFields[key] = value;
      }
      
      trackEvent({
        funnelId,
        stepId: step.id,
        sessionId,
        userId,
        eventType: FunnelEventType.FORM_SUBMIT,
        eventData: {
          formSelector: criteria.formSelector,
          formData: formFields,
          action: target.action,
          method: target.method
        },
        properties: {
          timestamp: new Date().toISOString()
        }
      });
      
      break;
    }
  }, [funnelId, sessionId, userId, trackEvent, debugLog]);

  // Handle custom events
  const handleCustomEvent = useCallback((eventName: string, data?: any) => {
    debugLog('Custom event detected', { eventName, data });
    
    for (const step of funnelSteps.current) {
      if (step.eventType !== FunnelEventType.CUSTOM) continue;
      if (trackingState.current.completedSteps.has(step.id)) continue;
      
      if (step.eventCriteria.customEventName === eventName) {
        debugLog('Custom event matched step', { step: step.name, event: eventName });
        
        trackEvent({
          funnelId,
          stepId: step.id,
          sessionId,
          userId,
          eventType: FunnelEventType.CUSTOM,
          eventData: {
            eventName,
            customData: data
          },
          properties: {
            timestamp: new Date().toISOString()
          }
        });
        
        break;
      }
    }
  }, [funnelId, sessionId, userId, trackEvent, debugLog]);

  // Set up event listeners
  const setupEventListeners = useCallback(() => {
    if (!isEnabled) return;
    
    debugLog('Setting up event listeners');
    
    // Click tracking
    const clickHandler = (event: Event) => handleClick(event);
    document.addEventListener('click', clickHandler, true);
    observers.current.clickHandlers.set('document', clickHandler);
    
    // Form submission tracking
    const formHandler = (event: Event) => handleFormSubmit(event);
    document.addEventListener('submit', formHandler, true);
    observers.current.formHandlers.set('document', formHandler);
    
    // Page view tracking on navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(() => handlePageView(), 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(() => handlePageView(), 0);
    };
    
    window.addEventListener('popstate', () => {
      setTimeout(() => handlePageView(), 0);
    });
    
    // Initial page view
    handlePageView();
    
  }, [isEnabled, handleClick, handleFormSubmit, handlePageView, debugLog]);

  // Clean up event listeners
  const cleanupEventListeners = useCallback(() => {
    debugLog('Cleaning up event listeners');
    
    // Remove click handlers
    for (const [key, handler] of observers.current.clickHandlers.entries()) {
      if (key === 'document') {
        document.removeEventListener('click', handler, true);
      }
    }
    observers.current.clickHandlers.clear();
    
    // Remove form handlers
    for (const [key, handler] of observers.current.formHandlers.entries()) {
      if (key === 'document') {
        document.removeEventListener('submit', handler, true);
      }
    }
    observers.current.formHandlers.clear();
    
    // Clean up observers
    if (observers.current.intersectionObserver) {
      observers.current.intersectionObserver.disconnect();
      observers.current.intersectionObserver = undefined;
    }
    
    if (observers.current.mutationObserver) {
      observers.current.mutationObserver.disconnect();
      observers.current.mutationObserver = undefined;
    }
  }, [debugLog]);

  // Expose custom event tracking method
  const trackCustomEvent = useCallback((eventName: string, data?: any) => {
    handleCustomEvent(eventName, data);
  }, [handleCustomEvent]);

  // Get current tracking state
  const getTrackingState = useCallback(() => {
    return {
      ...trackingState.current,
      completedSteps: Array.from(trackingState.current.completedSteps),
      sessionDuration: Date.now() - trackingState.current.startTime,
      timeSinceLastStep: Date.now() - trackingState.current.lastStepTime
    };
  }, []);

  // Initialize tracker
  useEffect(() => {
    if (!isEnabled) return;
    
    const initializeTracker = async () => {
      try {
        await loadFunnelConfig();
        setupEventListeners();
        debugLog('Funnel tracker initialized');
      } catch (error) {
        debugLog('Failed to initialize tracker', error);
      }
    };
    
    initializeTracker();
    
    return () => {
      cleanupEventListeners();
    };
  }, [isEnabled, loadFunnelConfig, setupEventListeners, cleanupEventListeners, debugLog]);

  // Expose tracker methods to parent component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).funnelTracker = {
        trackCustomEvent,
        getTrackingState,
        trackEvent
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).funnelTracker;
      }
    };
  }, [trackCustomEvent, getTrackingState, trackEvent]);

  // Component doesn't render anything - it's purely for tracking
  return null;
}

// Hook for using funnel tracker in components
export function useFunnelTracker() {
  const trackCustomEvent = useCallback((eventName: string, data?: any) => {
    if (typeof window !== 'undefined' && (window as any).funnelTracker) {
      (window as any).funnelTracker.trackCustomEvent(eventName, data);
    }
  }, []);

  const getTrackingState = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).funnelTracker) {
      return (window as any).funnelTracker.getTrackingState();
    }
    return null;
  }, []);

  const trackEvent = useCallback(async (request: Omit<TrackFunnelEventRequest, 'funnelId' | 'sessionId'>) => {
    if (typeof window !== 'undefined' && (window as any).funnelTracker) {
      return (window as any).funnelTracker.trackEvent(request);
    }
  }, []);

  return {
    trackCustomEvent,
    getTrackingState,
    trackEvent
  };
}