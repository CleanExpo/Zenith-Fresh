export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  speedIndex: number;
}

export interface SEOAnalysis {
  score: number;
  title: {
    present: boolean;
    length: number;
    optimal: boolean;
  };
  metaDescription: {
    present: boolean;
    length: number;
    optimal: boolean;
  };
  headings: {
    h1Count: number;
    h2Count: number;
    structure: boolean;
  };
  images: {
    total: number;
    withAlt: number;
    missingAlt: number;
  };
  internalLinks: number;
  externalLinks: number;
  canonicalUrl: string | null;
  structured: boolean;
  socialTags: {
    openGraph: boolean;
    twitterCard: boolean;
  };
}

export interface SecurityFindings {
  score: number;
  https: boolean;
  hsts: boolean;
  contentSecurityPolicy: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  referrerPolicy: boolean;
  vulnerabilities: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
}

export interface AccessibilityAudit {
  score: number;
  violations: Array<{
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    element: string;
    help: string;
    helpUrl: string;
  }>;
  passes: Array<{
    description: string;
    element: string;
  }>;
  colorContrast: {
    passed: number;
    failed: number;
  };
  keyboardNavigation: boolean;
  screenReaderCompatibility: boolean;
  semanticStructure: boolean;
}

export interface TechnicalDetails {
  framework: string | null;
  cms: string | null;
  analytics: string[];
  technologies: string[];
  serverResponse: {
    status: number;
    headers: Record<string, string>;
  };
  domComplexity: {
    elements: number;
    depth: number;
  };
  resources: {
    scripts: number;
    stylesheets: number;
    images: number;
    fonts: number;
  };
}

export interface Recommendations {
  performance: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  seo: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  security: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  accessibility: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}

export interface AnalysisResults {
  url: string;
  timestamp: Date;
  performance: PerformanceMetrics;
  seo: SEOAnalysis;
  security: SecurityFindings;
  accessibility: AccessibilityAudit;
  technical: TechnicalDetails;
  recommendations: Recommendations;
  overallScore: number;
  screenshotUrl?: string;
}

export interface ReportConfig {
  includeLogo: boolean;
  brandColor: string;
  includePerformance: boolean;
  includeSEO: boolean;
  includeSecurity: boolean;
  includeAccessibility: boolean;
  includeRecommendations: boolean;
  companyName?: string;
  customLogo?: string;
  reportTitle?: string;
  emailDelivery?: {
    enabled: boolean;
    recipients: string[];
    subject: string;
    message: string;
  };
}