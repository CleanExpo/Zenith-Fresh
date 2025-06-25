import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { AnalysisResults, ReportConfig } from '@/types/analyzer';

// Register fonts (you can add custom fonts here)
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    marginTop: 15,
  },
  text: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 5,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  metricLabel: {
    fontSize: 10,
    color: '#374151',
    flex: 1,
  },
  metricValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
  },
  recommendation: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  priorityHigh: {
    color: '#dc2626',
  },
  priorityMedium: {
    color: '#d97706',
  },
  priorityLow: {
    color: '#059669',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

interface PDFReportProps {
  analysisResults: AnalysisResults;
  reportConfig: ReportConfig;
}

export const PDFReport: React.FC<PDFReportProps> = ({ analysisResults, reportConfig }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#059669';
    if (score >= 75) return '#d97706';
    if (score >= 50) return '#dc2626';
    return '#dc2626';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatMetric = (value: number, unit: string = 'ms') => {
    if (value < 1000) return `${Math.round(value)}${unit}`;
    return `${(value / 1000).toFixed(1)}s`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              {reportConfig.reportTitle || 'Website Health Analysis Report'}
            </Text>
            <Text style={styles.subtitle}>
              {analysisResults.url}
            </Text>
            <Text style={styles.subtitle}>
              Generated on {formatDate(analysisResults.timestamp)}
            </Text>
            {reportConfig.companyName && (
              <Text style={styles.subtitle}>
                Prepared for {reportConfig.companyName}
              </Text>
            )}
          </View>
          {reportConfig.includeLogo && (
            <View>
              <Text style={{ fontSize: 16, color: reportConfig.brandColor, fontWeight: 'bold' }}>
                Zenith Platform
              </Text>
            </View>
          )}
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.scoreContainer}>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: getScoreColor(analysisResults.overallScore) }]}>
                {analysisResults.overallScore}
              </Text>
              <Text style={styles.scoreLabel}>Overall Score</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: getScoreColor(Math.round((100 - analysisResults.performance.loadTime / 50) * 100) / 100) }]}>
                {Math.round((100 - analysisResults.performance.loadTime / 50) * 100) / 100}
              </Text>
              <Text style={styles.scoreLabel}>Performance</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: getScoreColor(analysisResults.seo.score) }]}>
                {analysisResults.seo.score}
              </Text>
              <Text style={styles.scoreLabel}>SEO</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: getScoreColor(analysisResults.security.score) }]}>
                {analysisResults.security.score}
              </Text>
              <Text style={styles.scoreLabel}>Security</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: getScoreColor(analysisResults.accessibility.score) }]}>
                {analysisResults.accessibility.score}
              </Text>
              <Text style={styles.scoreLabel}>Accessibility</Text>
            </View>
          </View>
        </View>

        {/* Performance Section */}
        {reportConfig.includePerformance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Analysis</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Load Time</Text>
              <Text style={styles.metricValue}>{formatMetric(analysisResults.performance.loadTime)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>First Contentful Paint</Text>
              <Text style={styles.metricValue}>{formatMetric(analysisResults.performance.firstContentfulPaint)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Largest Contentful Paint</Text>
              <Text style={styles.metricValue}>{formatMetric(analysisResults.performance.largestContentfulPaint)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Cumulative Layout Shift</Text>
              <Text style={styles.metricValue}>{analysisResults.performance.cumulativeLayoutShift.toFixed(3)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Time to Interactive</Text>
              <Text style={styles.metricValue}>{formatMetric(analysisResults.performance.timeToInteractive)}</Text>
            </View>
          </View>
        )}

        {/* SEO Section */}
        {reportConfig.includeSEO && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SEO Analysis</Text>
            <Text style={styles.sectionSubtitle}>Page Structure</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Title Tag</Text>
              <Text style={styles.metricValue}>
                {analysisResults.seo.title.present ? 
                  `Present (${analysisResults.seo.title.length} chars)` : 
                  'Missing'
                }
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Meta Description</Text>
              <Text style={styles.metricValue}>
                {analysisResults.seo.metaDescription.present ? 
                  `Present (${analysisResults.seo.metaDescription.length} chars)` : 
                  'Missing'
                }
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>H1 Tags</Text>
              <Text style={styles.metricValue}>{analysisResults.seo.headings.h1Count}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Internal Links</Text>
              <Text style={styles.metricValue}>{analysisResults.seo.internalLinks}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Images with Alt Text</Text>
              <Text style={styles.metricValue}>
                {analysisResults.seo.images.withAlt}/{analysisResults.seo.images.total}
              </Text>
            </View>
          </View>
        )}
      </Page>

      {/* Second Page for Security and Accessibility */}
      <Page size="A4" style={styles.page}>
        {/* Security Section */}
        {reportConfig.includeSecurity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Analysis</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>HTTPS</Text>
              <Text style={styles.metricValue}>{analysisResults.security.https ? 'Enabled' : 'Disabled'}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>HSTS</Text>
              <Text style={styles.metricValue}>{analysisResults.security.hsts ? 'Enabled' : 'Disabled'}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Content Security Policy</Text>
              <Text style={styles.metricValue}>{analysisResults.security.contentSecurityPolicy ? 'Enabled' : 'Disabled'}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>X-Frame-Options</Text>
              <Text style={styles.metricValue}>{analysisResults.security.xFrameOptions ? 'Enabled' : 'Disabled'}</Text>
            </View>

            {analysisResults.security.vulnerabilities.length > 0 && (
              <View>
                <Text style={styles.sectionSubtitle}>Security Vulnerabilities</Text>
                {analysisResults.security.vulnerabilities.slice(0, 5).map((vuln, index) => (
                  <View key={index} style={styles.recommendation}>
                    <Text style={[styles.recommendationTitle, 
                      vuln.severity === 'critical' ? styles.priorityHigh :
                      vuln.severity === 'high' ? styles.priorityHigh :
                      vuln.severity === 'medium' ? styles.priorityMedium : styles.priorityLow
                    ]}>
                      {vuln.type} ({vuln.severity.toUpperCase()})
                    </Text>
                    <Text style={styles.recommendationText}>{vuln.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Accessibility Section */}
        {reportConfig.includeAccessibility && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessibility Analysis</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Color Contrast Passed</Text>
              <Text style={styles.metricValue}>{analysisResults.accessibility.colorContrast.passed}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Color Contrast Failed</Text>
              <Text style={styles.metricValue}>{analysisResults.accessibility.colorContrast.failed}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Keyboard Navigation</Text>
              <Text style={styles.metricValue}>{analysisResults.accessibility.keyboardNavigation ? 'Supported' : 'Not Supported'}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Screen Reader Compatible</Text>
              <Text style={styles.metricValue}>{analysisResults.accessibility.screenReaderCompatibility ? 'Yes' : 'No'}</Text>
            </View>

            {analysisResults.accessibility.violations.length > 0 && (
              <View>
                <Text style={styles.sectionSubtitle}>Accessibility Issues</Text>
                {analysisResults.accessibility.violations.slice(0, 5).map((violation, index) => (
                  <View key={index} style={styles.recommendation}>
                    <Text style={[styles.recommendationTitle,
                      violation.impact === 'critical' ? styles.priorityHigh :
                      violation.impact === 'serious' ? styles.priorityHigh :
                      violation.impact === 'moderate' ? styles.priorityMedium : styles.priorityLow
                    ]}>
                      {violation.description}
                    </Text>
                    <Text style={styles.recommendationText}>{violation.help}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </Page>

      {/* Third Page for Recommendations */}
      {reportConfig.includeRecommendations && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>

            {/* Performance Recommendations */}
            {analysisResults.recommendations.performance.length > 0 && (
              <View>
                <Text style={styles.sectionSubtitle}>Performance Improvements</Text>
                {analysisResults.recommendations.performance.slice(0, 3).map((rec, index) => (
                  <View key={index} style={styles.recommendation}>
                    <Text style={[styles.recommendationTitle,
                      rec.priority === 'high' ? styles.priorityHigh :
                      rec.priority === 'medium' ? styles.priorityMedium : styles.priorityLow
                    ]}>
                      {rec.title} ({rec.priority.toUpperCase()} PRIORITY)
                    </Text>
                    <Text style={styles.recommendationText}>{rec.description}</Text>
                    <Text style={[styles.recommendationText, { marginTop: 3, fontStyle: 'italic' }]}>
                      Impact: {rec.impact} | Effort: {rec.effort}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* SEO Recommendations */}
            {analysisResults.recommendations.seo.length > 0 && (
              <View>
                <Text style={styles.sectionSubtitle}>SEO Improvements</Text>
                {analysisResults.recommendations.seo.slice(0, 3).map((rec, index) => (
                  <View key={index} style={styles.recommendation}>
                    <Text style={[styles.recommendationTitle,
                      rec.priority === 'high' ? styles.priorityHigh :
                      rec.priority === 'medium' ? styles.priorityMedium : styles.priorityLow
                    ]}>
                      {rec.title} ({rec.priority.toUpperCase()} PRIORITY)
                    </Text>
                    <Text style={styles.recommendationText}>{rec.description}</Text>
                    <Text style={[styles.recommendationText, { marginTop: 3, fontStyle: 'italic' }]}>
                      Impact: {rec.impact} | Effort: {rec.effort}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Security Recommendations */}
            {analysisResults.recommendations.security.length > 0 && (
              <View>
                <Text style={styles.sectionSubtitle}>Security Improvements</Text>
                {analysisResults.recommendations.security.slice(0, 3).map((rec, index) => (
                  <View key={index} style={styles.recommendation}>
                    <Text style={[styles.recommendationTitle,
                      rec.priority === 'high' ? styles.priorityHigh :
                      rec.priority === 'medium' ? styles.priorityMedium : styles.priorityLow
                    ]}>
                      {rec.title} ({rec.priority.toUpperCase()} PRIORITY)
                    </Text>
                    <Text style={styles.recommendationText}>{rec.description}</Text>
                    <Text style={[styles.recommendationText, { marginTop: 3, fontStyle: 'italic' }]}>
                      Impact: {rec.impact} | Effort: {rec.effort}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Generated by Zenith Platform • https://zenith.engineer • Report Date: {formatDate(analysisResults.timestamp)}
          </Text>
        </Page>
      )}
    </Document>
  );
};