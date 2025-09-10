import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ 
    example: 'Startup Summit 2025',
    description: 'Nom de l\'événement',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(500, { message: 'Le nom ne peut pas dépasser 500 caractères' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ 
    example: 'Le plus grand rassemblement de startups en France...',
    description: 'Description détaillée de l\'événement',
    maxLength: 5000
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'La description ne peut pas dépasser 5000 caractères' })
  @Transform(({ value }) => value?.trim() || '')
  description?: string;

  @ApiProperty({ 
    example: 'conference',
    description: 'Type d\'événement (conference, workshop, networking, etc.)'
  })
  @IsString()
  @IsNotEmpty({ message: 'Le type d\'événement est obligatoire' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  event_type: string;

  @ApiProperty({ 
    example: 'Paris',
    description: 'Localisation de l\'événement'
  })
  @IsString()
  @IsNotEmpty({ message: 'La localisation est obligatoire' })
  @Transform(({ value }) => value?.trim())
  location: string;

  @ApiProperty({ 
    example: '2025-12-15T10:00:00.000Z',
    description: 'Date(s) de l\'événement (ISO 8601)'
  })
  @IsString()
  @IsNotEmpty({ message: 'Les dates sont obligatoires' })
  @Transform(({ value }) => value?.trim())
  dates: string;

  @ApiPropertyOptional({ 
    example: 'entrepreneurs',
    description: 'Public cible de l\'événement'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  target_audience?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/img.jpg',
    description: 'URL de l\'image associée à l\'événement'
  })
  @IsOptional()
  @IsUrl({}, { message: 'L\'URL de l\'image doit être valide' })
  imageUrl?: string;

  @ApiPropertyOptional({ 
    example: false,
    description: 'Indique si l\'événement est mis en vedette'
  })
  @IsOptional()
  @IsBoolean({ message: 'Le champ featured doit être un booléen' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  featured?: boolean;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({ 
    example: 'Startup Summit 2025 - Édition spéciale',
    description: 'Nouveau nom de l\'événement',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Le nom ne peut pas dépasser 500 caractères' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ 
    example: 'workshop',
    description: 'Nouveau type d\'événement'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  event_type?: string;

  @ApiPropertyOptional({ 
    example: 'Lyon',
    description: 'Nouvelle localisation de l\'événement'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  location?: string;

  @ApiPropertyOptional({ 
    example: '2025-12-16T10:00:00.000Z',
    description: 'Nouvelles dates de l\'événement'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  dates?: string;

  @ApiPropertyOptional({ 
    example: 'investisseurs',
    description: 'Nouveau public cible'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  target_audience?: string;
}

// DTO pour les filtres de recherche
export class EventFilterDto {
  @ApiPropertyOptional({ 
    example: 'conference',
    description: 'Filtrer par type d\'événement'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  event_type?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Filtrer les événements en vedette'
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  featured?: boolean;

  @ApiPropertyOptional({ 
    example: 'entrepreneurs',
    description: 'Filtrer par public cible'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  target_audience?: string;

  @ApiPropertyOptional({ 
    example: 'startup',
    description: 'Recherche textuelle dans le nom et la description'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ 
    example: 'Paris',
    description: 'Filtrer par localisation'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  location?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Filtrer les événements à venir'
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  upcoming?: boolean;
}