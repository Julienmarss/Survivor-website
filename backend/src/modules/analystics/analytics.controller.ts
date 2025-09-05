import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Headers
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analystics.service';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Analytics & KPI')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get main dashboard KPI' })
  @ApiResponse({ status: 200, description: 'Dashboard KPI retrieved successfully' })
  async getDashboardKPI() {
    try {
      const kpi = await this.analyticsService.getDashboardKPI();
      return ApiResponseDto.success('Dashboard KPI retrieved successfully', kpi);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve dashboard KPI: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('startup/:id')
  @ApiOperation({ summary: 'Get detailed analytics for a specific startup' })
  async getStartupAnalytics(@Param('id') id: string) {
    try {
      const analytics = await this.analyticsService.getStartupAnalytics(id);
      
      if (!analytics) {
        throw new HttpException('Startup not found', HttpStatus.NOT_FOUND);
      }
      
      return ApiResponseDto.success('Startup analytics retrieved', analytics);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve startup analytics: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('track/view/:startupId')
  @ApiOperation({ summary: 'Track a startup view event' })
  async trackView(
    @Param('startupId') startupId: string,
    @Headers('user-id') userId?: string,
    @Headers('user-role') userRole?: string
  ) {
    try {
      await this.analyticsService.trackStartupView(startupId, userId, userRole);
      return ApiResponseDto.success('View tracked successfully');
    } catch (error) {
      return ApiResponseDto.success('View tracking attempted');
    }
  }

  @Post('track/contact/:startupId')
  @ApiOperation({ summary: 'Track a startup contact event' })
  async trackContact(
    @Param('startupId') startupId: string,
    @Headers('user-id') userId?: string,
    @Headers('user-role') userRole?: string
  ) {
    try {
      await this.analyticsService.trackStartupContact(startupId, userId, userRole);
      return ApiResponseDto.success('Contact tracked successfully');
    } catch (error) {
      return ApiResponseDto.success('Contact tracking attempted');
    }
  }

  @Post('track/search')
  @ApiOperation({ summary: 'Track a search event' })
  async trackSearch(
    @Body('query') query: string,
    @Headers('user-id') userId?: string
  ) {
    try {
      await this.analyticsService.trackSearch(query, userId);
      return ApiResponseDto.success('Search tracked successfully');
    } catch (error) {
      return ApiResponseDto.success('Search tracking attempted');
    }
  }

  @Post('generate-test-data')
  @ApiOperation({ summary: 'Generate test analytics data (Development only)' })
  async generateTestData() {
    try {
      const result = await this.analyticsService.generateTestData();
      return ApiResponseDto.success('Test data generated', result);
    } catch (error) {
      throw new HttpException(
        'Failed to generate test data: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('export/stats')
  @ApiOperation({ summary: 'Get export-ready statistics' })
  async getExportStats() {
    try {
      const stats = await this.analyticsService.getExportStats();
      return ApiResponseDto.success('Export stats retrieved', stats);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve export stats: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}