// backend/src/modules/news/news.controller.ts - VERSION CORRIGÉE
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  NotFoundException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { NewsSyncService } from './news-sync.service';
import { IJebNews } from './interfaces/news.interface';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

@ApiTags('News')
@Controller('news') // Ceci donne /api/news avec le prefix global
export class NewsController {
  private readonly logger = new Logger(NewsController.name);

  constructor(
    private readonly newsService: NewsService,
    private readonly syncService: NewsSyncService,
  ) {}

  // ===== CRUD OPERATIONS =====

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les news' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean, description: 'Filtrer les news en vedette' })
  @ApiQuery({ name: 'startupId', required: false, type: Number, description: 'Filtrer par startup ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche textuelle' })
  async getAllNews(
    @Query('category') category?: string,
    @Query('featured') featured?: boolean,
    @Query('startupId') startupId?: number,
    @Query('search') search?: string,
  ): Promise<Array<IJebNews & { firebaseId?: string }>> {
    
    this.logger.log('GET /api/news called', { category, featured, startupId, search });
    
    try {
      // Filtres spécifiques
      if (search) {
        return this.newsService.searchNews(search);
      }
      
      if (category) {
        return this.newsService.getNewsByCategory(category);
      }
      
      if (featured === true) {
        return this.newsService.getFeaturedNews();
      }
      
      if (startupId) {
        return this.newsService.getNewsByStartup(startupId);
      }

      // Toutes les news
      const result = await this.newsService.findAll();
      this.logger.log(`✅ GET /api/news success - ${result.length} news returned`);
      return result;
    } catch (error) {
      this.logger.error('❌ GET /api/news failed', error);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des news' })
  async getNewsStats() {
    this.logger.log('GET /api/news/stats called');
    return this.newsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une news par ID' })
  @ApiParam({ name: 'id', description: 'ID Firebase de la news', example: 'abc123def456' })
  @ApiResponse({ status: 404, description: 'News non trouvée' })
  async getNewsById(@Param('id') id: string) {
    this.logger.log(`GET /api/news/${id} called`);
    
    // VALIDATION: Vérifier que l'ID n'est pas undefined/null/empty
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
      this.logger.error(`❌ GET /api/news/${id} - Invalid ID`);
      throw new BadRequestException('ID de la news invalide ou manquant');
    }

    try {
      const result = await this.newsService.findById(id);
      this.logger.log(`✅ GET /api/news/${id} success`);
      return result;
    } catch (error) {
      this.logger.error(`❌ GET /api/news/${id} failed`, error);
      throw new NotFoundException(`News avec l'ID ${id} non trouvée`);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle news' })
  @ApiResponse({ status: 201, description: 'News créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createNews(@Body() createNewsDto: CreateNewsDto) {
    this.logger.log('POST /api/news called', createNewsDto);
    
    try {
      // VALIDATION: Vérifier les champs obligatoires
      if (!createNewsDto.title || createNewsDto.title.trim() === '') {
        throw new BadRequestException('Le titre est obligatoire');
      }
      if (!createNewsDto.category || createNewsDto.category.trim() === '') {
        throw new BadRequestException('La catégorie est obligatoire');
      }
      if (!createNewsDto.location || createNewsDto.location.trim() === '') {
        throw new BadRequestException('La localisation est obligatoire');
      }

      // Mapping corrigé entre DTO et Interface
      const newsData: Partial<IJebNews> = {
        title: createNewsDto.title.trim(),
        description: createNewsDto.description?.trim() || '',
        category: createNewsDto.category.trim(),
        location: createNewsDto.location.trim(),
        imageUrl: createNewsDto.imageUrl?.trim(),
        news_date: createNewsDto.publishedAt || new Date().toISOString(),
        startup_id: createNewsDto.startupId ? parseInt(createNewsDto.startupId) : undefined,
        featured: createNewsDto.featured || false,
        source: 'local', // Marquer comme news locale
      };

      this.logger.log('📝 Creating news with data:', newsData);
      const result = await this.newsService.createNews(newsData);
      this.logger.log(`✅ POST /api/news success - Created news with ID: ${result.firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error('❌ POST /api/news failed', error);
      throw new BadRequestException(`Erreur lors de la création: ${error.message}`);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une news' })
  @ApiParam({ name: 'id', description: 'ID Firebase de la news', example: 'abc123def456' })
  @ApiResponse({ status: 200, description: 'News modifiée avec succès' })
  @ApiResponse({ status: 404, description: 'News non trouvée' })
  async updateNews(
    @Param('id') id: string, 
    @Body() updateNewsDto: UpdateNewsDto
  ) {
    this.logger.log(`PUT /api/news/${id} called`, updateNewsDto);
    
    // VALIDATION: Vérifier que l'ID n'est pas undefined/null/empty
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
      this.logger.error(`❌ PUT /api/news/${id} - Invalid ID`);
      throw new BadRequestException('ID de la news invalide ou manquant');
    }

    try {
      // Mapping plus robuste et vérification des champs
      const newsData: Partial<IJebNews> = {};
      
      if (updateNewsDto.title !== undefined && updateNewsDto.title.trim() !== '') {
        newsData.title = updateNewsDto.title.trim();
      }
      if (updateNewsDto.description !== undefined) {
        newsData.description = updateNewsDto.description.trim();
      }
      if (updateNewsDto.category !== undefined && updateNewsDto.category.trim() !== '') {
        newsData.category = updateNewsDto.category.trim();
      }
      if (updateNewsDto.location !== undefined && updateNewsDto.location.trim() !== '') {
        newsData.location = updateNewsDto.location.trim();
      }
      if (updateNewsDto.imageUrl !== undefined) {
        newsData.imageUrl = updateNewsDto.imageUrl?.trim();
      }
      if (updateNewsDto.publishedAt !== undefined) {
        newsData.news_date = updateNewsDto.publishedAt;
      }
      if (updateNewsDto.startupId !== undefined) {
        newsData.startup_id = updateNewsDto.startupId ? parseInt(updateNewsDto.startupId) : undefined;
      }
      if (updateNewsDto.featured !== undefined) {
        newsData.featured = updateNewsDto.featured;
      }

      // Vérifier qu'il y a au moins une donnée à mettre à jour
      if (Object.keys(newsData).length === 0) {
        throw new BadRequestException('Aucune donnée à mettre à jour fournie');
      }

      this.logger.log(`📝 Updating news ${id} with data:`, newsData);
      const result = await this.newsService.updateNews(id, newsData);
      this.logger.log(`✅ PUT /api/news/${id} success`);
      return result;
    } catch (error) {
      this.logger.error(`❌ PUT /api/news/${id} failed`, error);
      if (error.status === 404) {
        throw new NotFoundException(`News avec l'ID ${id} non trouvée`);
      }
      throw new BadRequestException(`Erreur lors de la modification: ${error.message}`);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une news' })
  @ApiParam({ name: 'id', description: 'ID Firebase de la news', example: 'abc123def456' })
  @ApiResponse({ status: 200, description: 'News supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'News non trouvée' })
  async deleteNews(@Param('id') id: string) {
    this.logger.log(`DELETE /api/news/${id} called`);
    
    // VALIDATION: Vérifier que l'ID n'est pas undefined/null/empty
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
      this.logger.error(`❌ DELETE /api/news/${id} - Invalid ID`);
      throw new BadRequestException('ID de la news invalide ou manquant');
    }

    try {
      const result = await this.newsService.deleteNews(id);
      this.logger.log(`✅ DELETE /api/news/${id} success`);
      return result;
    } catch (error) {
      this.logger.error(`❌ DELETE /api/news/${id} failed`, error);
      if (error.status === 404) {
        throw new NotFoundException(`News avec l'ID ${id} non trouvée`);
      }
      throw new BadRequestException(`Erreur lors de la suppression: ${error.message}`);
    }
  }

  // ===== SYNCHRONISATION =====

  @Post('sync')
  @ApiOperation({ summary: 'Synchronisation manuelle avec l\'API JEB' })
  @ApiResponse({ status: 200, description: 'Synchronisation effectuée' })
  async syncWithJebApi() {
    this.logger.log('POST /api/news/sync called');
    return this.syncService.manualSync();
  }

  @Get('sync/stats')
  @ApiOperation({ summary: 'Statistiques de synchronisation' })
  async getSyncStats() {
    this.logger.log('GET /api/news/sync/stats called');
    return this.syncService.getSyncStats();
  }

  // ===== ENDPOINTS UTILITAIRES =====

  @Get('categories/list')
  @ApiOperation({ summary: 'Liste des catégories disponibles' })
  async getCategories() {
    this.logger.log('GET /api/news/categories/list called');
    const stats = await this.newsService.getStats();
    return stats.categories;
  }

  @Get('locations/list')
  @ApiOperation({ summary: 'Liste des localisations disponibles' })
  async getLocations() {
    this.logger.log('GET /api/news/locations/list called');
    const stats = await this.newsService.getStats();
    return stats.locations;
  }
}