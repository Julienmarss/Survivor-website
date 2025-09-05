import { writable, derived } from 'svelte/store';
import { startupsApi } from '../services/startupsApi.js';

// States principaux
export const startupsList = writable([]);
export const featuredStartups = writable([]);
export const sectors = writable([]);
export const startupsStats = writable({
    startups: 0,
    funds: 50,
    success: 85,
    investors: 150
});
export const currentStartup = writable(null);
export const loading = writable(false);
export const error = writable(null);

// States pour la pagination
export const pagination = writable({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
});

// States pour les filtres
export const filters = writable({
    sector: 'all',
    search: '',
    maturity: 'all'
});

// Store dérivé pour les statistiques formatées
export const formattedStats = derived(startupsStats, ($stats) => ({
    startups: $stats.totalProjects || 0,
    funds: Math.round(($stats.totalFunding || 50000000) / 1000000), // Convertir en millions
    success: $stats.successRate || 85,
    investors: $stats.jobsCreated || 150 // Utiliser jobsCreated comme proxy pour les investisseurs
}));

// Actions
export const startupsActions = {
    // Charger toutes les startups
    async loadStartups(page = 1, limit = 20) {
        loading.set(true);
        error.set(null);

        try {
            const filtersValue = await new Promise(resolve => {
                const unsubscribe = filters.subscribe(resolve);
                unsubscribe();
            });

            const response = await startupsApi.getAllStartups(
                page,
                limit,
                filtersValue.sector === 'all' ? null : filtersValue.sector,
                filtersValue.search || null
            );

            // Adapter les données pour l'affichage
            const adaptedStartups = response.data.map(startup => ({
                ...startup,
                // Ajouter des propriétés pour la compatibilité avec l'UI existante
                category: startup.sector,
                stage: startup.maturity,
                gradient: getCategoryGradient(startup.sector),
                investors: startup.founders ? startup.founders.map(f => f.name) : [],
                fundsRaised: 0 // À calculer si nécessaire
            }));

            startupsList.set(adaptedStartups);
            pagination.set({
                page: response.page,
                limit: response.limit,
                total: response.total,
                totalPages: response.totalPages
            });
        } catch (err) {
            console.error('Erreur lors du chargement des startups:', err);
            error.set('Impossible de charger les startups. Veuillez réessayer.');
            startupsList.set([]);
        } finally {
            loading.set(false);
        }
    },

    // Charger les startups en vedette pour la page d'accueil
    async loadFeatured(limit = 6) {
        loading.set(true);
        error.set(null);

        try {
            const response = await startupsApi.getAllStartups(1, limit);

            const adaptedStartups = response.data.map(startup => ({
                ...startup,
                category: startup.sector,
                stage: startup.maturity,
                gradient: getCategoryGradient(startup.sector),
                investors: startup.founders ? startup.founders.map(f => f.name) : [],
                fundsRaised: 0
            }));

            featuredStartups.set(adaptedStartups);
        } catch (err) {
            console.error('Erreur lors du chargement des startups vedettes:', err);
            error.set('Impossible de charger les startups vedettes.');
            featuredStartups.set([]);
        } finally {
            loading.set(false);
        }
    },

    // Charger une startup spécifique
    async loadStartup(id) {
        loading.set(true);
        error.set(null);

        try {
            const startup = await startupsApi.getStartupById(id);

            const adaptedStartup = {
                ...startup,
                category: startup.sector,
                stage: startup.maturity,
                gradient: getCategoryGradient(startup.sector),
                investors: startup.founders ? startup.founders.map(f => f.name) : [],
                fundsRaised: 0
            };

            currentStartup.set(adaptedStartup);
            return adaptedStartup;
        } catch (err) {
            console.error('Erreur lors du chargement de la startup:', err);
            error.set('Impossible de charger cette startup.');
            currentStartup.set(null);
            return null;
        } finally {
            loading.set(false);
        }
    },

    // Charger les secteurs
    async loadSectors() {
        try {
            const sectorsData = await startupsApi.getSectors();
            sectors.set(sectorsData);
        } catch (err) {
            console.error('Erreur lors du chargement des secteurs:', err);
            error.set('Impossible de charger les secteurs.');
        }
    },

    // Charger les statistiques
    async loadStats() {
        try {
            const stats = await startupsApi.getStats();
            startupsStats.set(stats);
        } catch (err) {
            console.error('Erreur lors du chargement des statistiques:', err);
            // Garder les stats par défaut en cas d'erreur
        }
    },

    // Synchroniser avec l'API JEB
    async syncWithJeb() {
        loading.set(true);
        error.set(null);

        try {
            const result = await startupsApi.syncWithJebApi();
            // Recharger les données après la synchronisation
            await this.loadStartups();
            await this.loadStats();
            return result;
        } catch (err) {
            console.error('Erreur lors de la synchronisation:', err);
            error.set('Erreur lors de la synchronisation avec JEB API.');
            throw err;
        } finally {
            loading.set(false);
        }
    },

    // Mettre à jour les filtres
    updateFilters(newFilters) {
        filters.update(current => ({ ...current, ...newFilters }));
    },

    // Réinitialiser les filtres
    resetFilters() {
        filters.set({
            sector: 'all',
            search: '',
            maturity: 'all'
        });
    },

    // Effacer l'erreur
    clearError() {
        error.set(null);
    },

    // Rechercher des startups
    async searchStartups(searchTerm) {
        this.updateFilters({ search: searchTerm });
        await this.loadStartups(1);
    },

    // Filtrer par secteur
    async filterBySector(sector) {
        this.updateFilters({ sector });
        await this.loadStartups(1);
    }
};

// Fonction utilitaire pour les gradients (conservée de l'UI existante)
function getCategoryGradient(category) {
    const gradients = {
        'GreenTech': 'from-green-400 to-emerald-600',
        'HealthTech': 'from-blue-400 to-cyan-600',
        'FinTech': 'from-purple-400 to-indigo-600',
        'AgriTech': 'from-yellow-400 to-orange-600',
        'EdTech': 'from-pink-400 to-rose-600',
        'CyberSecurity': 'from-red-400 to-pink-600',
        'Tech': 'from-blue-400 to-purple-600',
        'Santé': 'from-blue-400 to-cyan-600',
        'Finance': 'from-purple-400 to-indigo-600',
        'Agriculture': 'from-yellow-400 to-orange-600',
        'Éducation': 'from-pink-400 to-rose-600',
        'Environnement': 'from-green-400 to-emerald-600',
        'Technologie': 'from-blue-400 to-purple-600',
        'default': 'from-gray-400 to-gray-600'
    };
    return gradients[category] || gradients.default;
}

// Export par défaut pour la rétrocompatibilité
export default {
    startupsList,
    featuredStartups,
    sectors,
    startupsStats,
    formattedStats,
    currentStartup,
    loading,
    error,
    pagination,
    filters,
    actions: startupsActions
};