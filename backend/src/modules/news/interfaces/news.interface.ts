// backend/src/modules/news/interfaces/news.interface.ts

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

// Format Firebase (étendu pour la synchronisation)
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
  // Nouveaux champs pour la synchronisation
  jebId?: number; // ID de référence vers l'API JEB (pour éviter doublons)
  syncedAt?: string; // Timestamp de synchronisation
  source: 'local' | 'jeb-synced'; // Source de la news
  created_at?: string;
  updated_at?: string;
}

// Format JEB API (interface principale utilisée dans l'application)
export interface IJebNews {
  id?: number; // JEB API ID
  title: string;
  description?: string; // Rendu optionnel pour plus de flexibilité
  news_date: string; // Date au format ISO 8601
  category?: string; // Rendu optionnel pour éviter les erreurs
  location?: string; // Rendu optionnel pour éviter les erreurs
  startup_id?: number;
  firebaseId?: string; // Firestore doc ID
  
  // Champs pour la synchronisation Firebase
  jebId?: number;
  syncedAt?: string;
  source?: 'local' | 'jeb-synced';
  
  // Champs supplémentaires
  featured?: boolean;
  imageUrl?: string;
  
  // Timestamps
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
  recent: number; // Last 30 days
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

// Interface pour la création de news (données minimales requises)
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