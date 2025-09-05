import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Res,
  Headers
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IExportOptions } from './interfaces/export.interface';

@ApiTags('Export & Reports')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('investor-report')
  @ApiOperation({ summary: 'Generate investor report (JSON)' })
  @ApiResponse({ status: 200, description: 'Investor report generated successfully' })
  async generateInvestorReport(
    @Query('includeAnalytics') includeAnalytics: boolean = true,
    @Query('sectors') sectors?: string,
    @Headers('user-id') userId?: string
  ) {
    try {
      const options: Partial<IExportOptions> = {
        includeAnalytics,
        includeContacts: true,
        sectors: sectors ? sectors.split(',') : undefined
      };
      
      const report = await this.exportService.generateInvestorReport(options, userId);
      return ApiResponseDto.success('Investor report generated successfully', report);
    } catch (error) {
      throw new HttpException(
        'Failed to generate investor report: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('investor-report/csv')
  @ApiOperation({ summary: 'Export investor report as CSV' })
  async exportInvestorReportCSV(
    @Res() res: Response,
    @Query('includeAnalytics') includeAnalytics: boolean = true,
    @Query('sectors') sectors?: string,
    @Headers('user-id') userId?: string
  ) {
    try {
      const options: Partial<IExportOptions> = {
        includeAnalytics,
        includeContacts: true,
        sectors: sectors ? sectors.split(',') : undefined
      };
      
      const report = await this.exportService.generateInvestorReport(options, userId);
      const csv = await this.exportService.exportToCSV(report);
      
      const filename = `investor-report-${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      throw new HttpException(
        'Failed to export CSV: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('top-startups')
  @ApiOperation({ summary: 'Export top performing startups' })
  async exportTopStartups(
    @Query('limit') limit: number = 20,
    @Headers('user-id') userId?: string
  ) {
    try {
      const result = await this.exportService.exportTopStartups(+limit, userId);
      return ApiResponseDto.success('Top startups export generated', result);
    } catch (error) {
      throw new HttpException(
        'Failed to export top startups: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sector-analysis')
  @ApiOperation({ summary: 'Export sector analysis report' })
  async exportSectorAnalysis(@Headers('user-id') userId?: string) {
    try {
      const analysis = await this.exportService.exportSectorAnalysis(userId);
      return ApiResponseDto.success('Sector analysis generated', analysis);
    } catch (error) {
      throw new HttpException(
        'Failed to generate sector analysis: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('investor-highlights')
  @ApiOperation({ summary: 'Get investor highlights and key insights' })
  async getInvestorHighlights(@Headers('user-id') userId?: string) {
    try {
      const highlights = await this.exportService.exportInvestorHighlights(userId);
      return ApiResponseDto.success('Investor highlights generated', highlights);
    } catch (error) {
      throw new HttpException(
        'Failed to generate investor highlights: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('custom')
  @ApiOperation({ summary: 'Generate custom export with filters' })
  async generateCustomExport(
    @Body() filters: {
      sectors?: string[];
      maturity?: string[];
      minViews?: number;
    },
    @Headers('user-id') userId?: string
  ) {
    try {
      const result = await this.exportService.generateCustomExport(filters, userId);
      return ApiResponseDto.success('Custom export generated', result);
    } catch (error) {
      throw new HttpException(
        'Failed to generate custom export: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
