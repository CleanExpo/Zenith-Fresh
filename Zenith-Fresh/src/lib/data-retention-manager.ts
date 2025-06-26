import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, subYears } from 'date-fns';

const prisma = new PrismaClient();

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  enabled: boolean;
}

export class DataRetentionManager {
  private defaultPolicies: RetentionPolicy[] = [
    { dataType: 'websiteAnalyses', retentionPeriod: 365, enabled: true }, // 1 year
    { dataType: 'performanceMetrics', retentionPeriod: 365, enabled: true }, // 1 year
    { dataType: 'coreWebVitals', retentionPeriod: 365, enabled: true }, // 1 year
    { dataType: 'technicalChecks', retentionPeriod: 365, enabled: true }, // 1 year
    { dataType: 'analysisAlerts', retentionPeriod: 90, enabled: true }, // 3 months for resolved alerts
    { dataType: 'performanceTrends', retentionPeriod: 730, enabled: true }, // 2 years
    { dataType: 'competitorAnalyses', retentionPeriod: 180, enabled: true }, // 6 months
    { dataType: 'auditLogs', retentionPeriod: 90, enabled: true }, // 3 months
  ];

  async cleanupExpiredData(): Promise<{
    cleaned: Record<string, number>;
    errors: Array<{ dataType: string; error: string }>;
  }> {
    const cleaned: Record<string, number> = {};
    const errors: Array<{ dataType: string; error: string }> = [];

    for (const policy of this.defaultPolicies) {
      if (!policy.enabled) continue;

      try {
        const deletedCount = await this.cleanupDataType(policy.dataType, policy.retentionPeriod);
        cleaned[policy.dataType] = deletedCount;
      } catch (error) {
        errors.push({
          dataType: policy.dataType,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { cleaned, errors };
  }

  private async cleanupDataType(dataType: string, retentionPeriod: number): Promise<number> {
    const cutoffDate = subDays(new Date(), retentionPeriod);

    switch (dataType) {
      case 'websiteAnalyses':
        return await this.cleanupWebsiteAnalyses(cutoffDate);
      
      case 'performanceMetrics':
        return await this.cleanupPerformanceMetrics(cutoffDate);
      
      case 'coreWebVitals':
        return await this.cleanupCoreWebVitals(cutoffDate);
      
      case 'technicalChecks':
        return await this.cleanupTechnicalChecks(cutoffDate);
      
      case 'analysisAlerts':
        return await this.cleanupAnalysisAlerts(cutoffDate);
      
      case 'performanceTrends':
        return await this.cleanupPerformanceTrends(cutoffDate);
      
      case 'competitorAnalyses':
        return await this.cleanupCompetitorAnalyses(cutoffDate);
      
      case 'auditLogs':
        return await this.cleanupAuditLogs(cutoffDate);
      
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  private async cleanupWebsiteAnalyses(cutoffDate: Date): Promise<number> {
    // Get IDs of analyses to delete
    const analysesToDelete = await prisma.websiteAnalysis.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: 'completed', // Only delete completed analyses
      },
      select: { id: true },
    });

    if (analysesToDelete.length === 0) return 0;

    const analysisIds = analysesToDelete.map(a => a.id);

    // Delete related data first (foreign key constraints)
    await Promise.all([
      prisma.performanceMetrics.deleteMany({
        where: { websiteAnalysisId: { in: analysisIds } },
      }),
      prisma.coreWebVitals.deleteMany({
        where: { websiteAnalysisId: { in: analysisIds } },
      }),
      prisma.technicalChecks.deleteMany({
        where: { websiteAnalysisId: { in: analysisIds } },
      }),
      prisma.analysisAlert.deleteMany({
        where: { websiteAnalysisId: { in: analysisIds } },
      }),
    ]);

    // Delete the analyses
    const result = await prisma.websiteAnalysis.deleteMany({
      where: { id: { in: analysisIds } },
    });

    return result.count;
  }

  private async cleanupPerformanceMetrics(cutoffDate: Date): Promise<number> {
    // Performance metrics are automatically cleaned up via cascade delete when WebsiteAnalysis is deleted
    // So we just need to count how many would be deleted based on old analyses
    const count = await prisma.performanceMetrics.count({
      where: {
        createdAt: { lt: cutoffDate },
        websiteAnalysis: {
          createdAt: { lt: cutoffDate }
        }
      },
    });

    // The actual deletion happens automatically via cascade when websiteAnalysis records are deleted
    return count;
  }

  private async cleanupCoreWebVitals(cutoffDate: Date): Promise<number> {
    // Core web vitals are automatically cleaned up via cascade delete when WebsiteAnalysis is deleted
    const count = await prisma.coreWebVitals.count({
      where: {
        createdAt: { lt: cutoffDate },
        websiteAnalysis: {
          createdAt: { lt: cutoffDate }
        }
      },
    });

    return count;
  }

  private async cleanupTechnicalChecks(cutoffDate: Date): Promise<number> {
    // Technical checks are automatically cleaned up via cascade delete when WebsiteAnalysis is deleted
    const count = await prisma.technicalChecks.count({
      where: {
        createdAt: { lt: cutoffDate },
        websiteAnalysis: {
          createdAt: { lt: cutoffDate }
        }
      },
    });

    return count;
  }

  private async cleanupAnalysisAlerts(cutoffDate: Date): Promise<number> {
    // Only delete resolved alerts older than cutoff
    const result = await prisma.analysisAlert.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isResolved: true,
      },
    });

    return result.count;
  }

