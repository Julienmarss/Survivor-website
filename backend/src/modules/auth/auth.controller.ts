// backend/src/modules/auth/auth.controller.ts
import { 
  Body, 
  Controller, 
  Post, 
  Get, 
  UseGuards, 
  Request,
  Query,
  Param,
  Put,
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
import { 
  LoginDto, 
  RegisterUserDto, 
  RegisterStartupDto, 
  RegisterInvestorDto, 
  UpdateRoleDto, 
  VerifyTokenDto 
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Inscription utilisateur normal
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

  // Inscription startup
  @Post('register/startup')
  @ApiOperation({ summary: 'Register a new startup' })
  @ApiResponse({ status: 201, description: 'Startup registered successfully' })
  @ApiResponse({ status: 409, description: 'Startup already exists' })
  async registerStartup(@Body() registerDto: RegisterStartupDto) {
    try {
      const result = await this.authService.registerStartup(registerDto);
      return ApiResponseDto.success('Startup registered successfully', result);
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // Inscription investisseur
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
      const result = await this.authService.login(loginDto);
      return ApiResponseDto.success('Login successful', result);
    } catch (error) {
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Post('verify-firebase-token')
  @ApiOperation({ summary: 'Verify Firebase ID token' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  async verifyFirebaseToken(@Body() verifyTokenDto: VerifyTokenDto) {
    try {
      const user = await this.authService.verifyFirebaseToken(verifyTokenDto.token);
      return ApiResponseDto.success('Token verified', { user });
    } catch (error) {
      throw new HttpException(
        error.message || 'Token verification failed',
        HttpStatus.UNAUTHORIZED
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
      const user = await this.authService.validateUser(req.user.sub);
      return ApiResponseDto.success('Profile retrieved', { user });
    } catch (error) {
      throw new HttpException(
        'Failed to get profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('limit') limit: number = 20,
    @Query('pageToken') pageToken?: string,
    @Query('role') role?: UserRole
  ) {
    try {
      const result = await this.authService.getAllUsers(limit, pageToken, role);
      return ApiResponseDto.success('Users retrieved successfully', result);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('users/startups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INVESTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all startups profiles' })
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

  @Get('users/investors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STARTUP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all investor profiles' })
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

  @Put('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateRoleDto
  ) {
    try {
      const user = await this.authService.updateUserRole(userId, updateRoleDto.role);
      return ApiResponseDto.success('User role updated', { user });
    } catch (error) {
      throw new HttpException(
        'Failed to update user role',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Request() req, @Body() updateData: any) {
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
}