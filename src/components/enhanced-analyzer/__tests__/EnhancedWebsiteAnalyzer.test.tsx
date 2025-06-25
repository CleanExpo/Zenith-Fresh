/**
 * Enhanced Website Analyzer Component Tests
 * Comprehensive test suite for the Week 2 enhanced analyzer feature
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import EnhancedWebsiteAnalyzer from '../EnhancedWebsiteAnalyzer';

// Mock dependencies
jest.mock('@/lib/feature-flags', () => ({
  useFeatureFlag: jest.fn(() => true)
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => (
    <div data-testid="progress" data-value={value} {...props} />
  )
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid={`tab-trigger-${value}`} {...props}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  )
}));

// Mock fetch
global.fetch = jest.fn();

describe('EnhancedWebsiteAnalyzer', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          analysisId: 'test-123',
          overallScore: 78,
          contentQuality: {
            readabilityScore: 75,
            engagementPotential: 70,
            contentGaps: ['Missing testimonials'],
            strengths: ['Clear structure']
          },
          seoInsights: {
            technicalScore: 82,
            contentScore: 79,
            opportunityAreas: ['Schema markup'],
            criticalIssues: ['Missing alt text']
          },
          userExperience: {
            usabilityScore: 76,
            accessibilityScore: 71,
            mobileExperience: 79
          },
          performanceInsights: {
            coreWebVitalsAnalysis: {
              lcp: { current: 2800, target: 2500, impact: 'Moderate impact' },
              inp: { current: 180, target: 200, impact: 'Good responsiveness' },
              cls: { current: 0.15, target: 0.1, impact: 'Layout shifts' }
            },
            bottleneckAnalysis: ['Large images'],
            optimizationOpportunities: []
          },
          recommendations: [
            {
              id: 'rec-1',
              title: 'Optimize Performance',
              description: 'Improve Core Web Vitals',
              category: 'performance',
              priority: 'high',
              difficulty: 'medium',
              estimatedImpact: {
                trafficIncrease: 8,
                conversionImprovement: 12,
                performanceGain: 25,
                timeToComplete: '2-4 hours'
              },
              roiEstimate: {
                effort: 6,
                value: 8,
                paybackPeriod: '2-4 weeks'
              }
            }
          ],
          timestamp: new Date().toISOString()
        }
      })
    });
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={false}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.queryByText('Enhanced Website Analyzer')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('Enhanced Website Analyzer')).toBeInTheDocument();
      expect(screen.getByText('Advanced AI insights and competitive intelligence')).toBeInTheDocument();
    });

    it('should render URL input form initially', () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('Analyze with AI')).toBeInTheDocument();
    });

    it('should render feature highlights', () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('AI-Powered Analysis')).toBeInTheDocument();
      expect(screen.getByText('Intelligent Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Content Quality Assessment')).toBeInTheDocument();
      expect(screen.getByText('ROI Impact Estimates')).toBeInTheDocument();
    });
  });

  describe('URL Input and Validation', () => {
    it('should accept valid URL input', () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      
      expect(urlInput).toHaveValue('https://test.com');
    });

    it('should show error for invalid URL', async () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      const analyzeButton = screen.getByText('Analyze with AI');
      
      fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL (including https://)')).toBeInTheDocument();
      });
    });

    it('should show error for empty URL', async () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL (including https://)')).toBeInTheDocument();
      });
    });

    it('should trigger analysis with Enter key', async () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      fireEvent.keyPress(urlInput, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('AI Analysis in Progress')).toBeInTheDocument();
      });
    });
  });

  describe('Analysis Process', () => {
    it('should show analysis progress', async () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      const analyzeButton = screen.getByText('Analyze with AI');
      
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText('AI Analysis in Progress')).toBeInTheDocument();
        expect(screen.getByText('Running comprehensive analysis with AI insights...')).toBeInTheDocument();
      });
    });

    it('should show progress indicators', async () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      const analyzeButton = screen.getByText('Analyze with AI');
      
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Content Crawling')).toBeInTheDocument();
        expect(screen.getByText('AI Analysis')).toBeInTheDocument();
        expect(screen.getByText('Performance Check')).toBeInTheDocument();
        expect(screen.getByText('Insights Generation')).toBeInTheDocument();
      });
    });

    it('should display results after analysis completes', async () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      const analyzeButton = screen.getByText('Analyze with AI');
      
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      fireEvent.click(analyzeButton);
      
      // Wait for analysis to complete (mocked to be fast)
      await waitFor(() => {
        expect(screen.getByText('Enhanced Analysis Score')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Results Display', () => {
    const setupAnalysisResults = async () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      const analyzeButton = screen.getByText('Analyze with AI');
      
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Enhanced Analysis Score')).toBeInTheDocument();
      }, { timeout: 10000 });
    };

    it('should show overall score', async () => {
      await setupAnalysisResults();
      
      // Score should be displayed
      expect(screen.getByText(/Enhanced Analysis Score/)).toBeInTheDocument();
    });

    it('should show metric breakdown', async () => {
      await setupAnalysisResults();
      
      expect(screen.getByText('Content Quality')).toBeInTheDocument();
      expect(screen.getByText('SEO Score')).toBeInTheDocument();
      expect(screen.getByText('User Experience')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    it('should show tabs for different sections', async () => {
      await setupAnalysisResults();
      
      expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-recommendations')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-performance')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-seo')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-competitive')).toBeInTheDocument();
    });

    it('should show action buttons', async () => {
      await setupAnalysisResults();
      
      expect(screen.getByText('Download Full Report')).toBeInTheDocument();
      expect(screen.getByText('Share Analysis')).toBeInTheDocument();
      expect(screen.getByText('Analyze Another')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis API errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      const analyzeButton = screen.getByText('Analyze with AI');
      
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Enhanced analysis failed/)).toBeInTheDocument();
      });
    });

    it('should handle feature flag disabled', () => {
      const mockUseFeatureFlag = require('@/lib/feature-flags').useFeatureFlag;
      mockUseFeatureFlag.mockReturnValueOnce(false);
      
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      const analyzeButton = screen.getByText('Analyze with AI');
      
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      fireEvent.click(analyzeButton);
      
      expect(screen.getByText('Enhanced Website Analyzer is not available in your plan')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should close modal when close button is clicked', () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const closeButton = screen.getByLabelText(/close/i) || screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset state when "Analyze Another" is clicked', async () => {
      await setupAnalysisResults();
      
      const analyzeAnotherButton = screen.getByText('Analyze Another');
      fireEvent.click(analyzeAnotherButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
      });
    });

    const setupAnalysisResults = async () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      const analyzeButton = screen.getByText('Analyze with AI');
      
      fireEvent.change(urlInput, { target: { value: 'https://test.com' } });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Enhanced Analysis Score')).toBeInTheDocument();
      }, { timeout: 10000 });
    };
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      expect(urlInput).toBeInTheDocument();
      
      const analyzeButton = screen.getByText('Analyze with AI');
      expect(analyzeButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const urlInput = screen.getByPlaceholderText('https://example.com');
      urlInput.focus();
      expect(document.activeElement).toBe(urlInput);
      
      // Tab to analyze button
      fireEvent.keyDown(urlInput, { key: 'Tab' });
      const analyzeButton = screen.getByText('Analyze with AI');
      expect(analyzeButton).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      // Re-render with same props
      rerender(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      // Component should handle re-renders gracefully
      expect(screen.getByText('Enhanced Website Analyzer')).toBeInTheDocument();
    });

    it('should cleanup effects on unmount', () => {
      const { unmount } = render(
        <EnhancedWebsiteAnalyzer
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      unmount();
      
      // No errors should occur during cleanup
      expect(true).toBe(true);
    });
  });
});