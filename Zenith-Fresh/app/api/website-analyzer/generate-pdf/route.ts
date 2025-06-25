import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { renderToBuffer } from '@react-pdf/renderer';
import { PDFReport } from '@/lib/pdf-generator';
import { AnalysisResults, ReportConfig } from '@/types/analyzer';
import { isFeatureEnabled } from '@/lib/feature-flags';

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

    if (!analysisResults || !reportConfig) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Check cache for existing PDF
    const cacheKey = `pdf:${analysisResults.url}:${JSON.stringify(reportConfig)}`;
    // In production, implement Redis cache check here

    // Generate PDF
    const pdfBuffer = await generatePDFReport(analysisResults, reportConfig);

    // Cache the PDF for 1 hour
    // await cacheService.set(cacheKey, pdfBuffer, 3600);

    // Log the PDF generation for analytics
    await logPDFGeneration(session.user?.id, analysisResults.url);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="website-analysis-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}

async function generatePDFReport(analysisResults: AnalysisResults, reportConfig: ReportConfig): Promise<Buffer> {
  try {
    // Create React PDF document
    const pdfDocument = PDFReport({ analysisResults, reportConfig });
    
    // Render to buffer
    const pdfBuffer = await renderToBuffer(pdfDocument);
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('PDF rendering error:', error);
    throw new Error('Failed to render PDF document');
  }
}

async function logPDFGeneration(userId: string | undefined, url: string) {
  try {
    // In production, log to your analytics system or database
    console.log(`PDF generated - User: ${userId}, URL: ${url}, Time: ${new Date().toISOString()}`);
    
    // Example: Log to database
    // await prisma.auditLog.create({
    //   data: {
    //     userId,
    //     action: 'PDF_REPORT_GENERATED',
    //     details: { url },
    //     timestamp: new Date(),
    //   },
    // });
  } catch (error) {
    console.error('Failed to log PDF generation:', error);
    // Don't throw error - logging failure shouldn't break PDF generation
  }
}