// backend/src/modules/jeb-api/jeb-api.service.ts
import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IJebNews } from '../news/interfaces/news.interface';
import { IJebEvent } from '../events/interfaces/events.interface';

@Injectable()
export class JebApiService {
  private readonly logger = new Logger(JebApiService.name);
  private readonly baseUrl: string;
  private readonly groupToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('JEB_API_URL');
    this.groupToken = this.configService.get('JEB_GROUP_TOKEN');
  }

  private getHeaders() {
    return {
      'X-Group-Authorization': this.groupToken,
      'Content-Type': 'application/json',
    };
  }

  // ===== EXISTING STARTUP METHODS =====
  async getAllStartups(skip = 0, limit = 100) {
    try {
      this.logger.log(`Fetching startups from JEB API (skip: ${skip}, limit: ${limit})`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/startups`, {
          headers: this.getHeaders(),
          params: { skip, limit },
        }),
      );

      this.logger.log(`Successfully fetched ${response.data.length} startups from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch startups from JEB API', error.response?.data || error.message);
      throw new HttpException('Unable to fetch startups from JEB API', 502);
    }
  }

  async getStartupById(id: number) {
    try {
      this.logger.log(`Fetching startup ${id} from JEB API`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/startups/${id}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`Successfully fetched startup ${id} from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch startup ${id} from JEB API`, error.response?.data || error.message);
      throw new HttpException(`Unable to fetch startup ${id}`, 502);
    }
  }

  // ===== NEW NEWS METHODS =====

  /**
   * Get all news from JEB API
   */
  async getAllNews(skip = 0, limit = 100): Promise<IJebNews[]> {
    try {
      this.logger.log(`Fetching news from JEB API (skip: ${skip}, limit: ${limit})`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/news`, {
          headers: this.getHeaders(),
          params: { skip, limit },
        }),
      );

      this.logger.log(`Successfully fetched ${response.data.length} news from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch news from JEB API', error.response?.data || error.message);
      throw new HttpException('Unable to fetch news from JEB API', 502);
    }
  }

  /**
   * Get specific news by ID from JEB API
   */
  async getNewsById(newsId: number): Promise<IJebNews> {
    try {
      this.logger.log(`Fetching news ${newsId} from JEB API`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/news/${newsId}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`Successfully fetched news ${newsId} from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch news ${newsId} from JEB API`, error.response?.data || error.message);
      throw new HttpException(`Unable to fetch news ${newsId}`, 404);
    }
  }

  /**
   * Get news image URL from JEB API
   */
  async getNewsImage(newsId: number): Promise<string> {
    try {
      this.logger.log(`Fetching news image ${newsId} from JEB API`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/news/${newsId}/image`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`Successfully fetched news image ${newsId} from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch news image ${newsId} from JEB API`, error.response?.data || error.message);
      // Return empty string if image not found
      return '';
    }
  }

  /**
   * Get news with images (enriched data)
   */
  async getNewsWithImages(skip = 0, limit = 100): Promise<Array<IJebNews & { imageUrl?: string }>> {
    try {
      const news = await this.getAllNews(skip, limit);
      
      // Fetch images for each news item (with concurrent limit to avoid overwhelming API)
      const batchSize = 5;
      const newsWithImages: Array<IJebNews & { imageUrl?: string }> = [];
      
      for (let i = 0; i < news.length; i += batchSize) {
        const batch = news.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (newsItem) => {
            try {
              const imageUrl = await this.getNewsImage(newsItem.id);
              return { ...newsItem, imageUrl };
            } catch (error) {
              // If image fetch fails, return news without image
              return newsItem;
            }
          })
        );
        newsWithImages.push(...batchResults);
      }

      return newsWithImages;
    } catch (error) {
      this.logger.error('Failed to fetch news with images from JEB API', error);
      throw new HttpException('Unable to fetch news with images from JEB API', 502);
    }
  }

  /**
   * Search news by category
   */
  async getNewsByCategory(category: string, skip = 0, limit = 100): Promise<IJebNews[]> {
    try {
      const allNews = await this.getAllNews(0, limit * 3); // Get more to ensure we have enough after filtering
      
      // Filter by category (case-insensitive)
      const filteredNews = allNews.filter(news => 
        news.category && news.category.toLowerCase() === category.toLowerCase()
      );

      // Apply pagination to filtered results
      return filteredNews.slice(skip, skip + limit);
    } catch (error) {
      this.logger.error(`Failed to fetch news by category ${category} from JEB API`, error);
      throw new HttpException(`Unable to fetch news by category ${category}`, 502);
    }
  }

  /**
   * Get recent news (sorted by date)
   */
  async getRecentNews(limit = 10): Promise<IJebNews[]> {
    try {
      const news = await this.getAllNews(0, limit * 2); // Get more to ensure good sorting
      
      // Sort by news_date descending
      const sortedNews = news.sort((a, b) => {
        const dateA = new Date(a.news_date || '1970-01-01');
        const dateB = new Date(b.news_date || '1970-01-01');
        return dateB.getTime() - dateA.getTime();
      });

      return sortedNews.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to fetch recent news from JEB API', error);
      throw new HttpException('Unable to fetch recent news', 502);
    }
  }

  /**
   * Get news by startup ID
   */
  async getNewsByStartupId(startupId: number, limit = 10): Promise<IJebNews[]> {
    try {
      const allNews = await this.getAllNews(0, 200); // Get more to filter
      
      // Filter by startup_id
      const startupNews = allNews.filter(news => news.startup_id === startupId);
      
      // Sort by date descending and limit
      const sortedNews = startupNews.sort((a, b) => {
        const dateA = new Date(a.news_date || '1970-01-01');
        const dateB = new Date(b.news_date || '1970-01-01');
        return dateB.getTime() - dateA.getTime();
      });

      return sortedNews.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to fetch news for startup ${startupId} from JEB API`, error);
      throw new HttpException(`Unable to fetch news for startup ${startupId}`, 502);
    }
  }

  /**
   * Search news by text query
   */
  async searchNews(query: string, limit = 20): Promise<IJebNews[]> {
    try {
      const allNews = await this.getAllNews(0, 200);
      const searchQuery = query.toLowerCase().trim();
      
      // Filter by title, description, or category containing the query
      const filteredNews = allNews.filter(news => 
        news.title.toLowerCase().includes(searchQuery) ||
        news.description?.toLowerCase().includes(searchQuery) ||
        news.category?.toLowerCase().includes(searchQuery) ||
        news.location?.toLowerCase().includes(searchQuery)
      );

      // Sort by relevance (title match first, then description, then others)
      const sortedNews = filteredNews.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(searchQuery) ? 3 : 0;
        const aDesc = a.description?.toLowerCase().includes(searchQuery) ? 2 : 0;
        const aOther = (a.category?.toLowerCase().includes(searchQuery) || 
                       a.location?.toLowerCase().includes(searchQuery)) ? 1 : 0;
        
        const bTitle = b.title.toLowerCase().includes(searchQuery) ? 3 : 0;
        const bDesc = b.description?.toLowerCase().includes(searchQuery) ? 2 : 0;
        const bOther = (b.category?.toLowerCase().includes(searchQuery) || 
                       b.location?.toLowerCase().includes(searchQuery)) ? 1 : 0;
        
        const aScore = aTitle + aDesc + aOther;
        const bScore = bTitle + bDesc + bOther;
        
        if (aScore !== bScore) {
          return bScore - aScore; // Higher score first
        }
        
        // If same score, sort by date
        const dateA = new Date(a.news_date || '1970-01-01');
        const dateB = new Date(b.news_date || '1970-01-01');
        return dateB.getTime() - dateA.getTime();
      });

      return sortedNews.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to search news with query "${query}" from JEB API`, error);
      throw new HttpException('Unable to search news', 502);
    }
  }

  /**
   * Get news by location
   */
  async getNewsByLocation(location: string, limit = 20): Promise<IJebNews[]> {
    try {
      const allNews = await this.getAllNews(0, 200);
      
      // Filter by location (case-insensitive)
      const filteredNews = allNews.filter(news => 
        news.location && news.location.toLowerCase().includes(location.toLowerCase())
      );

      // Sort by date descending
      const sortedNews = filteredNews.sort((a, b) => {
        const dateA = new Date(a.news_date || '1970-01-01');
        const dateB = new Date(b.news_date || '1970-01-01');
        return dateB.getTime() - dateA.getTime();
      });

      return sortedNews.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to fetch news by location ${location} from JEB API`, error);
      throw new HttpException(`Unable to fetch news by location ${location}`, 502);
    }
  }

  /**
   * Get news statistics
   */
  async getNewsStats(): Promise<{
    total: number;
    categories: Array<{ name: string; count: number }>;
    locations: Array<{ name: string; count: number }>;
    recentCount: number;
    oldestDate: string;
    newestDate: string;
    startupsWithNews: number;
  }> {
    try {
      const allNews = await this.getAllNews(0, 1000);
      
      // Count by category
      const categories: Record<string, number> = {};
      const locations: Record<string, number> = {};
      const startupsWithNews = new Set<number>();
      let oldestDate = new Date();
      let newestDate = new Date('1970-01-01');
      
      allNews.forEach(news => {
        // Categories
        const category = news.category || 'uncategorized';
        categories[category] = (categories[category] || 0) + 1;
        
        // Locations
        if (news.location) {
          const location = news.location;
          locations[location] = (locations[location] || 0) + 1;
        }
        
        // Startups with news
        if (news.startup_id) {
          startupsWithNews.add(news.startup_id);
        }
        
        // Dates
        const newsDate = new Date(news.news_date || '1970-01-01');
        if (newsDate < oldestDate) oldestDate = newsDate;
        if (newsDate > newestDate) newestDate = newsDate;
      });

      // Recent count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCount = allNews.filter(news => 
        new Date(news.news_date || '1970-01-01') >= thirtyDaysAgo
      ).length;

      const categoryArray = Object.entries(categories)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const locationArray = Object.entries(locations)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return {
        total: allNews.length,
        categories: categoryArray,
        locations: locationArray.slice(0, 10), // Top 10 locations
        recentCount,
        oldestDate: oldestDate.toISOString().split('T')[0],
        newestDate: newestDate.toISOString().split('T')[0],
        startupsWithNews: startupsWithNews.size,
      };
    } catch (error) {
      this.logger.error('Failed to get news statistics from JEB API', error);
      throw new HttpException('Unable to get news statistics', 502);
    }
  }

  /**
   * Get available news categories
   */
  async getNewsCategories(): Promise<Array<{ name: string; count: number }>> {
    try {
      const stats = await this.getNewsStats();
      return stats.categories;
    } catch (error) {
      this.logger.error('Failed to get news categories from JEB API', error);
      throw new HttpException('Unable to get news categories', 502);
    }
  }

  /**
   * Get available news locations
   */
  async getNewsLocations(): Promise<Array<{ name: string; count: number }>> {
    try {
      const stats = await this.getNewsStats();
      return stats.locations;
    } catch (error) {
      this.logger.error('Failed to get news locations from JEB API', error);
      throw new HttpException('Unable to get news locations', 502);
    }
  }

  // ===== TESTING AND HEALTH CHECK =====
  
  async testConnection() {
    try {
      await Promise.all([
        this.getAllStartups(0, 1),
        this.getAllNews(0, 1)
      ]);
      return { success: true, message: 'JEB API connection successful (startups and news)' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async testNewsConnection() {
    try {
      const news = await this.getAllNews(0, 1);
      return { 
        success: true, 
        message: 'JEB API news connection successful',
        sampleData: news.length > 0 ? news[0] : null
      };
    } catch (error) {
      return { 
        success: false, 
        message: `JEB API news connection failed: ${error.message}` 
      };
    }
  }

  async testStartupsConnection() {
    try {
      const startups = await this.getAllStartups(0, 1);
      return { 
        success: true, 
        message: 'JEB API startups connection successful',
        sampleData: startups.length > 0 ? startups[0] : null
      };
    } catch (error) {
      return { 
        success: false, 
        message: `JEB API startups connection failed: ${error.message}` 
      };
    }
  }

    // CREATE a news
  async createNews(newsData: Partial<IJebNews>): Promise<IJebNews> {
    try {
      this.logger.log(`Creating a new news`);
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/news`, newsData, { headers: this.getHeaders() })
      );
      this.logger.log(`Successfully created news with ID ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create news', error.response?.data || error.message);
      throw new HttpException('Unable to create news', 502);
    }
  }
  
  // UPDATE a news
  async updateNews(newsId: number, newsData: Partial<IJebNews>): Promise<IJebNews> {
    try {
      this.logger.log(`Updating news ${newsId}`);
      const response = await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/news/${newsId}`, newsData, { headers: this.getHeaders() })
      );
      this.logger.log(`Successfully updated news ${newsId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update news ${newsId}`, error.response?.data || error.message);
      throw new HttpException(`Unable to update news ${newsId}`, 502);
    }
  }
  
  // DELETE a news
  async deleteNews(newsId: number): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Deleting news ${newsId}`);
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/news/${newsId}`, { headers: this.getHeaders() })
      );
      this.logger.log(`Successfully deleted news ${newsId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete news ${newsId}`, error.response?.data || error.message);
      throw new HttpException(`Unable to delete news ${newsId}`, 502);
    }
  }

  async getAllEvents(skip = 0, limit = 100): Promise<IJebEvent[]> {
    try {
      this.logger.log(`Fetching events from JEB API (skip: ${skip}, limit: ${limit})`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/events`, {
          headers: this.getHeaders(),
          params: { skip, limit },
        }),
      );

      this.logger.log(`Successfully fetched ${response.data.length} events from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch events from JEB API', error.response?.data || error.message);
      throw new HttpException('Unable to fetch events from JEB API', 502);
    }
  }

  /**
   * Get specific event by ID from JEB API
   */
  async getEventById(eventId: number): Promise<IJebEvent> {
    try {
      this.logger.log(`Fetching event ${eventId} from JEB API`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/events/${eventId}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`Successfully fetched event ${eventId} from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch event ${eventId} from JEB API`, error.response?.data || error.message);
      throw new HttpException(`Unable to fetch event ${eventId}`, 404);
    }
  }

  /**
   * Get event image URL from JEB API
   */
  async getEventImage(eventId: number): Promise<string> {
    try {
      this.logger.log(`Fetching event image ${eventId} from JEB API`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/events/${eventId}/image`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`Successfully fetched event image ${eventId} from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch event image ${eventId} from JEB API`, error.response?.data || error.message);
      // Return empty string if image not found
      return '';
    }
  }

  /**
   * Get events with images (enriched data)
   */
  async getEventsWithImages(skip = 0, limit = 100): Promise<Array<IJebEvent & { imageUrl?: string }>> {
    try {
      const events = await this.getAllEvents(skip, limit);

      // Fetch images for each event item (with concurrent limit to avoid overwhelming API)
      const batchSize = 5;
      const eventsWithImages: Array<IJebEvent & { imageUrl?: string }> = [];

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (eventItem) => {
            try {
              const imageUrl = await this.getEventImage(eventItem.id);
              return { ...eventItem, imageUrl };
            } catch (error) {
              // If image fetch fails, return event without image
              return eventItem;
            }
          })
        );
        eventsWithImages.push(...batchResults);
      }

      return eventsWithImages;
    } catch (error) {
      this.logger.error('Failed to fetch events with images from JEB API', error);
      throw new HttpException('Unable to fetch events with images from JEB API', 502);
    }
  }

  /**
   * Search events by type
   */
  async getEventsByType(eventType: string, skip = 0, limit = 100): Promise<IJebEvent[]> {
    try {
      const allEvents = await this.getAllEvents(0, limit * 3); // Get more to ensure we have enough after filtering

      // Filter by event_type (case-insensitive)
      const filteredEvents = allEvents.filter(event => 
        event.event_type && event.event_type.toLowerCase() === eventType.toLowerCase()
      );

      // Apply pagination to filtered results
      return filteredEvents.slice(skip, skip + limit);
    } catch (error) {
      this.logger.error(`Failed to fetch events by type ${eventType} from JEB API`, error);
      throw new HttpException(`Unable to fetch events by type ${eventType}`, 502);
    }
  }

  /**
   * Get upcoming events (sorted by date)
   */
  async getUpcomingEvents(limit = 10): Promise<IJebEvent[]> {
    try {
      const events = await this.getAllEvents(0, limit * 2); // Get more to ensure good filtering
      const now = new Date();

      // Filter upcoming events and sort by date
      const upcomingEvents = events
        .filter(event => {
          const eventDate = new Date(event.dates);
          return eventDate >= now;
        })
        .sort((a, b) => {
          const dateA = new Date(a.dates);
          const dateB = new Date(b.dates);
          return dateA.getTime() - dateB.getTime();
        });

      return upcomingEvents.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to fetch upcoming events from JEB API', error);
      throw new HttpException('Unable to fetch upcoming events', 502);
    }
  }

  /**
   * Get events by target audience
   */
  async getEventsByTargetAudience(targetAudience: string, limit = 20): Promise<IJebEvent[]> {
    try {
      const allEvents = await this.getAllEvents(0, 200);

      // Filter by target_audience (case-insensitive)
      const filteredEvents = allEvents.filter(event => 
        event.target_audience && event.target_audience.toLowerCase().includes(targetAudience.toLowerCase())
      );

      // Sort by date ascending (upcoming first)
      const sortedEvents = filteredEvents.sort((a, b) => {
        const dateA = new Date(a.dates);
        const dateB = new Date(b.dates);
        return dateA.getTime() - dateB.getTime();
      });

      return sortedEvents.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to fetch events by target audience ${targetAudience} from JEB API`, error);
      throw new HttpException(`Unable to fetch events by target audience ${targetAudience}`, 502);
    }
  }

  /**
   * Search events by text query
   */
  async searchEvents(query: string, limit = 20): Promise<IJebEvent[]> {
    try {
      const allEvents = await this.getAllEvents(0, 200);
      const searchQuery = query.toLowerCase().trim();

      // Filter by name, description, event_type, or location containing the query
      const filteredEvents = allEvents.filter(event => 
        event.name.toLowerCase().includes(searchQuery) ||
        event.description?.toLowerCase().includes(searchQuery) ||
        event.event_type?.toLowerCase().includes(searchQuery) ||
        event.location?.toLowerCase().includes(searchQuery) ||
        event.target_audience?.toLowerCase().includes(searchQuery)
      );

      // Sort by relevance (name match first, then description, then others)
      const sortedEvents = filteredEvents.sort((a, b) => {
        const aName = a.name.toLowerCase().includes(searchQuery) ? 4 : 0;
        const aDesc = a.description?.toLowerCase().includes(searchQuery) ? 3 : 0;
        const aType = a.event_type?.toLowerCase().includes(searchQuery) ? 2 : 0;
        const aOther = (a.location?.toLowerCase().includes(searchQuery) || 
                       a.target_audience?.toLowerCase().includes(searchQuery)) ? 1 : 0;

        const bName = b.name.toLowerCase().includes(searchQuery) ? 4 : 0;
        const bDesc = b.description?.toLowerCase().includes(searchQuery) ? 3 : 0;
        const bType = b.event_type?.toLowerCase().includes(searchQuery) ? 2 : 0;
        const bOther = (b.location?.toLowerCase().includes(searchQuery) || 
                       b.target_audience?.toLowerCase().includes(searchQuery)) ? 1 : 0;

        const aScore = aName + aDesc + aType + aOther;
        const bScore = bName + bDesc + bType + bOther;

        if (aScore !== bScore) {
          return bScore - aScore; // Higher score first
        }

        // If same score, sort by date
        const dateA = new Date(a.dates);
        const dateB = new Date(b.dates);
        return dateA.getTime() - dateB.getTime();
      });

      return sortedEvents.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to search events with query "${query}" from JEB API`, error);
      throw new HttpException('Unable to search events', 502);
    }
  }

  /**
   * Get events by location
   */
  async getEventsByLocation(location: string, limit = 20): Promise<IJebEvent[]> {
    try {
      const allEvents = await this.getAllEvents(0, 200);

      // Filter by location (case-insensitive)
      const filteredEvents = allEvents.filter(event => 
        event.location && event.location.toLowerCase().includes(location.toLowerCase())
      );

      // Sort by date ascending (upcoming first)
      const sortedEvents = filteredEvents.sort((a, b) => {
        const dateA = new Date(a.dates);
        const dateB = new Date(b.dates);
        return dateA.getTime() - dateB.getTime();
      });

      return sortedEvents.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to fetch events by location ${location} from JEB API`, error);
      throw new HttpException(`Unable to fetch events by location ${location}`, 502);
    }
  }

  /**
   * Get events statistics
   */
  async getEventsStats(): Promise<{
    total: number;
    eventTypes: Array<{ name: string; count: number }>;
    locations: Array<{ name: string; count: number }>;
    targetAudiences: Array<{ name: string; count: number }>;
    upcoming: number;
    past: number;
    oldestDate: string;
    newestDate: string;
  }> {
    try {
      const allEvents = await this.getAllEvents(0, 1000);

      // Count by category
      const eventTypes: Record<string, number> = {};
      const locations: Record<string, number> = {};
      const targetAudiences: Record<string, number> = {};
      let upcoming = 0;
      let past = 0;
      let oldestDate = new Date();
      let newestDate = new Date('1970-01-01');
      const now = new Date();

      allEvents.forEach(event => {
        // Event types
        const eventType = event.event_type || 'uncategorized';
        eventTypes[eventType] = (eventTypes[eventType] || 0) + 1;

        // Locations
        if (event.location) {
          const location = event.location;
          locations[location] = (locations[location] || 0) + 1;
        }

        // Target audiences
        if (event.target_audience) {
          const audience = event.target_audience;
          targetAudiences[audience] = (targetAudiences[audience] || 0) + 1;
        }

        // Dates and upcoming/past
        const eventDate = new Date(event.dates);
        if (eventDate < oldestDate) oldestDate = eventDate;
        if (eventDate > newestDate) newestDate = eventDate;

        if (eventDate >= now) {
          upcoming++;
        } else {
          past++;
        }
      });

      const eventTypeArray = Object.entries(eventTypes)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const locationArray = Object.entries(locations)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const targetAudienceArray = Object.entries(targetAudiences)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return {
        total: allEvents.length,
        eventTypes: eventTypeArray,
        locations: locationArray.slice(0, 10), // Top 10 locations
        targetAudiences: targetAudienceArray.slice(0, 10), // Top 10 audiences
        upcoming,
        past,
        oldestDate: oldestDate.toISOString().split('T')[0],
        newestDate: newestDate.toISOString().split('T')[0],
      };
    } catch (error) {
      this.logger.error('Failed to get events statistics from JEB API', error);
      throw new HttpException('Unable to get events statistics', 502);
    }
  }

  /**
   * Get available event types
   */
  async getEventTypes(): Promise<Array<{ name: string; count: number }>> {
    try {
      const stats = await this.getEventsStats();
      return stats.eventTypes;
    } catch (error) {
      this.logger.error('Failed to get event types from JEB API', error);
      throw new HttpException('Unable to get event types', 502);
    }
  }

  /**
   * Get available target audiences
   */
  async getTargetAudiences(): Promise<Array<{ name: string; count: number }>> {
    try {
      const stats = await this.getEventsStats();
      return stats.targetAudiences;
    } catch (error) {
      this.logger.error('Failed to get target audiences from JEB API', error);
      throw new HttpException('Unable to get target audiences', 502);
    }
  }

  // Test events connection
  async testEventsConnection() {
    try {
      const events = await this.getAllEvents(0, 1);
      return { 
        success: true, 
        message: 'JEB API events connection successful',
        sampleData: events.length > 0 ? events[0] : null
      };
    } catch (error) {
      return { 
        success: false, 
        message: `JEB API events connection failed: ${error.message}` 
      };
    }
  }

  // CREATE an event
  async createEvent(eventData: Partial<IJebEvent>): Promise<IJebEvent> {
    try {
      this.logger.log(`Creating a new event`);
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/events`, eventData, { headers: this.getHeaders() })
      );
      this.logger.log(`Successfully created event with ID ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create event', error.response?.data || error.message);
      throw new HttpException('Unable to create event', 502);
    }
  }

  // UPDATE an event
  async updateEvent(eventId: number, eventData: Partial<IJebEvent>): Promise<IJebEvent> {
    try {
      this.logger.log(`Updating event ${eventId}`);
      const response = await firstValueFrom(
        this.httpService.put(`${this.baseUrl}/events/${eventId}`, eventData, { headers: this.getHeaders() })
      );
      this.logger.log(`Successfully updated event ${eventId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update event ${eventId}`, error.response?.data || error.message);
      throw new HttpException(`Unable to update event ${eventId}`, 502);
    }
  }

  // DELETE an event
  async deleteEvent(eventId: number): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Deleting event ${eventId}`);
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/events/${eventId}`, { headers: this.getHeaders() })
      );
      this.logger.log(`Successfully deleted event ${eventId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete event ${eventId}`, error.response?.data || error.message);
      throw new HttpException(`Unable to delete event ${eventId}`, 502);
    }
  }
}