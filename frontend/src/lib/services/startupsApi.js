import { PUBLIC_APIURL } from '$env/static/public';

const BASE_FROM_ENV = (PUBLIC_APIURL ?? '').replace(/\/+$/, '');
const API_BASE_URL = (BASE_FROM_ENV ? `${BASE_FROM_ENV}/api` : '') || 'http://localhost:3000/api';

class StartupsApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const errJson = await response.json();
                    message = errJson?.message || message;
                } catch (_) {}
                throw new Error(message);
            }
            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    async getAllStartups(page = 1, limit = 20, sector = null, search = null) {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit)
        });
        if (sector && sector !== 'all') params.append('sector', sector);
        if (search) params.append('search', search);

        const response = await this.request(`/startups?${params.toString()}`);
        return response.data || response;
    }

    async getStartupById(id) {
        const response = await this.request(`/startups/${id}`);
        return response.data || response;
    }

    async getSectors() {
        const response = await this.request('/startups/sectors');
        return response.data || response;
    }

    async getStats() {
        const response = await this.request('/startups/stats');
        return response.data || response;
    }

    async syncWithJebApi() {
        const response = await this.request('/startups/sync', { method: 'POST' });
        return response.data || response;
    }
}

export const startupsApi = new StartupsApiService();
export default startupsApi;