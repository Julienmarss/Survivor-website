export interface IStartup {
  id?: string;
  jeb_id: number;
  name: string;
  legal_status: string;
  address: string;
  email: string;
  phone: string;
  created_at: Date;
  description: string;
  website_url?: string;
  social_media_url?: string;
  project_status?: string;
  needs?: string;
  sector: string;
  maturity: string;
  founders?: IFounder[];
  db_created_at: Date;
  db_updated_at: Date;
}

export interface IFounder {
  id?: string;
  jeb_id: number;
  name: string;
  startup_id: string;
  jeb_startup_id: number;
}

export interface IPaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ISectorCount {
  name: string;
  count: number;
}

export interface IStats {
  totalProjects: number;
  totalFunding: number;
  successRate: number;
  jobsCreated: number;
}