/**
 * Accessibility Analyzer
 * Advanced accessibility auditing with WCAG compliance checking
 * Integrates with AI insights for UX scoring
 */

export interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'notice';
  wcagLevel: 'A' | 'AA' | 'AAA';
  rule: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  element: string;
  selector: string;
  fix: string;
  learnMore: string;
}

export interface AccessibilityScore {
  overall: number; // 0-100
  wcagCompliance: {
    levelA: number;
    levelAA: number;
    levelAAA: number;
  };
  categories: {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  };
  issueCount: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  issues: AccessibilityIssue[];
}

export interface UXScore {
  usability: number;
  accessibility: number;
  mobile: number;
  performance: number;
  navigation: number;
  content: number;
  overall: number;
  insights: string[];
  recommendations: string[];
}

class AccessibilityAnalyzer {
  private isEnabled: boolean = true;

  /**
   * Perform comprehensive accessibility audit
   */
  async analyzeAccessibility(html: string, url: string): Promise<AccessibilityScore> {
    try {
      // Parse HTML content
      const document = this.parseHTML(html);
      
      // Run accessibility checks
      const issues = await this.runAccessibilityChecks(document, url);
      
      // Calculate scores
      const scores = this.calculateAccessibilityScores(issues);
      
      return {
        overall: scores.overall,
        wcagCompliance: scores.wcagCompliance,
        categories: scores.categories,
        issueCount: scores.issueCount,
        issues
      };

    } catch (error) {
      console.error('Accessibility analysis error:', error);
      throw new Error('Failed to analyze accessibility');
    }
  }

  /**
   * Calculate UX score with AI insights
   */
  async calculateUXScore(html: string, url: string, performanceMetrics?: any): Promise<UXScore> {
    try {
      const document = this.parseHTML(html);
      
      // Analyze different UX aspects
      const [
        usabilityScore,
        accessibilityScore,
        mobileScore,
        navigationScore,
        contentScore
      ] = await Promise.all([
        this.analyzeUsability(document),
        this.analyzeAccessibilityForUX(document),
        this.analyzeMobileUX(document),
        this.analyzeNavigation(document),
        this.analyzeContentUX(document)
      ]);

      const performanceScore = performanceMetrics ? this.calculatePerformanceUXScore(performanceMetrics) : 75;
      
      const overall = Math.round(
        (usabilityScore * 0.25 + 
         accessibilityScore * 0.20 + 
         mobileScore * 0.20 + 
         performanceScore * 0.15 + 
         navigationScore * 0.10 + 
         contentScore * 0.10)
      );

      const insights = this.generateUXInsights({
        usability: usabilityScore,
        accessibility: accessibilityScore,
        mobile: mobileScore,
        performance: performanceScore,
        navigation: navigationScore,
        content: contentScore
      });

      const recommendations = this.generateUXRecommendations({
        usability: usabilityScore,
        accessibility: accessibilityScore,
        mobile: mobileScore,
        performance: performanceScore,
        navigation: navigationScore,
        content: contentScore
      });

      return {
        usability: usabilityScore,
        accessibility: accessibilityScore,
        mobile: mobileScore,
        performance: performanceScore,
        navigation: navigationScore,
        content: contentScore,
        overall,
        insights,
        recommendations
      };

    } catch (error) {
      console.error('UX score calculation error:', error);
      throw new Error('Failed to calculate UX score');
    }
  }

  /**
   * Parse HTML content (simplified)
   */
  private parseHTML(html: string): any {
    // In a real implementation, this would use a proper HTML parser like Cheerio
    // For now, we'll use simple regex-based parsing for key elements
    return {
      title: this.extractTitle(html),
      headings: this.extractHeadings(html),
      images: this.extractImages(html),
      links: this.extractLinks(html),
      forms: this.extractForms(html),
      buttons: this.extractButtons(html),
      labels: this.extractLabels(html),
      tables: this.extractTables(html),
      iframes: this.extractIframes(html),
      videos: this.extractVideos(html),
      rawHtml: html
    };
  }

