import { writable, derived } from 'svelte/store';
import { startupsApi } from '$lib/services/api.js';

// Stores pour les données
export const startups = writable([]);
export const sectors = writable([]);
export const stats = writable({
  totalProjects: 0,
  totalFunding: 0,
  successRate: 0,
  jobsCreated: 0
});
export const loading = writable(false);
export const error = writable(null);

// Helpers
const EUR = Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const formatEuro = (n) => {
  if (n == null || isNaN(Number(n))) return 'Non spécifié';
  return EUR.format(Number(n));
};

// Fonctions utilitaires
function getSectorIcon(sector) {
  // Si tu utilises Font Awesome v6, change 'fas' par 'fa-solid'
  const icons = {
    'FinTech': 'fas fa-coins',
    'HealthTech': 'fas fa-heartbeat',
    'EdTech': 'fas fa-graduation-cap',
    'DeepTech': 'fas fa-brain',
    'SaaS': 'fas fa-cloud',
    'Logistics': 'fas fa-truck',
    'CleanTech': 'fas fa-leaf',
    'AgriTech': 'fas fa-seedling',
    'Robotics': 'fas fa-robot',
    'CyberSecurity': 'fas fa-shield-alt',
    'default': 'fas fa-rocket'
  };
  return icons[sector] || icons.default;
}

function getSectorGradient(sector) {
  const gradients = {
    'FinTech': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'HealthTech': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'EdTech': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'DeepTech': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'SaaS': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'Logistics': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'CleanTech': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'AgriTech': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'Robotics': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'CyberSecurity': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'default': 'linear-gradient(135deg, #f18585 0%, #c174f2 100%)'
  };
  return gradients[sector] || gradients.default;
}

// Store dérivé pour les projets formatés
export const projects = derived(startups, ($startups) => {
  return ($startups || []).map((startup) => {
    // funding: on essaie plusieurs champs possibles (selon l'API JEB)
    const rawFunding =
      startup.funding ??
      startup.total_funding ??
      startup.totalFunds ??
      startup.raised ??
      startup.raised_amount ??
      null;

    // année robuste
    let year = '';
    if (startup.year) {
      year = startup.year;
    } else if (startup.created_at) {
      const d = new Date(startup.created_at);
      if (!isNaN(d.getTime())) year = d.getFullYear();
    }

    return {
      id: startup.id,
      title: startup.name ?? 'Projet',
      description: startup.description || 'Description non disponible',
      sector: startup.sector ?? '—',
      maturity: startup.maturity ?? '—',
      status: startup.project_status || startup.maturity || '—',
      founders: (startup.founders || []).map((f) => (typeof f === 'string' ? f : f?.name)).filter(Boolean),
      year,
      funding: rawFunding != null ? formatEuro(rawFunding) : 'Non spécifié',
      website: startup.website_url ?? startup.website ?? '',
      social: startup.social_media_url ?? startup.social ?? '',
      needs: startup.needs ?? '',
      email: startup.email ?? '',
      phone: startup.phone ?? '',
      address: startup.address ?? '',
      legalStatus: startup.legal_status ?? '',

      // Propriétés pour l'affichage
      badge: startup.sector ?? '',
      icon: getSectorIcon(startup.sector),
      gradient: getSectorGradient(startup.sector),
      tags: [startup.sector, startup.maturity, startup.legal_status].filter(Boolean)
    };
  });
});

// Actions
export const startupsActions = {
  async fetchAll(params = {}) {
    try {
      loading.set(true);
      error.set(null);
      
      const response = await startupsApi.getAll(params);
      
      if (response?.success) {
        // attente: response.data = { data: [], total, page, limit, totalPages }
        startups.set(response.data?.data || []);
        return response.data;
      } else {
        throw new Error(response?.message || 'Failed to fetch startups');
      }
    } catch (err) {
      console.error('Error fetching startups:', err);
      error.set(err.message || 'Une erreur est survenue');
      throw err;
    } finally {
      loading.set(false);
    }
  },

  async fetchSectors() {
    try {
      const response = await startupsApi.getSectors();
      
      if (response?.success) {
        sectors.set(response.data || []);
        return response.data;
      } else {
        throw new Error(response?.message || 'Failed to fetch sectors');
      }
    } catch (err) {
      console.error('Error fetching sectors:', err);
      error.set(err.message || 'Erreur lors du chargement des secteurs');
      throw err;
    }
  },

  async fetchStats() {
    try {
      const response = await startupsApi.getStats();
      
      if (response?.success) {
        stats.set(response.data || { totalProjects: 0, totalFunding: 0, successRate: 0, jobsCreated: 0 });
        return response.data;
      } else {
        throw new Error(response?.message || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      error.set(err.message || 'Erreur lors du chargement des statistiques');
      throw err;
    }
  },

  async syncWithJeb() {
    try {
      loading.set(true);
      const response = await startupsApi.syncWithJeb();
      
      if (response?.success) {
        // Recharger les données après synchronisation
        await this.fetchAll();
        return response;
      } else {
        throw new Error(response?.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Error syncing with JEB:', err);
      error.set(err.message || 'Erreur lors de la synchronisation');
      throw err;
    } finally {
      loading.set(false);
    }
  }
};

// Store pour les statistiques des projets (dérivé)
export const projectStats = derived(stats, ($stats) => $stats);

// Fonctions utilitaires exportées
export function getProjectById(id) {
  return derived(projects, ($projects) => {
    return $projects.find((project) => project.id === id);
  });
}

export function getProjectsBySector(sector) {
  return derived(projects, ($projects) => {
    return $projects.filter((project) => project.sector === sector);
  });
}

export function searchProjects(query) {
  return derived(projects, ($projects) => {
    const searchTerm = (query || '').toLowerCase();
    return $projects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm) ||
        project.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  });
}

