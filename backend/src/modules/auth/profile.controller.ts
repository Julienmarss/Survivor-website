// backend/src/modules/auth/profile.controller.ts
import { 
  Body, 
  Controller, 
  Get, 
  Put, 
  UseGuards, 
  Request,
  Query,
  HttpException,
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserRole } from './interfaces/user.interface';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('User Profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile retrieved' })
  async getMyProfile(@Request() req) {
    try {
      const user = await this.authService.validateUser(req.user.sub);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return ApiResponseDto.success('Profile retrieved successfully', { user });
    } catch (error) {
      throw new HttpException(
        'Failed to get profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateMyProfile(@Request() req, @Body() updateData: any) {
    try {
      const user = await this.authService.updateUserProfile(req.user.sub, updateData);
      return ApiResponseDto.success('Profile updated successfully', { user });
    } catch (error) {
      throw new HttpException(
        'Failed to update profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('startups')
  @ApiOperation({ summary: 'Get startup profiles (for investors and admins)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.INVESTOR, UserRole.ADMIN)
  async getStartupProfiles(
    @Query('limit') limit: number = 20,
    @Query('pageToken') pageToken?: string,
    @Query('sector') sector?: string
  ) {
    try {
      const result = await this.authService.getStartupProfiles(limit, pageToken, sector);
      return ApiResponseDto.success('Startup profiles retrieved successfully', result);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve startup profiles',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('investors')
  @ApiOperation({ summary: 'Get investor profiles (for startups and admins)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.STARTUP, UserRole.ADMIN)
  async getInvestorProfiles(
    @Query('limit') limit: number = 20,
    @Query('pageToken') pageToken?: string,
    @Query('investorType') investorType?: string
  ) {
    try {
      const result = await this.authService.getInvestorProfiles(limit, pageToken, investorType);
      return ApiResponseDto.success('Investor profiles retrieved successfully', result);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve investor profiles',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user profiles (for admins only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserProfiles(
    @Query('limit') limit: number = 20,
    @Query('pageToken') pageToken?: string,
    @Query('role') role?: UserRole
  ) {
    try {
      const result = await this.authService.getAllUsers(limit, pageToken, role);
      return ApiResponseDto.success('User profiles retrieved successfully', result);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve user profiles',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}