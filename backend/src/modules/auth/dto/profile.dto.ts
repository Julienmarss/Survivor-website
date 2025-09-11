// backend/src/modules/auth/dto/profile.dto.ts
import { IsEmail, IsString, IsOptional, IsArray, IsUrl, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  motivation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

export class UpdateStartupProfileDto extends UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2030)
  foundingYear?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teamSize?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fundingStage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessModel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currentFunding?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fundingNeeds?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  maturity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  projectStatus?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  needs?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  socialMediaUrl?: string;
}

export class UpdateInvestorProfileDto extends UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  investorType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  investmentRange?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSectors?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredStages?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  geography?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  investmentCriteria?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  portfolio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expertise?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  portfolioSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  investmentExperience?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  companyWebsite?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geographicalPreferences?: string[];
}

export class UpdateStudentProfileDto extends UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  studyLevel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  studyField?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(2020)
  @Max(2035)
  graduationYear?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(120)
  age?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gender?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  newPassword: string;
}