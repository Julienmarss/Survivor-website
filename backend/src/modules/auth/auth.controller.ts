// backend/src/modules/auth/auth.controller.ts - Version corrigée

import { 
  Body, 
  Controller, 
  Post, 
  Get, 
  Put,
  UseGuards, 
  Request,
  Query,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  UseFilters,
  UsePipes,
  ValidationPipe as NestValidationPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserRole } from './interfaces/user.interface';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { 
  LoginDto, 
  RegisterUserDto, 
  RegisterStartupDto, 
  RegisterInvestorDto, 
  UpdateRoleDto,
  VerifyTokenDto 
} from './dto/auth.dto';

// Interface pour le changement de mot de passe
interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // ===== ENDPOINTS D'AUTHENTIFICATION EXISTANTS =====

  @Post('register/startup')
  @ApiOperation({ summary: 'Register a new startup' })
  @ApiResponse({ status: 201, description: 'Startup registered successfully' })
  @ApiResponse({ status: 409, description: 'Startup already exists' })
  async registerStartup(@Body() registerDto: RegisterStartupDto) {
    try {
      this.logger.log(`Startup registration attempt: ${registerDto.email}`);
      const result = await this.authService.registerStartup(registerDto);
      this.logger.log(`Startup registration successful: ${registerDto.email}`);
      return ApiResponseDto.success('Startup registered successfully', result);
    } catch (error) {
      this.logger.error(`Startup registration failed for ${registerDto.email}:`, error.message);
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('register/user')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async registerUser(@Body() registerDto: RegisterUserDto) {
    try {
      const result = await this.authService.registerUser(registerDto);
      return ApiResponseDto.success('User registered successfully', result);
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('register/investor')
  @ApiOperation({ summary: 'Register a new investor' })
  @ApiResponse({ status: 201, description: 'Investor registered successfully' })
  @ApiResponse({ status: 409, description: 'Investor already exists' })
  async registerInvestor(@Body() registerDto: RegisterInvestorDto) {
    try {
      const result = await this.authService.registerInvestor(registerDto);
      return ApiResponseDto.success('Investor registered successfully', result);
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

@Post('login')
@ApiOperation({ summary: 'Login user' })
@ApiResponse({ status: 200, description: 'User logged in successfully' })
@ApiResponse({ status: 401, description: 'Invalid credentials' })
async login(@Body() loginDto: LoginDto) {
  try {
    this.logger.log(`Login attempt for: ${loginDto.email}`);
    
    const result = await this.authService.login(loginDto);
    
    this.logger.log(`Login successful for: ${loginDto.email}`);
    this.logger.debug(`User role: ${result.user.role}, ID: ${result.user.id}`);
    
    return {
      success: true,
      message: 'Login successful',
      data: result
    };
  } catch (error) {
    this.logger.error(`Login failed for ${loginDto.email}:`, error.message);
    
    throw new HttpException(
      {
        success: false,
        message: error.message || 'Login failed',
        error: error.message
      },
      error.status || HttpStatus.UNAUTHORIZED
    );
  }
}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getProfile(@Request() req) {
    try {
      const userProfile = await this.authService.getUserProfile(req.user.sub);
      if (!userProfile) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return ApiResponseDto.success('Profile retrieved', { user: userProfile });
    } catch (error) {
      throw new HttpException(
        'Failed to get profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== NOUVEAUX ENDPOINTS POUR LA GESTION DES PROFILS =====

  @Put('profile/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'userId', description: 'ID of the user to update' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() updateData: any,
    @Request() req
  ) {
    try {
      // Vérifier les permissions
      if (req.user.sub !== userId && req.user.role !== 'admin') {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      this.logger.log(`Profile update attempt for user: ${userId} by user: ${req.user.sub}`);
      this.logger.debug(`Update data received:`, {
        keys: Object.keys(updateData),
        userId,
        requestedBy: req.user.sub
      });
      
      const updatedUser = await this.authService.updateUserProfile(userId, updateData);
      
      this.logger.log(`Profile updated successfully for user: ${userId}`);
      
      return ApiResponseDto.success('Profile updated successfully', { user: updatedUser });
    } catch (error) {
      this.logger.error(`Profile update failed for ${userId}:`, error.message);
      
      if (error.message.includes('not found')) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        error.message || 'Failed to update profile',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('profile/:userId/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(
    @Param('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req
  ) {
    try {
      // Vérifier les permissions
      if (req.user.sub !== userId) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      this.logger.log(`Password change attempt for user: ${userId} by user: ${req.user.sub}`);
      
      await this.authService.changePassword(
        userId, 
        changePasswordDto.currentPassword, 
        changePasswordDto.newPassword
      );
      
      this.logger.log(`Password changed successfully for user: ${userId}`);
      
      return ApiResponseDto.success('Password changed successfully');
    } catch (error) {
      this.logger.error(`Password change failed for ${userId}:`, error.message);
      
      if (error.message.includes('incorrect') || error.message.includes('invalid')) {
        throw new HttpException('Current password is incorrect', HttpStatus.BAD_REQUEST);
      }
      
      throw new HttpException(
        error.message || 'Failed to change password',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('profile/:userId/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  async uploadAvatar(
    @Param('userId') userId: string,
    @Request() req
  ) {
    try {
      // Vérifier les permissions
      if (req.user.sub !== userId && req.user.role !== 'admin') {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      this.logger.log(`Avatar upload attempt for user: ${userId} by user: ${req.user.sub}`);
      
      // Pour l'instant, génération d'un avatar par défaut
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=c174f2`;
      
      const updatedUser = await this.authService.updateUserProfile(userId, { 
        avatar: avatarUrl 
      });
      
      this.logger.log(`Avatar updated for user: ${userId}`);
      
      return ApiResponseDto.success('Avatar uploaded successfully', { 
        avatarUrl,
        user: updatedUser 
      });
    } catch (error) {
      this.logger.error(`Avatar upload failed for ${userId}:`, error.message);
      
      throw new HttpException(
        error.message || 'Failed to upload avatar',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('profile/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(
    @Param('userId') userId: string,
    @Request() req
  ) {
    try {
      // Vérifier les permissions de lecture
      if (req.user.sub !== userId && req.user.role !== UserRole.ADMIN) {
        // Les investisseurs peuvent voir les profils des startups et vice versa
        const targetUser = await this.authService.getUserProfile(userId);
        if (!targetUser) {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        
        const canView = (
          (req.user.role === UserRole.INVESTOR && targetUser.role === UserRole.STARTUP) ||
          (req.user.role === UserRole.STARTUP && targetUser.role === UserRole.INVESTOR) ||
          targetUser.role === UserRole.USER
        );
        
        if (!canView) {
          throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
        }
      }
      
      const userProfile = await this.authService.getUserProfile(userId);
      if (!userProfile) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      return ApiResponseDto.success('Profile retrieved', { user: userProfile });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to retrieve profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== ENDPOINTS DE DEBUG ET UTILITAIRES =====

  @Get('debug/users')
  @ApiOperation({ summary: 'Debug: List all users' })
  async debugUsers() {
    try {
      const users = await this.authService.getAllUsers(50);
      this.logger.log(`Debug: Found ${users.users.length} users in database`);
      
      const userSummary = users.users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        hasPassword: !!user.password
      }));
      
      return ApiResponseDto.success('Users retrieved for debug', {
        count: users.users.length,
        users: userSummary
      });
    } catch (error) {
      this.logger.error('Debug users failed:', error);
      throw new HttpException(
        'Failed to retrieve users for debug',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('debug/user/:email')
  @ApiOperation({ summary: 'Debug: Find user by email' })
  async debugFindUser(@Param('email') email: string) {
    try {
      this.logger.log(`Debug: Looking for user: ${email}`);
      
      const userRepository = this.authService['userRepository'];
      const user = await userRepository.findByEmail(email);
      
      if (user) {
        this.logger.log(`Debug: User found: ${email}`);
        return ApiResponseDto.success('User found', {
          id: user.id,
          email: user.email,
          role: user.role,
          hasPassword: !!user.password,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      } else {
        this.logger.log(`Debug: User not found: ${email}`);
        return ApiResponseDto.error('User not found');
      }
    } catch (error) {
      this.logger.error(`Debug find user failed for ${email}:`, error);
      throw new HttpException(
        'Failed to find user for debug',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify JWT token' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    try {
      const user = await this.authService.verifyToken(verifyTokenDto.token);
      return ApiResponseDto.success('Token verified', { user });
    } catch (error) {
      throw new HttpException(
        error.message || 'Token verification failed',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout() {
    return ApiResponseDto.success('Logout successful');
  }
}