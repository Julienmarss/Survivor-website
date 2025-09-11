import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseConfigService } from '../../../config/firebase.config';
import { IJebNews } from '../interfaces/news.interface';

@Injectable()
export class NewsRepository {
  private readonly logger = new Logger(NewsRepository.name);
  private firestore = this.firebaseConfig.getFirestore();
  private readonly collection = 'news';

  constructor(private readonly firebaseConfig: FirebaseConfigService) {}

  async findAll(): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .orderBy('news_date', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebNews & { firebaseId: string }));
    } catch (error) {
      this.logger.error('Failed to fetch news from Firebase', error);
      return [];
    }
  }

  async findById(firebaseId: string): Promise<IJebNews & { firebaseId?: string }> {
    try {
      const doc = await this.firestore.collection(this.collection).doc(firebaseId).get();
      
      if (!doc.exists) {
        throw new NotFoundException(`News with ID ${firebaseId} not found`);
      }

      return {
        firebaseId: doc.id,
        ...doc.data()
      } as IJebNews & { firebaseId: string };
    } catch (error) {
      this.logger.error(`Failed to fetch news ${firebaseId} from Firebase`, error);
      throw error;
    }
  }

  async create(news: Partial<IJebNews>): Promise<IJebNews & { firebaseId: string }> {
    try {
      if (!news.title) {
        throw new Error('Title is required');
      }
      if (!news.category) {
        throw new Error('Category is required');
      }
      if (!news.location) {
        throw new Error('Location is required');
      }

      const newsData = {
        ...news,
        news_date: news.news_date || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        syncedAt: news.syncedAt || new Date().toISOString(),
      };

      const cleanedData = {};
      Object.keys(newsData).forEach(key => {
        if (newsData[key] !== undefined && newsData[key] !== null) {
          cleanedData[key] = newsData[key];
        }
      });

      this.logger.log('Creating news with data:', JSON.stringify(cleanedData, null, 2));

      const docRef = await this.firestore.collection(this.collection).add(cleanedData);
      
      const created = await docRef.get();
      
      if (!created.exists) {
        throw new Error('Failed to create news - document not found after creation');
      }

      const result = {
        firebaseId: docRef.id,
        ...created.data()
      } as IJebNews & { firebaseId: string };

      this.logger.log(`Successfully created news with ID: ${docRef.id}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to create news in Firebase', error);
      throw error;
    }
  }

  async update(firebaseId: string, news: Partial<IJebNews>): Promise<IJebNews & { firebaseId: string }> {
    try {
      const docRef = this.firestore.collection(this.collection).doc(firebaseId);
      
      const existingDoc = await docRef.get();
      if (!existingDoc.exists) {
        throw new NotFoundException(`News with ID ${firebaseId} not found`);
      }

      const updateData = {
        ...news,
        updated_at: new Date().toISOString(),
      };

      const cleanedUpdateData = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          cleanedUpdateData[key] = updateData[key];
        }
      });

      this.logger.log(`Updating news ${firebaseId} with data:`, JSON.stringify(cleanedUpdateData, null, 2));

      await docRef.update(cleanedUpdateData);
      
      const updated = await docRef.get();
      if (!updated.exists) {
        throw new Error('Document was deleted during update');
      }

      const result = {
        firebaseId: docRef.id,
        ...updated.data()
      } as IJebNews & { firebaseId: string };

      this.logger.log(`Successfully updated news ${firebaseId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update news ${firebaseId}`, error);
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
        throw new NotFoundException(`News with ID ${firebaseId} not found`);
      }

      await docRef.delete();
      this.logger.log(`Successfully deleted news ${firebaseId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete news ${firebaseId}`, error);
      throw error;
    }
  }

  async findByCategory(category: string): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .where('category', '==', category)
        .orderBy('news_date', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebNews & { firebaseId: string }));
    } catch (error) {
      this.logger.error(`Failed to fetch news by category ${category}`, error);
      return [];
    }
  }

  async findFeatured(): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .where('featured', '==', true)
        .orderBy('news_date', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebNews & { firebaseId: string }));
    } catch (error) {
      this.logger.error('Failed to fetch featured news', error);
      return [];
    }
  }

  async findByStartupId(startupId: number): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .where('startup_id', '==', startupId)
        .orderBy('news_date', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebNews & { firebaseId: string }));
    } catch (error) {
      this.logger.error(`Failed to fetch news by startup ${startupId}`, error);
      return [];
    }
  }

  async search(query: string): Promise<Array<IJebNews & { firebaseId?: string }>> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .orderBy('news_date', 'desc')
        .get();
      
      const allNews = snapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      } as IJebNews & { firebaseId: string }));

      const searchQuery = query.toLowerCase().trim();
      
      return allNews.filter(news => 
        news.title?.toLowerCase().includes(searchQuery) ||
        news.description?.toLowerCase().includes(searchQuery) ||
        news.category?.toLowerCase().includes(searchQuery) ||
        news.location?.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      this.logger.error(`Failed to search news with query "${query}"`, error);
      return [];
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
      const snapshot = await this.firestore.collection(this.collection).get();
      const allNews = snapshot.docs.map(doc => doc.data() as IJebNews);

      // Compteurs
      const categories: Record<string, number> = {};
      const locations: Record<string, number> = {};
      const sources: Record<string, number> = {};
      let featured = 0;
      let recent = 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      allNews.forEach(news => {
        // Catégories
        const category = news.category || 'uncategorized';
        categories[category] = (categories[category] || 0) + 1;

        // Localisations
        if (news.location) {
          locations[news.location] = (locations[news.location] || 0) + 1;
        }

        // Sources
        const source = news.source || 'unknown';
        sources[source] = (sources[source] || 0) + 1;

        // Featured
        if (news.featured) featured++;

        // Recent
        const newsDate = new Date(news.news_date || '1970-01-01');
        if (newsDate >= thirtyDaysAgo) recent++;
      });

      return {
        total: allNews.length,
        categories: Object.entries(categories)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        locations: Object.entries(locations)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        sources: Object.entries(sources)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        featured,
        recent,
      };
    } catch (error) {
      this.logger.error('Failed to get news statistics', error);
      return {
        total: 0,
        categories: [],
        locations: [],
        sources: [],
        featured: 0,
        recent: 0,
      };
    }
  }
}