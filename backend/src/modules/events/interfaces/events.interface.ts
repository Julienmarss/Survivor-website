// Interface générique pour les events
export interface IEvent {
  id: string;
  name: string;
  description?: string;
  event_type: string;
  location: string;
  dates: string;
  target_audience?: string;
  source: 'firebase' | 'jeb';
  featured?: boolean;
  imageUrl?: string;
}

// Format Firebase (étendu pour la synchronisation)
export interface IFirebaseEvent {
  id: string;
  name: string;
  description?: string;
  event_type: string;
  location: string;
  dates: string;
  target_audience?: string;
  featured?: boolean;
  imageUrl?: string;
  jebId?: number;
  syncedAt?: string; 
  source: 'local' | 'jeb-synced'; 
  created_at?: string;
  updated_at?: string;
}

// Format JEB API (interface principale utilisée dans l'application)
export interface IJebEvent {
  id?: number;
  name: string;
  description?: string;
  dates: string;
  event_type?: string;
  location?: string;
  target_audience?: string;
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
export type EventWithFirebaseId = IJebEvent & { firebaseId: string };

// Interface pour les statistiques
export interface IEventStats {
  total: number;
  eventTypes: Array<{ name: string; count: number }>;
  locations: Array<{ name: string; count: number }>;
  targetAudiences: Array<{ name: string; count: number }>;
  sources: Array<{ name: string; count: number }>;
  featured: number;
  upcoming: number;
  past: number;
  oldestDate?: string;
  newestDate?: string;
}

// Interface pour les filtres de recherche
export interface IEventFilters {
  event_type?: string;
  featured?: boolean;
  target_audience?: string;
  search?: string;
  location?: string;
  skip?: number;
  limit?: number;
  upcoming?: boolean;
}

// Interface pour la création d'events (données minimales requises)
export interface ICreateEventData {
  name: string;
  event_type: string;
  location: string;
  dates: string;
  description?: string;
  target_audience?: string;
  imageUrl?: string;
  featured?: boolean;
  source?: 'local' | 'jeb-synced';
}

// Interface pour la mise à jour d'events
export interface IUpdateEventData {
  name?: string;
  description?: string;
  event_type?: string;
  location?: string;
  dates?: string;
  target_audience?: string;
  imageUrl?: string;
  featured?: boolean;
}

// Interface pour les réponses d'API
export interface IEventResponse<T = IJebEvent> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Interface pour les réponses de liste
export interface IEventListResponse {
  success: boolean;
  data: IJebEvent[];
  total: number;
  skip: number;
  limit: number;
  message?: string;
}

// Interface pour la synchronisation
export interface ISyncStats {
  totalEvents: number;
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