import { 
  IsEmail, 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsArray, 
  IsUrl, 
  IsDateString, 
  ValidateNested,
  IsNumber,
  Min
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class FounderDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'CEO', required: false })
  @IsOptional()
  @IsString()
  role?: string;
}

export class CreateStartupDto {
  @ApiProperty({ example: 'TechCorp SAS' })
  @IsString()
  name: string;

  @ApiProperty({ 
    enum: ['SAS', 'SARL', 'SA', 'SNC', 'SCS', 'Auto-entrepreneur', 'EURL'], 
    example: 'SAS' 
  })
  @IsString()
  legalStatus: string;

  @ApiProperty({ example: '123 Innovation Street, 75001 Paris, France' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'contact@techcorp.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+33123456789' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'We develop innovative AI solutions for healthcare.' })
  @IsString()
  description: string;

  @ApiProperty({ 
    enum: [
      'FinTech', 'HealthTech', 'EdTech', 'GreenTech', 'AgriTech', 'PropTech', 
      'FoodTech', 'RetailTech', 'Mobility', 'Cybersécurité', 'Intelligence Artificielle', 
      'Blockchain', 'IoT', 'Robotique', 'Gaming', 'Media & Entertainment', 'E-commerce', 
      'SaaS', 'Autre'
    ], 
    example: 'FinTech' 
  })
  @IsString()
  sector: string;

  @ApiProperty({ 
    enum: ['Idéation', 'Prototype', 'MVP', 'Validation', 'Traction', 'Croissance', 'Scale-up'], 
    example: 'MVP' 
  })
  @IsString()
  maturity: string;

  @ApiProperty({ 
    enum: ['Active', 'Seeking Investment', 'Paused', 'Completed'], 
    example: 'Active',
    required: false 
  })
  @IsOptional()
  @IsString()
  projectStatus?: string;

  @ApiProperty({ example: 'https://techcorp.com', required: false })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiProperty({ example: 'https://linkedin.com/company/techcorp', required: false })
  @IsOptional()
  @IsUrl()
  socialMediaUrl?: string;

  @ApiProperty({ 
    example: 'Funding, mentoring, technical expertise',
    required: false 
  })
  @IsOptional()
  @IsString()
  needs?: string;

  @ApiProperty({ example: '2022-01-15', required: false })
  @IsOptional()
  @IsDateString()
  foundingDate?: string;

  @ApiProperty({ type: [FounderDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FounderDto)
  founders?: FounderDto[];
}

export class UpdateStartupDto {
  @ApiProperty({ example: 'TechCorp SAS', required: false })
  @IsOptional()
  @IsString()
  name?: string;

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

  @ApiProperty({ example: 'contact@techcorp.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+33123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'We develop innovative AI solutions for healthcare.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    enum: [
      'FinTech', 'HealthTech', 'EdTech', 'GreenTech', 'AgriTech', 'PropTech', 
      'FoodTech', 'RetailTech', 'Mobility', 'Cybersécurité', 'Intelligence Artificielle', 
      'Blockchain', 'IoT', 'Robotique', 'Gaming', 'Media & Entertainment', 'E-commerce', 
      'SaaS', 'Autre'
    ], 
    example: 'FinTech',
    required: false 
  })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ 
    enum: ['Idéation', 'Prototype', 'MVP', 'Validation', 'Traction', 'Croissance', 'Scale-up'], 
    example: 'MVP',
    required: false 
  })
  @IsOptional()
  @IsString()
  maturity?: string;

  @ApiProperty({ 
    enum: ['Active', 'Seeking Investment', 'Paused', 'Completed'], 
    example: 'Active',
    required: false 
  })
  @IsOptional()
  @IsString()
  projectStatus?: string;

  @ApiProperty({ example: 'https://techcorp.com', required: false })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiProperty({ example: 'https://linkedin.com/company/techcorp', required: false })
  @IsOptional()
  @IsUrl()
  socialMediaUrl?: string;

  @ApiProperty({ 
    example: 'Funding, mentoring, technical expertise',
    required: false 
  })
  @IsOptional()
  @IsString()
  needs?: string;

  @ApiProperty({ example: '2022-01-15', required: false })
  @IsOptional()
  @IsDateString()
  foundingDate?: string;

  @ApiProperty({ type: [FounderDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FounderDto)
  founders?: FounderDto[];
}

export class StartupSearchDto {
  @ApiProperty({ example: 'TechCorp', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 'FinTech', required: false })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ example: 'MVP', required: false })
  @IsOptional()
  @IsString()
  maturity?: string;

  @ApiProperty({ example: 'Active', required: false })
  @IsOptional()
  @IsString()
  projectStatus?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 'created_at', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'desc', required: false })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class UpdateStartupStatusDto {
  @ApiProperty({ 
    enum: ['Active', 'Seeking Investment', 'Paused', 'Completed'], 
    example: 'Seeking Investment' 
  })
  @IsEnum(['Active', 'Seeking Investment', 'Paused', 'Completed'])
  status: string;

  @ApiProperty({ example: 'Status updated for funding search', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkActionStartupDto {
  @ApiProperty({ 
    type: [String], 
    example: ['startup1-id', 'startup2-id'] 
  })
  @IsArray()
  @IsString({ each: true })
  startupIds: string[];

  @ApiProperty({ 
    enum: ['delete', 'status_change', 'sector_change', 'export'], 
    example: 'status_change' 
  })
  @IsEnum(['delete', 'status_change', 'sector_change', 'export'])
  action: 'delete' | 'status_change' | 'sector_change' | 'export';

  @ApiProperty({ 
    example: { status: 'Active', reason: 'Bulk status update' },
    required: false 
  })
  @IsOptional()
  params?: any;
}

export class AddFounderDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'CEO', required: false })
  @IsOptional()
  @IsString()
  role?: string;
}

