/**
 * Unit tests for WebsiteAnalyzer component
 * Tests form interaction, API calls, error handling, and loading states
 */

import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WebsiteAnalyzer } from '@/components/website-analyzer/WebsiteAnalyzer'
import { AnalysisResults } from '@/types/analyzer'

// Mock the fetch function
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock the LoadingSpinner component
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  ),
}))

// Mock the AnalysisDisplay component
jest.mock('@/components/website-analyzer/AnalysisDisplay', () => ({
  AnalysisDisplay: ({ results }: { results: AnalysisResults }) => (
    <div data-testid="analysis-display">
      Analysis results for: {results.url}
    </div>
  ),
}))

const mockAnalysisResults: AnalysisResults = {
  url: 'https://example.com',
  timestamp: new Date(),
  performance: {
    loadTime: 1200,
    firstContentfulPaint: 1200,
    largestContentfulPaint: 2400,
    firstInputDelay: 100,
    cumulativeLayoutShift: 0.1,
    timeToInteractive: 2500,
    totalBlockingTime: 150,
    speedIndex: 2000,
  },
  seo: {
    score: 90,
    title: {
      present: true,
      length: 45,
      optimal: true,
    },
    metaDescription: {
      present: true,
      length: 140,
      optimal: true,
    },
    headings: {
      h1Count: 1,
      h2Count: 3,
      structure: true,
    },
    images: {
      total: 5,
      withAlt: 4,
      missingAlt: 1,
    },
    internalLinks: 10,
    externalLinks: 2,
    canonicalUrl: 'https://example.com',
    structured: true,
    socialTags: {
      openGraph: true,
      twitterCard: true,
    },
  },
  security: {
    score: 95,
    https: true,
    hsts: true,
    contentSecurityPolicy: true,
    xFrameOptions: true,
    xContentTypeOptions: true,
    referrerPolicy: true,
    vulnerabilities: [],
  },
  accessibility: {
    score: 88,
    violations: [
      {
        impact: 'moderate',
        description: 'Low color contrast detected',
        element: 'button.primary',
        help: 'Ensure sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/color-contrast',
      },
    ],
    passes: [
      {
        description: 'Images have alt text',
        element: 'img',
      },
    ],
    colorContrast: {
      passed: 15,
      failed: 2,
    },
    keyboardNavigation: true,
    screenReaderCompatibility: true,
    semanticStructure: true,
  },
  technical: {
    framework: 'React',
    cms: null,
    analytics: ['Google Analytics'],
    technologies: ['React', 'Next.js'],
    serverResponse: {
      status: 200,
      headers: {},
    },
    domComplexity: {
      elements: 150,
      depth: 8,
    },
    resources: {
      scripts: 5,
      stylesheets: 3,
      images: 5,
      fonts: 2,
    },
  },
  recommendations: {
    performance: [
      {
        priority: 'high',
        title: 'Optimize images',
        description: 'Compress images to reduce load time',
        impact: 'Improves page speed',
        effort: 'medium',
      },
    ],
    seo: [],
    security: [],
    accessibility: [],
  },
  overallScore: 88,
}

describe('WebsiteAnalyzer Component', () => {
  const mockOnAnalysisComplete = jest.fn()

  beforeEach(() => {
    mockFetch.mockClear()
    mockOnAnalysisComplete.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the URL input form', () => {
    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    expect(screen.getByText('Enter Website URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Website URL')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Analyze Website' })).toBeInTheDocument()
  })

  it('should update URL input when user types', async () => {
    const user = userEvent.setup()
    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    
    await user.type(urlInput, 'https://example.com')
    
    expect(urlInput).toHaveValue('https://example.com')
  })

  it('should disable submit button when URL is empty', () => {
    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when URL is provided', async () => {
    const user = userEvent.setup()
    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    
    expect(submitButton).not.toBeDisabled()
  })

  it('should show loading state during analysis', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    mockFetch.mockImplementation(() =>
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalysisResults),
        } as Response), 100)
      )
    )

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)

    // Check loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Analyzing...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    expect(urlInput).toBeDisabled()

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })
  })

  it('should call API with correct parameters', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalysisResults),
    } as Response)

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/website-analyzer/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      })
    })
  })

  it('should call onAnalysisComplete when analysis succeeds', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalysisResults),
    } as Response)

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnAnalysisComplete).toHaveBeenCalledWith(mockAnalysisResults)
    })
  })

  it('should display analysis results after successful analysis', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalysisResults),
    } as Response)

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('analysis-display')).toBeInTheDocument()
      expect(screen.getByText('Analysis results for: https://example.com')).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response)

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Analysis failed: Internal Server Error')).toBeInTheDocument()
    })

    expect(mockOnAnalysisComplete).not.toHaveBeenCalled()
  })

  it('should handle network errors', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    expect(mockOnAnalysisComplete).not.toHaveBeenCalled()
  })

  it('should handle unknown errors', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValue('Unknown error')

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Analysis failed')).toBeInTheDocument()
    })

    expect(mockOnAnalysisComplete).not.toHaveBeenCalled()
  })

  it('should clear error when starting new analysis', async () => {
    const user = userEvent.setup()
    
    // First, make it fail
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as Response)

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Analysis failed: Bad Request')).toBeInTheDocument()
    })

    // Now make it succeed
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnalysisResults),
    } as Response)

    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('Analysis failed: Bad Request')).not.toBeInTheDocument()
    })
  })

  it('should prevent form submission without URL', async () => {
    const user = userEvent.setup()
    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const form = screen.getByRole('form')
    
    await user.click(screen.getByRole('button', { name: 'Analyze Website' }))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle form submission via Enter key', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalysisResults),
    } as Response)

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    
    await user.type(urlInput, 'https://example.com')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/website-analyzer/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      })
    })
  })

  it('should validate URL format', () => {
    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    
    expect(urlInput).toHaveAttribute('type', 'url')
    expect(urlInput).toHaveAttribute('required')
  })

  it('should show appropriate ARIA labels and roles', () => {
    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    expect(urlInput).toHaveAttribute('id', 'url')
    expect(screen.getByText('Website URL')).toHaveAttribute('for', 'url')
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('should maintain focus management during loading', async () => {
    const user = userEvent.setup()
    mockFetch.mockImplementation(() =>
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalysisResults),
        } as Response), 100)
      )
    )

    render(<WebsiteAnalyzer onAnalysisComplete={mockOnAnalysisComplete} />)

    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Analyze Website' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)

    // During loading, both input and button should be disabled
    expect(urlInput).toBeDisabled()
    expect(submitButton).toBeDisabled()

    await waitFor(() => {
      expect(urlInput).not.toBeDisabled()
      expect(submitButton).not.toBeDisabled()
    })
  })
})