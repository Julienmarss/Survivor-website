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

export class CreateNewsDto {
  @ApiProperty({ 
    example: 'Levée de fonds de 2M€',
    description: 'Titre de la news',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(500, { message: 'Le titre ne peut pas dépasser 500 caractères' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiPropertyOptional({ 
    example: 'La startup X annonce une levée de fonds de 2 millions d\'euros...',
    description: 'Description détaillée de la news',
    maxLength: 5000
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'La description ne peut pas dépasser 5000 caractères' })
  @Transform(({ value }) => value?.trim() || '')
  description?: string;

  @ApiProperty({ 
    example: 'startup',
    description: 'Catégorie de la news (startup, financement, innovation, etc.)'
  })
  @IsString()
  @IsNotEmpty({ message: 'La catégorie est obligatoire' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  category: string;

  @ApiProperty({ 
    example: 'Paris',
    description: 'Localisation de la news'
  })
  @IsString()
  @IsNotEmpty({ message: 'La localisation est obligatoire' })
  @Transform(({ value }) => value?.trim())
  location: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/img.jpg',
    description: 'URL de l\'image associée à la news'
  })
  @IsOptional()
  @IsUrl({}, { message: 'L\'URL de l\'image doit être valide' })
  imageUrl?: string;

  @ApiPropertyOptional({ 
    example: '2025-09-10T10:00:00.000Z',
    description: 'Date de publication de la news (ISO 8601)'
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de publication doit être au format ISO 8601' })
  publishedAt?: string;

  @ApiPropertyOptional({ 
    example: '42',
    description: 'ID de la startup associée (chaîne de caractères qui sera convertie en nombre)'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  startupId?: string;

  @ApiPropertyOptional({ 
    example: false,
    description: 'Indique si la news est mise en vedette'
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

export class UpdateNewsDto extends PartialType(CreateNewsDto) {
  @ApiPropertyOptional({ 
    example: 'Levée de fonds de 2M€ - Mise à jour',
    description: 'Nouveau titre de la news',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Le titre ne peut pas dépasser 500 caractères' })
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiPropertyOptional({ 
    example: 'startup',
    description: 'Nouvelle catégorie de la news'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  category?: string;

  @ApiPropertyOptional({ 
    example: 'Lyon',
    description: 'Nouvelle localisation de la news'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  location?: string;
}

// DTO pour les filtres de recherche
export class NewsFilterDto {
  @ApiPropertyOptional({ 
    example: 'startup',
    description: 'Filtrer par catégorie'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  category?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Filtrer les news en vedette'
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
    example: 42,
    description: 'Filtrer par ID de startup'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'ID// <-- pour JwtService/JwtAuthGuard de startup doit être un nombre entier' })
  @Min(1, { message: 'L\'ID de startup doit être positif' })
  startupId?: number;

  @ApiPropertyOptional({ 
    example: 'financement',
    description: 'Recherche textuelle dans le titre et la description'
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
}