// backend/src/modules/events/events-sync.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventsRepository } from './repositories/events.repository';
import { JebApiService } from '../jeb-api/jeb-api.service';
import { IJebEvent } from './interfaces/events.interface';

@Injectable()
export class EventsSyncService implements OnModuleInit {
  private readonly logger = new Logger(EventsSyncService.name);

  constructor(
    private readonly eventsRepo: EventsRepository,
    private readonly jebApiService: JebApiService,
  ) {}

  async onModuleInit() {
    // Synchronisation au démarrage de l'application
    await this.syncEventsFromJebApi();
  }

  /**
   * Synchronise les events de l'API JEB vers Firebase
   * Évite les doublons en utilisant l'ID JEB comme référence
   */
  async syncEventsFromJebApi(): Promise<void> {
    try {
      this.logger.log('Démarrage de la synchronisation des events...');
      
      // Récupérer tous les events de l'API JEB
      const jebEvents = await this.jebApiService.getAllEvents(0, 1000);
      this.logger.log(`${jebEvents.length} events récupérés de l'API JEB`);

      // Récupérer les events existants dans Firebase
      const existingEvents = await this.eventsRepo.findAll();
      const existingJebIds = new Set(
        existingEvents
          .filter(event => event.jebId)
          .map(event => event.jebId)
      );

      this.logger.log(`${existingEvents.length} events existants dans Firebase`);

      // Filtrer les nouveaux events (pas encore en base)
      const newEvents = jebEvents.filter(event => 
        event.id && !existingJebIds.has(event.id)
      );

      this.logger.log(`${newEvents.length} nouveaux events à synchroniser`);

      // Insérer les nouveaux events en batch
      let syncedCount = 0;
      for (const event of newEvents) {
        try {
          const eventData = this.transformJebEventToFirebase(event);
          await this.eventsRepo.create(eventData);
          syncedCount++;
        } catch (error) {
          this.logger.warn(`Erreur lors de la synchronisation de l'event ${event.id}:`, error.message);
        }
      }

      this.logger.log(`Synchronisation terminée: ${syncedCount}/${newEvents.length} events synchronisés`);

    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des events:', error.message);
    }
  }

  /**
   * Transforme un event JEB en format Firebase
   */
  private transformJebEventToFirebase(jebEvent: IJebEvent): Partial<IJebEvent> {
    return {
      name: jebEvent.name,
      description: jebEvent.description || '',
      event_type: jebEvent.event_type || 'conference',
      location: jebEvent.location || '',
      dates: jebEvent.dates,
      target_audience: jebEvent.target_audience || '',
      jebId: jebEvent.id, // Référence vers l'ID JEB pour éviter les doublons
      syncedAt: new Date().toISOString(), // Timestamp de synchronisation
      source: 'jeb-synced', // Source de l'event
    };
  }

  /**
   * Synchronisation manuelle (utile pour un endpoint d'admin)
   */
  async manualSync(): Promise<{ 
    success: boolean; 
    message: string; 
    syncedCount?: number; 
  }> {
    try {
      const beforeCount = (await this.eventsRepo.findAll()).length;
      await this.syncEventsFromJebApi();
      const afterCount = (await this.eventsRepo.findAll()).length;
      const syncedCount = afterCount - beforeCount;

      return {
        success: true,
        message: `Synchronisation réussie: ${syncedCount} nouveaux events ajoutés`,
        syncedCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur de synchronisation: ${error.message}`,
      };
    }
  }

  /**
   * Statistiques de synchronisation
   */
  async getSyncStats(): Promise<{
    totalEvents: number;
    syncedFromJeb: number;
    localOnly: number;
    lastSyncDate?: string;
  }> {
    const allEvents = await this.eventsRepo.findAll();
    const syncedFromJeb = allEvents.filter(event => event.jebId).length;
    const localOnly = allEvents.length - syncedFromJeb;

    // Trouver la dernière date de sync
    const eventsWithSyncDate = allEvents
      .filter(event => event.syncedAt)
      .sort((a, b) => new Date(b.syncedAt!).getTime() - new Date(a.syncedAt!).getTime());

    return {
      totalEvents: allEvents.length,
      syncedFromJeb,
      localOnly,
      lastSyncDate: eventsWithSyncDate[0]?.syncedAt,
    };
  }
}