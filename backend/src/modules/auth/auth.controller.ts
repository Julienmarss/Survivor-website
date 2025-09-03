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
import { ILoginDto, IRegisterDto, UserRole } from './interfaces/user.interface';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: IRegisterDto) {
    try {
      const result = await this.authService.register(registerDto);
      return ApiResponseDto.success('User registered successfully', result);
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
  async login(@Body() loginDto: ILoginDto) {
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
  async verifyFirebaseToken(@Body('token') token: string) {
    try {
      const user = await this.authService.verifyFirebaseToken(token);
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
    @Query('pageToken') pageToken?: string
  ) {
    try {
      const result = await this.authService.getAllUsers(limit, pageToken);
      return ApiResponseDto.success('Users retrieved successfully', result);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve users',
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
    @Body('role') role: UserRole
  ) {
    try {
      const user = await this.authService.updateUserRole(userId, role);
      return ApiResponseDto.success('User role updated', { user });
    } catch (error) {
      throw new HttpException(
        'Failed to update user role',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
