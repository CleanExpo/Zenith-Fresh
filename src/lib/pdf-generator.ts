import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ScanData {
  id: string;
  url: string;
  status: string;
  performanceScore?: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  seoScore?: number;
  createdAt: string;
  completedAt?: string;
  project: {
    id: string;
    name: string;
  };
  alerts?: Array<{
    id: string;
    severity: string;
    title: string;
    description: string;
    currentValue?: number;
    previousValue?: number;
    threshold?: number;
  }>;
  results?: {
    performance?: {
      metrics: {
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        firstInputDelay: number;
        cumulativeLayoutShift: number;
        speedIndex: number;
        totalBlockingTime: number;
      };
    };
  };
}

interface PDFOptions {
  includeDetailedMetrics?: boolean;
  includeBranding?: boolean;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export class WebsiteAnalysisPDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
  }

  private addHeader(url: string, scanDate: string) {
    // Zenith branding
    this.doc.setFillColor(59, 130, 246); // Blue color
    this.doc.rect(0, 0, this.pageWidth, 25, 'F');
    
    // Logo placeholder and title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ZENITH', this.margin, 17);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Website Health Analysis Report', this.pageWidth - this.margin - 60, 17);
    
    this.currentY = 40;
    
    // Report title and URL
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Website Health Analysis Report', this.margin, this.currentY);
    
    this.currentY += 15;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`URL: ${url}`, this.margin, this.currentY);
    
    this.currentY += 8;
    this.doc.text(`Report Generated: ${scanDate}`, this.margin, this.currentY);
    
    this.currentY += 20;
  }

  private addScoreSection(scan: ScanData) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Overall Scores', this.margin, this.currentY);
    this.currentY += 15;

    const scores = [
      { name: 'Performance', score: scan.performanceScore || 0 },
      { name: 'Accessibility', score: scan.accessibilityScore || 0 },
      { name: 'Best Practices', score: scan.bestPracticesScore || 0 },
      { name: 'SEO', score: scan.seoScore || 0 },
    ];

    // Create scores table
    const tableData = scores.map(score => [
      score.name,
      score.score.toString(),
      this.getScoreRating(score.score)
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Category', 'Score', 'Rating']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' }
      },
      didDrawCell: (data: any) => {
        if (data.column.index === 1 && data.section === 'body') {
          const score = parseInt(data.cell.text[0]);
          this.doc.setFillColor(...this.getScoreColor(score));
          this.doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          this.doc.setTextColor(255, 255, 255);
          this.doc.text(data.cell.text[0], data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2 + 2, { align: 'center' });
        }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addPerformanceMetrics(scan: ScanData) {
    if (!scan.results?.performance?.metrics) return;

    this.checkPageBreak(80);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Performance Metrics', this.margin, this.currentY);
    this.currentY += 15;

    const metrics = scan.results.performance.metrics;
    const metricsData = [
      ['First Contentful Paint', `${metrics.firstContentfulPaint.toFixed(0)}ms`, this.getMetricRating(metrics.firstContentfulPaint, 1800)],
      ['Largest Contentful Paint', `${metrics.largestContentfulPaint.toFixed(0)}ms`, this.getMetricRating(metrics.largestContentfulPaint, 2500)],
      ['First Input Delay', `${metrics.firstInputDelay.toFixed(0)}ms`, this.getMetricRating(metrics.firstInputDelay, 100)],
      ['Cumulative Layout Shift', metrics.cumulativeLayoutShift.toFixed(3), this.getMetricRating(metrics.cumulativeLayoutShift, 0.1)],
      ['Speed Index', `${metrics.speedIndex.toFixed(0)}ms`, this.getMetricRating(metrics.speedIndex, 3400)],
      ['Total Blocking Time', `${metrics.totalBlockingTime.toFixed(0)}ms`, this.getMetricRating(metrics.totalBlockingTime, 200)],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Metric', 'Value', 'Status']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addAlertsSection(scan: ScanData) {
    if (!scan.alerts || scan.alerts.length === 0) {
      this.checkPageBreak(50);
      
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Issues & Alerts', this.margin, this.currentY);
      this.currentY += 15;
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(34, 197, 94); // Green color
      this.doc.text('✓ No critical issues found. Your website is performing well!', this.margin, this.currentY);
      this.doc.setTextColor(0, 0, 0);
      this.currentY += 20;
      return;
    }

    this.checkPageBreak(100);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Issues & Alerts', this.margin, this.currentY);
    this.currentY += 15;

    // Group alerts by severity
    const groupedAlerts = scan.alerts.reduce((acc: any, alert) => {
      if (!acc[alert.severity]) acc[alert.severity] = [];
      acc[alert.severity].push(alert);
      return acc;
    }, {});

    const severityOrder = ['critical', 'high', 'medium', 'low'];
    
    severityOrder.forEach(severity => {
      const alerts = groupedAlerts[severity];
      if (!alerts) return;

      this.checkPageBreak(30 + (alerts.length * 20));
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.getSeverityColor(severity));
      this.doc.text(`${severity.toUpperCase()} (${alerts.length})`, this.margin, this.currentY);
      this.doc.setTextColor(0, 0, 0);
      this.currentY += 10;

      alerts.forEach((alert: any) => {
        this.checkPageBreak(25);
        
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`• ${alert.title}`, this.margin + 5, this.currentY);
        this.currentY += 6;
        
        this.doc.setFont('helvetica', 'normal');
        const splitDescription = this.doc.splitTextToSize(alert.description, this.pageWidth - 2 * this.margin - 10);
        this.doc.text(splitDescription, this.margin + 10, this.currentY);
        this.currentY += splitDescription.length * 4 + 5;
      });
      
      this.currentY += 10;
    });
  }

  private addRecommendations(scan: ScanData) {
    this.checkPageBreak(100);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Recommendations', this.margin, this.currentY);
    this.currentY += 15;

    const recommendations = this.generateRecommendations(scan);
    
    recommendations.forEach((rec, index) => {
      this.checkPageBreak(25);
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${rec.title}`, this.margin, this.currentY);
      this.currentY += 8;
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      const splitText = this.doc.splitTextToSize(rec.description, this.pageWidth - 2 * this.margin);
      this.doc.text(splitText, this.margin + 5, this.currentY);
      this.currentY += splitText.length * 4 + 10;
    });
  }

  private addFooter() {
    const footerY = this.pageHeight - 15;
    this.doc.setFontSize(8);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text('Generated by Zenith Platform - zenith.engineer', this.margin, footerY);
    this.doc.text(`Page ${this.doc.getNumberOfPages()}`, this.pageWidth - this.margin - 20, footerY);
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private getScoreColor(score: number): [number, number, number] {
    if (score >= 90) return [34, 197, 94]; // Green
    if (score >= 70) return [234, 179, 8]; // Yellow
    if (score >= 50) return [249, 115, 22]; // Orange
    return [239, 68, 68]; // Red
  }

  private getScoreRating(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  }

  private getMetricRating(value: number, threshold: number): string {
    return value <= threshold ? 'Good' : 'Needs Improvement';
  }

  private getSeverityColor(severity: string): [number, number, number] {
    switch (severity) {
      case 'critical': return [239, 68, 68]; // Red
      case 'high': return [249, 115, 22]; // Orange
      case 'medium': return [234, 179, 8]; // Yellow
      case 'low': return [59, 130, 246]; // Blue
      default: return [107, 114, 128]; // Gray
    }
  }

  private generateRecommendations(scan: ScanData) {
    const recommendations = [];
    
    // Performance recommendations
    if ((scan.performanceScore || 0) < 70) {
      recommendations.push({
        title: 'Optimize Website Performance',
        description: 'Consider implementing image optimization, minifying CSS/JavaScript, enabling compression, and using a Content Delivery Network (CDN) to improve loading times.'
      });
    }

    // Accessibility recommendations
    if ((scan.accessibilityScore || 0) < 80) {
      recommendations.push({
        title: 'Improve Accessibility',
        description: 'Add alt text to images, ensure proper color contrast, implement keyboard navigation, and use semantic HTML elements to make your website accessible to all users.'
      });
    }

    // SEO recommendations
    if ((scan.seoScore || 0) < 80) {
      recommendations.push({
        title: 'Enhance SEO',
        description: 'Optimize meta titles and descriptions, add structured data markup, improve internal linking, and ensure your website is mobile-friendly for better search engine rankings.'
      });
    }

    // Security recommendations based on alerts
    const hasSecurityAlerts = scan.alerts?.some(alert => 
      alert.title.toLowerCase().includes('security') || 
      alert.title.toLowerCase().includes('ssl') ||
      alert.title.toLowerCase().includes('https')
    );

    if (hasSecurityAlerts) {
      recommendations.push({
        title: 'Address Security Issues',
        description: 'Review and resolve security vulnerabilities, ensure SSL certificates are properly configured, and implement security headers to protect your website and users.'
      });
    }

    // General maintenance recommendation
    recommendations.push({
      title: 'Regular Monitoring',
      description: 'Schedule regular website health checks using Zenith Platform to track performance trends, catch issues early, and maintain optimal website performance.'
    });

    return recommendations;
  }

  public generatePDF(scan: ScanData, options: PDFOptions = {}): jsPDF {
    const scanDate = scan.completedAt ? 
      new Date(scan.completedAt).toLocaleDateString() : 
      new Date(scan.createdAt).toLocaleDateString();

    // Add header
    this.addHeader(scan.url, scanDate);

    // Add overall scores
    this.addScoreSection(scan);

    // Add performance metrics if available and requested
    if (options.includeDetailedMetrics && scan.results?.performance) {
      this.addPerformanceMetrics(scan);
    }

    // Add alerts section
    this.addAlertsSection(scan);

    // Add recommendations
    this.addRecommendations(scan);

    // Add footer to all pages
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter();
    }

    return this.doc;
  }

  public downloadPDF(scan: ScanData, options: PDFOptions = {}) {
    const pdf = this.generatePDF(scan, options);
    const fileName = `website-analysis-${scan.url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }
}

// Utility function for easy use
export function downloadWebsiteAnalysisPDF(scan: ScanData, options: PDFOptions = {}) {
  const generator = new WebsiteAnalysisPDFGenerator();
  generator.downloadPDF(scan, { includeDetailedMetrics: true, ...options });
}

// Legacy export for API compatibility
export function PDFReport(props: any) {
  // This is a placeholder for React PDF compatibility
  // The actual PDF generation is handled by WebsiteAnalysisPDFGenerator
  return null;
}