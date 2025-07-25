import puppeteer from "puppeteer";

interface ReportData {
  id: string;
  title: string;
  url: string;
  domain: string;
  description?: string;
  seoScore?: number;
  performanceScore?: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  issues?: any[];
  suggestions?: any[];
  status: string;
  createdAt: string;
  updatedAt: string;
  technicalDetails?: {
    loadTime: number;
    performanceScore: number;
    mobileScore: number;
    seoScore: number;
    accessibilityScore: number;
    securityScore: number;
    totalPages: number;
    totalImages: number;
    totalLinks: number;
    issuesFound: number;
    overallScore: number;
  };
  multiPageAudit?: {
    totalPagesAnalyzed: number;
    seoScore: number;
    contentScore: number;
    technicalScore: number;
    siteWideIssues: any[];
    allAnalyzedPages: any[];
    websiteGenerationPrompt: string;
  };
  contentAnalysis?: {
    readability: number;
    keywordOptimization: any[];
    contentGaps: any[];
    duplicateContent: any[];
  };
  technicalAnalysis?: {
    performance: any;
    security: any;
  };
  brandMarketing?: {
    score: number;
    brandIdentity: any;
    conversionOptimization: any;
    contentStrategy: any;
    competitiveAdvantage: any;
  };
}

export class PDFGenerator {
  static async generateProfessionalReport(
    reportData: ReportData
  ): Promise<Buffer> {
    const html = this.generateHTML(reportData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  private static generateHTML(reportData: ReportData): string {
    const issues = (reportData.issues as any[]) || [];
    const suggestions = (reportData.suggestions as any[]) || [];
    const overallScore = Math.round(
      ((reportData.seoScore || 0) +
        (reportData.performanceScore || 0) +
        (reportData.accessibilityScore || 0) +
        (reportData.bestPracticesScore || 0)) /
        4
    );

    let technicalDetails = {
      loadTime: 0,
      performanceScore: reportData.performanceScore || 0,
      mobileScore: 0,
      seoScore: reportData.seoScore || 0,
      accessibilityScore: reportData.accessibilityScore || 0,
      securityScore: reportData.bestPracticesScore || 0,
      totalPages: 0,
      totalImages: 0,
      totalLinks: 0,
      issuesFound: issues.length,
      overallScore,
    };
    if (reportData["technicalDetails"]) {
      technicalDetails = {
        ...technicalDetails,
        ...reportData["technicalDetails"],
      };
    }

    // Enhanced content sections for comprehensive report
    const seoIssues = issues.filter(
      (i) =>
        i.category === "SEO" ||
        i.category === "Technical SEO" ||
        i.category === "Content SEO"
    );
    const performanceIssues = issues.filter(
      (i) => i.category === "Performance"
    );
    const contentIssues = issues.filter((i) => i.category === "Content");
    const accessibilityIssues = issues.filter(
      (i) => i.category === "Accessibility"
    );

    const highPriorityIssues = issues.filter(
      (i) => i.severity === "high" || i.severity === "critical"
    );
    const mediumPriorityIssues = issues.filter((i) => i.severity === "medium");
    const lowPriorityIssues = issues.filter((i) => i.severity === "low");

    const highPrioritySuggestions = suggestions.filter(
      (s) => s.priority === "high"
    );
    const mediumPrioritySuggestions = suggestions.filter(
      (s) => s.priority === "medium"
    );
    const lowPrioritySuggestions = suggestions.filter(
      (s) => s.priority === "low"
    );

    function getSolution(issue: any) {
      if (issue.solution) return issue.solution;
      if (issue.category === "SEO")
        return "Add or improve meta tags, titles, and descriptions.";
      if (issue.category === "Performance")
        return "Optimize images, minify CSS/JS, and enable caching.";
      if (issue.category === "Accessibility")
        return "Add alt text to images, use semantic HTML, and ensure color contrast.";
      return "Review and implement best practices for this category.";
    }

    function getExample(issue: any) {
      if (issue.category === "SEO")
        return "Example: <title>Your Page Title - Brand Name</title>";
      if (issue.category === "Performance")
        return "Example: Compress images to WebP format, implement lazy loading";
      if (issue.category === "Accessibility")
        return "Example: <img src='image.jpg' alt='Descriptive text'>";
      return "Follow industry best practices and guidelines.";
    }

    function getBusinessSummary() {
      const domain = reportData.domain || new URL(reportData.url).hostname;
      return `This comprehensive website analysis for ${domain} reveals ${
        issues.length
      } issues across ${
        technicalDetails.totalPages
      } pages. The overall performance score of ${overallScore}/100 indicates ${
        overallScore >= 80
          ? "excellent"
          : overallScore >= 60
          ? "good"
          : overallScore >= 40
          ? "fair"
          : "poor"
      } website health. Immediate attention is required for ${
        highPriorityIssues.length
      } critical issues to improve search rankings, user experience, and conversion rates.`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Website Analysis Report - ${reportData.domain}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 15px;
            background: #ffffff;
            font-size: 10px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border-radius: 5px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 20px;
          }
          .header p {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 11px;
          }
          .score-section {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          .score-card {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            padding: 12px;
            border-radius: 5px;
            text-align: center;
            flex: 1;
            margin: 3px;
            min-width: 80px;
          }
          .score-card h3 {
            margin: 0 0 5px 0;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .score-card .score {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
          }
          .overall-score {
            background: linear-gradient(135deg, #28a745, #1e7e34);
            font-size: 12px;
          }
          .section {
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .section h2 {
            color: #007bff;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 5px;
            margin-bottom: 15px;
            font-size: 14px;
          }
          .issue-card {
            background: #f8f9fa;
            border-left: 3px solid #dc3545;
            padding: 10px;
            margin: 10px 0;
            border-radius: 3px;
            font-size: 9px;
          }
          .issue-card.high { border-left-color: #dc3545; }
          .issue-card.medium { border-left-color: #ffc107; }
          .issue-card.low { border-left-color: #28a745; }
          .issue-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
            font-size: 10px;
          }
          .issue-description {
            color: #666;
            margin-bottom: 5px;
            font-size: 9px;
          }
          .issue-solution {
            background: #e7f3ff;
            padding: 8px;
            border-radius: 3px;
            margin-top: 5px;
            font-size: 9px;
          }
          .issue-solution strong {
            color: #007bff;
          }
          .suggestion-card {
            background: #f8f9fa;
            border-left: 3px solid #007bff;
            padding: 10px;
            margin: 10px 0;
            border-radius: 3px;
            font-size: 9px;
          }
          .suggestion-title {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
            font-size: 10px;
          }
          .technical-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin: 15px 0;
          }
          .tech-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            text-align: center;
            font-size: 9px;
          }
          .tech-item h4 {
            margin: 0 0 5px 0;
            color: #007bff;
            font-size: 9px;
          }
          .tech-item .value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
          }
          .priority-section {
            margin: 15px 0;
          }
          .priority-section h3 {
            color: #333;
            margin-bottom: 10px;
            font-size: 12px;
          }
          .summary-box {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .summary-box h2 {
            margin: 0 0 10px 0;
            color: white;
            font-size: 14px;
          }
          .summary-box p {
            margin: 0;
            line-height: 1.5;
            font-size: 10px;
          }
          .page-break {
            page-break-before: always;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
            color: #666;
            font-size: 8px;
          }
          .multi-page-summary {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .page-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
            margin-top: 10px;
          }
          .page-item {
            background: white;
            padding: 8px;
            border-radius: 3px;
            border: 1px solid #e9ecef;
            font-size: 8px;
          }
          .page-item h5 {
            margin: 0 0 3px 0;
            color: #007bff;
            font-size: 9px;
          }
          .page-item p {
            margin: 2px 0;
            color: #666;
            font-size: 8px;
          }
          .content-analysis {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .brand-marketing {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .metric-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 9px;
          }
          .metric-label {
            font-weight: bold;
            color: #007bff;
          }
          .metric-value {
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Page 1: Executive Summary -->
          <div class="header">
            <h1>Website Analysis Report</h1>
            <p>${reportData.domain} | ${new Date(
      reportData.createdAt
    ).toLocaleDateString()}</p>
            </div>

          <div class="summary-box">
            <h2>Executive Summary</h2>
            <p>${getBusinessSummary()}</p>
          </div>

          <div class="score-section">
            <div class="score-card overall-score">
              <h3>Overall Score</h3>
              <div class="score">${overallScore}</div>
            </div>
            <div class="score-card">
              <h3>SEO Score</h3>
              <div class="score">${technicalDetails.seoScore}</div>
            </div>
            <div class="score-card">
              <h3>Performance</h3>
              <div class="score">${technicalDetails.performanceScore}</div>
            </div>
            <div class="score-card">
              <h3>Accessibility</h3>
              <div class="score">${technicalDetails.accessibilityScore}</div>
            </div>
          </div>

          <div class="technical-grid">
            <div class="tech-item">
              <h4>Pages Analyzed</h4>
              <div class="value">${technicalDetails.totalPages}</div>
            </div>
            <div class="tech-item">
              <h4>Total Issues</h4>
              <div class="value">${technicalDetails.issuesFound}</div>
            </div>
            <div class="tech-item">
              <h4>Load Time</h4>
              <div class="value">${technicalDetails.loadTime.toFixed(1)}s</div>
            </div>
            <div class="tech-item">
              <h4>Total Images</h4>
              <div class="value">${technicalDetails.totalImages}</div>
            </div>
          </div>

          <!-- Multi-Page Audit Summary -->
          ${
            reportData.multiPageAudit
              ? `
          <div class="multi-page-summary">
            <h2>Multi-Page Audit Summary</h2>
            <div class="technical-grid">
              <div class="tech-item">
                <h4>SEO Score</h4>
                <div class="value">${
                  reportData.multiPageAudit.seoScore
                }/100</div>
              </div>
              <div class="tech-item">
                <h4>Content Score</h4>
                <div class="value">${
                  reportData.multiPageAudit.contentScore
                }/100</div>
              </div>
              <div class="tech-item">
                <h4>Technical Score</h4>
                <div class="value">${
                  reportData.multiPageAudit.technicalScore
                }/100</div>
              </div>
            </div>
            <h4>Pages Analyzed:</h4>
            <div class="page-list">
              ${reportData.multiPageAudit.allAnalyzedPages
                .map(
                  (page: any) => `
                <div class="page-item">
                  <h5>${page.title}</h5>
                  <p>${page.url}</p>
                  <p>Word count: ${page.wordCount}</p>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Page 2: Critical Issues -->
          <div class="page-break"></div>
          <div class="section">
            <h2>Critical Issues Requiring Immediate Attention</h2>
            ${
              highPriorityIssues.length > 0
                ? highPriorityIssues
                    .map(
                      (issue) => `
              <div class="issue-card high">
                <div class="issue-title">${issue.title}</div>
                <div class="issue-description">${issue.description}</div>
                <div class="issue-solution">
                  <strong>Solution:</strong> ${getSolution(issue)}
                </div>
              </div>
            `
                    )
                    .join("")
                : "<p>No critical issues found. Great job!</p>"
            }
          </div>

          <div class="section">
            <h2>High Priority Recommendations</h2>
            ${
              highPrioritySuggestions.length > 0
                ? highPrioritySuggestions
                    .map(
                      (suggestion) => `
              <div class="suggestion-card">
                <div class="suggestion-title">${suggestion.title}</div>
                <div class="issue-description">${suggestion.description}</div>
                <div class="issue-solution">
                  <strong>Expected Impact:</strong> ${suggestion.impact}
                </div>
              </div>
            `
                    )
                    .join("")
                : "<p>No high priority recommendations at this time.</p>"
            }
          </div>

          <!-- Page 3: Detailed Analysis -->
          <div class="page-break"></div>
          <div class="section">
            <h2>SEO Analysis</h2>
            ${
              seoIssues.length > 0
                ? seoIssues
                    .map(
                      (issue) => `
              <div class="issue-card ${issue.severity}">
                <div class="issue-title">${issue.title}</div>
                <div class="issue-description">${issue.description}</div>
                <div class="issue-solution">
                  <strong>Solution:</strong> ${getSolution(issue)}
                </div>
              </div>
            `
                    )
                    .join("")
                : `
              <div class="content-analysis">
                <h3>SEO Performance Overview</h3>
                <p>Your website demonstrates good SEO fundamentals with a score of ${technicalDetails.seoScore}/100. However, there are several areas where improvements can be made to enhance search engine visibility and rankings.</p>
                
                <h4>Current SEO Strengths:</h4>
                <ul>
                  <li>Proper page structure and navigation</li>
                  <li>Good use of internal linking</li>
                  <li>Mobile-responsive design</li>
                </ul>
                
                <h4>Areas for Improvement:</h4>
                <ul>
                  <li>Meta descriptions optimization for better click-through rates</li>
                  <li>Image alt text implementation for accessibility and SEO</li>
                  <li>Content expansion on pages with low word count</li>
                  <li>Heading structure optimization for better content hierarchy</li>
                </ul>
                
                <h4>Recommended Actions:</h4>
                <p>Focus on creating unique, compelling meta descriptions for each page, ensuring all images have descriptive alt text, and expanding content on pages with fewer than 300 words. These improvements will help search engines better understand your content and improve your rankings.</p>
              </div>
            `
            }
          </div>

          <div class="section">
            <h2>Performance Analysis</h2>
            ${
              performanceIssues.length > 0
                ? performanceIssues
                    .map(
                      (issue) => `
              <div class="issue-card ${issue.severity}">
                <div class="issue-title">${issue.title}</div>
                <div class="issue-description">${issue.description}</div>
                <div class="issue-solution">
                  <strong>Solution:</strong> ${getSolution(issue)}
                </div>
              </div>
            `
                    )
                    .join("")
                : `
              <div class="content-analysis">
                <h3>Performance Overview</h3>
                <p>Your website's performance score of ${
                  technicalDetails.performanceScore
                }/100 indicates areas for optimization to improve user experience and Core Web Vitals.</p>
                
                <h4>Current Performance Metrics:</h4>
                <div class="metric-row">
                  <span class="metric-label">Page Load Time:</span>
                  <span class="metric-value">${technicalDetails.loadTime.toFixed(
                    1
                  )} seconds</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Performance Score:</span>
                  <span class="metric-value">${
                    technicalDetails.performanceScore
                  }/100</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Mobile Score:</span>
                  <span class="metric-value">${
                    technicalDetails.mobileScore
                  }/100</span>
                </div>
                
                <h4>Performance Optimization Opportunities:</h4>
                <ul>
                  <li><strong>Image Optimization:</strong> Compress and optimize images to reduce file sizes and improve loading times</li>
                  <li><strong>Caching Implementation:</strong> Implement browser and server-side caching for static assets</li>
                  <li><strong>Code Minification:</strong> Minify CSS and JavaScript files to reduce file sizes</li>
                  <li><strong>CDN Integration:</strong> Use a Content Delivery Network for faster global access</li>
                </ul>
                
                <h4>Expected Improvements:</h4>
                <p>Implementing these optimizations can reduce page load time by 30-50% and improve Core Web Vitals scores by 20-30%, leading to better user experience and potentially higher search rankings.</p>
              </div>
            `
            }
          </div>

          <!-- Content Analysis -->
          ${
            reportData.contentAnalysis
              ? `
          <div class="content-analysis">
            <h2>Content Analysis</h2>
            <div class="metric-row">
              <span class="metric-label">Readability Score:</span>
              <span class="metric-value">${
                reportData.contentAnalysis.readability
              }/100</span>
            </div>
            ${
              reportData.contentAnalysis.keywordOptimization.length > 0
                ? `
            <h4>Keyword Optimization:</h4>
            ${reportData.contentAnalysis.keywordOptimization
              .map(
                (keyword: any) => `
              <div class="issue-card low">
                <div class="issue-title">Keyword: ${keyword.keyword}</div>
                <div class="issue-description">Density: ${keyword.density}% - ${keyword.recommendation}</div>
              </div>
            `
              )
              .join("")}
            `
                : ""
            }
            ${
              reportData.contentAnalysis.contentGaps.length > 0
                ? `
            <h4>Content Gaps:</h4>
            ${reportData.contentAnalysis.contentGaps
              .map(
                (gap: any) => `
              <div class="issue-card medium">
                <div class="issue-title">${gap.topic}</div>
                <div class="issue-description">${gap.opportunity}</div>
              </div>
            `
              )
              .join("")}
            `
                : ""
            }
          </div>
          `
              : ""
          }

          <!-- Page 4: Recommendations & Next Steps -->
          <div class="page-break"></div>
          <div class="section">
            <h2>Medium Priority Issues</h2>
            ${
              mediumPriorityIssues.length > 0
                ? mediumPriorityIssues
                    .map(
                      (issue) => `
              <div class="issue-card medium">
                <div class="issue-title">${issue.title}</div>
                <div class="issue-description">${issue.description}</div>
                <div class="issue-solution">
                  <strong>Solution:</strong> ${getSolution(issue)}
                </div>
              </div>
            `
                    )
                    .join("")
                : "<p>No medium priority issues found.</p>"
            }
          </div>

          <div class="section">
            <h2>Medium Priority Recommendations</h2>
            ${
              mediumPrioritySuggestions.length > 0
                ? mediumPrioritySuggestions
                    .map(
                      (suggestion) => `
              <div class="suggestion-card">
                <div class="suggestion-title">${suggestion.title}</div>
                <div class="issue-description">${suggestion.description}</div>
                <div class="issue-solution">
                  <strong>Expected Impact:</strong> ${suggestion.impact}
                </div>
              </div>
            `
                    )
                    .join("")
                : "<p>No medium priority recommendations at this time.</p>"
            }
          </div>

          <div class="section">
            <h2>Low Priority Issues</h2>
            ${
              lowPriorityIssues.length > 0
                ? lowPriorityIssues
                    .map(
                      (issue) => `
              <div class="issue-card low">
                <div class="issue-title">${issue.title}</div>
                <div class="issue-description">${issue.description}</div>
                <div class="issue-solution">
                  <strong>Solution:</strong> ${getSolution(issue)}
                </div>
              </div>
            `
                    )
                    .join("")
                : "<p>No low priority issues found.</p>"
            }
          </div>

          <!-- Brand Marketing Analysis -->
          ${
            reportData.brandMarketing
              ? `
          <div class="brand-marketing">
            <h2>Brand Marketing Analysis</h2>
            <div class="metric-row">
              <span class="metric-label">Brand Score:</span>
              <span class="metric-value">${reportData.brandMarketing.score}/100</span>
            </div>
            
            <h3>Brand Identity Assessment</h3>
            <p>Your brand marketing score of ${reportData.brandMarketing.score}/100 indicates significant opportunities for improvement in brand positioning and customer engagement. Based on our analysis, here are the key areas that need attention:</p>
            
            <h4>Current Brand Strengths:</h4>
            <ul>
              <li>Clear value proposition and service offering</li>
              <li>Professional design elements and consistent branding</li>
              <li>Established market presence in your industry</li>
            </ul>
            
            <h4>Critical Brand Issues:</h4>
            <ul>
              <li><strong>Limited Social Proof:</strong> Missing customer testimonials and reviews that build trust</li>
              <li><strong>Weak Call-to-Action Strategy:</strong> CTAs lack urgency and compelling messaging</li>
              <li><strong>Insufficient Trust Signals:</strong> No certifications, awards, or security badges displayed</li>
              <li><strong>Poor Conversion Optimization:</strong> Website doesn't effectively guide visitors toward conversion</li>
            </ul>
            
            <h4>Impact on Business:</h4>
            <p>These issues are significantly affecting your conversion rates and customer acquisition. Studies show that websites with strong social proof and trust signals convert 15-25% better than those without. Your current brand presentation may be costing you potential customers and revenue.</p>
            
            <h4>Recommended Brand Improvements:</h4>
            <div class="issue-card medium">
              <div class="issue-title">Add Customer Testimonials and Reviews</div>
              <div class="issue-description">Create a dedicated testimonials page and display customer reviews prominently on key pages. Include customer photos, company names, and specific results achieved.</div>
              <div class="issue-solution">
                <strong>Implementation:</strong> Collect testimonials from satisfied customers, create case studies, and display them strategically throughout the website.
              </div>
            </div>
            
            <div class="issue-card medium">
              <div class="issue-title">Implement Stronger Call-to-Action Strategy</div>
              <div class="issue-description">Replace generic CTAs with compelling, action-oriented buttons that create urgency and clearly communicate value.</div>
              <div class="issue-solution">
                <strong>Implementation:</strong> Use CTAs like "Get Free Consultation", "Start Your Free Trial", "Download Free Guide" with clear value propositions.
              </div>
            </div>
            
            <div class="issue-card low">
              <div class="issue-title">Add Trust Signals and Certifications</div>
              <div class="issue-description">Display industry certifications, security badges, and trust indicators to build credibility and reduce customer hesitation.</div>
              <div class="issue-solution">
                <strong>Implementation:</strong> Add SSL certificates, industry awards, client logos, and security badges to key conversion pages.
              </div>
            </div>
            
            <h4>Expected Results:</h4>
            <p>Implementing these brand improvements can increase conversion rates by 20-35%, improve customer trust and credibility, and ultimately drive more qualified leads and sales for your business.</p>
          </div>
          `
              : ""
          }

          <div class="footer">
            <p>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>This report contains ${issues.length} issues and ${
      suggestions.length
    } recommendations across ${technicalDetails.totalPages} analyzed pages.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
