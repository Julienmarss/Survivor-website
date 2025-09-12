import { 
  Body, 
  Controller, 
  Post, 
  Get, 
  Put,
  Delete,
  UseGuards, 
  Request,
  Query,
  Param,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminStartupService } from './admin-startup.service';
import { UserRole } from '../../auth/interfaces/user.interface';
import { ApiResponse as ApiResponseDto } from '../../../common/dto/response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { 
  CreateStartupDto, 
  UpdateStartupDto, 
  StartupSearchDto,
  BulkActionStartupDto 
} from './dto/admin-startup.dto';

@ApiTags('Admin - Startup Management')
@Controller('admin/startups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminStartupController {
  private readonly logger = new Logger(AdminStartupController.name);

  constructor(private readonly adminStartupService: AdminStartupService) {}

@Get()
@ApiOperation({ summary: 'Get all startups with pagination and filters (Admin)' })
@ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
@ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
@ApiQuery({ name: 'sector', required: false, type: String, description: 'Filter by sector' })
@ApiQuery({ name: 'maturity', required: false, type: String, description: 'Filter by maturity' })
@ApiQuery({ name: 'projectStatus', required: false, type: String, description: 'Filter by project status' })
@ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (default: created_at)' })
@ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
@ApiResponse({ status: 200, description: 'Startups retrieved successfully' })
async getAllStartups(@Request() req) {
  try {
    // Récupération des paramètres de requête depuis req.query
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string;
    const sector = req.query.sector as string;
    const maturity = req.query.maturity as string;
    const projectStatus = req.query.projectStatus as string;
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    this.logger.log(`Admin ${req.user.email} fetching startups with filters`);
    
    const result = await this.adminStartupService.getAllStartupsWithPagination({
      page,
      limit,
      search,
      sector,
      maturity,
      projectStatus,
      sortBy,
      sortOrder
    });

    return ApiResponseDto.success('Startups retrieved successfully', {
      startups: result.startups,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    this.logger.error('Error getting all startups:', error);
    throw new HttpException(
      'Failed to retrieve startups',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

  @Get('stats')
  @ApiOperation({ summary: 'Get startup statistics for admin dashboard' })
  @ApiResponse({ status: 200, description: 'Startup statistics retrieved successfully' })
  async getStartupStats(@Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} fetching startup stats`);
      const stats = await this.adminStartupService.getStartupStats();
      return ApiResponseDto.success('Startup statistics retrieved successfully', stats);
    } catch (error) {
      this.logger.error('Error getting startup stats:', error);
      throw new HttpException(
        'Failed to retrieve startup statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sectors')
  @ApiOperation({ summary: 'Get all sectors with detailed statistics' })
  @ApiResponse({ status: 200, description: 'Sectors retrieved successfully' })
  async getAllSectors(@Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} fetching sectors`);
      const sectors = await this.adminStartupService.getAllSectorsWithStats();
      return ApiResponseDto.success('Sectors retrieved successfully', sectors);
    } catch (error) {
      this.logger.error('Error getting sectors:', error);
      throw new HttpException(
        'Failed to retrieve sectors',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get startup by ID with full details (Admin)' })
  @ApiParam({ name: 'id', description: 'Startup ID' })
  @ApiResponse({ status: 200, description: 'Startup retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Startup not found' })
  async getStartupById(@Param('id') id: string, @Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} fetching startup: ${id}`);
      const startup = await this.adminStartupService.getStartupById(id);
      
      if (!startup) {
        throw new HttpException('Startup not found', HttpStatus.NOT_FOUND);
      }
      
      return ApiResponseDto.success('Startup retrieved successfully', { startup });
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      this.logger.error(`Error getting startup ${id}:`, error);
      throw new HttpException(
        'Failed to retrieve startup',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new startup (Admin)' })
  @ApiResponse({ status: 201, description: 'Startup created successfully' })
  @ApiResponse({ status: 409, description: 'Startup already exists' })
  async createStartup(@Body() createStartupDto: CreateStartupDto, @Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} creating startup: ${createStartupDto.name}`);
      const result = await this.adminStartupService.createStartup(createStartupDto, req.user.sub);
      this.logger.log(`Startup created successfully: ${createStartupDto.name}`);
      return ApiResponseDto.success('Startup created successfully', result);
    } catch (error) {
      this.logger.error(`Startup creation failed:`, error.message);
      throw new HttpException(
        error.message || 'Startup creation failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update startup (Admin)' })
  @ApiParam({ name: 'id', description: 'Startup ID' })
  @ApiResponse({ status: 200, description: 'Startup updated successfully' })
  @ApiResponse({ status: 404, description: 'Startup not found' })
  async updateStartup(
    @Param('id') id: string, 
    @Body() updateStartupDto: UpdateStartupDto,
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} updating startup: ${id}`);
      const startup = await this.adminStartupService.updateStartup(id, updateStartupDto, req.user.sub);
      this.logger.log(`Startup updated successfully: ${id}`);
      return ApiResponseDto.success('Startup updated successfully', { startup });
    } catch (error) {
      this.logger.error(`Startup update failed for ${id}:`, error.message);
      throw new HttpException(
        error.message || 'Startup update failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update startup status (Admin)' })
  @ApiParam({ name: 'id', description: 'Startup ID' })
  @ApiResponse({ status: 200, description: 'Startup status updated successfully' })
  async updateStartupStatus(
    @Param('id') id: string, 
    @Body() body: { status: string; reason?: string },
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} updating status for startup: ${id} to ${body.status}`);
      const startup = await this.adminStartupService.updateStartupStatus(
        id, 
        body.status, 
        req.user.sub, 
        body.reason
      );
      this.logger.log(`Startup status updated successfully: ${id}`);
      return ApiResponseDto.success('Startup status updated successfully', { startup });
    } catch (error) {
      this.logger.error(`Status update failed for startup ${id}:`, error.message);
      throw new HttpException(
        error.message || 'Status update failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete startup (Admin)' })
  @ApiParam({ name: 'id', description: 'Startup ID' })
  @ApiResponse({ status: 200, description: 'Startup deleted successfully' })
  @ApiResponse({ status: 404, description: 'Startup not found' })
  async deleteStartup(@Param('id') id: string, @Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} deleting startup: ${id}`);
      await this.adminStartupService.deleteStartup(id, req.user.sub);
      this.logger.log(`Startup deleted successfully: ${id}`);
      return ApiResponseDto.success('Startup deleted successfully');
    } catch (error) {
      this.logger.error(`Startup deletion failed for ${id}:`, error.message);
      throw new HttpException(
        error.message || 'Startup deletion failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk action on startups (Admin)' })
  @ApiResponse({ status: 200, description: 'Bulk action completed successfully' })
  async bulkAction(@Body() bulkActionDto: BulkActionStartupDto, @Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} performing bulk action: ${bulkActionDto.action} on ${bulkActionDto.startupIds.length} startups`);
      const result = await this.adminStartupService.performBulkAction(
        bulkActionDto.startupIds,
        bulkActionDto.action,
        req.user.sub,
        bulkActionDto.params
      );
      this.logger.log(`Bulk action completed successfully`);
      return ApiResponseDto.success('Bulk action completed successfully', result);
    } catch (error) {
      this.logger.error(`Bulk action failed:`, error.message);
      throw new HttpException(
        error.message || 'Bulk action failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export startups to CSV (Admin)' })
  @ApiQuery({ name: 'sector', required: false, type: String, description: 'Filter by sector' })
  @ApiQuery({ name: 'maturity', required: false, type: String, description: 'Filter by maturity' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiResponse({ status: 200, description: 'CSV export generated successfully' })
  async exportStartupsCSV(
    @Request() req,
    @Query('sector') sector?: string,
    @Query('maturity') maturity?: string,
    @Query('search') search?: string
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} exporting startups to CSV`);
      const csvData = await this.adminStartupService.exportStartupsToCSV({ 
        sector, 
        maturity, 
        search 
      });
      this.logger.log(`CSV export generated successfully`);
      
      return {
        success: true,
        data: csvData,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=startups-export-${new Date().toISOString().split('T')[0]}.csv`
        }
      };
    } catch (error) {
      this.logger.error(`CSV export failed:`, error.message);
      throw new HttpException(
        error.message || 'CSV export failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync startups with JEB API (Admin)' })
  @ApiResponse({ status: 200, description: 'Synchronization completed successfully' })
  async syncWithJebApi(@Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} initiating JEB API sync`);
      const result = await this.adminStartupService.syncWithJebApi(req.user.sub);
      this.logger.log(`JEB API sync completed successfully`);
      return ApiResponseDto.success('Synchronization completed successfully', result);
    } catch (error) {
      this.logger.error(`JEB API sync failed:`, error.message);
      throw new HttpException(
        error.message || 'Synchronization failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get detailed analytics for a startup (Admin)' })
  @ApiParam({ name: 'id', description: 'Startup ID' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getStartupAnalytics(@Param('id') id: string, @Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} fetching analytics for startup: ${id}`);
      const analytics = await this.adminStartupService.getStartupAnalytics(id);
      return ApiResponseDto.success('Analytics retrieved successfully', analytics);
    } catch (error) {
      this.logger.error(`Error getting analytics for startup ${id}:`, error);
      throw new HttpException(
        'Failed to retrieve analytics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/audit-log')
  @ApiOperation({ summary: 'Get audit log for a startup (Admin)' })
  @ApiParam({ name: 'id', description: 'Startup ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  async getStartupAuditLog(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} fetching audit log for startup: ${id}`);
      const auditLog = await this.adminStartupService.getStartupAuditLog(id, {
        page: Number(page),
        limit: Number(limit)
      });
      return ApiResponseDto.success('Audit log retrieved successfully', auditLog);
    } catch (error) {
      this.logger.error(`Error getting audit log for startup ${id}:`, error);
      throw new HttpException(
        'Failed to retrieve audit log',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/founders')
  @ApiOperation({ summary: 'Add founder to startup (Admin)' })
  @ApiParam({ name: 'id', description: 'Startup ID' })
  @ApiResponse({ status: 201, description: 'Founder added successfully' })
  async addFounder(
    @Param('id') id: string,
    @Body() founderData: { name: string; email?: string; role?: string },
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} adding founder to startup: ${id}`);
      const result = await this.adminStartupService.addFounder(id, founderData, req.user.sub);
      this.logger.log(`Founder added successfully to startup: ${id}`);
      return ApiResponseDto.success('Founder added successfully', result);
    } catch (error) {
      this.logger.error(`Failed to add founder to startup ${id}:`, error.message);
      throw new HttpException(
        error.message || 'Failed to add founder',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id/founders/:founderId')
  @ApiOperation({ summary: 'Remove founder from startup (Admin)' })
  @ApiParam({ name: 'id', description: 'Startup ID' })
  @ApiParam({ name: 'founderId', description: 'Founder ID' })
  @ApiResponse({ status: 200, description: 'Founder removed successfully' })
  async removeFounder(
    @Param('id') id: string,
    @Param('founderId') founderId: string,
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} removing founder ${founderId} from startup: ${id}`);
      await this.adminStartupService.removeFounder(id, founderId, req.user.sub);
      this.logger.log(`Founder removed successfully from startup: ${id}`);
      return ApiResponseDto.success('Founder removed successfully');
    } catch (error) {
      this.logger.error(`Failed to remove founder from startup ${id}:`, error.message);
      throw new HttpException(
        error.message || 'Failed to remove founder',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // Debug endpoints
  @Get('debug/test')
  @ApiOperation({ summary: 'Test admin startup endpoint' })
  async debugTest(@Request() req) {
    try {
      this.logger.log(`🔧 Debug test called by admin: ${req.user?.email || 'unknown'}`);
      return ApiResponseDto.success('Admin startup endpoint is working', {
        user: req.user,
        timestamp: new Date().toISOString(),
        message: 'Admin startup controller is connected and working'
      });
    } catch (error) {
      this.logger.error('Debug test failed:', error);
      throw new HttpException(
        'Debug test failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}