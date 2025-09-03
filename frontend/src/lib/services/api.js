// frontend/src/lib/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Interceptor pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Gérer les différents types d'erreurs
    if (error.code === 'ECONNABORTED') {
      error.message = 'Timeout: Le serveur met trop de temps à répondre';
    } else if (error.code === 'ERR_NETWORK') {
      error.message = 'Erreur réseau: Vérifiez que le backend est démarré';
    } else if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 404:
          error.message = 'Ressource non trouvée';
          break;
        case 500:
          error.message = 'Erreur serveur interne';
          break;
        case 502:
          error.message = 'Erreur de connexion à l\'API JEB';
          break;
        default:
          error.message = error.response.data?.message || `Erreur ${status}`;
      }
    }
    
    return Promise.reject(error);
  }
);

export const startupsApi = {
  // Récupérer toutes les startups avec filtres
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/startups', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la récupération des startups');
    }
  },

  // Récupérer une startup par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/startups/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || `Erreur lors de la récupération de la startup ${id}`);
    }
  },

  // Récupérer les secteurs
  getSectors: async () => {
    try {
      const response = await api.get('/startups/sectors');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la récupération des secteurs');
    }
  },

  // Récupérer les statistiques
  getStats: async () => {
    try {
      const response = await api.get('/startups/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la récupération des statistiques');
    }
  },

  // Synchroniser avec l'API JEB
  syncWithJeb: async () => {
    try {
      const response = await api.post('/startups/sync');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la synchronisation avec JEB');
    }
  },
};

// Fonction utilitaire pour tester la connexion
export const testConnection = async () => {
  try {
    const response = await api.get('/');
    return {
      success: true,
      message: 'Connexion API réussie',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Impossible de se connecter à l\'API',
      error: error
    };
  }
};

export default api;