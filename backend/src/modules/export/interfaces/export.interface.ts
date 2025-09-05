export interface IExportOptions {
  format: ExportFormat;
  includeAnalytics: boolean;
  includeContacts: boolean;
  sectors?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'xlsx'
}

export interface IInvestorReport {
  metadata: {
    generatedAt: Date;
    generatedBy?: string;
    reportType: string;
    period: string;
  };
  summary: {
    totalStartups: number;
    totalFunding: number;
    averageTeamSize: number;
    successRate: number;
    topSectors: string[];
  };
  startups: IStartupExport[];
  analytics: {
    totalViews: number;
    engagementRate: number;
    conversionRate: number;
    monthlyTrends: Array<{
      month: string;
      startups: number;
      views: number;
    }>;
  };
}

export interface IStartupExport {
  id: string;
  name: string;
  sector: string;
  maturity: string;
  description: string;
  foundersCount: number;
  founders: string[];
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  analytics?: {
    views: number;
    contactClicks: number;
    engagementScore: number;
  };
  status: string;
  needs: string;
  createdAt: Date;
}
