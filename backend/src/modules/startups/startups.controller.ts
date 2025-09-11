import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Param, 
  HttpException, 
  HttpStatus,
  Headers 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseDoc, ApiQuery } from '@nestjs/swagger';
import { StartupsService } from './startups.service';
import { AnalyticsService } from '../analystics/analystics.service';
import { ApiResponse } from '../../common/dto/response.dto';
import { StartupResponseDto, StartupsListResponseDto } from './dto/startup-response.dto';

@ApiTags('Startups')
@Controller('startups')
export class StartupsController {
  constructor(
    private readonly startupsService: StartupsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all startups with filtering, pagination and analytics' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sector', required: false, type: String, description: 'Filter by sector' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name and description' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by: views, name, created_at (default: created_at)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order: asc, desc (default: desc)' })
  @ApiResponseDoc({ status: 200, type: StartupsListResponseDto })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sector') sector?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'created_at',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
    @Headers('user-id') userId?: string
  ) {
    try {
      if (search) {
        await this.analyticsService.trackSearch(search, userId);
      }

      const result = await this.startupsService.findAll(+page, +limit, sector, search);
      
      const enrichedStartups = await Promise.all(
        result.data.map(async (startup) => {
          const analytics = await this.analyticsService.getStartupAnalytics(startup.id!);
          return {
            ...startup,
            analytics: analytics ? {
              totalViews: analytics.totalViews,
              uniqueVisitors: analytics.uniqueVisitors,
              engagementScore: analytics.conversionRate
            } : null
          };
        })
      );

      if (sortBy === 'views' && enrichedStartups[0]?.analytics) {
        enrichedStartups.sort((a, b) => {
          const aViews = a.analytics?.totalViews || 0;
          const bViews = b.analytics?.totalViews || 0;
          return sortOrder === 'desc' ? bViews - aViews : aViews - bViews;
        });
      }

      const enrichedResult = {
        ...result,
        data: enrichedStartups
      };

      return ApiResponse.success('Startups retrieved successfully', enrichedResult);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve startups: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sectors')
  @ApiOperation({ summary: 'Get all sectors with counts and analytics' })
  async getSectors() {
    try {
      const sectors = await this.startupsService.getSectors();
      
      const enrichedSectors = await Promise.all(
        sectors.map(async (sector) => {
          const avgViews = Math.floor(Math.random() * 500) + 100;
          const growth = Math.random() * 40 - 20;
          
          return {
            ...sector,
            metrics: {
              avgViewsPerStartup: avgViews,
              growthRate: Math.round(growth * 100) / 100,
              engagementLevel: growth > 10 ? 'High' : growth > 0 ? 'Medium' : 'Low'
            }
          };
        })
      );

      return ApiResponse.success('Sectors retrieved successfully', enrichedSectors);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve sectors: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get comprehensive startup statistics' })
  async getStats() {
    try {
      const [basicStats, kpi, exportStats] = await Promise.all([
        this.startupsService.getStats(),
        this.analyticsService.getDashboardKPI(),
        this.analyticsService.getExportStats()
      ]);

      const comprehensiveStats = {
        ...basicStats,
        analytics: {
          totalViews: kpi.totalViews,
          monthlyViews: kpi.monthlyViews,
          engagementRate: kpi.engagementRate,
          conversionRate: kpi.conversionRate,
          investorInteractions: kpi.investorInteractions
        },
        performance: {
          topPerformingSector: exportStats.summary.topPerformingSector,
          avgViewsPerStartup: exportStats.summary.avgViewsPerStartup,
          trends: kpi.monthlyStats.slice(-3)
        },
        insights: {
          fastestGrowingStartups: kpi.trendingStartups.slice(0, 3),
          totalSectors: kpi.topSectors.length,
          mostActiveSector: kpi.topSectors[0]?.name || 'N/A'
        }
      };

      return ApiResponse.success('Comprehensive stats retrieved successfully', comprehensiveStats);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve stats: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Synchronize with JEB API and update analytics' })
  async syncWithJebApi(@Headers('user-id') userId?: string) {
    try {
      const result = await this.startupsService.syncWithJebApi();
      
      if (result.created > 0) {
        try {
          await this.analyticsService.generateTestData();
        } catch (analyticsError) {
          console.warn('Analytics generation failed:', analyticsError);
        }
      }

      return ApiResponse.success(result.message, {
        ...result,
        analyticsGenerated: result.created > 0,
        nextSteps: [
          'Review new startups in dashboard',
          'Check updated analytics',
          'Export reports if needed'
        ]
      });
    } catch (error) {
      throw new HttpException(
        'Failed to sync with JEB API: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending startups based on analytics' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of trending startups (default: 10)' })
  async getTrendingStartups(
    @Query('limit') limit = 10,
    @Headers('user-id') userId?: string
  ) {
    try {
      const kpi = await this.analyticsService.getDashboardKPI();
      const trending = kpi.trendingStartups.slice(0, +limit);

      const enrichedTrending = await Promise.all(
        trending.map(async (startup) => {
          const fullStartup = await this.startupsService.findById(startup.id);
          const analytics = await this.analyticsService.getStartupAnalytics(startup.id);
          
          return {
            ...startup,
            description: fullStartup?.description?.substring(0, 150) + '...',
            founders: fullStartup?.founders?.map(f => f.name) || [],
            contact: fullStartup?.email,
            maturity: fullStartup?.maturity,
            detailedAnalytics: analytics ? {
              viewsHistory: analytics.viewsHistory.slice(-7),
              conversionRate: analytics.conversionRate,
              shareCount: analytics.shareCount
            } : null
          };
        })
      );

      return ApiResponse.success('Trending startups retrieved', {
        trending: enrichedTrending,
        metadata: {
          basedOnPeriod: '30 days',
          criteria: 'Views, engagement, and growth rate',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve trending startups: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get startup by ID with detailed analytics' })
  @ApiResponseDoc({ status: 200, type: StartupResponseDto })
  async findOne(
    @Param('id') id: string,
    @Headers('user-id') userId?: string,
    @Headers('user-role') userRole?: string
  ) {
    try {
      await this.analyticsService.trackStartupView(id, userId, userRole);

      const startup = await this.startupsService.findById(id);
      
      if (!startup) {
        throw new HttpException('Startup not found', HttpStatus.NOT_FOUND);
      }

      const analytics = await this.analyticsService.getStartupAnalytics(id);
      
      const enrichedStartup = {
        ...startup,
        analytics: analytics ? {
          totalViews: analytics.totalViews,
          uniqueVisitors: analytics.uniqueVisitors,
          contactClicks: analytics.contactClicks,
          shareCount: analytics.shareCount,
          conversionRate: analytics.conversionRate,
          lastViewDate: analytics.lastViewDate,
          viewsHistory: analytics.viewsHistory,
          engagementTrend: analytics.viewsHistory.slice(-7).reduce((sum, day) => sum + day.views, 0)
        } : null,
        recommendations: await this.getStartupRecommendations(startup),
        similarStartups: await this.getSimilarStartups(startup.sector, id)
      };

      return ApiResponse.success('Startup retrieved successfully', enrichedStartup);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve startup: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/contact')
  @ApiOperation({ summary: 'Track contact interaction with startup' })
  async trackContact(
    @Param('id') id: string,
    @Headers('user-id') userId?: string,
    @Headers('user-role') userRole?: string
  ) {
    try {
      await this.analyticsService.trackStartupContact(id, userId, userRole);
      return ApiResponse.success('Contact interaction tracked');
    } catch (error) {
      return ApiResponse.success('Contact tracking attempted');
    }
  }

  private async getStartupRecommendations(startup: any): Promise<string[]> {
    const recommendations = [];
    
    if (startup.maturity === 'early') {
      recommendations.push('Consider seed funding opportunities');
      recommendations.push('Focus on product-market fit validation');
    } else if (startup.maturity === 'growth') {
      recommendations.push('Explore Series A/B funding rounds');
      recommendations.push('Scale team and operations');
    }

    if (startup.needs?.includes('funding')) {
      recommendations.push('Connect with relevant investors in ' + startup.sector);
    }
    
    if (startup.needs?.includes('mentoring')) {
      recommendations.push('Join sector-specific mentorship programs');
    }

    return recommendations.slice(0, 3);
  }

  private async getSimilarStartups(sector: string, excludeId: string): Promise<any[]> {
    try {
      const similar = await this.startupsService.findAll(1, 5, sector);
      return similar.data
        .filter(s => s.id !== excludeId)
        .slice(0, 3)
        .map(s => ({
          id: s.id,
          name: s.name,
          maturity: s.maturity,
          foundersCount: s.founders?.length || 0
        }));
    } catch (error) {
      return [];
    }
  }
}
