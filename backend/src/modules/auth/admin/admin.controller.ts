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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UserRole } from '../interfaces/user.interface';
import { ApiResponse as ApiResponseDto } from '../../../common/dto/response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  ChangePasswordDto,
  UserSearchDto
} from './dto/admin.dto';

@ApiTags('Admin - User Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    try {
      const result = await this.adminService.getAllUsersWithPagination({
        page: Number(page),
        limit: Number(limit),
        search,
        role,
        sortBy,
        sortOrder
      });

      return ApiResponseDto.success('Users retrieved successfully', {
        users: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      this.logger.error('Error getting all users:', error);
      throw new HttpException(
        'Failed to retrieve users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats() {
    try {
      const stats = await this.adminService.getUserStats();
      return ApiResponseDto.success('User statistics retrieved successfully', stats);
    } catch (error) {
      this.logger.error('Error getting user stats:', error);
      throw new HttpException(
        'Failed to retrieve user statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.adminService.getUserById(id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return ApiResponseDto.success('User retrieved successfully', { user });
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      this.logger.error(`Error getting user ${id}:`, error);
      throw new HttpException(
        'Failed to retrieve user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} creating user: ${createUserDto.email}`);
      const result = await this.adminService.createUser(createUserDto, req.user.sub);
      this.logger.log(`User created successfully: ${createUserDto.email}`);
      return ApiResponseDto.success('User created successfully', result);
    } catch (error) {
      this.logger.error(`User creation failed for ${createUserDto.email}:`, error.message);
      throw new HttpException(
        error.message || 'User creation failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} updating user: ${id}`);
      const user = await this.adminService.updateUser(id, updateUserDto, req.user.sub);
      this.logger.log(`User updated successfully: ${id}`);
      return ApiResponseDto.success('User updated successfully', { user });
    } catch (error) {
      this.logger.error(`User update failed for ${id}:`, error.message);
      throw new HttpException(
        error.message || 'User update failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('id') id: string, 
    @Body() body: { role: UserRole; reason?: string },
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} updating role for user: ${id} to ${body.role}`);
      const user = await this.adminService.updateUserRole(id, body.role, req.user.sub, body.reason);
      this.logger.log(`User role updated successfully: ${id}`);
      return ApiResponseDto.success('User role updated successfully', { user });
    } catch (error) {
      this.logger.error(`Role update failed for user ${id}:`, error.message);
      throw new HttpException(
        error.message || 'Role update failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id/password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetUserPassword(
    @Param('id') id: string, 
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} resetting password for user: ${id}`);
      await this.adminService.resetUserPassword(id, changePasswordDto.newPassword, req.user.sub);
      this.logger.log(`Password reset successfully for user: ${id}`);
      return ApiResponseDto.success('Password reset successfully');
    } catch (error) {
      this.logger.error(`Password reset failed for user ${id}:`, error.message);
      throw new HttpException(
        error.message || 'Password reset failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async toggleUserStatus(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} toggling status for user: ${id}`);
      const user = await this.adminService.toggleUserStatus(id, req.user.sub, body.reason);
      this.logger.log(`User status toggled successfully: ${id}`);
      return ApiResponseDto.success('User status updated successfully', { user });
    } catch (error) {
      this.logger.error(`Status toggle failed for user ${id}:`, error.message);
      throw new HttpException(
        error.message || 'Status toggle failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string, @Request() req) {
    try {
      this.logger.log(`Admin ${req.user.email} deleting user: ${id}`);
      await this.adminService.deleteUser(id, req.user.sub);
      this.logger.log(`User deleted successfully: ${id}`);
      return ApiResponseDto.success('User deleted successfully');
    } catch (error) {
      this.logger.error(`User deletion failed for ${id}:`, error.message);
      throw new HttpException(
        error.message || 'User deletion failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiResponse({ status: 200, description: 'User activity retrieved successfully' })
  async getUserActivity(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50
  ) {
    try {
      const activity = await this.adminService.getUserActivity(id, {
        page: Number(page),
        limit: Number(limit)
      });
      return ApiResponseDto.success('User activity retrieved successfully', activity);
    } catch (error) {
      this.logger.error(`Error getting user activity for ${id}:`, error);
      throw new HttpException(
        'Failed to retrieve user activity',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/send-notification')
  @ApiOperation({ summary: 'Send notification to user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(
    @Param('id') id: string,
    @Body() body: { subject: string; message: string; type?: string },
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} sending notification to user: ${id}`);
      await this.adminService.sendNotificationToUser(id, body, req.user.sub);
      this.logger.log(`Notification sent successfully to user: ${id}`);
      return ApiResponseDto.success('Notification sent successfully');
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${id}:`, error.message);
      throw new HttpException(
        error.message || 'Failed to send notification',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk action on users' })
  @ApiResponse({ status: 200, description: 'Bulk action completed successfully' })
  async bulkAction(
    @Body() body: { 
      userIds: string[]; 
      action: 'delete' | 'role_change' | 'activate' | 'deactivate'; 
      params?: any 
    },
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} performing bulk action: ${body.action} on ${body.userIds.length} users`);
      const result = await this.adminService.performBulkAction(body.userIds, body.action, req.user.sub, body.params);
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
  @ApiOperation({ summary: 'Export users to CSV' })
  @ApiResponse({ status: 200, description: 'CSV export generated successfully' })
  async exportUsersCSV(
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
    @Request() req
  ) {
    try {
      this.logger.log(`Admin ${req.user.email} exporting users to CSV`);
      const csvData = await this.adminService.exportUsersToCSV({ role, search });
      this.logger.log(`CSV export generated successfully`);
      
      return {
        success: true,
        data: csvData,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=users-export-${new Date().toISOString().split('T')[0]}.csv`
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
}