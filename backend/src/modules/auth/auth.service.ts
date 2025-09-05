// backend/src/modules/auth/auth.service.ts
import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './repositories/user.repository';
import { IUser, IAuthResponse, UserRole } from './interfaces/user.interface';
import { LoginDto, RegisterUserDto, RegisterStartupDto, RegisterInvestorDto } from './dto/auth.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * @brief Register a standard user
   * @param registerDto User registration data
   * @return IAuthResponse
   */
  async registerUser(registerDto: RegisterUserDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Registering user: ${registerDto.email}`);
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = this.cleanObjectDeep({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.USER,
        age: registerDto.age,
        gender: registerDto.gender,
      });

      const user = await this.userRepository.createUser(userData);
      const accessToken = this.generateAccessToken(user);

      this.logger.log(`User registered successfully: ${user.email}`);
      return { user: { ...user, password: undefined }, accessToken };
    } catch (error) {
      this.logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * @brief Register a startup user
   * @param registerDto Startup registration data
   * @return IAuthResponse
   */
  async registerStartup(registerDto: RegisterStartupDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Registering startup: ${registerDto.email}`);
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = this.cleanObjectDeep({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.STARTUP,
        companyName: registerDto.companyName,
        legalStatus: registerDto.legalStatus,
        address: registerDto.address,
        phone: registerDto.phone,
        websiteUrl: registerDto.websiteUrl,
        socialMediaUrl: registerDto.socialMediaUrl,
        description: registerDto.description,
        sector: registerDto.sector,
        maturity: registerDto.maturity,
        projectStatus: registerDto.projectStatus,
        needs: registerDto.needs,
        foundingDate: new Date(registerDto.foundingDate),
        teamSize: registerDto.teamSize,
      });

      const user = await this.userRepository.createUser(userData);
      const accessToken = this.generateAccessToken(user);

      this.logger.log(`Startup registered successfully: ${user.email}`);
      return { user: { ...user, password: undefined }, accessToken };
    } catch (error) {
      this.logger.error('Startup registration failed:', error);
      throw error;
    }
  }

  /**
   * @brief Register an investor user
   * @param registerDto Investor registration data
   * @return IAuthResponse
   */
  async registerInvestor(registerDto: RegisterInvestorDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Registering investor: ${registerDto.email}`);
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = this.cleanObjectDeep({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.INVESTOR,
        investorType: registerDto.investorType,
        investmentRange: registerDto.investmentRange ? {
          min: registerDto.investmentRange.min,
          max: registerDto.investmentRange.max,
        } : undefined,
        preferredSectors: registerDto.preferredSectors,
        preferredStages: registerDto.preferredStages,
        portfolioSize: registerDto.portfolioSize,
        investmentExperience: registerDto.investmentExperience,
        linkedinUrl: registerDto.linkedinUrl,
        companyWebsite: registerDto.companyWebsite,
        investmentCriteria: registerDto.investmentCriteria,
        geographicalPreferences: registerDto.geographicalPreferences,
      });

      const user = await this.userRepository.createUser(userData);
      const accessToken = this.generateAccessToken(user);

      this.logger.log(`Investor registered successfully: ${user.email}`);
      return { user: { ...user, password: undefined }, accessToken };
    } catch (error) {
      this.logger.error('Investor registration failed:', error);
      throw error;
    }
  }

  /**
   * @brief Authenticate user login
   * @param loginDto Login data
   * @return IAuthResponse
   */
  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Login attempt for: ${loginDto.email}`);
      const user = await this.userRepository.findByEmail(loginDto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.userRepository.updateLastLogin(user.id!);
      const accessToken = this.generateAccessToken(user);

      this.logger.log(`User logged in successfully: ${user.email}`);
      return { user: { ...user, password: undefined }, accessToken };
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * @brief Validate user existence
   * @param userId User identifier
   * @return IUser | null
   */
  async validateUser(userId: string): Promise<IUser | null> {
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      this.logger.error(`Error validating user ${userId}:`, error);
      return null;
    }
  }

  /**
   * @brief Verify Firebase token validity
   * @param token Firebase token
   * @return IUser | null
   */
  async verifyFirebaseToken(token: string): Promise<IUser | null> {
    try {
      const decodedToken = await this.userRepository.verifyToken(token);
      const user = await this.userRepository.findByUid(decodedToken.uid);
      if (user) {
        await this.userRepository.updateLastLogin(user.id!);
      }
      return user;
    } catch (error) {
      this.logger.error('Firebase token verification failed:', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async getAllUsers(limit: number = 20, pageToken?: string, role?: UserRole) {
    try {
      return await this.userRepository.getAllUsers(limit, pageToken, role);
    } catch (error) {
      this.logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async getStartupProfiles(limit: number = 20, pageToken?: string, sector?: string) {
    try {
      return await this.userRepository.getStartupProfiles(limit, pageToken, sector);
    } catch (error) {
      this.logger.error('Error getting startup profiles:', error);
      throw error;
    }
  }

  async getInvestorProfiles(limit: number = 20, pageToken?: string, investorType?: string) {
    try {
      return await this.userRepository.getInvestorProfiles(limit, pageToken, investorType);
    } catch (error) {
      this.logger.error('Error getting investor profiles:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<IUser> {
    try {
      return await this.userRepository.updateUser(userId, { role });
    } catch (error) {
      this.logger.error(`Error updating user role ${userId}:`, error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
    try {
      const { id, uid, password, role, createdAt, updatedAt, ...allowedData } = updateData;
      return await this.userRepository.updateUser(userId, this.cleanObjectDeep(allowedData));
    } catch (error) {
      this.logger.error(`Error updating user profile ${userId}:`, error);
      throw error;
    }
  }

  /**
   * @brief Generate JWT access token
   * @param user IUser object
   * @return string
   */
  private generateAccessToken(user: IUser): string {
    const payload = { sub: user.id, email: user.email, role: user.role, uid: user.uid };
    return this.jwtService.sign(payload);
  }

  /**
   * @brief Recursively remove undefined values from an object
   * @param obj Object to clean
   * @return Object without undefined values
   */
  private cleanObjectDeep<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj
        .map((item) => this.cleanObjectDeep(item))
        .filter((item) => item !== undefined && item !== null) as any;
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      
      for (const [key, value] of Object.entries(obj as any)) {
        if (value !== undefined) {
          const cleanedValue = this.cleanObjectDeep(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      
      return cleaned as T;
    }
    
    return obj;
  }
}