import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NewsRepository } from './repositories/news.repository';
import { IJebNews } from './interfaces/news.interface';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly newsRepo: NewsRepository,
  ) {}

  async findAll(): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      this.logger.log('Fetching all news');
      const result = await this.newsRepo.findAll();
      this.logger.log(`Successfully fetched ${result.length} news`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch all news', error);
      throw error;
    }
  }

  async findById(firebaseId: string): Promise<IJebNews & { firebaseId?: string }> {
    try {
      this.logger.log(`Fetching news with ID: ${firebaseId}`);
      
      if (!firebaseId) {
        throw new NotFoundException('News ID is required');
      }

      const result = await this.newsRepo.findById(firebaseId);
      this.logger.log(`Successfully fetched news ${firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch news ${firebaseId}`, error);
      throw error;
    }
  }

  async createNews(news: Partial<IJebNews>): Promise<IJebNews & { firebaseId: string }> {
    try {
      this.logger.log('Creating news', { title: news.title, category: news.category });
      
      if (!news.title) {
        throw new Error('Title is required');
      }
      if (!news.category) {
        throw new Error('Category is required');
      }
      if (!news.location) {
        throw new Error('Location is required');
      }

      const newsData: Partial<IJebNews> = {
        ...news,
        source: news.source || 'local',
        syncedAt: news.syncedAt || new Date().toISOString(),
        news_date: news.news_date || new Date().toISOString(),
        description: news.description || '',
        featured: news.featured || false,
      };

      const result = await this.newsRepo.create(newsData);
      this.logger.log(`Successfully created news with ID: ${result.firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to create news', error);
      throw error;
    }
  }

  async updateNews(firebaseId: string, news: Partial<IJebNews>): Promise<IJebNews & { firebaseId: string }> {
    try {
      this.logger.log(`Updating news ${firebaseId}`, { updates: Object.keys(news) });
      
      if (!firebaseId) {
        throw new NotFoundException('News ID is required');
      }

      await this.findById(firebaseId);

      const result = await this.newsRepo.update(firebaseId, news);
      this.logger.log(`Successfully updated news ${firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update news ${firebaseId}`, error);
      throw error;
    }
  }

  async deleteNews(firebaseId: string): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Deleting news ${firebaseId}`);
      
      if (!firebaseId) {
        throw new NotFoundException('News ID is required');
      }

      await this.findById(firebaseId);

      const result = await this.newsRepo.delete(firebaseId);
      this.logger.log(`Successfully deleted news ${firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete news ${firebaseId}`, error);
      throw error;
    }
  }

  async getNewsByCategory(category: string): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      this.logger.log(`Fetching news by category: ${category}`);
      
      if (!category) {
        throw new Error('Category is required');
      }

      const result = await this.newsRepo.findByCategory(category);
      this.logger.log(`Found ${result.length} news in category ${category}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch news by category ${category}`, error);
      throw error;
    }
  }

  async getFeaturedNews(): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      this.logger.log('Fetching featured news');
      const result = await this.newsRepo.findFeatured();
      this.logger.log(`Found ${result.length} featured news`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch featured news', error);
      throw error;
    }
  }

  async getNewsByStartup(startupId: number): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      this.logger.log(`Fetching news for startup: ${startupId}`);
      
      if (!startupId || isNaN(startupId)) {
        throw new Error('Valid startup ID is required');
      }

      const result = await this.newsRepo.findByStartupId(startupId);
      this.logger.log(`Found ${result.length} news for startup ${startupId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch news for startup ${startupId}`, error);
      throw error;
    }
  }

  async searchNews(query: string): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      this.logger.log(`Searching news with query: "${query}"`);
      
      if (!query || query.trim().length === 0) {
        throw new Error('Search query is required');
      }

      const result = await this.newsRepo.search(query.trim());
      this.logger.log(`Found ${result.length} news matching query "${query}"`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to search news with query "${query}"`, error);
      throw error;
    }
  }

  async getStats(): Promise<{
    total: number;
    categories: Array<{ name: string; count: number }>;
    locations: Array<{ name: string; count: number }>;
    sources: Array<{ name: string; count: number }>;
    featured: number;
    recent: number;
  }> {
    try {
      this.logger.log('Fetching news statistics');
      const result = await this.newsRepo.getStats();
      this.logger.log(`Successfully fetched statistics: ${result.total} total news`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch news statistics', error);
      throw error;
    }
  }

  private validateNewsData(news: Partial<IJebNews>): void {
    const errors: string[] = [];

    if (!news.title || news.title.trim().length === 0) {
      errors.push('Title is required and cannot be empty');
    }

    if (!news.category || news.category.trim().length === 0) {
      errors.push('Category is required and cannot be empty');
    }

    if (!news.location || news.location.trim().length === 0) {
      errors.push('Location is required and cannot be empty');
    }

    if (news.title && news.title.length > 500) {
      errors.push('Title must be less than 500 characters');
    }

    if (news.description && news.description.length > 5000) {
      errors.push('Description must be less than 5000 characters');
    }

    if (news.imageUrl && !this.isValidUrl(news.imageUrl)) {
      errors.push('Image URL must be a valid URL');
    }

    if (news.startup_id && (isNaN(news.startup_id) || news.startup_id < 0)) {
      errors.push('Startup ID must be a positive number');
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
}