  private async cleanupPerformanceTrends(cutoffDate: Date): Promise<number> {
    const result = await prisma.performanceTrend.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  private async cleanupCompetitorAnalyses(cutoffDate: Date): Promise<number> {
    const result = await prisma.competitorAnalysis.deleteMany({
      where: {
        analysisDate: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  private async cleanupAuditLogs(cutoffDate: Date): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  async optimizeDatabase(): Promise<void> {
    // Vacuum and analyze database for PostgreSQL
    try {
      await prisma.$executeRaw`VACUUM ANALYZE`;
      console.log('Database optimized successfully');
    } catch (error) {
      console.warn('Database optimization not supported or failed:', error);
    }
  }

  async getDataUsageStats(): Promise<{
    totalAnalyses: number;
    totalAlerts: number;
    totalTrends: number;
    oldestAnalysis: Date | null;
    newestAnalysis: Date | null;
    estimatedSizeReduction: number;
  }> {
    const [
      totalAnalyses,
      totalAlerts,
      totalTrends,
      oldestAnalysis,
      newestAnalysis,
    ] = await Promise.all([
      prisma.websiteAnalysis.count(),
      prisma.analysisAlert.count(),
      prisma.performanceTrend.count(),
      prisma.websiteAnalysis.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.websiteAnalysis.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // Estimate data that would be cleaned up
    const oneYearAgo = subYears(new Date(), 1);
    const expiredAnalyses = await prisma.websiteAnalysis.count({
      where: {
        createdAt: { lt: oneYearAgo },
        status: 'completed',
      },
    });

    return {
      totalAnalyses,
      totalAlerts,
      totalTrends,
      oldestAnalysis: oldestAnalysis?.createdAt || null,
      newestAnalysis: newestAnalysis?.createdAt || null,
      estimatedSizeReduction: expiredAnalyses,
    };
  }

  async createRetentionSchedule(): Promise<void> {
    // This would typically be implemented as a cron job or scheduled task
    // For demonstration, we'll just log the schedule

    console.log('Data Retention Schedule:');
    console.log('- Daily cleanup at 2:00 AM UTC');
    console.log('- Weekly database optimization on Sundays');
    console.log('- Monthly data usage reports');
    
    this.defaultPolicies.forEach(policy => {
      if (policy.enabled) {
        console.log(`- ${policy.dataType}: ${policy.retentionPeriod} days retention`);
      }
    });
  }

  async generateRetentionReport(): Promise<string> {
    const stats = await this.getDataUsageStats();
    const cleanupResult = await this.cleanupExpiredData();
    
    const report = `
# Data Retention Report
Generated: ${new Date().toISOString()}

## Current Data Usage
- Total Analyses: ${stats.totalAnalyses}
- Total Alerts: ${stats.totalAlerts}
- Total Trends: ${stats.totalTrends}
- Oldest Analysis: ${stats.oldestAnalysis?.toISOString() || 'N/A'}
- Newest Analysis: ${stats.newestAnalysis?.toISOString() || 'N/A'}

## Cleanup Results
${Object.entries(cleanupResult.cleaned)
  .map(([dataType, count]) => `- ${dataType}: ${count} records cleaned`)
  .join('\n')}

## Errors
${cleanupResult.errors.length === 0 
  ? '- No errors encountered' 
  : cleanupResult.errors.map(error => `- ${error.dataType}: ${error.error}`).join('\n')
}

## Retention Policies
${this.defaultPolicies
  .filter(policy => policy.enabled)
  .map(policy => `- ${policy.dataType}: ${policy.retentionPeriod} days`)
  .join('\n')}

## Recommendations
- Consider archiving data older than 2 years to cold storage
- Monitor database performance and adjust retention periods as needed
- Regular database maintenance helps maintain optimal performance
`;

    return report;
  }
}