export class StartupAnalyticsDto {
  @ApiProperty({ example: 1250 })
  views: number;

  @ApiProperty({ example: 45 })
  contacts: number;

  @ApiProperty({ example: 23 })
  shares: number;

  @ApiProperty({ example: 78.5 })
  engagementRate: number;

  @ApiProperty({ example: 234 })
  lastWeekViews: number;

  @ApiProperty({ example: 3.6 })
  conversionRate: number;

  @ApiProperty({ 
    type: [Object],
    example: [
      { source: 'Direct', count: 456 },
      { source: 'Google', count: 234 },
      { source: 'LinkedIn', count: 123 }
    ]
  })
  topReferrers: Array<{ source: string; count: number }>;
}

export class StartupStatsDto {
  @ApiProperty({ example: 145 })
  total: number;

  @ApiProperty({ 
    type: [Object],
    example: [
      { sector: 'FinTech', count: 25 },
      { sector: 'HealthTech', count: 18 }
    ]
  })
  bySector: Array<{ sector: string; count: number }>;

  @ApiProperty({ 
    type: [Object],
    example: [
      { maturity: 'MVP', count: 45 },
      { maturity: 'Validation', count: 32 }
    ]
  })
  byMaturity: Array<{ maturity: string; count: number }>;

  @ApiProperty({ 
    type: [Object],
    example: [
      { status: 'Active', count: 89 },
      { status: 'Seeking Investment', count: 34 }
    ]
  })
  byStatus: Array<{ status: string; count: number }>;

  @ApiProperty({ example: 12 })
  newThisMonth: number;

  @ApiProperty({ example: 3 })
  newThisWeek: number;

  @ApiProperty({ example: 89 })
  activeProjects: number;

  @ApiProperty({ example: 67 })
  needsFunding: number;

  @ApiProperty({ 
    type: [Object],
    example: [
      { sector: 'FinTech', count: 25, percentage: 17.2 },
      { sector: 'HealthTech', count: 18, percentage: 12.4 }
    ]
  })
  topSectors: Array<{ sector: string; count: number; percentage: number }>;

  @ApiProperty({ 
    type: [Object],
    example: [
      {
        id: 'startup123',
        name: 'TechCorp',
        sector: 'FinTech',
        maturity: 'MVP',
        created_at: '2024-01-15T10:30:00Z'
      }
    ]
  })
  recentStartups: Array<{
    id: string;
    name: string;
    sector: string;
    maturity: string;
    created_at: Date;
  }>;

  @ApiProperty({ 
    type: [Object],
    example: [
      { month: 'Jan 2024', count: 8 },
      { month: 'Fév 2024', count: 12 }
    ]
  })
  monthlyGrowth: Array<{
    month: string;
    count: number;
  }>;
}

export class SectorWithStatsDto {
  @ApiProperty({ example: 'FinTech' })
  name: string;

  @ApiProperty({ example: 25 })
  count: number;

  @ApiProperty({ example: 'MVP' })
  avgMaturity: string;

  @ApiProperty({ example: 18 })
  activePrjects: number;

  @ApiProperty({ example: 15 })
  fundingNeeds: number;
}

export class StartupAuditLogDto {
  @ApiProperty({ example: 'log123' })
  id: string;

  @ApiProperty({ example: 'startup456' })
  startupId: string;

  @ApiProperty({ example: 'startup_updated' })
  action: string;

  @ApiProperty({ 
    example: { fields: ['description', 'sector'] }
  })
  details: any;

  @ApiProperty({ example: 'admin123', required: false })
  adminId?: string;

  @ApiProperty({ example: 'admin@example.com', required: false })
  adminEmail?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  timestamp: Date;
}

export class PaginatedStartupAuditLogDto {
  @ApiProperty({ type: [StartupAuditLogDto] })
  logs: StartupAuditLogDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 50,
      total: 125,
      totalPages: 3
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class BulkActionResultDto {
  @ApiProperty({ example: 8 })
  success: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({ 
    type: [String],
    example: ['Startup xyz: Not found', 'Startup abc: Invalid status']
  })
  errors: string[];
}

export class StartupSyncResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Synchronisation terminée: 5 créées, 12 mises à jour' })
  message: string;

  @ApiProperty({ example: 5 })
  created: number;

  @ApiProperty({ example: 12 })
  updated: number;

  @ApiProperty({ example: 1 })
  errors: number;

  @ApiProperty({ example: 18 })
  total: number;
}

export class StartupExportFiltersDto {
  @ApiProperty({ example: 'FinTech', required: false })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ example: 'MVP', required: false })
  @IsOptional()
  @IsString()
  maturity?: string;

  @ApiProperty({ example: 'Active', required: false })
  @IsOptional()
  @IsString()
  projectStatus?: string;

  @ApiProperty({ example: 'TechCorp', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 'csv', enum: ['csv', 'excel', 'json'], required: false })
  @IsOptional()
  @IsEnum(['csv', 'excel', 'json'])
  format?: 'csv' | 'excel' | 'json';
}

// Response DTOs pour les réponses API
export class CreateStartupResponseDto {
  @ApiProperty()
  startup: any; // IStartup interface
}

export class UpdateStartupResponseDto {
  @ApiProperty()
  startup: any; // IStartup interface
}

export class StartupListResponseDto {
  @ApiProperty({ type: [Object] })
  startups: any[]; // IStartup[]

  @ApiProperty({
    example: {
      page: 1,
      limit: 20,
      total: 145,
      totalPages: 8
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}