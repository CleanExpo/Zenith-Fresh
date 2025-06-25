import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportConfig {
  type: 'dashboard' | 'report' | 'raw_data';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  data: any;
  title?: string;
  subtitle?: string;
  includeCharts?: boolean;
  includeMetadata?: boolean;
  branding?: {
    logo?: string;
    companyName?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export interface ExportJob {
  id: string;
  type: string;
  format: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  config: ExportConfig;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  userId: string;
  teamId: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

class ExportService {
  async createExportJob(
    userId: string,
    teamId: string,
    config: ExportConfig
  ): Promise<string> {
    const job = await prisma.dataExportJob.create({
      data: {
        type: config.type,
        format: config.format,
        status: 'queued',
        config: config as any,
        userId,
        teamId
      }
    });

    // Process the job asynchronously
    this.processExportJob(job.id).catch(error => {
      console.error('Export job processing failed:', error);
      this.updateJobStatus(job.id, 'failed', error.message);
    });

    return job.id;
  }

  async processExportJob(jobId: string): Promise<void> {
    // Update status to processing
    await this.updateJobStatus(jobId, 'processing');

    const job = await prisma.dataExportJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new Error('Export job not found');
    }

    const config = job.config as ExportConfig;
    let fileBuffer: Buffer;
    let fileName: string;

    try {
      switch (config.format) {
        case 'pdf':
          fileBuffer = await this.generatePDF(config);
          fileName = `export-${Date.now()}.pdf`;
          break;
        
        case 'excel':
          fileBuffer = await this.generateExcel(config);
          fileName = `export-${Date.now()}.xlsx`;
          break;
        
        case 'csv':
          fileBuffer = await this.generateCSV(config);
          fileName = `export-${Date.now()}.csv`;
          break;
        
        case 'json':
          fileBuffer = await this.generateJSON(config);
          fileName = `export-${Date.now()}.json`;
          break;
        
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      // In a real implementation, you would upload to cloud storage
      // For now, we'll simulate a file URL
      const fileUrl = `/exports/${fileName}`;
      const fileSize = fileBuffer.length;

      await prisma.dataExportJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          fileUrl,
          fileSize,
          completedAt: new Date()
        }
      });

    } catch (error) {
      await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: 'queued' | 'processing' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    await prisma.dataExportJob.update({
      where: { id: jobId },
      data: {
        status,
        ...(error && { error }),
        ...(status === 'processing' && { startedAt: new Date() }),
        ...(status === 'completed' && { completedAt: new Date() })
      }
    });
  }

  private async generatePDF(config: ExportConfig): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Add branding
    if (config.branding?.companyName) {
      doc.setFontSize(20);
      doc.setTextColor(config.branding.colors?.primary || '#000000');
      doc.text(config.branding.companyName, 20, 30);
    }

    // Add title
    doc.setFontSize(16);
    doc.setTextColor('#000000');
    doc.text(config.title || 'Analytics Report', 20, 50);

    // Add subtitle
    if (config.subtitle) {
      doc.setFontSize(12);
      doc.setTextColor('#666666');
      doc.text(config.subtitle, 20, 65);
    }

    // Add metadata
    if (config.includeMetadata) {
      doc.setFontSize(10);
      doc.setTextColor('#999999');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 20);
    }

    let yPosition = 80;

    // Process data based on type
    if (config.type === 'dashboard') {
      yPosition = await this.addDashboardContentToPDF(doc, config.data, yPosition);
    } else if (config.type === 'report') {
      yPosition = await this.addReportContentToPDF(doc, config.data, yPosition);
    } else {
      yPosition = await this.addRawDataToPDF(doc, config.data, yPosition);
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  private async addDashboardContentToPDF(doc: jsPDF, data: any, yPosition: number): Promise<number> {
    // Add KPIs summary
    if (data.kpis && data.kpis.length > 0) {
      doc.setFontSize(14);
      doc.text('Key Performance Indicators', 20, yPosition);
      yPosition += 20;

      const kpiData = data.kpis.map((kpi: any) => [
        kpi.title,
        kpi.value.toLocaleString(),
        kpi.change ? `${kpi.change > 0 ? '+' : ''}${kpi.change.toFixed(1)}%` : 'N/A'
      ]);

      autoTable(doc, {
        head: [['Metric', 'Value', 'Change']],
        body: kpiData,
        startY: yPosition,
        margin: { left: 20 },
        styles: { fontSize: 10 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Add widgets summary
    if (data.widgets && data.widgets.length > 0) {
      doc.setFontSize(14);
      doc.text('Dashboard Widgets', 20, yPosition);
      yPosition += 20;

      data.widgets.forEach((widget: any, index: number) => {
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${widget.title}`, 30, yPosition);
        yPosition += 15;

        if (widget.description) {
          doc.setFontSize(10);
          doc.setTextColor('#666666');
          doc.text(widget.description, 30, yPosition);
          yPosition += 15;
        }

        doc.setTextColor('#000000');
        yPosition += 5;
      });
    }

    return yPosition;
  }

  private async addReportContentToPDF(doc: jsPDF, data: any, yPosition: number): Promise<number> {
    // Add report sections
    if (data.sections && data.sections.length > 0) {
      data.sections.forEach((section: any) => {
        doc.setFontSize(14);
        doc.text(section.title, 20, yPosition);
        yPosition += 20;

        if (section.content) {
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(section.content, 170);
          doc.text(lines, 20, yPosition);
          yPosition += lines.length * 5 + 10;
        }

        if (section.data && Array.isArray(section.data)) {
          autoTable(doc, {
            head: section.columns ? [section.columns] : undefined,
            body: section.data,
            startY: yPosition,
            margin: { left: 20 },
            styles: { fontSize: 9 }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 20;
        }
      });
    }

    return yPosition;
  }

  private async addRawDataToPDF(doc: jsPDF, data: any, yPosition: number): Promise<number> {
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(header => String(item[header] || '')));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: yPosition,
        margin: { left: 20 },
        styles: { fontSize: 8 },
        columnStyles: headers.reduce((acc, header, index) => {
          acc[index] = { cellWidth: 'auto' };
          return acc;
        }, {} as any)
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    return yPosition;
  }

  private async generateExcel(config: ExportConfig): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    if (config.type === 'dashboard') {
      await this.addDashboardSheetsToWorkbook(workbook, config.data);
    } else if (config.type === 'report') {
      await this.addReportSheetsToWorkbook(workbook, config.data);
    } else {
      await this.addRawDataSheetToWorkbook(workbook, config.data);
    }

    // Add metadata sheet
    if (config.includeMetadata) {
      const metadata = [
        ['Report Title', config.title || 'Analytics Export'],
        ['Generated On', new Date().toLocaleString()],
        ['Export Type', config.type],
        ['Format', config.format]
      ];

      const metadataSheet = XLSX.utils.aoa_to_sheet(metadata);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
    }

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  private async addDashboardSheetsToWorkbook(workbook: XLSX.WorkBook, data: any): Promise<void> {
    // KPIs sheet
    if (data.kpis && data.kpis.length > 0) {
      const kpiData = [
        ['Metric', 'Value', 'Change (%)', 'Trend', 'Timeframe'],
        ...data.kpis.map((kpi: any) => [
          kpi.title,
          kpi.value,
          kpi.change || 0,
          kpi.trend || 'flat',
          kpi.timeframe || 'N/A'
        ])
      ];

      const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');
    }

    // Widgets sheet
    if (data.widgets && data.widgets.length > 0) {
      const widgetData = [
        ['Widget', 'Type', 'Title', 'Description'],
        ...data.widgets.map((widget: any, index: number) => [
          index + 1,
          widget.type,
          widget.title,
          widget.description || ''
        ])
      ];

      const widgetSheet = XLSX.utils.aoa_to_sheet(widgetData);
      XLSX.utils.book_append_sheet(workbook, widgetSheet, 'Widgets');
    }
  }

  private async addReportSheetsToWorkbook(workbook: XLSX.WorkBook, data: any): Promise<void> {
    if (data.sections && data.sections.length > 0) {
      data.sections.forEach((section: any, index: number) => {
        if (section.data && Array.isArray(section.data) && section.data.length > 0) {
          const headers = section.columns || Object.keys(section.data[0]);
          const sheetData = [
            headers,
            ...section.data.map((item: any) => 
              headers.map((header: string) => item[header] || '')
            )
          ];

          const sheet = XLSX.utils.aoa_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(workbook, sheet, section.title.substring(0, 31));
        }
      });
    }
  }

  private async addRawDataSheetToWorkbook(workbook: XLSX.WorkBook, data: any): Promise<void> {
    if (Array.isArray(data) && data.length > 0) {
      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Data');
    }
  }

  private async generateCSV(config: ExportConfig): Promise<Buffer> {
    let csvContent = '';

    if (config.type === 'dashboard' && config.data.kpis) {
      csvContent += 'Metric,Value,Change (%),Trend,Timeframe\n';
      config.data.kpis.forEach((kpi: any) => {
        csvContent += `"${kpi.title}",${kpi.value},${kpi.change || 0},"${kpi.trend || 'flat'}","${kpi.timeframe || 'N/A'}"\n`;
      });
    } else if (Array.isArray(config.data) && config.data.length > 0) {
      const headers = Object.keys(config.data[0]);
      csvContent += headers.join(',') + '\n';
      
      config.data.forEach((item: any) => {
        const row = headers.map(header => {
          const value = item[header] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvContent += row.join(',') + '\n';
      });
    }

    return Buffer.from(csvContent, 'utf-8');
  }

  private async generateJSON(config: ExportConfig): Promise<Buffer> {
    const exportData = {
      metadata: {
        title: config.title || 'Analytics Export',
        subtitle: config.subtitle,
        exportType: config.type,
        format: config.format,
        generatedAt: new Date().toISOString(),
        ...(config.branding && { branding: config.branding })
      },
      data: config.data
    };

    return Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');
  }

  async getExportJob(jobId: string): Promise<ExportJob | null> {
    const job = await prisma.dataExportJob.findUnique({
      where: { id: jobId }
    });

    if (!job) return null;

    return {
      id: job.id,
      type: job.type,
      format: job.format,
      status: job.status as any,
      config: job.config as ExportConfig,
      fileUrl: job.fileUrl || undefined,
      fileSize: job.fileSize || undefined,
      error: job.error || undefined,
      userId: job.userId,
      teamId: job.teamId,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
      createdAt: job.createdAt
    };
  }

  async getExportJobs(userId: string, teamId?: string): Promise<ExportJob[]> {
    const jobs = await prisma.dataExportJob.findMany({
      where: {
        userId,
        ...(teamId && { teamId })
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return jobs.map(job => ({
      id: job.id,
      type: job.type,
      format: job.format,
      status: job.status as any,
      config: job.config as ExportConfig,
      fileUrl: job.fileUrl || undefined,
      fileSize: job.fileSize || undefined,
      error: job.error || undefined,
      userId: job.userId,
      teamId: job.teamId,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
      createdAt: job.createdAt
    }));
  }
}

export const exportService = new ExportService();