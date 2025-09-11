import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventsRepository } from './repositories/events.repository';
import { IJebEvent } from './interfaces/events.interface';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventsRepo: EventsRepository,
  ) {}

  async findAll(): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      this.logger.log('Fetching all events');
      const result = await this.eventsRepo.findAll();
      this.logger.log(`Successfully fetched ${result.length} events`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch all events', error);
      throw error;
    }
  }

  async findById(firebaseId: string): Promise<IJebEvent & { firebaseId?: string }> {
    try {
      this.logger.log(`Fetching event with ID: ${firebaseId}`);
      
      if (!firebaseId) {
        throw new NotFoundException('Event ID is required');
      }

      const result = await this.eventsRepo.findById(firebaseId);
      this.logger.log(`Successfully fetched event ${firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch event ${firebaseId}`, error);
      throw error;
    }
  }

  async createEvent(event: Partial<IJebEvent>): Promise<IJebEvent & { firebaseId: string }> {
    try {
      this.logger.log('Creating event', { name: event.name, eventType: event.event_type });
      
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

      const eventData: Partial<IJebEvent> = {
        ...event,
        source: event.source || 'local',
        syncedAt: event.syncedAt || new Date().toISOString(),
        dates: event.dates || new Date().toISOString(),
        description: event.description || '',
        featured: event.featured || false,
      };

      const result = await this.eventsRepo.create(eventData);
      this.logger.log(`Successfully created event with ID: ${result.firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to create event', error);
      throw error;
    }
  }

  async updateEvent(firebaseId: string, event: Partial<IJebEvent>): Promise<IJebEvent & { firebaseId: string }> {
    try {
      this.logger.log(`Updating event ${firebaseId}`, { updates: Object.keys(event) });
      
      if (!firebaseId) {
        throw new NotFoundException('Event ID is required');
      }

      await this.findById(firebaseId);

      const result = await this.eventsRepo.update(firebaseId, event);
      this.logger.log(`Successfully updated event ${firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update event ${firebaseId}`, error);
      throw error;
    }
  }

  async deleteEvent(firebaseId: string): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Deleting event ${firebaseId}`);
      
      if (!firebaseId) {
        throw new NotFoundException('Event ID is required');
      }

      await this.findById(firebaseId);

      const result = await this.eventsRepo.delete(firebaseId);
      this.logger.log(`Successfully deleted event ${firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete event ${firebaseId}`, error);
      throw error;
    }
  }

  async getEventsByType(eventType: string): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      this.logger.log(`Fetching events by type: ${eventType}`);
      
      if (!eventType) {
        throw new Error('Event type is required');
      }

      const result = await this.eventsRepo.findByType(eventType);
      this.logger.log(`Found ${result.length} events of type ${eventType}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch events by type ${eventType}`, error);
      throw error;
    }
  }

  async getFeaturedEvents(): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      this.logger.log('Fetching featured events');
      const result = await this.eventsRepo.findFeatured();
      this.logger.log(`Found ${result.length} featured events`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch featured events', error);
      throw error;
    }
  }

  async getEventsByTargetAudience(targetAudience: string): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      this.logger.log(`Fetching events for target audience: ${targetAudience}`);
      
      if (!targetAudience) {
        throw new Error('Target audience is required');
      }

      const result = await this.eventsRepo.findByTargetAudience(targetAudience);
      this.logger.log(`Found ${result.length} events for target audience ${targetAudience}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch events for target audience ${targetAudience}`, error);
      throw error;
    }
  }

  async getUpcomingEvents(): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      this.logger.log('Fetching upcoming events');
      const result = await this.eventsRepo.findUpcoming();
      this.logger.log(`Found ${result.length} upcoming events`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch upcoming events', error);
      throw error;
    }
  }

  async searchEvents(query: string): Promise<Array<IJebEvent & { firebaseId?: string }>> {
    try {
      this.logger.log(`Searching events with query: "${query}"`);
      
      if (!query || query.trim().length === 0) {
        throw new Error('Search query is required');
      }

      const result = await this.eventsRepo.search(query.trim());
      this.logger.log(`Found ${result.length} events matching query "${query}"`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to search events with query "${query}"`, error);
      throw error;
    }
  }

  async getStats(): Promise<{
    total: number;
    eventTypes: Array<{ name: string; count: number }>;
    locations: Array<{ name: string; count: number }>;
    targetAudiences: Array<{ name: string; count: number }>;
    sources: Array<{ name: string; count: number }>;
    featured: number;
    upcoming: number;
    past: number;
  }> {
    try {
      this.logger.log('Fetching events statistics');
      const result = await this.eventsRepo.getStats();
      this.logger.log(`Successfully fetched statistics: ${result.total} total events`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch events statistics', error);
      throw error;
    }
  }

  private validateEventData(event: Partial<IJebEvent>): void {
    const errors: string[] = [];

    if (!event.name || event.name.trim().length === 0) {
      errors.push('Name is required and cannot be empty');
    }

    if (!event.event_type || event.event_type.trim().length === 0) {
      errors.push('Event type is required and cannot be empty');
    }

    if (!event.location || event.location.trim().length === 0) {
      errors.push('Location is required and cannot be empty');
    }

    if (!event.dates || event.dates.trim().length === 0) {
      errors.push('Dates are required and cannot be empty');
    }

    if (event.name && event.name.length > 500) {
      errors.push('Name must be less than 500 characters');
    }

    if (event.description && event.description.length > 5000) {
      errors.push('Description must be less than 5000 characters');
    }

    if (event.imageUrl && !this.isValidUrl(event.imageUrl)) {
      errors.push('Image URL must be a valid URL');
    }

    if (event.dates && !this.isValidDate(event.dates)) {
      errors.push('Dates must be in valid ISO 8601 format');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }
}