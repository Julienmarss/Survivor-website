// Service pour communiquer avec l'API des startups
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class StartupsApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Récupérer toutes les startups avec pagination et filtres
    async getAllStartups(page = 1, limit = 20, sector = null, search = null) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (sector && sector !== 'all') {
            params.append('sector', sector);
        }

        if (search) {
            params.append('search', search);
        }

        const response = await this.request(`/startups?${params}`);
        return response.data || response;
    }

    // Récupérer une startup par ID
    async getStartupById(id) {
        const response = await this.request(`/startups/${id}`);
        return response.data || response;
    }

    // Récupérer les secteurs avec comptages
    async getSectors() {
        const response = await this.request('/startups/sectors');
        return response.data || response;
    }

    // Récupérer les statistiques
    async getStats() {
        const response = await this.request('/startups/stats');
        return response.data || response;
    }

    // Synchroniser avec l'API JEB
    async syncWithJebApi() {
        const response = await this.request('/startups/sync', {
            method: 'POST',
        });
        return response.data || response;
    }
}

export const startupsApi = new StartupsApiService();
export default startupsApi;