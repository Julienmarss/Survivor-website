// Interface générique pour les news
export interface INews {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  source: 'firebase' | 'jeb';
  publishedAt: string;
  startupId?: string;
  featured?: boolean;
  imageUrl?: string;
}

// Format Firebase
export interface IFirebaseNews {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  publishedAt: string;
  startupId?: string;
  featured?: boolean;
  imageUrl?: string;
  jebId?: number; 
  syncedAt?: string; 
  source: 'local' | 'jeb-synced'; 
  created_at?: string;
  updated_at?: string;
}

// Format JEB API 
export interface IJebNews {
  id?: number;
  title: string;
  description?: string;
  news_date: string;
  category?: string;
  location?: string;
  startup_id?: number;
  firebaseId?: string;
  
  jebId?: number;
  syncedAt?: string;
  source?: 'local' | 'jeb-synced';
  
  featured?: boolean;
  imageUrl?: string;
  
  created_at?: string;
  updated_at?: string;
}

// Type pour les réponses avec FirebaseId
export type NewsWithFirebaseId = IJebNews & { firebaseId: string };

// Interface pour les statistiques
export interface INewsStats {
  total: number;
  categories: Array<{ name: string; count: number }>;
  locations: Array<{ name: string; count: number }>;
  sources: Array<{ name: string; count: number }>;
  featured: number;
  recent: number;
  oldestDate?: string;
  newestDate?: string;
  startupsWithNews?: number;
}

// Interface pour les filtres de recherche
export interface INewsFilters {
  category?: string;
  featured?: boolean;
  startupId?: number;
  search?: string;
  location?: string;
  skip?: number;
  limit?: number;
}

// Interface pour la création de news 
export interface ICreateNewsData {
  title: string;
  category: string;
  location: string;
  description?: string;
  imageUrl?: string;
  news_date?: string;
  startup_id?: number;
  featured?: boolean;
  source?: 'local' | 'jeb-synced';
}

// Interface pour la mise à jour de news
export interface IUpdateNewsData {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  imageUrl?: string;
  news_date?: string;
  startup_id?: number;
  featured?: boolean;
}

// Interface pour les réponses d'API
export interface INewsResponse<T = IJebNews> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Interface pour les réponses de liste
export interface INewsListResponse {
  success: boolean;
  data: IJebNews[];
  total: number;
  skip: number;
  limit: number;
  message?: string;
}

// Interface pour la synchronisation
export interface ISyncStats {
  totalNews: number;
  syncedFromJeb: number;
  localOnly: number;
  lastSyncDate?: string;
}

export interface ISyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  errors?: string[];
}