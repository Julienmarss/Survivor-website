// backend/src/modules/auth/auth.controller.ts - Version avec debug
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
  HttpStatus,
  Logger
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
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // Inscription startup avec debug
  @Post('register/startup')
  @ApiOperation({ summary: 'Register a new startup' })
  @ApiResponse({ status: 201, description: 'Startup registered successfully' })
  @ApiResponse({ status: 409, description: 'Startup already exists' })
  async registerStartup(@Body() registerDto: RegisterStartupDto) {
    try {
      this.logger.log(`📝 Startup registration attempt: ${registerDto.email}`);
      this.logger.debug(`Registration data: ${JSON.stringify({
        email: registerDto.email,
        companyName: registerDto.companyName,
        sector: registerDto.sector,
        hasPassword: !!registerDto.password
      })}`);
      
      const result = await this.authService.registerStartup(registerDto);
      
      this.logger.log(`✅ Startup registration successful: ${registerDto.email}`);
      this.logger.debug(`User created with ID: ${result.user.id}`);
      
      return ApiResponseDto.success('Startup registered successfully', result);
    } catch (error) {
      this.logger.error(`❌ Startup registration failed for ${registerDto.email}:`, error.message);
      this.logger.error('Full error:', error);
      
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
      this.logger.log(`🔐 Login attempt for: ${loginDto.email}`);
      
      const result = await this.authService.login(loginDto);
      
      this.logger.log(`✅ Login successful for: ${loginDto.email}`);
      this.logger.debug(`User role: ${result.user.role}, ID: ${result.user.id}`);
      
      return ApiResponseDto.success('Login successful', result);
    } catch (error) {
      this.logger.error(`❌ Login failed for ${loginDto.email}:`, error.message);
      
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  // Endpoint de debug pour lister les utilisateurs
  @Get('debug/users')
  @ApiOperation({ summary: 'Debug: List all users' })
  async debugUsers() {
    try {
      const users = await this.authService.getAllUsers(50);
      this.logger.log(`📋 Debug: Found ${users.users.length} users in database`);
      
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
      this.logger.error('❌ Debug users failed:', error);
      throw new HttpException(
        'Failed to retrieve users for debug',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint de debug pour chercher un utilisateur spécifique
  @Get('debug/user/:email')
  @ApiOperation({ summary: 'Debug: Find user by email' })
  async debugFindUser(@Param('email') email: string) {
    try {
      this.logger.log(`🔍 Debug: Looking for user: ${email}`);
      
      // Utiliser directement le repository pour le debug
      const userRepository = this.authService['userRepository'];
      const user = await userRepository.findByEmail(email);
      
      if (user) {
        this.logger.log(`✅ Debug: User found: ${email}`);
        return ApiResponseDto.success('User found', {
          id: user.id,
          email: user.email,
          role: user.role,
          hasPassword: !!user.password,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      } else {
        this.logger.log(`❌ Debug: User not found: ${email}`);
        return ApiResponseDto.error('User not found');
      }
    } catch (error) {
      this.logger.error(`💥 Debug find user failed for ${email}:`, error);
      throw new HttpException(
        'Failed to find user for debug',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Les autres méthodes restent identiques...
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

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout() {
    return ApiResponseDto.success('Logout successful');
  }
}
