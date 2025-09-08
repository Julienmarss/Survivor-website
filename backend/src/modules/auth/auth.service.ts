// backend/src/modules/auth/auth.service.ts
import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './repositories/user.repository';
import { IUser, IAuthResponse, UserRole } from './interfaces/user.interface';
import { LoginDto, RegisterUserDto, RegisterStartupDto, RegisterInvestorDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * @brief Register a standard user
   */
  async registerUser(registerDto: RegisterUserDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Registering user: ${registerDto.email}`);
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = this.cleanObjectDeep({
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.USER,
        age: registerDto.age,
        gender: registerDto.gender,
        isEmailVerified: false,
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
   * @brief Register a startup user - Version corrigée
   */
  async registerStartup(registerDto: RegisterStartupDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Registering startup: ${registerDto.email}`);
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Parser teamSize si c'est une string
      let teamSizeNumber: number;
      if (typeof registerDto.teamSize === 'string') {
        const teamSizeMapping: Record<string, number> = {
          '1 (Solo founder)': 1,
          '2-3 personnes': 3,
          '4-6 personnes': 5,
          '7-10 personnes': 8,
          '11-20 personnes': 15,
          '20+ personnes': 25
        };
        teamSizeNumber = teamSizeMapping[registerDto.teamSize] || 1;
      } else {
        teamSizeNumber = registerDto.teamSize || 1;
      }

      // Gérer les dates
      let foundingDate: Date;
      if (registerDto.foundingDate) {
        foundingDate = new Date(registerDto.foundingDate);
      } else if (registerDto.foundingYear) {
        foundingDate = new Date(`${registerDto.foundingYear}-01-01`);
      } else {
        foundingDate = new Date(); // Date actuelle par défaut
      }

      // Utiliser stage ou maturity
      const maturity = registerDto.maturity || registerDto.stage || 'MVP';

      const userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = this.cleanObjectDeep({
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.STARTUP,
        companyName: registerDto.companyName,
        legalStatus: registerDto.legalStatus || 'SAS',
        address: registerDto.address || '',
        phone: registerDto.phone,
        websiteUrl: registerDto.website,
        socialMediaUrl: registerDto.socialMediaUrl,
        description: registerDto.description,
        sector: registerDto.sector,
        maturity: maturity,
        projectStatus: registerDto.projectStatus || 'Active',
        needs: registerDto.needs || registerDto.fundingNeeds,
        foundingDate: foundingDate,
        teamSize: teamSizeNumber,
        isEmailVerified: false,
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
   */
  async registerInvestor(registerDto: RegisterInvestorDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Registering investor: ${registerDto.email}`);
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Mapper le type d'investisseur du frontend vers le backend
      const mapInvestorType = (type: string): 'angel' | 'venture_capital' | 'private_equity' | 'corporate' | 'government' => {
        const mapping: Record<string, 'angel' | 'venture_capital' | 'private_equity' | 'corporate' | 'government'> = {
          'Business Angel': 'angel',
          'Fonds d\'investissement': 'venture_capital',
          'Corporate Venture': 'corporate',
          'Family Office': 'venture_capital',
          'Fonds de pension': 'venture_capital',
          'Investisseur institutionnel': 'venture_capital',
          'Crowdfunding platform': 'venture_capital',
          'Autre': 'angel'
        };
        return mapping[type] || 'angel';
      };

      // Parser l'investmentRange si c'est une string
      let investmentRangeData: { min: number; max: number } | undefined;
      if (registerDto.investmentRange) {
        if (typeof registerDto.investmentRange === 'string') {
          // Parser les fourchettes comme "100K€ - 500K€"
          const parseRange = (rangeStr: string): { min: number; max: number } => {
            const ranges: Record<string, { min: number; max: number }> = {
              'Moins de 10K€': { min: 0, max: 10000 },
              '10K€ - 50K€': { min: 10000, max: 50000 },
              '50K€ - 100K€': { min: 50000, max: 100000 },
              '100K€ - 500K€': { min: 100000, max: 500000 },
              '500K€ - 1M€': { min: 500000, max: 1000000 },
              '1M€ - 5M€': { min: 1000000, max: 5000000 },
              '5M€ - 10M€': { min: 5000000, max: 10000000 },
              'Plus de 10M€': { min: 10000000, max: 100000000 }
            };
            return ranges[rangeStr] || { min: 0, max: 1000000 };
          };
          investmentRangeData = parseRange(registerDto.investmentRange);
        } else {
          investmentRangeData = {
            min: registerDto.investmentRange.min,
            max: registerDto.investmentRange.max,
          };
        }
      }

      const userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = this.cleanObjectDeep({
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.INVESTOR,
        investorType: mapInvestorType(registerDto.investorType),
        investmentRange: investmentRangeData,
        preferredSectors: registerDto.preferredSectors,
        preferredStages: registerDto.preferredStages,
        portfolioSize: registerDto.portfolioSize,
        investmentExperience: registerDto.investmentExperience,
        linkedinUrl: registerDto.linkedinUrl,
        companyWebsite: registerDto.companyWebsite,
        investmentCriteria: registerDto.investmentCriteria,
        geographicalPreferences: registerDto.geographicalPreferences,
        isEmailVerified: false,
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
   */
  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Login attempt for: ${loginDto.email}`);
      const user = await this.userRepository.findByEmail(loginDto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
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
   */
  async validateUser(userId: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findById(userId);
      if (user) {
        return { ...user, password: undefined };
      }
      return null;
    } catch (error) {
      this.logger.error(`Error validating user ${userId}:`, error);
      return null;
    }
  }

  /**
   * @brief Verify JWT token
   */
  async verifyToken(token: string): Promise<IUser | null> {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.userRepository.findById(decoded.sub);
      if (user) {
        await this.userRepository.updateLastLogin(user.id!);
        return { ...user, password: undefined };
      }
      return null;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid token');
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
   */
  private generateAccessToken(user: IUser): string {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role, 
      firstName: user.firstName,
      lastName: user.lastName
    };
    return this.jwtService.sign(payload);
  }

  /**
   * @brief Recursively remove undefined values from an object
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
