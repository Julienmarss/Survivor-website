import { Injectable, Logger } from '@nestjs/common';
import { FirebaseConfigService } from '../../../config/firebase.config';
import { IAnalytics, AnalyticsEvent } from '../interfaces/analytics.interface';

@Injectable()
export class AnalyticsRepository {
  private readonly logger = new Logger(AnalyticsRepository.name);
  private readonly analyticsCollection = 'analytics';

  constructor(private firebaseConfig: FirebaseConfigService) {}

  private get db() {
    return this.firebaseConfig.getFirestore();
  }

  async trackEvent(analyticsData: Omit<IAnalytics, 'id' | 'timestamp'>): Promise<void> {
    try {
      const data: Omit<IAnalytics, 'id'> = {
        ...analyticsData,
        timestamp: new Date()
      };

      await this.db.collection(this.analyticsCollection).add(data);
      this.logger.log(`Tracked event: ${data.event} for startup ${data.startupId}`);
    } catch (error) {
      this.logger.error('Error tracking event:', error);
    }
  }

  async getStartupViews(startupId: string, days: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const snapshot = await this.db.collection(this.analyticsCollection)
        .where('startupId', '==', startupId)
        .where('event', '==', AnalyticsEvent.STARTUP_VIEW)
        .where('timestamp', '>=', cutoffDate)
        .get();

      return snapshot.size;
    } catch (error) {
      this.logger.error(`Error getting views for startup ${startupId}:`, error);
      return 0;
    }
  }

  async getTotalViews(days: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const snapshot = await this.db.collection(this.analyticsCollection)
        .where('event', '==', AnalyticsEvent.STARTUP_VIEW)
        .where('timestamp', '>=', cutoffDate)
        .get();

      return snapshot.size;
    } catch (error) {
      this.logger.error('Error getting total views:', error);
      return 0;
    }
  }

  async getEngagementRate(days: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const [viewsSnapshot, contactsSnapshot] = await Promise.all([
        this.db.collection(this.analyticsCollection)
          .where('event', '==', AnalyticsEvent.STARTUP_VIEW)
          .where('timestamp', '>=', cutoffDate)
          .get(),
        this.db.collection(this.analyticsCollection)
          .where('event', '==', AnalyticsEvent.STARTUP_CONTACT)
          .where('timestamp', '>=', cutoffDate)
          .get()
      ]);

      const views = viewsSnapshot.size;
      const contacts = contactsSnapshot.size;

      return views > 0 ? Math.round((contacts / views) * 100 * 100) / 100 : 0;
    } catch (error) {
      this.logger.error('Error calculating engagement rate:', error);
      return 0;
    }
  }

  async getTopStartupsByViews(limit: number = 10, days: number = 30): Promise<Array<{
    startupId: string;
    views: number;
  }>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const snapshot = await this.db.collection(this.analyticsCollection)
        .where('event', '==', AnalyticsEvent.STARTUP_VIEW)
        .where('timestamp', '>=', cutoffDate)
        .get();

      const viewCounts: Record<string, number> = {};
      
      snapshot.forEach(doc => {
        const data = doc.data() as IAnalytics;
        viewCounts[data.startupId] = (viewCounts[data.startupId] || 0) + 1;
      });

      return Object.entries(viewCounts)
        .map(([startupId, views]) => ({ startupId, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting top startups by views:', error);
      return [];
    }
  }

  async getMonthlyStats(months: number = 6): Promise<Array<{
    month: string;
    views: number;
    interactions: number;
  }>> {
    try {
      const stats = [];
      const now = new Date();

      for (let i = 0; i < months; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const [viewsSnapshot, interactionsSnapshot] = await Promise.all([
          this.db.collection(this.analyticsCollection)
            .where('event', '==', AnalyticsEvent.STARTUP_VIEW)
            .where('timestamp', '>=', monthStart)
            .where('timestamp', '<=', monthEnd)
            .get(),
          this.db.collection(this.analyticsCollection)
            .where('event', 'in', [AnalyticsEvent.STARTUP_CONTACT, AnalyticsEvent.STARTUP_SHARE])
            .where('timestamp', '>=', monthStart)
            .where('timestamp', '<=', monthEnd)
            .get()
        ]);

        stats.push({
          month: monthStart.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
          views: viewsSnapshot.size,
          interactions: interactionsSnapshot.size
        });
      }

      return stats.reverse();
    } catch (error) {
      this.logger.error('Error getting monthly stats:', error);
      return [];
    }
  }

  async getInvestorInteractions(days: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const snapshot = await this.db.collection(this.analyticsCollection)
        .where('userRole', '==', 'investor')
        .where('event', 'in', [AnalyticsEvent.STARTUP_VIEW, AnalyticsEvent.STARTUP_CONTACT])
        .where('timestamp', '>=', cutoffDate)
        .get();

      return snapshot.size;
    } catch (error) {
      this.logger.error('Error getting investor interactions:', error);
      return 0;
    }
  }
}