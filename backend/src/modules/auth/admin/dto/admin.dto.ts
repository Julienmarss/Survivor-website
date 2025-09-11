import { IsEmail, IsString, IsOptional, IsEnum, MinLength, IsNumber, IsArray, ValidateNested, IsUrl, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole } from '../../interfaces/user.interface';

class InvestmentRangeDto {
  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  min: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  max: number;
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole;

  // Universal optional fields
  @ApiProperty({ example: '+33123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  // User-specific fields
  @ApiProperty({ example: 25, required: false })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(120)
  age?: number;

  @ApiProperty({ 
    enum: ['male', 'female', 'other', 'prefer_not_to_say'], 
    example: 'male',
    required: false 
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  @ApiProperty({ example: 'Epitech Paris', required: false })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiProperty({ example: 'Bac +5', required: false })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ example: 'Informatique', required: false })
  @IsOptional()
  @IsString()
  field?: string;

  // Startup-specific fields
  @ApiProperty({ example: 'TechCorp SAS', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: 'FinTech', required: false })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ example: 'We develop innovative solutions', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'MVP', required: false })
  @IsOptional()
  @IsString()
  maturity?: string;

  @ApiProperty({ example: 'Active', required: false })
  @IsOptional()
  @IsString()
  projectStatus?: string;

  @ApiProperty({ example: 'Funding, mentoring', required: false })
  @IsOptional()
  @IsString()
  needs?: string;

  @ApiProperty({ example: 'https://company.com', required: false })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiProperty({ example: 'SAS', required: false })
  @IsOptional()
  @IsString()
  legalStatus?: string;

  @ApiProperty({ example: '123 Main St, Paris', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  teamSize?: number;

  // Investor-specific fields
  @ApiProperty({ 
    enum: ['angel', 'venture_capital', 'private_equity', 'corporate', 'government'], 
    example: 'angel',
    required: false 
  })
  @IsOptional()
  @IsEnum(['angel', 'venture_capital', 'private_equity', 'corporate', 'government'])
  investorType?: 'angel' | 'venture_capital' | 'private_equity' | 'corporate' | 'government';

  @ApiProperty({ type: InvestmentRangeDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvestmentRangeDto)
  investmentRange?: InvestmentRangeDto;

  @ApiProperty({ 
    type: [String], 
    example: ['FinTech', 'HealthTech'],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSectors?: string[];

  @ApiProperty({ 
    type: [String], 
    example: ['Seed', 'Series A'],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredStages?: string[];

  @ApiProperty({ example: 25, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  portfolioSize?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  investmentExperience?: number;

  @ApiProperty({ example: 'Strong technical background', required: false })
  @IsOptional()
  @IsString()
  investmentCriteria?: string;

  @ApiProperty({ 
    type: [String], 
    example: ['Europe', 'North America'],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geographicalPreferences?: string[];

  @ApiProperty({ example: 'https://linkedin.com/in/user', required: false })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+33123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  // User-specific fields
  @ApiProperty({ example: 25, required: false })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(120)
  age?: number;

  @ApiProperty({ 
    enum: ['male', 'female', 'other', 'prefer_not_to_say'], 
    example: 'male',
    required: false 
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  @ApiProperty({ example: 'Epitech Paris', required: false })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiProperty({ example: 'Bac +5', required: false })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ example: 'Informatique', required: false })
  @IsOptional()
  @IsString()
  field?: string;

  // Startup-specific fields
  @ApiProperty({ example: 'TechCorp SAS', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: 'FinTech', required: false })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ example: 'We develop innovative solutions', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'MVP', required: false })
  @IsOptional()
  @IsString()
  maturity?: string;

  @ApiProperty({ example: 'Active', required: false })
  @IsOptional()
  @IsString()
  projectStatus?: string;

  @ApiProperty({ example: 'Funding, mentoring', required: false })
  @IsOptional()
  @IsString()
  needs?: string;

  @ApiProperty({ example: 'https://company.com', required: false })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiProperty({ example: 'SAS', required: false })
  @IsOptional()
  @IsString()
  legalStatus?: string;

  @ApiProperty({ example: '123 Main St, Paris', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  teamSize?: number;

  // Investor-specific fields
  @ApiProperty({ 
    enum: ['angel', 'venture_capital', 'private_equity', 'corporate', 'government'], 
    example: 'angel',
    required: false 
  })
  @IsOptional()
  @IsEnum(['angel', 'venture_capital', 'private_equity', 'corporate', 'government'])
  investorType?: 'angel' | 'venture_capital' | 'private_equity' | 'corporate' | 'government';

  @ApiProperty({ type: InvestmentRangeDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvestmentRangeDto)
  investmentRange?: InvestmentRangeDto;

  @ApiProperty({ 
    type: [String], 
    example: ['FinTech', 'HealthTech'],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSectors?: string[];

  @ApiProperty({ 
    type: [String], 
    example: ['Seed', 'Series A'],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredStages?: string[];

  @ApiProperty({ example: 25, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  portfolioSize?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  investmentExperience?: number;

  @ApiProperty({ example: 'Strong technical background', required: false })
  @IsOptional()
  @IsString()
  investmentCriteria?: string;

  @ApiProperty({ 
    type: [String], 
    example: ['Europe', 'North America'],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geographicalPreferences?: string[];

  @ApiProperty({ example: 'https://linkedin.com/in/user', required: false })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}

export class UserSearchDto {
  @ApiProperty({ example: 'john', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ example: 'createdAt', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'desc', required: false })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.STARTUP })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 'Promoting user to startup role', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SendNotificationDto {
  @ApiProperty({ example: 'Welcome to the platform' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Welcome! Here is everything you need to know...' })
  @IsString()
  message: string;

  @ApiProperty({ 
    enum: ['welcome', 'announcement', 'warning', 'info'], 
    example: 'welcome',
    required: false 
  })
  @IsOptional()
  @IsEnum(['welcome', 'announcement', 'warning', 'info'])
  type?: string;
}

export class BulkActionDto {
  @ApiProperty({ 
    type: [String], 
    example: ['user1-id', 'user2-id'] 
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({ 
    enum: ['delete', 'role_change', 'activate', 'deactivate'], 
    example: 'role_change' 
  })
  @IsEnum(['delete', 'role_change', 'activate', 'deactivate'])
  action: 'delete' | 'role_change' | 'activate' | 'deactivate';

  @ApiProperty({ 
    example: { role: 'startup', reason: 'Bulk promotion' },
    required: false 
  })
  @IsOptional()
  params?: any;
}