// backend/src/modules/events/repositories/events.repository.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseConfigService } from '../../../config/firebase.config';
import { IJebEvent } from '../interfaces/events.interface';

@Injectable()
export class EventsRepository {
  private readonly logger = new Logger(EventsRepository.name);
  private firestore = this.firebaseConfig.getFirestore();
  private readonly collection = 'events';

  constructor(private readonly firebaseConfig: FirebaseConfigService) {}

  async findAll(): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .orderBy('dates', 'asc') // Order by event date ascending
        .get();
      
      return snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebEvent & { firebaseId: string }));
    } catch (error) {
      this.logger.error('Failed to fetch events from Firebase', error);
      return [];
    }
  }

  async findById(firebaseId: string): Promise<IJebEvent & { firebaseId?: string }> {
    try {
      const doc = await this.firestore.collection(this.collection).doc(firebaseId).get();
      
      if (!doc.exists) {
        throw new NotFoundException(`Event with ID ${firebaseId} not found`);
      }

      return {
        firebaseId: doc.id,
        ...doc.data()
      } as IJebEvent & { firebaseId: string };
    } catch (error) {
      this.logger.error(`Failed to fetch event ${firebaseId} from Firebase`, error);
      throw error;
    }
  }

  async create(event: Partial<IJebEvent>): Promise<IJebEvent & { firebaseId: string }> {
    try {
      // VALIDATION: Vérifier les champs obligatoires
      if (!event.name) {
        throw new Error('Name is required');
      }
      if (!event.event_type) {
        throw new Error('Event type is required');
      }
      if (!event.location) {
        throw new Error('Location is required');
      }
      if (!event.dates) {
        throw new Error('Dates are required');
      }

      const eventData = {
        ...event,
        dates: event.dates || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        syncedAt: event.syncedAt || new Date().toISOString(),
      };

      // CORRECTION: Supprimer les champs undefined pour Firebase
      const cleanedData = {};
      Object.keys(eventData).forEach(key => {
        if (eventData[key] !== undefined && eventData[key] !== null) {
          cleanedData[key] = eventData[key];
        }
      });

      this.logger.log('Creating event with data:', JSON.stringify(cleanedData, null, 2));

      const docRef = await this.firestore.collection(this.collection).add(cleanedData);
      
      // CORRECTION: Récupérer les données créées pour s'assurer de la cohérence
      const created = await docRef.get();
      
      if (!created.exists) {
        throw new Error('Failed to create event - document not found after creation');
      }

      const result = {
        firebaseId: docRef.id,
        ...created.data()
      } as IJebEvent & { firebaseId: string };

      this.logger.log(`Successfully created event with ID: ${docRef.id}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to create event in Firebase', error);
      throw error;
    }
  }

  async update(firebaseId: string, event: Partial<IJebEvent>): Promise<IJebEvent & { firebaseId: string }> {
    try {
      const docRef = this.firestore.collection(this.collection).doc(firebaseId);
      
      // Vérifier que le document existe avant la mise à jour
      const existingDoc = await docRef.get();
      if (!existingDoc.exists) {
        throw new NotFoundException(`Event with ID ${firebaseId} not found`);
      }

      const updateData = {
        ...event,
        updated_at: new Date().toISOString(),
      };

      // CORRECTION: Supprimer les champs undefined pour Firebase
      const cleanedUpdateData = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          cleanedUpdateData[key] = updateData[key];
        }
      });

      this.logger.log(`Updating event ${firebaseId} with data:`, JSON.stringify(cleanedUpdateData, null, 2));

      await docRef.update(cleanedUpdateData);
      
      // Récupérer les données mises à jour
      const updated = await docRef.get();
      if (!updated.exists) {
        throw new Error('Document was deleted during update');
      }

      const result = {
        firebaseId: docRef.id,
        ...updated.data()
      } as IJebEvent & { firebaseId: string };

      this.logger.log(`Successfully updated event ${firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update event ${firebaseId}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async delete(firebaseId: string): Promise<{ success: boolean }> {
    try {
      const docRef = this.firestore.collection(this.collection).doc(firebaseId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new NotFoundException(`Event with ID ${firebaseId} not found`);
      }

      await docRef.delete();
      this.logger.log(`Successfully deleted event ${firebaseId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete event ${firebaseId}`, error);
      throw error;
    }
  }

  // Méthodes de recherche étendues
  async findByType(eventType: string): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .where('event_type', '==', eventType)
        .orderBy('dates', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebEvent & { firebaseId: string }));
    } catch (error) {
      this.logger.error(`Failed to fetch events by type ${eventType}`, error);
      return [];
    }
  }

  async findFeatured(): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .where('featured', '==', true)
        .orderBy('dates', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebEvent & { firebaseId: string }));
    } catch (error) {
      this.logger.error('Failed to fetch featured events', error);
      return [];
    }
  }

  async findByTargetAudience(targetAudience: string): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .where('target_audience', '==', targetAudience)
        .orderBy('dates', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebEvent & { firebaseId: string }));
    } catch (error) {
      this.logger.error(`Failed to fetch events by target audience ${targetAudience}`, error);
      return [];
    }
  }

  async findUpcoming(): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      const now = new Date().toISOString();
      const snapshot = await this.firestore
        .collection(this.collection)
        .where('dates', '>=', now)
        .orderBy('dates', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebEvent & { firebaseId: string }));
    } catch (error) {
      this.logger.error('Failed to fetch upcoming events', error);
      return [];
    }
  }

  async search(query: string): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      // Firebase ne supporte pas la recherche full-text native,
      // donc on récupère tout et on filtre côté application
      const snapshot = await this.firestore
        .collection(this.collection)
        .orderBy('dates', 'asc')
        .get();
      
      const allEvents = snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebEvent & { firebaseId: string }));

      const searchQuery = query.toLowerCase().trim();
      
      return allEvents.filter(event => 
        event.name?.toLowerCase().includes(searchQuery) ||
        event.description?.toLowerCase().includes(searchQuery) ||
        event.event_type?.toLowerCase().includes(searchQuery) ||
        event.location?.toLowerCase().includes(searchQuery) ||
        event.target_audience?.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      this.logger.error(`Failed to search events with query "${query}"`, error);
      return [];
    }
  }

  async getStats(): Promise<{
    total: number;
    eventTypes: Array<{ name: string; count: number }>;
    locations: Array<{ name: string; count: number }>;
    targetAudiences: Array<{ name: string; count: number }>;
    sources: Array<{ name: string; count: number }>;
    featured: number;
    upcoming: number; // Events in the future
    past: number; // Events in the past
  }> {
    try {
      const snapshot = await this.firestore.collection(this.collection).get();
      const allEvents = snapshot.docs.map(doc => doc.data() as IJebEvent);

      // Compteurs
      const eventTypes: Record<string, number> = {};
      const locations: Record<string, number> = {};
      const targetAudiences: Record<string, number> = {};
      const sources: Record<string, number> = {};
      let featured = 0;
      let upcoming = 0;
      let past = 0;

      const now = new Date();

      allEvents.forEach(event => {
        // Event types
        const eventType = event.event_type || 'uncategorized';
        eventTypes[eventType] = (eventTypes[eventType] || 0) + 1;

        // Localisations
        if (event.location) {
          locations[event.location] = (locations[event.location] || 0) + 1;
        }

        // Target audiences
        if (event.target_audience) {
          targetAudiences[event.target_audience] = (targetAudiences[event.target_audience] || 0) + 1;
        }

        // Sources
        const source = event.source || 'unknown';
        sources[source] = (sources[source] || 0) + 1;

        // Featured
        if (event.featured) featured++;

        // Upcoming/Past
        const eventDate = new Date(event.dates);
        if (eventDate >= now) {
          upcoming++;
        } else {
          past++;
        }
      });

      return {
        total: allEvents.length,
        eventTypes: Object.entries(eventTypes)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        locations: Object.entries(locations)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        targetAudiences: Object.entries(targetAudiences)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        sources: Object.entries(sources)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        featured,
        upcoming,
        past,
      };
    } catch (error) {
      this.logger.error('Failed to get events statistics', error);
      return {
        total: 0,
        eventTypes: [],
        locations: [],
        targetAudiences: [],
        sources: [],
        featured: 0,
        upcoming: 0,
        past: 0,
      };
    }
  }
}