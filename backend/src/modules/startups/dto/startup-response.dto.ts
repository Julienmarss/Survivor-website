import { ApiProperty } from '@nestjs/swagger';

export class FounderDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startup_id: number;
}

export class StartupResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  legal_status: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  website_url?: string;

  @ApiProperty({ required: false })
  social_media_url?: string;

  @ApiProperty({ required: false })
  project_status?: string;

  @ApiProperty({ required: false })
  needs?: string;

  @ApiProperty()
  sector: string;

  @ApiProperty()
  maturity: string;

  @ApiProperty({ type: [FounderDto] })
  founders: FounderDto[];
}

export class StartupsListResponseDto {
  @ApiProperty({ type: [StartupResponseDto] })
  data: StartupResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}