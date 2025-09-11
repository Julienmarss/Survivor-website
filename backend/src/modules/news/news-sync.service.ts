import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NewsRepository } from './repositories/news.repository';
import { JebApiService } from '../jeb-api/jeb-api.service';
import { IJebNews } from './interfaces/news.interface';

@Injectable()
export class NewsSyncService implements OnModuleInit {
  private readonly logger = new Logger(NewsSyncService.name);

  constructor(
    private readonly newsRepo: NewsRepository,
    private readonly jebApiService: JebApiService,
  ) {}

  async onModuleInit() {
    await this.syncNewsFromJebApi();
  }

  /**
   * Synchronise les news de l'API JEB vers Firebase
   */
  async syncNewsFromJebApi(): Promise<void> {
    try {
      this.logger.log('Démarrage de la synchronisation des news...');
      
      const jebNews = await this.jebApiService.getAllNews(0, 1000);
      this.logger.log(`${jebNews.length} news récupérées de l'API JEB`);

      const existingNews = await this.newsRepo.findAll();
      const existingJebIds = new Set(
        existingNews
          .filter(news => news.jebId)
          .map(news => news.jebId)
      );

      this.logger.log(`${existingNews.length} news existantes dans Firebase`);

      const newNews = jebNews.filter(news => 
        news.id && !existingJebIds.has(news.id)
      );

      this.logger.log(`${newNews.length} nouvelles news à synchroniser`);

      let syncedCount = 0;
      for (const news of newNews) {
        try {
          const newsData = this.transformJebNewsToFirebase(news);
          await this.newsRepo.create(newsData);
          syncedCount++;
        } catch (error) {
          this.logger.warn(`Erreur lors de la synchronisation de la news ${news.id}:`, error.message);
        }
      }

      this.logger.log(`Synchronisation terminée: ${syncedCount}/${newNews.length} news synchronisées`);

    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation des news:', error.message);
    }
  }

  /**
   * Transforme une news JEB en format Firebase
   */
  private transformJebNewsToFirebase(jebNews: IJebNews): Partial<IJebNews> {
    return {
      title: jebNews.title,
      description: jebNews.description || '',
      category: jebNews.category || 'startup',
      location: jebNews.location || '',
      news_date: jebNews.news_date,
      startup_id: jebNews.startup_id,
      jebId: jebNews.id, 
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Synchronisation manuelle 
   */
  async manualSync(): Promise<{ 
    success: boolean; 
    message: string; 
    syncedCount?: number; 
  }> {
    try {
      const beforeCount = (await this.newsRepo.findAll()).length;
      await this.syncNewsFromJebApi();
      const afterCount = (await this.newsRepo.findAll()).length;
      const syncedCount = afterCount - beforeCount;

      return {
        success: true,
        message: `Synchronisation réussie: ${syncedCount} nouvelles news ajoutées`,
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
    totalNews: number;
    syncedFromJeb: number;
    localOnly: number;
    lastSyncDate?: string;
  }> {
    const allNews = await this.newsRepo.findAll();
    const syncedFromJeb = allNews.filter(news => news.jebId).length;
    const localOnly = allNews.length - syncedFromJeb;

    const newsWithSyncDate = allNews
      .filter(news => news.syncedAt)
      .sort((a, b) => new Date(b.syncedAt!).getTime() - new Date(a.syncedAt!).getTime());

    return {
      totalNews: allNews.length,
      syncedFromJeb,
      localOnly,
      lastSyncDate: newsWithSyncDate[0]?.syncedAt,
    };
  }
}