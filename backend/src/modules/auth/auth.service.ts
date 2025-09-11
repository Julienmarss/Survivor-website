import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './repositories/user.repository';
import { StartupRepository } from '../startups/repositories/startups.repository';
import { IUser, IAuthResponse, UserRole } from './interfaces/user.interface';
import { LoginDto, RegisterUserDto, RegisterStartupDto, RegisterInvestorDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly startupRepository: StartupRepository,
  ) {}

  /**
   * @brief Register a startup user - Version avec debug complet
   */
  async registerStartup(registerDto: RegisterStartupDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Starting startup registration for: ${registerDto.email}`);
      
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      this.logger.log('Password hashed successfully');

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
      this.logger.log(`Team size mapped: ${registerDto.teamSize} -> ${teamSizeNumber}`);

      let foundingDate: Date;
      if (registerDto.foundingDate) {
        foundingDate = new Date(registerDto.foundingDate);
      } else if (registerDto.foundingYear) {
        foundingDate = new Date(`${registerDto.foundingYear}-01-01`);
      } else {
        foundingDate = new Date();
      }
      this.logger.log(`Founding date: ${foundingDate.toISOString()}`);

      const maturity = registerDto.maturity || registerDto.stage || 'MVP';
      this.logger.log(`Maturity stage: ${maturity}`);

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

      this.logger.log('Creating user in Firebase...');
      const user = await this.userRepository.createUser(userData);
      this.logger.log(`User created successfully with ID: ${user.id}`);
      this.logger.log('Starting startup creation process...');
      
      try {
        if (!this.startupRepository) {
          throw new Error('StartupRepository is not injected!');
        }
        this.logger.log('StartupRepository is available');

        const startupData = {
          jeb_id: Math.floor(Math.random() * 1000000),
          name: registerDto.companyName,
          legal_status: registerDto.legalStatus || 'SAS',
          address: registerDto.address || '',
          email: registerDto.email,
          phone: registerDto.phone || '',
          created_at: foundingDate,
          description: registerDto.description,
          website_url: registerDto.website,
          social_media_url: registerDto.socialMediaUrl,
          project_status: registerDto.projectStatus || 'Active',
          needs: registerDto.needs || registerDto.fundingNeeds,
          sector: registerDto.sector,
          maturity: maturity,
        };

        this.logger.log('Creating startup with data:', JSON.stringify(startupData, null, 2));
        const startup = await this.startupRepository.create(startupData);
        this.logger.log(`Startup created successfully with ID: ${startup.id}`);

        this.logger.log('Creating founder...');
        const founderData = {
          jeb_id: Math.floor(Math.random() * 1000000),
          name: `${registerDto.firstName} ${registerDto.lastName}`,
          startup_id: startup.id!,
          jeb_startup_id: startupData.jeb_id,
        };

        this.logger.log('Creating founder with data:', JSON.stringify(founderData, null, 2));
        const founder = await this.startupRepository.createFounder(founderData);
        this.logger.log(`Founder created successfully with ID: ${founder.id}`);

        this.logger.log(`Complete startup creation successful:
          - User ID: ${user.id}
          - Startup ID: ${startup.id}
          - Founder ID: ${founder.id}
        `);

      } catch (startupError) {
        this.logger.error('STARTUP CREATION FAILED:', startupError);
        this.logger.error('Stack trace:', startupError.stack);
        
        if (startupError.message) {
          this.logger.error('Error message:', startupError.message);
        }
        if (startupError.code) {
          this.logger.error('Error code:', startupError.code);
        }
        
        this.logger.warn('Startup creation failed but user creation succeeded');
      }

      const accessToken = this.generateAccessToken(user);
      this.logger.log('Access token generated successfully');

      this.logger.log(`Startup registration completed for: ${user.email}`);
      return { user: { ...user, password: undefined }, accessToken };
      
    } catch (error) {
      this.logger.error('Startup registration completely failed:', error);
      this.logger.error('Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * @brief Register a standard user - Version améliorée pour les étudiants
   */
  async registerUser(userData: RegisterUserDto): Promise<IAuthResponse> {
    try {
      this.logger.log(`Registering user: ${userData.email}`);
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const userDataClean: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = this.cleanObjectDeep({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: UserRole.USER,
        age: userData.age || 20,
        gender: userData.gender || 'prefer_not_to_say',
        isEmailVerified: false,
        
        ...(userData as any).school && { school: (userData as any).school },
        ...(userData as any).level && { level: (userData as any).level },
        ...(userData as any).field && { field: (userData as any).field },
        ...(userData as any).linkedin && { linkedinUrl: (userData as any).linkedin },
        ...(userData as any).motivation && { motivation: (userData as any).motivation },
        ...(userData as any).interests && { interests: (userData as any).interests },
      });

      const user = await this.userRepository.createUser(userDataClean);
      const accessToken = this.generateAccessToken(user);

      this.logger.log(`User registered successfully: ${user.email}`);
      return { user: { ...user, password: undefined }, accessToken };
    } catch (error) {
      this.logger.error('User registration failed:', error);
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

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

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

      let investmentRangeData: { min: number; max: number } | undefined;
      if (registerDto.investmentRange) {
        if (typeof registerDto.investmentRange === 'string') {
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

  /**
 * @brief Update user profile with enhanced validation and data cleaning
 */
async updateUserProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
  try {
    this.logger.log(`Updating profile for user: ${userId}`);
    this.logger.debug(`Update data received: ${JSON.stringify(updateData, null, 2)}`);
    
    // Validation des données selon le rôle de l'utilisateur
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new UnauthorizedException('User not found');
    }

    // Nettoyer et valider les données selon le rôle
    const cleanedData = this.validateAndCleanProfileData(updateData, existingUser.role);
    
    this.logger.debug(`Cleaned data for update: ${JSON.stringify(cleanedData, null, 2)}`);
    
    // Mise à jour dans la base de données
    const updatedUser = await this.userRepository.updateUser(userId, cleanedData);
    
    this.logger.log(`Profile updated successfully for user: ${userId}`);
    
    // Retourner l'utilisateur sans le mot de passe
    return { ...updatedUser, password: undefined };
  } catch (error) {
    this.logger.error(`Error updating user profile ${userId}:`, error);
    throw error;
  }
}

/**
 * @brief Change user password with validation
 */
async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  try {
    this.logger.log(`Password change attempt for user: ${userId}`);
    
    // Récupérer l'utilisateur avec son mot de passe
    const user = await this.userRepository.findById(userId);
    if (!user || !user.password) {
      throw new UnauthorizedException('User not found or invalid');
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Valider le nouveau mot de passe
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await this.userRepository.updateUser(userId, { 
      password: hashedNewPassword 
    });

    this.logger.log(`Password changed successfully for user: ${userId}`);
  } catch (error) {
    this.logger.error(`Error changing password for user ${userId}:`, error);
    throw error;
  }
}

/**
 * @brief Validate and clean profile data based on user role
 */
private validateAndCleanProfileData(data: any, userRole: UserRole): Partial<IUser> {
  const cleanedData: any = {};

  // Champs communs autorisés
  const commonFields = [
    'firstName', 'lastName', 'phone', 'bio', 'motivation', 'location', 'address',
    'linkedin', 'linkedinUrl', 'website', 'websiteUrl', 'website_url', 'avatar'
  ];

  // Champs spécifiques aux startups
  const startupFields = [
    'companyName', 'company_name', 'sector', 'description', 'companyDescription',
    'foundingYear', 'founding_year', 'teamSize', 'team_size', 'fundingStage', 
    'funding_stage', 'businessModel', 'business_model', 'currentFunding', 
    'current_funding', 'fundingNeeds', 'funding_needs', 'maturity', 
    'projectStatus', 'project_status', 'needs', 'socialMediaUrl', 'social_media_url'
  ];

  // Champs spécifiques aux investisseurs
  const investorFields = [
    'company', 'position', 'investorType', 'investor_type', 'experience',
    'investmentRange', 'investment_range', 'preferredSectors', 'preferred_sectors',
    'preferredStages', 'preferred_stages', 'geography', 'investmentCriteria',
    'investment_criteria', 'portfolio', 'expertise', 'portfolioSize',
    'investmentExperience', 'companyWebsite', 'geographicalPreferences'
  ];

  // Champs spécifiques aux étudiants
  const studentFields = [
    'school', 'schoolName', 'studyLevel', 'study_level', 'level', 'studyField',
    'study_field', 'field', 'interests', 'graduationYear', 'graduation_year'
  ];

  // Nettoyer les champs communs
  commonFields.forEach(field => {
    if (data[field] !== undefined) {
      cleanedData[field] = data[field];
    }
  });

  // Nettoyer les champs spécifiques selon le rôle
  switch (userRole) {
    case UserRole.STARTUP:
      startupFields.forEach(field => {
        if (data[field] !== undefined) {
          cleanedData[field] = data[field];
        }
      });
      break;

    case UserRole.INVESTOR:
      investorFields.forEach(field => {
        if (data[field] !== undefined) {
          cleanedData[field] = data[field];
        }
      });
      break;

    case UserRole.USER:
      studentFields.forEach(field => {
        if (data[field] !== undefined) {
          cleanedData[field] = data[field];
        }
      });
      break;
  }

  // Validation spéciale pour certains champs
  if (cleanedData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedData.email)) {
      throw new Error('Invalid email format');
    }
  }

  if (cleanedData.phone) {
    // Nettoyer le numéro de téléphone (enlever les espaces, tirets, etc.)
    cleanedData.phone = cleanedData.phone.replace(/[\s-()]/g, '');
  }

  if (cleanedData.linkedin || cleanedData.linkedinUrl) {
    const linkedinUrl = cleanedData.linkedin || cleanedData.linkedinUrl;
    if (linkedinUrl && !linkedinUrl.includes('linkedin.com')) {
      throw new Error('Invalid LinkedIn URL');
    }
  }

  if (cleanedData.website || cleanedData.websiteUrl || cleanedData.website_url) {
    const websiteUrl = cleanedData.website || cleanedData.websiteUrl || cleanedData.website_url;
    if (websiteUrl && !websiteUrl.startsWith('http')) {
      cleanedData.website = `https://${websiteUrl}`;
      cleanedData.websiteUrl = cleanedData.website;
      cleanedData.website_url = cleanedData.website;
    }
  }

  // Nettoyer les arrays
  if (cleanedData.preferredSectors && Array.isArray(cleanedData.preferredSectors)) {
    cleanedData.preferredSectors = cleanedData.preferredSectors.filter(s => s && s.trim());
  }

  if (cleanedData.interests && Array.isArray(cleanedData.interests)) {
    cleanedData.interests = cleanedData.interests.filter(i => i && i.trim());
  }

  return this.cleanObjectDeep(cleanedData);
}

/**
 * @brief Get user profile with role-specific data
 */
async getUserProfile(userId: string): Promise<IUser | null> {
  try {
    const user = await this.userRepository.findById(userId);
    if (user) {
      return { ...user, password: undefined };
    }
    return null;
  } catch (error) {
    this.logger.error(`Error getting user profile ${userId}:`, error);
    throw error;
  }
}
}
