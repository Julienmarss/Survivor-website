export interface IAnalytics {
  id?: string;
  startupId: string;
  event: AnalyticsEvent;
  userId?: string;
  userRole?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum AnalyticsEvent {
  STARTUP_VIEW = 'startup_view',
  STARTUP_CONTACT = 'startup_contact',
  STARTUP_SHARE = 'startup_share',
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
  EXPORT_GENERATED = 'export_generated'
}

export interface IDashboardKPI {
  totalStartups: number;
  totalViews: number;
  monthlyViews: number;
  topSectors: Array<{
    name: string;
    count: number;
    growth: number;
  }>;
  engagementRate: number;
  conversionRate: number;
  investorInteractions: number;
  trendingStartups: Array<{
    id: string;
    name: string;
    views: number;
    sector: string;
    growth: number;
  }>;
  monthlyStats: Array<{
    month: string;
    startups: number;
    views: number;
    interactions: number;
  }>;
}

export interface IStartupAnalytics {
  startupId: string;
  startupName: string;
  totalViews: number;
  uniqueVisitors: number;
  contactClicks: number;
  shareCount: number;
  conversionRate: number;
  lastViewDate: Date;
  viewsHistory: Array<{
    date: string;
    views: number;
  }>;
}
