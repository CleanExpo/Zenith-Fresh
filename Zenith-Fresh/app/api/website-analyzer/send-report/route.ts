import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { renderToBuffer } from '@react-pdf/renderer';
import { PDFReport } from '@/lib/pdf-generator';
import { AnalysisResults, ReportConfig } from '@/types/analyzer';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { sendEmailWithAttachment } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if PDF reports feature is enabled
    if (!isFeatureEnabled('PDF_REPORTS', session.user?.email, session.user?.id)) {
      return NextResponse.json({ error: 'PDF reports feature not available' }, { status: 403 });
    }

    const { analysisResults, reportConfig }: { 
      analysisResults: AnalysisResults; 
      reportConfig: ReportConfig;
    } = await request.json();

    if (!analysisResults || !reportConfig || !reportConfig.emailDelivery?.enabled) {
      return NextResponse.json({ error: 'Missing required data or email not configured' }, { status: 400 });
    }

    if (!reportConfig.emailDelivery.recipients?.length) {
      return NextResponse.json({ error: 'No email recipients specified' }, { status: 400 });
    }

    // Generate PDF
    const pdfBuffer = await generatePDFReport(analysisResults, reportConfig);

    // Send email with PDF attachment
    await sendReportEmail(analysisResults, reportConfig, pdfBuffer, session.user);

    // Log the email send for analytics
    await logEmailSend(session.user?.id, analysisResults.url, reportConfig.emailDelivery.recipients);

    return NextResponse.json({ 
      success: true, 
      message: `Report sent to ${reportConfig.emailDelivery.recipients.length} recipient(s)` 
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email report' },
      { status: 500 }
    );
  }
}

async function generatePDFReport(analysisResults: AnalysisResults, reportConfig: ReportConfig): Promise<Buffer> {
  try {
    // Create React PDF document - call the functional component directly
    const pdfDocument = PDFReport({ analysisResults, reportConfig });
    
    // Ensure we have a valid document element
    if (!pdfDocument) {
      throw new Error('PDF document generation failed');
    }
    
    // Render to buffer with type assertion
    const pdfBuffer = await renderToBuffer(pdfDocument as any);
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('PDF rendering error:', error);
    throw new Error('Failed to render PDF document');
  }
}

async function sendReportEmail(
  analysisResults: AnalysisResults, 
  reportConfig: ReportConfig, 
  pdfBuffer: Buffer,
  user: any
) {
  const emailConfig = reportConfig.emailDelivery!;
  
  const emailData = {
    to: emailConfig.recipients,
    subject: emailConfig.subject || `Website Analysis Report - ${analysisResults.url}`,
    html: generateEmailHTML(analysisResults, reportConfig, user),
    text: generateEmailText(analysisResults, reportConfig, user),
    attachments: [
      {
        filename: `website-analysis-${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await sendEmailWithAttachment(emailData);
}

function generateEmailHTML(analysisResults: AnalysisResults, reportConfig: ReportConfig, user: any): string {
  const customMessage = reportConfig.emailDelivery?.message || '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Analysis Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 14px; }
        .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 20px 0; }
        .score-card { text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .score-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .score-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .high-score { color: #059669; }
        .medium-score { color: #d97706; }
        .low-score { color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Website Analysis Report</h1>
          <p>Comprehensive analysis for ${analysisResults.url}</p>
        </div>
        
        <div class="content">
          ${customMessage ? `<p><strong>Message:</strong> ${customMessage}</p>` : ''}
          
          <h2>Analysis Summary</h2>
          <p>We've completed a comprehensive analysis of your website covering performance, SEO, security, and accessibility. Here are the key findings:</p>
          
          <div class="score-grid">
            <div class="score-card">
              <div class="score-value ${getScoreClass(analysisResults.overallScore)}">${analysisResults.overallScore}</div>
              <div class="score-label">Overall Score</div>
            </div>
            <div class="score-card">
              <div class="score-value ${getScoreClass(Math.round((100 - analysisResults.performance.loadTime / 50) * 100) / 100)}">${Math.round((100 - analysisResults.performance.loadTime / 50) * 100) / 100}</div>
              <div class="score-label">Performance</div>
            </div>
            <div class="score-card">
              <div class="score-value ${getScoreClass(analysisResults.seo.score)}">${analysisResults.seo.score}</div>
              <div class="score-label">SEO</div>
            </div>
            <div class="score-card">
              <div class="score-value ${getScoreClass(analysisResults.security.score)}">${analysisResults.security.score}</div>
              <div class="score-label">Security</div>
            </div>
            <div class="score-card">
              <div class="score-value ${getScoreClass(analysisResults.accessibility.score)}">${analysisResults.accessibility.score}</div>
              <div class="score-label">Accessibility</div>
            </div>
          </div>
          
          <h3>Key Recommendations</h3>
          <ul>
            ${analysisResults.recommendations.performance.slice(0, 2).map(rec => `<li><strong>${rec.title}:</strong> ${rec.description}</li>`).join('')}
            ${analysisResults.recommendations.seo.slice(0, 2).map(rec => `<li><strong>${rec.title}:</strong> ${rec.description}</li>`).join('')}
          </ul>
          
          <p>The detailed report is attached as a PDF and contains comprehensive analysis, findings, and actionable recommendations to improve your website.</p>
          
          <p>If you have any questions about this report, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
          <p>Report generated by <strong>Zenith Platform</strong> on ${new Date(analysisResults.timestamp).toLocaleDateString()}</p>
          <p>Sent by ${user?.name || user?.email} • <a href="https://zenith.engineer">https://zenith.engineer</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateEmailText(analysisResults: AnalysisResults, reportConfig: ReportConfig, user: any): string {
  const customMessage = reportConfig.emailDelivery?.message || '';
  
  return `
Website Analysis Report - ${analysisResults.url}

${customMessage ? `Message: ${customMessage}\n\n` : ''}

Analysis Summary:
- Overall Score: ${analysisResults.overallScore}/100
- Performance: ${Math.round((100 - analysisResults.performance.loadTime / 50) * 100) / 100}/100
- SEO: ${analysisResults.seo.score}/100
- Security: ${analysisResults.security.score}/100
- Accessibility: ${analysisResults.accessibility.score}/100

The detailed report is attached as a PDF with comprehensive analysis and recommendations.

Report generated by Zenith Platform on ${new Date(analysisResults.timestamp).toLocaleDateString()}
Sent by ${user?.name || user?.email}
https://zenith.engineer
  `;
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'high-score';
  if (score >= 60) return 'medium-score';
  return 'low-score';
}

async function logEmailSend(userId: string | undefined, url: string, recipients: string[]) {
  try {
    console.log(`Email sent - User: ${userId}, URL: ${url}, Recipients: ${recipients.length}, Time: ${new Date().toISOString()}`);
    
    // Example: Log to database
    // await prisma.auditLog.create({
    //   data: {
    //     userId,
    //     action: 'EMAIL_REPORT_SENT',
    //     details: { url, recipientCount: recipients.length },
    //     timestamp: new Date(),
    //   },
    // });
  } catch (error) {
    console.error('Failed to log email send:', error);
  }
}