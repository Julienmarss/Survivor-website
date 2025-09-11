import { IsEmail, IsString, IsOptional, IsEnum, MinLength, IsNumber, IsArray, IsObject, ValidateNested, IsUrl, Min, Max, IsDateString, IsBoolean } from 'class-validator';
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

  @ApiProperty({ example: '+33123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/john-doe', required: false })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiProperty({ example: 'TechCorp SAS' })
  @IsString()
  companyName: string;

  @ApiProperty({ 
    enum: ['FinTech', 'HealthTech', 'EdTech', 'GreenTech', 'AgriTech', 'PropTech', 'FoodTech', 'RetailTech', 'Mobility', 'Cybersécurité', 'Intelligence Artificielle', 'Blockchain', 'IoT', 'Robotique', 'Gaming', 'Media & Entertainment', 'E-commerce', 'SaaS', 'Autre'], 
    example: 'FinTech' 
  })
  @IsString()
  sector: string;

  @ApiProperty({ example: 'We develop innovative AI solutions for healthcare.' })
  @IsString()
  description: string;

  @ApiProperty({ 
    enum: ['Idéation', 'Prototype', 'MVP', 'Validation', 'Traction', 'Croissance', 'Scale-up'], 
    example: 'MVP',
    required: false
  })
  @IsOptional()
  @IsString()
  maturity?: string;

  @ApiProperty({ 
    enum: ['Idéation', 'Prototype', 'MVP', 'Validation', 'Traction', 'Croissance', 'Scale-up'], 
    example: 'MVP',
    required: false
  })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiProperty({ example: '2022-01-15', required: false })
  @IsOptional()
  @IsDateString()
  foundingDate?: string;

  @ApiProperty({ example: 2024, required: false })
  @IsOptional()
  @IsNumber()
  foundingYear?: number;

  @ApiProperty({ 
    oneOf: [
      { type: 'string', example: '2-3 personnes' },
      { type: 'number', example: 3 }
    ],
    example: '2-3 personnes'
  })
  teamSize: string | number;

  @ApiProperty({ example: 'https://techcorp.com', required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ 
    enum: ['SAS', 'SARL', 'SA', 'SNC', 'SCS', 'Auto-entrepreneur', 'EURL'], 
    example: 'SAS',
    required: false
  })
  @IsOptional()
  @IsString()
  legalStatus?: string;

  @ApiProperty({ example: '123 Innovation Street, 75001 Paris, France', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'https://linkedin.com/company/techcorp', required: false })
  @IsOptional()
  @IsUrl()
  socialMediaUrl?: string;

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

  @ApiProperty({ example: 'Jean Dupont, CTO expert en IA', required: false })
  @IsOptional()
  @IsString()
  coFounders?: string;

  @ApiProperty({ example: '100K€ - 500K€', required: false })
  @IsOptional()
  @IsString()
  fundingNeeds?: string;

  @ApiProperty({ example: 'Autofinancement', required: false })
  @IsOptional()
  @IsString()
  currentFunding?: string;

  @ApiProperty({ example: 'Révolutionner le secteur de la santé avec l\'IA', required: false })
  @IsOptional()
  @IsString()
  vision?: string;

  @ApiProperty({ example: 'Validation technique, accès au marché', required: false })
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiProperty({ example: 'Accéder au réseau d\'experts et d\'investisseurs', required: false })
  @IsOptional()
  @IsString()
  why?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;

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

  @ApiProperty({ example: '+33123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/janesmith', required: false })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiProperty({ example: 'Investment Capital' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'Partner' })
  @IsString()
  position: string;

  @ApiProperty({ 
    enum: ['Business Angel', 'Fonds d\'investissement', 'Corporate Venture', 'Family Office', 'Fonds de pension', 'Investisseur institutionnel', 'Crowdfunding platform', 'Autre'], 
    example: 'Business Angel' 
  })
  @IsEnum(['Business Angel', 'Fonds d\'investissement', 'Corporate Venture', 'Family Office', 'Fonds de pension', 'Investisseur institutionnel', 'Crowdfunding platform', 'Autre'])
  investorType: string;

  @ApiProperty({ example: 'https://investmentcapital.com', required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ 
    enum: ['Moins d\'1 an', '1-3 ans', '3-5 ans', '5-10 ans', '10-15 ans', 'Plus de 15 ans'], 
    example: '5-10 ans' 
  })
  @IsString()
  experience: string;

  @ApiProperty({ type: InvestmentRangeDto })
  @ValidateNested()
  @Type(() => InvestmentRangeDto)
  investmentRange: InvestmentRangeDto;

  @ApiProperty({ 
    type: [String], 
    example: ['FinTech', 'HealthTech', 'EdTech'],
    description: 'Preferred investment sectors'
  })
  @IsArray()
  @IsString({ each: true })
  preferredSectors: string[];

  @ApiProperty({ 
    type: [String], 
    example: ['Pre-seed', 'Seed', 'Série A'],
    description: 'Preferred investment stages'
  })
  @IsArray()
  @IsString({ each: true })
  preferredStages: string[];

  @ApiProperty({ 
    enum: ['France uniquement', 'Europe', 'Europe + États-Unis', 'Global', 'Marchés émergents', 'Asie-Pacifique', 'Afrique', 'Amérique du Nord'], 
    example: 'Europe' 
  })
  @IsString()
  geography: string;

  @ApiProperty({ 
    example: 'Recherche d\'équipes solides avec une vision claire',
    required: false 
  })
  @IsOptional()
  @IsString()
  investmentCriteria?: string;

  @ApiProperty({ example: 25, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  portfolioSize?: number;

  @ApiProperty({ example: 8, description: 'Years of investment experience', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  investmentExperience?: number;

  @ApiProperty({ example: 'https://janesmith.com', required: false })
  @IsOptional()
  @IsUrl()
  companyWebsite?: string;

  @ApiProperty({ 
    type: [String], 
    example: ['Europe', 'North America'],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geographicalPreferences?: string[];

  @ApiProperty({ 
    example: 'Apporter mon expertise en scaling et en levées de fonds',
    required: false 
  })
  @IsOptional()
  @IsString()
  expertise?: string;

  @ApiProperty({ 
    example: 'Présentation de quelques investissements réussis...',
    required: false 
  })
  @IsOptional()
  @IsString()
  portfolio?: string;

  @ApiProperty({ 
    example: 'Accéder aux meilleures startups françaises',
    required: false 
  })
  @IsOptional()
  @IsString()
  motivation?: string;

  role: UserRole.INVESTOR = UserRole.INVESTOR;
}

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.STARTUP })
  @IsEnum(UserRole)
  role: UserRole;
}

export class VerifyTokenDto {
  @ApiProperty({ example: 'jwt-token-here' })
  @IsString()
  token: string;
}
