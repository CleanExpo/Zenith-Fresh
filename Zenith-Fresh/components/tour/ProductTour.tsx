'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  Circle,
  Target,
  MousePointer,
  Eye,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'scroll' | 'input' | 'wait';
  actionData?: any;
  isOptional?: boolean;
  waitForElement?: string; // Wait for element to appear
  highlightStyle?: 'pulse' | 'glow' | 'border' | 'none';
  beforeStep?: () => Promise<void> | void;
  afterStep?: () => Promise<void> | void;
}

interface ProductTourProps {
  tourId: string;
  steps: TourStep[];
  isVisible?: boolean;
  autoStart?: boolean;
  showProgress?: boolean;
  allowSkip?: boolean;
  persistent?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  onStepChange?: (stepIndex: number, step: TourStep) => void;
}

interface TourState {
  currentStep: number;
  isActive: boolean;
  isPlaying: boolean;
  completedSteps: string[];
  skippedSteps: string[];
}

export function ProductTour({
  tourId,
  steps,
  isVisible = false,
  autoStart = false,
  showProgress = true,
  allowSkip = true,
  persistent = false,
  onComplete,
  onSkip,
  onStepChange
}: ProductTourProps) {
  const [tourState, setTourState] = useState<TourState>({
    currentStep: 0,
    isActive: false,
    isPlaying: false,
    completedSteps: [],
    skippedSteps: []
  });
  
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (isVisible || autoStart) {
      startTour();
    }
    return () => {
      cleanup();
    };
  }, [isVisible, autoStart]);

  useEffect(() => {
    if (tourState.isActive && steps[tourState.currentStep]) {
      updateHighlight();
      onStepChange?.(tourState.currentStep, steps[tourState.currentStep]);
    }
  }, [tourState.currentStep, tourState.isActive]);

  const startTour = async () => {
    if (steps.length === 0) return;
    
    setTourState(prev => ({
      ...prev,
      isActive: true,
      isPlaying: true,
      currentStep: 0
    }));

    // Track tour start
    await trackTourEvent('tour_started');
  };

  const stopTour = async () => {
    cleanup();
    setTourState(prev => ({
      ...prev,
      isActive: false,
      isPlaying: false
    }));

    // Track tour completion
    await trackTourEvent('tour_completed');
    onComplete?.();
  };

  const skipTour = async () => {
    cleanup();
    setTourState(prev => ({
      ...prev,
      isActive: false,
      isPlaying: false
    }));

    // Track tour skip
    await trackTourEvent('tour_skipped');
    onSkip?.();
  };

  const cleanup = () => {
    if (highlightedElement) {
      removeHighlight(highlightedElement);
    }
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    setHighlightedElement(null);
  };

  const updateHighlight = useCallback(async () => {
    const currentStep = steps[tourState.currentStep];
    if (!currentStep || !tourState.isActive) return;

    // Execute before step action
    if (currentStep.beforeStep) {
      await currentStep.beforeStep();
    }

    // Wait for element if needed
    let targetElement = document.querySelector(currentStep.target);
    if (!targetElement && currentStep.waitForElement) {
      targetElement = await waitForElement(currentStep.waitForElement);
    } else if (!targetElement) {
      targetElement = await waitForElement(currentStep.target);
    }

    if (!targetElement) {
      console.warn(`Tour step ${currentStep.id}: Target element not found: ${currentStep.target}`);
      return;
    }

    // Remove previous highlight
    if (highlightedElement) {
      removeHighlight(highlightedElement);
    }

    // Add new highlight
    addHighlight(targetElement, currentStep.highlightStyle || 'pulse');
    setHighlightedElement(targetElement);

    // Calculate tooltip position
    const rect = targetElement.getBoundingClientRect();
    const position = calculateTooltipPosition(rect, currentStep.position);
    setTooltipPosition(position);

    // Scroll element into view
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    // Execute after step action
    if (currentStep.afterStep) {
      await currentStep.afterStep();
    }

  }, [tourState.currentStep, tourState.isActive, highlightedElement]);

  const waitForElement = (selector: string, timeout = 5000): Promise<Element | null> => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);

      observerRef.current = observer;
    });
  };

  const addHighlight = (element: Element, style: string) => {
    element.classList.add('tour-highlight', `tour-highlight-${style}`);
    
    // Add styles if not already present
    if (!document.getElementById('tour-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'tour-styles';
      styleSheet.textContent = `
        .tour-highlight {
          position: relative;
          z-index: 9999;
        }
        .tour-highlight-pulse {
          animation: tour-pulse 2s infinite;
        }
        .tour-highlight-glow {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
        }
        .tour-highlight-border {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }
        @keyframes tour-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  };

  const removeHighlight = (element: Element) => {
    element.classList.remove('tour-highlight', 'tour-highlight-pulse', 'tour-highlight-glow', 'tour-highlight-border');
  };

  const calculateTooltipPosition = (rect: DOMRect, position: string) => {
    const margin = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (position) {
      case 'top':
        return {
          x: rect.left + rect.width / 2 - tooltipWidth / 2,
          y: rect.top - tooltipHeight - margin
        };
      case 'bottom':
        return {
          x: rect.left + rect.width / 2 - tooltipWidth / 2,
          y: rect.bottom + margin
        };
      case 'left':
        return {
          x: rect.left - tooltipWidth - margin,
          y: rect.top + rect.height / 2 - tooltipHeight / 2
        };
      case 'right':
        return {
          x: rect.right + margin,
          y: rect.top + rect.height / 2 - tooltipHeight / 2
        };
      case 'center':
      default:
        return {
          x: window.innerWidth / 2 - tooltipWidth / 2,
          y: window.innerHeight / 2 - tooltipHeight / 2
        };
    }
  };

  const nextStep = async () => {
    const currentStep = steps[tourState.currentStep];
    
    // Mark current step as completed
    await trackStepEvent('step_completed', currentStep);

    if (tourState.currentStep < steps.length - 1) {
      setTourState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        completedSteps: [...prev.completedSteps, currentStep.id]
      }));
    } else {
      await stopTour();
    }
  };

  const prevStep = () => {
    if (tourState.currentStep > 0) {
      setTourState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };

  const skipStep = async () => {
    const currentStep = steps[tourState.currentStep];
    
    // Mark current step as skipped
    await trackStepEvent('step_skipped', currentStep);

    if (tourState.currentStep < steps.length - 1) {
      setTourState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        skippedSteps: [...prev.skippedSteps, currentStep.id]
      }));
    } else {
      await stopTour();
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setTourState(prev => ({
        ...prev,
        currentStep: stepIndex
      }));
    }
  };

  const pauseTour = () => {
    setTourState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  };

  const restartTour = () => {
    setTourState(prev => ({
      ...prev,
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      isPlaying: true
    }));
  };

  const trackTourEvent = async (eventType: string) => {
    try {
      await fetch('/api/user-success-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metricType: 'engagement',
          metricName: `product_tour_${eventType}`,
          value: 1,
          unit: 'count',
          category: 'onboarding',
          milestone: `tour-${tourId}-${eventType}`
        })
      });
    } catch (error) {
      console.error('Error tracking tour event:', error);
    }
  };

  const trackStepEvent = async (eventType: string, step: TourStep) => {
    try {
      await fetch('/api/user-success-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metricType: 'engagement',
          metricName: `tour_step_${eventType}`,
          value: 1,
          unit: 'count',
          category: 'onboarding',
          milestone: `tour-${tourId}-step-${step.id}`
        })
      });
    } catch (error) {
      console.error('Error tracking step event:', error);
    }
  };

  const currentStep = steps[tourState.currentStep];
  const progress = ((tourState.currentStep + 1) / steps.length) * 100;

  if (!tourState.isActive || !currentStep) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 pointer-events-none"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Tooltip */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x, window.innerWidth - 330)),
            top: Math.max(10, Math.min(tooltipPosition.y, window.innerHeight - 210))
          }}
        >
          <Card className="w-80 shadow-2xl border-2 border-blue-500">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Product Tour</h3>
                    <p className="text-xs text-gray-500">
                      Step {tourState.currentStep + 1} of {steps.length}
                    </p>
                  </div>
                </div>
                
                {allowSkip && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Progress */}
              {showProgress && (
                <div className="mb-4">
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {currentStep.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {currentStep.description}
                  </p>
                </div>

                {/* Action hint */}
                {currentStep.action && (
                  <div className="bg-blue-50 p-3 rounded-lg flex items-center space-x-2">
                    {currentStep.action === 'click' && <MousePointer className="h-4 w-4 text-blue-600" />}
                    {currentStep.action === 'hover' && <Eye className="h-4 w-4 text-blue-600" />}
                    {currentStep.action === 'input' && <Info className="h-4 w-4 text-blue-600" />}
                    <span className="text-sm text-blue-800">
                      {currentStep.action === 'click' && 'Click the highlighted element'}
                      {currentStep.action === 'hover' && 'Hover over the highlighted element'}
                      {currentStep.action === 'input' && 'Enter some text in the highlighted field'}
                      {currentStep.action === 'scroll' && 'Scroll to see more content'}
                      {currentStep.action === 'wait' && 'Observe the highlighted area'}
                    </span>
                  </div>
                )}

                {/* Step indicator */}
                <div className="flex items-center justify-center space-x-1">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToStep(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === tourState.currentStep
                          ? 'bg-blue-500'
                          : index < tourState.currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={tourState.currentStep === 0}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pauseTour}
                  >
                    {tourState.isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={restartTour}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  {currentStep.isOptional && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={skipStep}
                    >
                      Skip
                    </Button>
                  )}
                  
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {tourState.currentStep === steps.length - 1 ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Finish
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// Hook for easy tour management
export function useProductTour(tourId: string) {
  const [isVisible, setIsVisible] = useState(false);
  
  const startTour = () => setIsVisible(true);
  const stopTour = () => setIsVisible(false);
  
  return {
    isVisible,
    startTour,
    stopTour
  };
}

// Predefined tour configurations
export const predefinedTours = {
  dashboard: [
    {
      id: 'welcome',
      title: 'Welcome to your Dashboard',
      description: 'This is your central hub for monitoring all your projects and getting insights.',
      target: '[data-tour="dashboard-overview"]',
      position: 'center' as const
    },
    {
      id: 'sidebar',
      title: 'Navigation Sidebar',
      description: 'Use the sidebar to access different tools and features.',
      target: '[data-tour="sidebar"]',
      position: 'right' as const
    },
    {
      id: 'projects',
      title: 'Your Projects',
      description: 'View and manage all your website analysis projects here.',
      target: '[data-tour="projects-section"]',
      position: 'top' as const
    },
    {
      id: 'quick-scan',
      title: 'Quick Scan',
      description: 'Start a quick website analysis with this button.',
      target: '[data-tour="quick-scan-button"]',
      position: 'bottom' as const,
      action: 'click' as const
    }
  ],
  
  websiteAnalyzer: [
    {
      id: 'url-input',
      title: 'Enter Website URL',
      description: 'Start by entering the URL of the website you want to analyze.',
      target: '[data-tour="url-input"]',
      position: 'bottom' as const,
      action: 'input' as const
    },
    {
      id: 'scan-options',
      title: 'Scan Options',
      description: 'Choose what aspects of the website to analyze.',
      target: '[data-tour="scan-options"]',
      position: 'left' as const
    },
    {
      id: 'start-scan',
      title: 'Start Analysis',
      description: 'Click this button to begin the comprehensive analysis.',
      target: '[data-tour="start-scan-button"]',
      position: 'top' as const,
      action: 'click' as const
    }
  ]
};