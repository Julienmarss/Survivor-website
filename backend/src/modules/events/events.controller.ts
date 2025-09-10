// backend/src/modules/events/events.controller.ts
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
import { EventsService } from './events.service';
import { EventsSyncService } from './events-sync.service';
import { IJebEvent } from './interfaces/events.interface';
import { CreateEventDto, UpdateEventDto } from './dto/events.dto';

@ApiTags('Events')
@Controller('events') // Ceci donne /api/events avec le prefix global
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly syncService: EventsSyncService,
  ) {}

  // ===== CRUD OPERATIONS =====

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les events' })
  @ApiQuery({ name: 'event_type', required: false, description: 'Filtrer par type d\'événement' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean, description: 'Filtrer les events en vedette' })
  @ApiQuery({ name: 'target_audience', required: false, description: 'Filtrer par public cible' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche textuelle' })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean, description: 'Filtrer les events à venir' })
  async getAllEvents(
    @Query('event_type') eventType?: string,
    @Query('featured') featured?: boolean,
    @Query('target_audience') targetAudience?: string,
    @Query('search') search?: string,
    @Query('upcoming') upcoming?: boolean,
  ): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    
    this.logger.log('GET /api/events called', { eventType, featured, targetAudience, search, upcoming });
    
    try {
      // Filtres spécifiques
      if (search) {
        return this.eventsService.searchEvents(search);
      }
      
      if (eventType) {
        return this.eventsService.getEventsByType(eventType);
      }
      
      if (featured === true) {
        return this.eventsService.getFeaturedEvents();
      }
      
      if (targetAudience) {
        return this.eventsService.getEventsByTargetAudience(targetAudience);
      }

      if (upcoming === true) {
        return this.eventsService.getUpcomingEvents();
      }

      // Tous les events
      const result = await this.eventsService.findAll();
      this.logger.log(`✅ GET /api/events success - ${result.length} events returned`);
      return result;
    } catch (error) {
      this.logger.error('❌ GET /api/events failed', error);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des events' })
  async getEventsStats() {
    this.logger.log('GET /api/events/stats called');
    return this.eventsService.getStats();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Récupérer les events à venir' })
  async getUpcomingEvents() {
    this.logger.log('GET /api/events/upcoming called');
    return this.eventsService.getUpcomingEvents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un event par ID' })
  @ApiParam({ name: 'id', description: 'ID Firebase de l\'event', example: 'abc123def456' })
  @ApiResponse({ status: 404, description: 'Event non trouvé' })
  async getEventById(@Param('id') id: string) {
    this.logger.log(`GET /api/events/${id} called`);
    
    // VALIDATION: Vérifier que l'ID n'est pas undefined/null/empty
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
      this.logger.error(`❌ GET /api/events/${id} - Invalid ID`);
      throw new BadRequestException('ID de l\'event invalide ou manquant');
    }

    try {
      const result = await this.eventsService.findById(id);
      this.logger.log(`✅ GET /api/events/${id} success`);
      return result;
    } catch (error) {
      this.logger.error(`❌ GET /api/events/${id} failed`, error);
      throw new NotFoundException(`Event avec l'ID ${id} non trouvé`);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel event' })
  @ApiResponse({ status: 201, description: 'Event créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createEvent(@Body() createEventDto: CreateEventDto) {
    this.logger.log('POST /api/events called', createEventDto);
    
    try {
      // VALIDATION: Vérifier les champs obligatoires
      if (!createEventDto.name || createEventDto.name.trim() === '') {
        throw new BadRequestException('Le nom est obligatoire');
      }
      if (!createEventDto.event_type || createEventDto.event_type.trim() === '') {
        throw new BadRequestException('Le type d\'événement est obligatoire');
      }
      if (!createEventDto.location || createEventDto.location.trim() === '') {
        throw new BadRequestException('La localisation est obligatoire');
      }
      if (!createEventDto.dates || createEventDto.dates.trim() === '') {
        throw new BadRequestException('Les dates sont obligatoires');
      }

      // Mapping entre DTO et Interface
      const eventData: Partial<IJebEvent> = {
        name: createEventDto.name.trim(),
        description: createEventDto.description?.trim() || '',
        event_type: createEventDto.event_type.trim(),
        location: createEventDto.location.trim(),
        dates: createEventDto.dates.trim(),
        target_audience: createEventDto.target_audience?.trim() || '',
        imageUrl: createEventDto.imageUrl?.trim(),
        featured: createEventDto.featured || false,
        source: 'local', // Marquer comme event local
      };

      this.logger.log('📝 Creating event with data:', eventData);
      const result = await this.eventsService.createEvent(eventData);
      this.logger.log(`✅ POST /api/events success - Created event with ID: ${result.firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error('❌ POST /api/events failed', error);
      throw new BadRequestException(`Erreur lors de la création: ${error.message}`);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un event' })
  @ApiParam({ name: 'id', description: 'ID Firebase de l\'event', example: 'abc123def456' })
  @ApiResponse({ status: 200, description: 'Event modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Event non trouvé' })
  async updateEvent(
    @Param('id') id: string, 
    @Body() updateEventDto: UpdateEventDto
  ) {
    this.logger.log(`PUT /api/events/${id} called`, updateEventDto);
    
    // VALIDATION: Vérifier que l'ID n'est pas undefined/null/empty
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
      this.logger.error(`❌ PUT /api/events/${id} - Invalid ID`);
      throw new BadRequestException('ID de l\'event invalide ou manquant');
    }

    try {
      // Mapping plus robuste et vérification des champs
      const eventData: Partial<IJebEvent> = {};
      
      if (updateEventDto.name !== undefined && updateEventDto.name.trim() !== '') {
        eventData.name = updateEventDto.name.trim();
      }
      if (updateEventDto.description !== undefined) {
        eventData.description = updateEventDto.description.trim();
      }
      if (updateEventDto.event_type !== undefined && updateEventDto.event_type.trim() !== '') {
        eventData.event_type = updateEventDto.event_type.trim();
      }
      if (updateEventDto.location !== undefined && updateEventDto.location.trim() !== '') {
        eventData.location = updateEventDto.location.trim();
      }
      if (updateEventDto.dates !== undefined && updateEventDto.dates.trim() !== '') {
        eventData.dates = updateEventDto.dates.trim();
      }
      if (updateEventDto.target_audience !== undefined) {
        eventData.target_audience = updateEventDto.target_audience?.trim();
      }
      if (updateEventDto.imageUrl !== undefined) {
        eventData.imageUrl = updateEventDto.imageUrl?.trim();
      }
      if (updateEventDto.featured !== undefined) {
        eventData.featured = updateEventDto.featured;
      }

      // Vérifier qu'il y a au moins une donnée à mettre à jour
      if (Object.keys(eventData).length === 0) {
        throw new BadRequestException('Aucune donnée à mettre à jour fournie');
      }

      this.logger.log(`📝 Updating event ${id} with data:`, eventData);
      const result = await this.eventsService.updateEvent(id, eventData);
      this.logger.log(`✅ PUT /api/events/${id} success`);
      return result;
    } catch (error) {
      this.logger.error(`❌ PUT /api/events/${id} failed`, error);
      if (error.status === 404) {
        throw new NotFoundException(`Event avec l'ID ${id} non trouvé`);
      }
      throw new BadRequestException(`Erreur lors de la modification: ${error.message}`);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un event' })
  @ApiParam({ name: 'id', description: 'ID Firebase de l\'event', example: 'abc123def456' })
  @ApiResponse({ status: 200, description: 'Event supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Event non trouvé' })
  async deleteEvent(@Param('id') id: string) {
    this.logger.log(`DELETE /api/events/${id} called`);
    
    // VALIDATION: Vérifier que l'ID n'est pas undefined/null/empty
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
      this.logger.error(`❌ DELETE /api/events/${id} - Invalid ID`);
      throw new BadRequestException('ID de l\'event invalide ou manquant');
    }

    try {
      const result = await this.eventsService.deleteEvent(id);
      this.logger.log(`✅ DELETE /api/events/${id} success`);
      return result;
    } catch (error) {
      this.logger.error(`❌ DELETE /api/events/${id} failed`, error);
      if (error.status === 404) {
        throw new NotFoundException(`Event avec l'ID ${id} non trouvé`);
      }
      throw new BadRequestException(`Erreur lors de la suppression: ${error.message}`);
    }
  }

  // ===== SYNCHRONISATION =====

  @Post('sync')
  @ApiOperation({ summary: 'Synchronisation manuelle avec l\'API JEB' })
  @ApiResponse({ status: 200, description: 'Synchronisation effectuée' })
  async syncWithJebApi() {
    this.logger.log('POST /api/events/sync called');
    return this.syncService.manualSync();
  }

  @Get('sync/stats')
  @ApiOperation({ summary: 'Statistiques de synchronisation' })
  async getSyncStats() {
    this.logger.log('GET /api/events/sync/stats called');
    return this.syncService.getSyncStats();
  }

  // ===== ENDPOINTS UTILITAIRES =====

  @Get('types/list')
  @ApiOperation({ summary: 'Liste des types d\'événements disponibles' })
  async getEventTypes() {
    this.logger.log('GET /api/events/types/list called');
    const stats = await this.eventsService.getStats();
    return stats.eventTypes;
  }

  @Get('locations/list')
  @ApiOperation({ summary: 'Liste des localisations disponibles' })
  async getLocations() {
    this.logger.log('GET /api/events/locations/list called');
    const stats = await this.eventsService.getStats();
    return stats.locations;
  }

  @Get('audiences/list')
  @ApiOperation({ summary: 'Liste des publics cibles disponibles' })
  async getTargetAudiences() {
    this.logger.log('GET /api/events/audiences/list called');
    const stats = await this.eventsService.getStats();
    return stats.targetAudiences;
  }
}