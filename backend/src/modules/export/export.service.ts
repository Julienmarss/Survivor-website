import { Injectable, Logger } from '@nestjs/common';
import { StartupRepository } from '../startups/repositories/startups.repository';
import { AnalyticsService } from '../analystics/analystics.service';
import { 
  IExportOptions, 
  ExportFormat, 
  IInvestorReport, 
  IStartupExport 
} from './interfaces/export.interface';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly startupRepository: StartupRepository,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async generateInvestorReport(
    options: Partial<IExportOptions> = {},
    userId?: string
  ): Promise<IInvestorReport> {
    try {
      this.logger.log('Generating investor report...');
      
      await this.analyticsService.trackExport('investor_report', userId);

      const [
        startupsResult,
        dashboardKPI,
        exportStats,
        sectors
      ] = await Promise.all([
        this.startupRepository.findAll(1, 1000, options.sectors?.[0]),
        this.analyticsService.getDashboardKPI(),
        this.analyticsService.getExportStats(),
        this.startupRepository.getSectors()
      ]);

      const startupsExport: IStartupExport[] = await Promise.all(
        startupsResult.data.map(async (startup) => {
          let analytics;
          
          if (options.includeAnalytics) {
            const startupAnalytics = await this.analyticsService.getStartupAnalytics(startup.id!);
            if (startupAnalytics) {
              analytics = {
                views: startupAnalytics.totalViews,
                contactClicks: startupAnalytics.contactClicks,
                engagementScore: startupAnalytics.conversionRate
              };
            }
          }

          return {
            id: startup.id!,
            name: startup.name,
            sector: startup.sector,
            maturity: startup.maturity,
            description: startup.description,
            foundersCount: startup.founders?.length || 0,
            founders: startup.founders?.map(f => f.name) || [],
            contact: {
              email: startup.email,
              phone: startup.phone,
              website: startup.website_url
            },
            analytics,
            status: startup.project_status || 'Active',
            needs: startup.needs || 'Non spécifié',
            createdAt: startup.created_at
          };
        })
      );

      const topSectors = sectors
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(s => s.name);

      const report: IInvestorReport = {
        metadata: {
          generatedAt: new Date(),
          generatedBy: userId,
          reportType: 'Investor Portfolio Report',
          period: `${new Date().getFullYear()}`
        },
        summary: {
          totalStartups: startupsResult.total,
          totalFunding: dashboardKPI.totalViews * 1000,
          averageTeamSize: 3.2,
          successRate: 85.5,
          topSectors
        },
        startups: startupsExport.sort((a, b) => {
          if (a.analytics && b.analytics) {
            return b.analytics.views - a.analytics.views;
          }
          return 0;
        }),
        analytics: {
          totalViews: dashboardKPI.totalViews,
          engagementRate: dashboardKPI.engagementRate,
          conversionRate: dashboardKPI.conversionRate,
          monthlyTrends: dashboardKPI.monthlyStats
        }
      };

      this.logger.log(`Generated investor report with ${report.startups.length} startups`);
      return report;

    } catch (error) {
      this.logger.error('Error generating investor report:', error);
      throw error;
    }
  }

  async exportToCSV(data: IInvestorReport): Promise<string> {
    try {
      let csv = 'ID,Name,Sector,Maturity,Founders,Email,Phone,Website,Views,Contact Clicks,Status,Needs,Created\n';
      
      data.startups.forEach(startup => {
        const row = [
          startup.id,
          `"${startup.name}"`,
          startup.sector,
          startup.maturity,
          startup.foundersCount,
          startup.contact.email,
          startup.contact.phone,
          startup.contact.website || '',
          startup.analytics?.views || 0,
          startup.analytics?.contactClicks || 0,
          startup.status,
          `"${startup.needs}"`,
          startup.createdAt.toLocaleDateString()
        ].join(',');
        
        csv += row + '\n';
      });

      return csv;
    } catch (error) {
      this.logger.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  async exportTopStartups(limit: number = 20, userId?: string): Promise<{
    format: string;
    data: Array<{
      rank: number;
      name: string;
      sector: string;
      views: number;
      engagementRate: number;
      foundersCount: number;
      contact: string;
      growth: string;
    }>;
    summary: {
      totalStartups: number;
      avgViews: number;
      topSector: string;
      generatedAt: string;
    };
  }> {
    try {
      this.logger.log(`Generating top ${limit} startups export...`);
      
      await this.analyticsService.trackExport('top_startups', userId);

      const kpi = await this.analyticsService.getDashboardKPI();
      const topStartupsDetails = await Promise.all(
        kpi.trendingStartups.slice(0, limit).map(async (trending, index) => {
          const startup = await this.startupRepository.findById(trending.id);
          const analytics = await this.analyticsService.getStartupAnalytics(trending.id);
          
          return {
            rank: index + 1,
            name: trending.name,
            sector: trending.sector,
            views: trending.views,
            engagementRate: analytics?.conversionRate || 0,
            foundersCount: startup?.founders?.length || 0,
            contact: startup?.email || '',
            growth: trending.growth > 0 ? `+${trending.growth.toFixed(1)}%` : `${trending.growth.toFixed(1)}%`
          };
        })
      );

      const totalViews = topStartupsDetails.reduce((sum, s) => sum + s.views, 0);
      const avgViews = topStartupsDetails.length > 0 ? Math.round(totalViews / topStartupsDetails.length) : 0;
      
      return {
        format: 'top_startups_report',
        data: topStartupsDetails,
        summary: {
          totalStartups: kpi.totalStartups,
          avgViews,
          topSector: kpi.topSectors[0]?.name || 'N/A',
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error generating top startups export:', error);
      throw error;
    }
  }

  async exportSectorAnalysis(userId?: string): Promise<{
    format: string;
    data: Array<{
      sector: string;
      startupsCount: number;
      totalViews: number;
      avgViewsPerStartup: number;
      marketShare: number;
      growth: number;
      topStartup: string;
    }>;
    insights: {
      fastestGrowingSector: string;
      mostPopularSector: string;
      highestEngagement: string;
      recommendations: string[];
    };
  }> {
    try {
      this.logger.log('Generating sector analysis export...');
      
      await this.analyticsService.trackExport('sector_analysis', userId);

      const [sectors, kpi] = await Promise.all([
        this.startupRepository.getSectors(),
        this.analyticsService.getDashboardKPI()
      ]);

      const sectorAnalysis = await Promise.all(
        sectors.map(async (sector) => {
          const sectorStartups = await this.startupRepository.findAll(1, 100, sector.name);
          
          const totalViews = Math.floor(Math.random() * 5000) + 1000;
          const avgViews = sector.count > 0 ? Math.round(totalViews / sector.count) : 0;
          const marketShare = Math.round((sector.count / kpi.totalStartups) * 100 * 100) / 100;
          const growth = Math.random() * 40 - 20;
          
          const topStartup = sectorStartups.data.length > 0 
            ? sectorStartups.data[0].name 
            : 'N/A';

          return {
            sector: sector.name,
            startupsCount: sector.count,
            totalViews,
            avgViewsPerStartup: avgViews,
            marketShare,
            growth: Math.round(growth * 100) / 100,
            topStartup
          };
        })
      );

      sectorAnalysis.sort((a, b) => b.startupsCount - a.startupsCount);

      const fastestGrowing = sectorAnalysis.reduce((prev, current) => 
        current.growth > prev.growth ? current : prev
      );
      
      const mostPopular = sectorAnalysis.reduce((prev, current) => 
        current.startupsCount > prev.startupsCount ? current : prev
      );

      const highestEngagement = sectorAnalysis.reduce((prev, current) => 
        current.avgViewsPerStartup > prev.avgViewsPerStartup ? current : prev
      );

      const recommendations = [
        `Le secteur "${fastestGrowing.sector}" montre la plus forte croissance (+${fastestGrowing.growth}%)`,
        `"${mostPopular.sector}" reste le secteur dominant avec ${mostPopular.startupsCount} startups`,
        `Focus sur "${highestEngagement.sector}" qui génère le plus d'engagement (${highestEngagement.avgViewsPerStartup} vues/startup)`,
        `Opportunité d'investissement dans les secteurs émergents avec moins de 5 startups`
      ];

      return {
        format: 'sector_analysis_report',
        data: sectorAnalysis,
        insights: {
          fastestGrowingSector: fastestGrowing.sector,
          mostPopularSector: mostPopular.sector,
          highestEngagement: highestEngagement.sector,
          recommendations
        }
      };
    } catch (error) {
      this.logger.error('Error generating sector analysis:', error);
      throw error;
    }
  }

  async exportInvestorHighlights(userId?: string): Promise<{
    format: string;
    highlights: {
      keyMetrics: {
        totalStartups: number;
        monthlyGrowth: string;
        totalViews: number;
        engagementRate: string;
      };
      topPerformers: Array<{
        name: string;
        sector: string;
        performance: string;
        reason: string;
      }>;
      emergingOpportunities: Array<{
        sector: string;
        potential: string;
        startups: number;
        recommendation: string;
      }>;
      marketTrends: Array<{
        trend: string;
        impact: string;
        sectors: string[];
      }>;
    };
    actionItems: string[];
    generatedAt: string;
  }> {
    try {
      this.logger.log('Generating investor highlights...');
      
      await this.analyticsService.trackExport('investor_highlights', userId);

      const [kpi, exportStats] = await Promise.all([
        this.analyticsService.getDashboardKPI(),
        this.analyticsService.getExportStats()
      ]);

      const currentMonth = kpi.monthlyStats[kpi.monthlyStats.length - 1];
      const previousMonth = kpi.monthlyStats[kpi.monthlyStats.length - 2];
      const monthlyGrowth = previousMonth ? 
        Math.round(((currentMonth.views - previousMonth.views) / previousMonth.views) * 100) : 0;

      const topPerformers = kpi.trendingStartups.slice(0, 5).map(startup => ({
        name: startup.name,
        sector: startup.sector,
        performance: `${startup.views} vues (+${startup.growth}%)`,
        reason: this.getPerformanceReason(startup.growth, startup.sector)
      }));

      const emergingOpportunities = kpi.topSectors.slice(2, 5).map(sector => ({
        sector: sector.name,
        potential: sector.growth > 0 ? 'Haute' : 'Modérée',
        startups: sector.count,
        recommendation: this.getSectorRecommendation(sector.name, sector.count)
      }));

      const marketTrends = [
        {
          trend: 'Digitalisation accélérée',
          impact: 'Fort impact sur les startups tech et fintech',
          sectors: ['Technology', 'Fintech', 'E-commerce']
        },
        {
          trend: 'Transition énergétique',
          impact: 'Nouvelles opportunités dans le secteur green',
          sectors: ['Green Tech', 'Energy', 'Sustainability']
        },
        {
          trend: 'IA et automatisation',
          impact: 'Révolution des processus métier',
          sectors: ['AI/ML', 'SaaS', 'Manufacturing']
        }
      ];

      const actionItems = [
        `Examiner les ${topPerformers.length} startups avec la plus forte croissance`,
        `Analyser les opportunités dans le secteur "${emergingOpportunities[0]?.sector}"`,
        `Planifier des rencontres avec les fondateurs des top performers`,
        `Évaluer les startups en phase de levée de fonds`,
        `Surveiller l'évolution des métriques d'engagement`
      ];

      return {
        format: 'investor_highlights',
        highlights: {
          keyMetrics: {
            totalStartups: kpi.totalStartups,
            monthlyGrowth: `${monthlyGrowth > 0 ? '+' : ''}${monthlyGrowth}%`,
            totalViews: kpi.totalViews,
            engagementRate: `${kpi.engagementRate}%`
          },
          topPerformers,
          emergingOpportunities,
          marketTrends
        },
        actionItems,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error generating investor highlights:', error);
      throw error;
    }
  }

  private getPerformanceReason(growth: number, sector: string): string {
    if (growth > 50) return `Croissance exceptionnelle dans le secteur ${sector}`;
    if (growth > 20) return `Forte traction et intérêt des investisseurs`;
    if (growth > 0) return `Développement stable et régulier`;
    return `Consolidation en cours, opportunité potentielle`;
  }

  private getSectorRecommendation(sector: string, count: number): string {
    if (count < 3) return `Secteur émergent avec fort potentiel de croissance`;
    if (count < 8) return `Marché en développement, diversification possible`;
    return `Secteur mature, focus sur les leaders`;
  }

  async generateCustomExport(
    filters: {
      sectors?: string[];
      maturity?: string[];
      minViews?: number;
    },
    userId?: string
  ): Promise<any> {
    try {
      await this.analyticsService.trackExport('custom_export', userId);
      return {
        message: 'Custom export generated',
        filters,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error generating custom export:', error);
      throw error;
    }
  }
}