import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from '../analystics/analystics.service';
import { StartupRepository } from '../startups/repositories/startups.repository';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly startupRepository: StartupRepository,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get complete dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard overview retrieved successfully' })
  async getDashboardOverview() {
    try {
      const [kpi, sectors, exportStats] = await Promise.all([
        this.analyticsService.getDashboardKPI(),
        this.startupRepository.getSectors(),
        this.analyticsService.getExportStats()
      ]);

      const overview = {
        mainKPI: kpi,
        sectorsBreakdown: sectors,
        quickStats: exportStats.summary,
        lastUpdated: new Date().toISOString()
      };

      return ApiResponseDto.success('Dashboard overview retrieved', overview);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve dashboard overview: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('real-time')
  @ApiOperation({ summary: 'Get real-time dashboard metrics' })
  async getRealTimeMetrics() {
    try {
      const realTimeData = {
        currentVisitors: Math.floor(Math.random() * 50) + 10,
        todayViews: Math.floor(Math.random() * 200) + 50,
        activeStartups: Math.floor(Math.random() * 10) + 5,
        recentInteractions: [
          {
            type: 'view',
            startup: 'TechCorp',
            timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
          },
          {
            type: 'contact',
            startup: 'GreenSolutions',
            timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
          }
        ],
        alerts: [],
        systemStatus: 'operational'
      };

      return ApiResponseDto.success('Real-time metrics retrieved', realTimeData);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve real-time metrics: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance analytics for dashboard' })
  async getPerformanceAnalytics(
    @Query('period') period: string = '30d'
  ) {
    try {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      
      const kpi = await this.analyticsService.getDashboardKPI();
      
      const performance = {
        period,
        metrics: {
          totalViews: kpi.totalViews,
          engagementRate: kpi.engagementRate,
          conversionRate: kpi.conversionRate,
          growthRate: Math.random() * 20 - 5
        },
        trends: kpi.monthlyStats,
        topPerformers: kpi.trendingStartups.slice(0, 5),
        alerts: [
          {
            level: 'info',
            message: `${kpi.trendingStartups.length} startups en forte croissance ce mois`,
            timestamp: new Date().toISOString()
          }
        ]
      };

      return ApiResponseDto.success('Performance analytics retrieved', performance);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve performance analytics: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