  /**
   * Run comprehensive accessibility checks
   */
  private async runAccessibilityChecks(document: any, url: string): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];

    // Image alt text checks
    issues.push(...this.checkImageAltText(document.images));
    
    // Heading structure checks
    issues.push(...this.checkHeadingStructure(document.headings));
    
    // Form accessibility checks
    issues.push(...this.checkFormAccessibility(document.forms, document.labels));
    
    // Color contrast checks (mock implementation)
    issues.push(...this.checkColorContrast(document.rawHtml));
    
    // Keyboard navigation checks
    issues.push(...this.checkKeyboardNavigation(document.links, document.buttons));
    
    // ARIA attributes checks
    issues.push(...this.checkAriaAttributes(document.rawHtml));
    
    // Table accessibility checks
    issues.push(...this.checkTableAccessibility(document.tables));
    
    // Video accessibility checks
    issues.push(...this.checkVideoAccessibility(document.videos));

    return issues;
  }

  /**
   * Check image alt text
   */
  private checkImageAltText(images: any[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    images.forEach((img, index) => {
      if (!img.alt || img.alt.trim() === '') {
        issues.push({
          id: `img-alt-${index}`,
          type: 'error',
          wcagLevel: 'A',
          rule: 'WCAG 1.1.1 Non-text Content',
          description: 'Image missing alt text',
          impact: 'serious',
          element: 'img',
          selector: `img[src="${img.src}"]`,
          fix: 'Add descriptive alt text to the image',
          learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
        });
      } else if (img.alt.length > 125) {
        issues.push({
          id: `img-alt-long-${index}`,
          type: 'warning',
          wcagLevel: 'A',
          rule: 'WCAG 1.1.1 Non-text Content',
          description: 'Alt text too long (over 125 characters)',
          impact: 'moderate',
          element: 'img',
          selector: `img[src="${img.src}"]`,
          fix: 'Shorten alt text to be more concise',
          learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
        });
      }
    });

    return issues;
  }

  /**
   * Check heading structure
   */
  private checkHeadingStructure(headings: any[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    if (headings.length === 0 || !headings.some(h => h.level === 1)) {
      issues.push({
        id: 'heading-missing-h1',
        type: 'error',
        wcagLevel: 'AA',
        rule: 'WCAG 2.4.6 Headings and Labels',
        description: 'Page missing h1 heading',
        impact: 'serious',
        element: 'h1',
        selector: 'h1',
        fix: 'Add a descriptive h1 heading to the page',
        learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html'
      });
    }

    // Check for heading level skips
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
      if (current.level > previous.level + 1) {
        issues.push({
          id: `heading-skip-${i}`,
          type: 'warning',
          wcagLevel: 'AA',
          rule: 'WCAG 2.4.6 Headings and Labels',
          description: `Heading level skipped from h${previous.level} to h${current.level}`,
          impact: 'moderate',
          element: `h${current.level}`,
          selector: `h${current.level}`,
          fix: 'Use sequential heading levels without skipping',
          learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html'
        });
      }
    }

    return issues;
  }

  /**
   * Check form accessibility
   */
  private checkFormAccessibility(forms: any[], labels: any[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    forms.forEach((form, formIndex) => {
      form.inputs?.forEach((input: any, inputIndex: number) => {
        const hasLabel = labels.some(label => 
          label.for === input.id || 
          label.content?.includes(input.name)
        );
        
        if (!hasLabel && !input.ariaLabel && !input.ariaLabelledby) {
          issues.push({
            id: `form-input-label-${formIndex}-${inputIndex}`,
            type: 'error',
            wcagLevel: 'A',
            rule: 'WCAG 1.3.1 Info and Relationships',
            description: 'Form input missing label',
            impact: 'serious',
            element: 'input',
            selector: `input[name="${input.name}"]`,
            fix: 'Add a label element or aria-label attribute',
            learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check color contrast (mock implementation)
   */
  private checkColorContrast(html: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Simplified check - in reality would analyze actual colors
    const hasLowContrast = html.includes('color: #999') || html.includes('color: #ccc');
    
    if (hasLowContrast) {
      issues.push({
        id: 'color-contrast-low',
        type: 'error',
        wcagLevel: 'AA',
        rule: 'WCAG 1.4.3 Contrast (Minimum)',
        description: 'Insufficient color contrast detected',
        impact: 'serious',
        element: 'text',
        selector: '*',
        fix: 'Ensure color contrast ratio is at least 4.5:1 for normal text',
        learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
      });
    }

    return issues;
  }

  /**
   * Check keyboard navigation
   */
  private checkKeyboardNavigation(links: any[], buttons: any[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for interactive elements without proper focus indicators
    [...links, ...buttons].forEach((element, index) => {
      if (!element.tabindex && element.tabindex !== 0) {
        issues.push({
          id: `keyboard-focus-${index}`,
          type: 'warning',
          wcagLevel: 'A',
          rule: 'WCAG 2.1.1 Keyboard',
          description: 'Interactive element may not be keyboard accessible',
          impact: 'moderate',
          element: element.type,
          selector: element.selector || `${element.type}:nth-child(${index + 1})`,
          fix: 'Ensure element is focusable and has visible focus indicator',
          learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html'
        });
      }
    });

    return issues;
  }

  /**
   * Check ARIA attributes
   */
  private checkAriaAttributes(html: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for common ARIA issues
    const hasAriaHidden = html.includes('aria-hidden="true"');
    const hasAriaLabel = html.includes('aria-label');
    
    if (hasAriaHidden && !hasAriaLabel) {
      issues.push({
        id: 'aria-hidden-without-label',
        type: 'warning',
        wcagLevel: 'A',
        rule: 'WCAG 4.1.2 Name, Role, Value',
        description: 'Elements with aria-hidden may need accessible alternatives',
        impact: 'moderate',
        element: '*[aria-hidden]',
        selector: '[aria-hidden="true"]',
        fix: 'Provide accessible alternatives for hidden content',
        learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
      });
    }

    return issues;
  }

  /**
   * Check table accessibility
   */
  private checkTableAccessibility(tables: any[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    tables.forEach((table, index) => {
      if (!table.caption && !table.summary) {
        issues.push({
          id: `table-caption-${index}`,
          type: 'warning',
          wcagLevel: 'A',
          rule: 'WCAG 1.3.1 Info and Relationships',
          description: 'Table missing caption or summary',
          impact: 'moderate',
          element: 'table',
          selector: `table:nth-child(${index + 1})`,
          fix: 'Add a caption element or summary attribute to describe the table',
          learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
        });
      }
      
      if (!table.headers || table.headers.length === 0) {
        issues.push({
          id: `table-headers-${index}`,
          type: 'error',
          wcagLevel: 'A',
          rule: 'WCAG 1.3.1 Info and Relationships',
          description: 'Table missing header cells',
          impact: 'serious',
          element: 'table',
          selector: `table:nth-child(${index + 1})`,
          fix: 'Add th elements or headers attribute to identify table headers',
          learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
        });
      }
    });

    return issues;
  }

  /**
   * Check video accessibility
   */
  private checkVideoAccessibility(videos: any[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    videos.forEach((video, index) => {
      if (!video.captions && !video.transcript) {
        issues.push({
          id: `video-captions-${index}`,
          type: 'error',
          wcagLevel: 'A',
          rule: 'WCAG 1.2.2 Captions (Prerecorded)',
          description: 'Video missing captions or transcript',
          impact: 'serious',
          element: 'video',
          selector: `video:nth-child(${index + 1})`,
          fix: 'Add captions track or provide transcript for video content',
          learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html'
        });
      }
    });

    return issues;
  }

  /**
   * Calculate accessibility scores
   */
  private calculateAccessibilityScores(issues: AccessibilityIssue[]): any {
    const issueCount = {
      critical: issues.filter(i => i.impact === 'critical').length,
      serious: issues.filter(i => i.impact === 'serious').length,
      moderate: issues.filter(i => i.impact === 'moderate').length,
      minor: issues.filter(i => i.impact === 'minor').length
    };

    // Calculate penalty based on issue severity
    const penalty = issueCount.critical * 20 + 
                   issueCount.serious * 10 + 
                   issueCount.moderate * 5 + 
                   issueCount.minor * 2;

    const overall = Math.max(0, 100 - penalty);

    // WCAG compliance levels
    const levelAIssues = issues.filter(i => i.wcagLevel === 'A').length;
    const levelAAIssues = issues.filter(i => i.wcagLevel === 'AA').length;
    const levelAAAIssues = issues.filter(i => i.wcagLevel === 'AAA').length;

    const wcagCompliance = {
      levelA: Math.max(0, 100 - (levelAIssues * 15)),
      levelAA: Math.max(0, 100 - (levelAAIssues * 12)),
      levelAAA: Math.max(0, 100 - (levelAAAIssues * 8))
    };

    // POUR categories (mock calculation)
    const categories = {
      perceivable: Math.max(0, 100 - (issues.filter(i => 
        i.rule.includes('1.1') || i.rule.includes('1.2') || 
        i.rule.includes('1.3') || i.rule.includes('1.4')
      ).length * 10)),
      operable: Math.max(0, 100 - (issues.filter(i => 
        i.rule.includes('2.1') || i.rule.includes('2.2') || 
        i.rule.includes('2.3') || i.rule.includes('2.4')
      ).length * 10)),
      understandable: Math.max(0, 100 - (issues.filter(i => 
        i.rule.includes('3.1') || i.rule.includes('3.2') || i.rule.includes('3.3')
      ).length * 10)),
      robust: Math.max(0, 100 - (issues.filter(i => 
        i.rule.includes('4.1')
      ).length * 10))
    };

    return {
      overall,
      wcagCompliance,
      categories,
      issueCount
    };
  }

  /**
   * Analyze usability
   */
  private async analyzeUsability(document: any): Promise<number> {
    let score = 100;
    
    // Check for usability factors
    if (document.headings.length === 0) score -= 15;
    if (document.links.length === 0) score -= 10;
    if (!document.title || document.title.length === 0) score -= 20;
    if (document.forms.length > 0 && document.labels.length === 0) score -= 15;
    
    return Math.max(0, score);
  }

  /**
   * Analyze accessibility for UX
   */
  private async analyzeAccessibilityForUX(document: any): Promise<number> {
    const accessibilityResult = await this.analyzeAccessibility(document.rawHtml, '');
    return accessibilityResult.overall;
  }

  /**
   * Analyze mobile UX
   */
  private async analyzeMobileUX(document: any): Promise<number> {
    let score = 100;
    
    // Check for mobile-friendly indicators
    const hasViewport = document.rawHtml.includes('viewport');
    const hasResponsive = document.rawHtml.includes('responsive') || 
                         document.rawHtml.includes('@media');
    
    if (!hasViewport) score -= 20;
    if (!hasResponsive) score -= 15;
    
    return Math.max(0, score);
  }

  /**
   * Analyze navigation
   */
  private async analyzeNavigation(document: any): Promise<number> {
    let score = 100;
    
    // Check navigation elements
    const hasNav = document.rawHtml.includes('<nav') || 
                  document.rawHtml.includes('navigation');
    const hasBreadcrumbs = document.rawHtml.includes('breadcrumb');
    const hasSearch = document.rawHtml.includes('search') || 
                     document.rawHtml.includes('type="search"');
    
    if (!hasNav) score -= 20;
    if (!hasBreadcrumbs) score -= 10;
    if (!hasSearch) score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * Analyze content UX
   */
  private async analyzeContentUX(document: any): Promise<number> {
    let score = 100;
    
    // Check content structure
    if (document.headings.length < 2) score -= 15;
    if (document.images.length === 0) score -= 10;
    if (!document.rawHtml.includes('<p>')) score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * Calculate performance UX score
   */
  private calculatePerformanceUXScore(metrics: any): number {
    // Convert performance metrics to UX score
    const lcpScore = metrics.lcp <= 2500 ? 100 : metrics.lcp <= 4000 ? 75 : 50;
    const inpScore = metrics.inp <= 200 ? 100 : metrics.inp <= 500 ? 75 : 50;
    const clsScore = metrics.cls <= 0.1 ? 100 : metrics.cls <= 0.25 ? 75 : 50;
    
    return (lcpScore + inpScore + clsScore) / 3;
  }

  /**
   * Generate UX insights
   */
  private generateUXInsights(scores: any): string[] {
    const insights = [];
    
    if (scores.accessibility < 70) {
      insights.push('Accessibility improvements needed for better user inclusion');
    }
    
    if (scores.mobile < 75) {
      insights.push('Mobile experience requires optimization for better engagement');
    }
    
    if (scores.performance < 70) {
      insights.push('Performance issues may be impacting user satisfaction');
    }
    
    if (scores.navigation < 75) {
      insights.push('Navigation clarity could be improved for better usability');
    }
    
    return insights;
  }

  /**
   * Generate UX recommendations
   */
  private generateUXRecommendations(scores: any): string[] {
    const recommendations = [];
    
    if (scores.accessibility < 80) {
      recommendations.push('Implement WCAG AA compliance for better accessibility');
    }
    
    if (scores.mobile < 80) {
      recommendations.push('Optimize mobile layout and touch targets');
    }
    
    if (scores.usability < 80) {
      recommendations.push('Simplify user interface and improve information architecture');
    }
    
    if (scores.performance < 80) {
      recommendations.push('Optimize Core Web Vitals for better user experience');
    }
    
    return recommendations;
  }

  // Helper methods for extracting HTML elements
  private extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim() : '';
  }

  private extractHeadings(html: string): any[] {
    const headings = [];
    const headingRegex = /<h([1-6])[^>]*>([^<]*)<\/h[1-6]>/gi;
    let match;
    
    while ((match = headingRegex.exec(html)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        text: match[2].trim()
      });
    }
    
    return headings;
  }

  private extractImages(html: string): any[] {
    const images = [];
    const imgRegex = /<img[^>]*>/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      const img = match[0];
      const srcMatch = img.match(/src="([^"]*)"/i);
      const altMatch = img.match(/alt="([^"]*)"/i);
      
      images.push({
        src: srcMatch ? srcMatch[1] : '',
        alt: altMatch ? altMatch[1] : ''
      });
    }
    
    return images;
  }

  private extractLinks(html: string): any[] {
    const links = [];
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      links.push({
        href: match[1],
        text: match[2].trim(),
        type: 'link'
      });
    }
    
    return links;
  }

  private extractForms(html: string): any[] {
    const forms = [];
    const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
    let match;
    
    while ((match = formRegex.exec(html)) !== null) {
      const formContent = match[1];
      const inputs = this.extractInputs(formContent);
      
      forms.push({
        content: formContent,
        inputs
      });
    }
    
    return forms;
  }

  private extractInputs(html: string): any[] {
    const inputs = [];
    const inputRegex = /<input[^>]*>/gi;
    let match;
    
    while ((match = inputRegex.exec(html)) !== null) {
      const input = match[0];
      const nameMatch = input.match(/name="([^"]*)"/i);
      const idMatch = input.match(/id="([^"]*)"/i);
      const ariaLabelMatch = input.match(/aria-label="([^"]*)"/i);
      const ariaLabelledbyMatch = input.match(/aria-labelledby="([^"]*)"/i);
      
      inputs.push({
        name: nameMatch ? nameMatch[1] : '',
        id: idMatch ? idMatch[1] : '',
        ariaLabel: ariaLabelMatch ? ariaLabelMatch[1] : '',
        ariaLabelledby: ariaLabelledbyMatch ? ariaLabelledbyMatch[1] : ''
      });
    }
    
    return inputs;
  }

  private extractButtons(html: string): any[] {
    const buttons = [];
    const buttonRegex = /<button[^>]*>([^<]*)<\/button>/gi;
    let match;
    
    while ((match = buttonRegex.exec(html)) !== null) {
      buttons.push({
        text: match[1].trim(),
        type: 'button'
      });
    }
    
    return buttons;
  }

  private extractLabels(html: string): any[] {
    const labels = [];
    const labelRegex = /<label[^>]*for="([^"]*)"[^>]*>([^<]*)<\/label>/gi;
    let match;
    
    while ((match = labelRegex.exec(html)) !== null) {
      labels.push({
        for: match[1],
        content: match[2].trim()
      });
    }
    
    return labels;
  }

  private extractTables(html: string): any[] {
    const tables = [];
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let match;
    
    while ((match = tableRegex.exec(html)) !== null) {
      const tableContent = match[1];
      const hasCaption = tableContent.includes('<caption');
      const hasSummary = match[0].includes('summary=');
      const headers = (tableContent.match(/<th[^>]*>/gi) || []).length;
      
      tables.push({
        content: tableContent,
        caption: hasCaption,
        summary: hasSummary,
        headers
      });
    }
    
    return tables;
  }

  private extractIframes(html: string): any[] {
    const iframes = [];
    const iframeRegex = /<iframe[^>]*>/gi;
    let match;
    
    while ((match = iframeRegex.exec(html)) !== null) {
      const iframe = match[0];
      const srcMatch = iframe.match(/src="([^"]*)"/i);
      const titleMatch = iframe.match(/title="([^"]*)"/i);
      
      iframes.push({
        src: srcMatch ? srcMatch[1] : '',
        title: titleMatch ? titleMatch[1] : ''
      });
    }
    
    return iframes;
  }

  private extractVideos(html: string): any[] {
    const videos = [];
    const videoRegex = /<video[^>]*>([\s\S]*?)<\/video>/gi;
    let match;
    
    while ((match = videoRegex.exec(html)) !== null) {
      const videoContent = match[1];
      const hasCaptions = videoContent.includes('<track') && videoContent.includes('kind="captions"');
      const hasTranscript = html.includes('transcript');
      
      videos.push({
        content: videoContent,
        captions: hasCaptions,
        transcript: hasTranscript
      });
    }
    
    return videos;
  }
}

export const accessibilityAnalyzer = new AccessibilityAnalyzer();
export default accessibilityAnalyzer;