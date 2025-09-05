// backend/src/modules/auth/dto/auth.dto.ts
import { IsEmail, IsString, IsOptional, IsEnum, MinLength, IsNumber, IsArray, IsObject, ValidateNested, IsUrl, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole } from '../interfaces/user.interface';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

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

export class RegisterUserDto {
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

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(13)
  @Max(120)
  age: number;

  @ApiProperty({ 
    enum: ['male', 'female', 'other', 'prefer_not_to_say'], 
    example: 'male' 
  })
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  role: UserRole.USER = UserRole.USER;
}

export class RegisterStartupDto {
  @ApiProperty({ example: 'founder@startup.com' })
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

  @ApiProperty({ example: 'TechCorp SAS' })
  @IsString()
  companyName: string;

  @ApiProperty({ 
    enum: ['SAS', 'SARL', 'SA', 'SNC', 'SCS', 'Auto-entrepreneur', 'EURL'], 
    example: 'SAS' 
  })
  @IsString()
  legalStatus: string;

  @ApiProperty({ example: '123 Innovation Street, 75001 Paris, France' })
  @IsString()
  address: string;

  @ApiProperty({ example: '+33123456789' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'https://techcorp.com', required: false })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiProperty({ example: 'https://linkedin.com/company/techcorp', required: false })
  @IsOptional()
  @IsUrl()
  socialMediaUrl?: string;

  @ApiProperty({ example: 'We develop innovative AI solutions for healthcare.' })
  @IsString()
  description: string;

  @ApiProperty({ 
    enum: ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Energy', 'Transportation', 'Agriculture', 'Food', 'Other'], 
    example: 'Technology' 
  })
  @IsString()
  sector: string;

  @ApiProperty({ 
    enum: ['Ideation', 'Prototype', 'MVP', 'Early Stage', 'Growth', 'Mature'], 
    example: 'MVP' 
  })
  @IsString()
  maturity: string;

  @ApiProperty({ 
    enum: ['Active', 'Seeking Investment', 'Paused', 'Completed'], 
    example: 'Seeking Investment',
    required: false 
  })
  @IsOptional()
  @IsString()
  projectStatus?: string;

  @ApiProperty({ 
    example: 'Funding, mentoring, technical expertise',
    required: false 
  })
  @IsOptional()
  @IsString()
  needs?: string;

  @ApiProperty({ example: '2022-01-15' })
  @IsDateString()
  foundingDate: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  teamSize: number;

  role: UserRole.STARTUP = UserRole.STARTUP;
}

export class RegisterInvestorDto {
  @ApiProperty({ example: 'investor@fund.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  lastName: string;

  @ApiProperty({ 
    enum: ['angel', 'venture_capital', 'private_equity', 'corporate', 'government'], 
    example: 'angel' 
  })
  @IsEnum(['angel', 'venture_capital', 'private_equity', 'corporate', 'government'])
  investorType: 'angel' | 'venture_capital' | 'private_equity' | 'corporate' | 'government';

  @ApiProperty({ type: InvestmentRangeDto })
  @ValidateNested()
  @Type(() => InvestmentRangeDto)
  investmentRange: InvestmentRangeDto;

  @ApiProperty({ 
    type: [String], 
    example: ['Technology', 'Healthcare', 'Finance'],
    description: 'Preferred investment sectors'
  })
  @IsArray()
  @IsString({ each: true })
  preferredSectors: string[];

  @ApiProperty({ 
    type: [String], 
    example: ['Seed', 'Series A', 'Series B'],
    description: 'Preferred investment stages'
  })
  @IsArray()
  @IsString({ each: true })
  preferredStages: string[];

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  @Max(1000)
  portfolioSize: number;

  @ApiProperty({ example: 8, description: 'Years of investment experience' })
  @IsNumber()
  @Min(0)
  @Max(50)
  investmentExperience: number;

  @ApiProperty({ example: 'https://linkedin.com/in/janesmith', required: false })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiProperty({ example: 'https://janesmith.com', required: false })
  @IsOptional()
  @IsUrl()
  companyWebsite?: string;

  @ApiProperty({ 
    example: 'Looking for early-stage tech startups with strong teams',
    required: false 
  })
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

  role: UserRole.INVESTOR = UserRole.INVESTOR;
}

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.STARTUP })
  @IsEnum(UserRole)
  role: UserRole;
}

export class VerifyTokenDto {
  @ApiProperty({ example: 'firebase-id-token' })
  @IsString()
  token: string;
}