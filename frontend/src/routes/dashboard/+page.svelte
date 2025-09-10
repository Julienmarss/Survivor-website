<!-- src/routes/dashboard/+page.svelte - Version complète corrigée -->
<script>
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/userStore.js';
  import { goto } from '$app/navigation';
  import Header from '../../lib/components/Header.svelte';
  import Footer from '../../lib/components/Footer.svelte';
  import LoadingSpinner from '../../lib/components/LoadingSpinner.svelte';
  import ErrorMessage from '../../lib/components/ErrorMessage.svelte';

  // États
  let user = null;
  let loading = true;
  let error = null;
  let activeView = 'overview';

  // Données du dashboard
  let stats = {
    totalStartups: 0,
    totalViews: 0,
    monthlyViews: 0,
    engagementRate: 0,
    investorInteractions: 0,
    totalFunding: 0,
    successRate: 85,
    jobsCreated: 0
  };

  let recentStartups = [];
  let topSectors = [];
  let recentActivity = [];
  let userProjects = [];

  // Configuration API
  const API_BASE = `${import.meta.env.PUBLIC_APIURL || 'http://localhost:3000'}/api`;

  // S'abonner au store utilisateur
  userStore.subscribe(value => {
    user = value;
  });

  function isAdmin(user) {
    return user?.role === 'admin' || user?.isAdmin === true;
  }

  async function loadDashboardData() {
    try {
      loading = true;
      error = null;

      // Charger les statistiques générales
      const statsResponse = await fetch(`${API_BASE}/analytics/dashboard`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        stats = { ...stats, ...statsData.data };
      }

      // Charger les startups récentes
      const startupsResponse = await fetch(`${API_BASE}/startups?limit=5&sort=recent`);
      const startupsData = await startupsResponse.json();

      if (startupsData.success) {
        recentStartups = startupsData.data;
      }

      // Charger les secteurs populaires
      const sectorsResponse = await fetch(`${API_BASE}/startups/sectors`);
      const sectorsData = await sectorsResponse.json();

      if (sectorsData.success) {
        topSectors = sectorsData.slice(0, 5);
      }

      // Charger les projets de l'utilisateur (si applicable)
      if (user && !isAdmin(user)) {
        userProjects = recentStartups.slice(0, 3);
      }

      // Simuler l'activité récente
      recentActivity = [
        { type: 'startup_created', message: 'Nouvelle startup ajoutée', time: '2 minutes', icon: 'plus' },
        { type: 'view', message: '150 nouvelles vues aujourd\'hui', time: '1 heure', icon: 'eye' },
        { type: 'investor', message: 'Nouvel investisseur inscrit', time: '3 heures', icon: 'user' },
        { type: 'funding', message: 'Levée de fonds: €2.5M', time: '1 jour', icon: 'chart' }
      ];

    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      error = 'Impossible de charger les données du dashboard';
    } finally {
      loading = false;
    }
  }

  async function exportData(format) {
    if (!isAdmin(user)) {
      error = 'Vous n\'avez pas les permissions pour exporter les données';
      return;
    }

    try {
      loading = true;

      let endpoint = '';
      let filename = '';

      switch (format) {
        case 'highlights':
          endpoint = `${API_BASE}/export/investor-highlights`;
          filename = `investor-highlights-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'report':
          endpoint = `${API_BASE}/export/investor-report`;
          filename = `investor-report-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'csv':
          endpoint = `${API_BASE}/export/investor-report/csv`;
          filename = `investor-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
      }

      const response = await fetch(endpoint);

      if (response.ok) {
        const blob = await response.blob();
        downloadFile(blob, filename);
        showSuccessMessage('Export réussi !');
      } else {
        throw new Error('Erreur lors de l\'export');
      }
    } catch (err) {
      console.error('Erreur export:', err);
      error = 'Erreur lors de l\'export des données';
    } finally {
      loading = false;
    }
  }

  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function retryLoad() {
    error = null;
    loadDashboardData();
  }

  function getActivityIcon(type) {
    const icons = {
      plus: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      chart: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    };
    return icons[type] || icons.plus;
  }

  onMount(async () => {
    await userStore.init();
    await loadDashboardData();
  });
</script>

<svelte:head>
  <title>Dashboard - JEB Incubator</title>
  <meta name="description" content="Tableau de bord JEB Incubator">
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
  <Header />

  <!-- Vérification de la connexion -->
  {#if !user}
    <div class="pt-24 px-6 sm:px-8 lg:px-12">
      <div class="max-w-4xl mx-auto text-center py-16">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Connexion Requise</h1>
        <p class="text-gray-600 mb-8">Vous devez être connecté pour accéder au dashboard.</p>
        <button
                on:click={() => goto('/login')}
                class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
          Se connecter
        </button>
      </div>
    </div>
  {:else}
    <!-- Affichage des erreurs -->
    {#if error}
      <ErrorMessage message={error} onRetry={retryLoad} />
    {/if}

    <!-- En-tête Dashboard -->
    <section class="pt-24 pb-8 px-6 sm:px-8 lg:px-12">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2 font-['Montserrat']">
              {#if isAdmin(user)}
                Dashboard Administrateur
              {:else}
                Mon Dashboard
              {/if}
            </h1>
            <p class="text-xl text-gray-600 font-['Open_Sans']">
              Bienvenue, {user.firstName || user.first_name || user.name || user.email}
            </p>
          </div>
          <div class="mt-4 lg:mt-0 flex gap-3">
            {#if isAdmin(user)}
              <button
                      on:click={() => goto('/admin')}
                      class="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors duration-300">
                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Administration
              </button>
            {/if}
            <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              {isAdmin(user) ? 'Administrateur' : 'Utilisateur'}
            </span>
          </div>
        </div>

        <!-- Navigation par onglets -->
        <div class="border-b border-gray-200 mb-8">
          <nav class="-mb-px flex space-x-8">
            <button
                    on:click={() => activeView = 'overview'}
                    class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                activeView === 'overview'
                  ? 'border-[#c174f2] text-[#c174f2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }">
              Vue d'ensemble
            </button>
            {#if isAdmin(user)}
              <button
                      on:click={() => activeView = 'analytics'}
                      class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                  activeView === 'analytics'
                    ? 'border-[#c174f2] text-[#c174f2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }">
                Analytics
              </button>
              <button
                      on:click={() => activeView = 'exports'}
                      class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                  activeView === 'exports'
                    ? 'border-[#c174f2] text-[#c174f2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }">
                Exports
              </button>
            {:else}
              <button
                      on:click={() => activeView = 'projects'}
                      class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                  activeView === 'projects'
                    ? 'border-[#c174f2] text-[#c174f2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }">
                Mes Projets
              </button>
            {/if}
          </nav>
        </div>
      </div>
    </section>

    <!-- Contenu principal -->
    <section class="pb-20 px-6 sm:px-8 lg:px-12">
      <div class="max-w-7xl mx-auto">
        {#if loading}
          <div class="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        {:else}
          <!-- Vue d'ensemble -->
          {#if activeView === 'overview'}
            <!-- Statistiques principales -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <!-- Startups Totales -->
              <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Startups Totales</p>
                    <p class="text-3xl font-bold text-gray-900">{stats.totalStartups}</p>
                    <p class="text-sm text-green-600 font-medium">+12% ce mois</p>
                  </div>
                  <div class="w-12 h-12 bg-gradient-to-r from-[#d5a8f2] to-[#e4bef8] rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Interactions Investisseurs -->
              <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Interactions Investisseurs</p>
                    <p class="text-3xl font-bold text-gray-900">{stats.investorInteractions}</p>
                    <p class="text-sm text-purple-600 font-medium">+8% ce mois</p>
                  </div>
                  <div class="w-12 h-12 bg-gradient-to-r from-[#f6aeae] to-[#f8cacf] rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Vues Totales -->
              <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Vues Totales</p>
                    <p class="text-3xl font-bold text-gray-900">{formatNumber(stats.totalViews)}</p>
                    <p class="text-sm text-green-600 font-medium">+24% ce mois</p>
                  </div>
                  <div class="w-12 h-12 bg-gradient-to-r from-[#f18585] to-[#f49c9c] rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Taux d'Engagement -->
              <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Taux d'Engagement</p>
                    <p class="text-3xl font-bold text-gray-900">{stats.engagementRate}%</p>
                    <p class="text-sm text-blue-600 font-medium">Excellent</p>
                  </div>
                  <div class="w-12 h-12 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grille de contenu -->
            <div class="grid lg:grid-cols-3 gap-8">
              <!-- Startups récentes -->
              <div class="lg:col-span-2">
                <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-gray-900 font-['Montserrat']">Startups Récentes</h3>
                    <button
                            on:click={() => goto('/projects')}
                            class="text-[#c174f2] hover:text-[#cb90f1] text-sm font-medium transition-colors duration-300">
                      Voir tout →
                    </button>
                  </div>
                  <div class="space-y-4">
                    {#each recentStartups as startup}
                      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                           on:click={() => goto(`/startup/${startup.id}`)}>
                        <div class="flex items-center space-x-4">
                          <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center">
                            <span class="text-white font-bold text-sm">{startup.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h4 class="font-semibold text-gray-900">{startup.name}</h4>
                            <p class="text-sm text-gray-600">{startup.sector}</p>
                          </div>
                        </div>
                        <div class="text-right">
                          <span class="text-sm font-medium text-[#c174f2]">{startup.maturity}</span>
                          <p class="text-xs text-gray-500">{new Date(startup.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Sidebar -->
              <div class="space-y-8">
                <!-- Activité récente -->
                <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 class="text-lg font-bold text-gray-900 mb-4 font-['Montserrat']">Activité Récente</h3>
                  <div class="space-y-3">
                    {#each recentActivity as activity}
                      <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-[#c174f2] bg-opacity-10 rounded-full flex items-center justify-center">
                          <svg class="w-4 h-4 text-[#c174f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{getActivityIcon(activity.icon)}"></path>
                          </svg>
                        </div>
                        <div class="flex-1">
                          <p class="text-sm text-gray-900">{activity.message}</p>
                          <p class="text-xs text-gray-500">Il y a {activity.time}</p>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Top secteurs -->
                <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 class="text-lg font-bold text-gray-900 mb-4 font-['Montserrat']">Secteurs Populaires</h3>
                  <div class="space-y-3">
                    {#each topSectors as sector}
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-900">{sector.name}</span>
                        <span class="text-sm text-[#c174f2] font-semibold">{sector.count}</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-gradient-to-r from-[#c174f2] to-[#f18585] h-2 rounded-full"
                             style="width: {(sector.count / Math.max(...topSectors.map(s => s.count))) * 100}%"></div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Vue Analytics (admin seulement) -->
          {#if activeView === 'analytics' && isAdmin(user)}
            <div class="space-y-8">
              <!-- Métriques avancées -->
              <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h3 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Analytics Avancées</h3>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div class="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <div class="text-3xl font-bold text-[#c174f2] mb-2">{formatCurrency(stats.totalFunding)}</div>
                    <div class="text-gray-600 font-medium">Financement Total</div>
                  </div>

                  <div class="text-center p-6 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl">
                    <div class="text-3xl font-bold text-[#f18585] mb-2">{stats.successRate}%</div>
                    <div class="text-gray-600 font-medium">Taux de Réussite</div>
                  </div>

                  <div class="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                    <div class="text-3xl font-bold text-[#d5a8f2] mb-2">{stats.jobsCreated}+</div>
                    <div class="text-gray-600 font-medium">Emplois Créés</div>
                  </div>
                </div>

                <!-- Graphique simulé -->
                <div class="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                  <div class="text-center">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <p class="text-gray-500 font-medium">Graphiques Analytics</p>
                    <p class="text-sm text-gray-400">À intégrer avec Chart.js ou D3.js</p>
                  </div>
                </div>
              </div>

              <!-- Métriques de performance -->
              <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h4 class="text-lg font-bold text-gray-900 mb-4 font-['Montserrat']">Performance des Vues</h4>
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Vues aujourd'hui</span>
                      <span class="font-semibold text-[#c174f2]">{formatNumber(Math.floor(stats.monthlyViews / 30))}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Vues ce mois</span>
                      <span class="font-semibold text-[#f18585]">{formatNumber(stats.monthlyViews)}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Vues totales</span>
                      <span class="font-semibold text-[#d5a8f2]">{formatNumber(stats.totalViews)}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h4 class="text-lg font-bold text-gray-900 mb-4 font-['Montserrat']">Engagement Utilisateurs</h4>
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Taux de rebond</span>
                      <span class="font-semibold text-green-600">23%</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Temps moyen sur site</span>
                      <span class="font-semibold text-blue-600">4m 32s</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Pages par session</span>
                      <span class="font-semibold text-purple-600">3.2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Vue Exports (admin seulement) -->
          {#if activeView === 'exports' && isAdmin(user)}
            <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Rapports et Exports</h3>
              <p class="text-gray-600 mb-8 font-['Open_Sans']">
                Générez et téléchargez des rapports détaillés pour les investisseurs et les partenaires.
              </p>

              <div class="grid md:grid-cols-3 gap-6">
                <div class="border border-gray-200 rounded-xl p-6 hover:border-[#c174f2] transition-colors duration-300">
                  <div class="w-12 h-12 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                    </svg>
                  </div>
                  <h4 class="text-lg font-bold text-gray-900 mb-2 font-['Montserrat']">Highlights Investisseurs</h4>
                  <p class="text-gray-600 text-sm mb-4 font-['Open_Sans']">
                    Résumé des meilleures opportunités d'investissement.
                  </p>
                  <button
                          on:click={() => exportData('highlights')}
                          disabled={loading}
                          class="w-full bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50">
                    Exporter JSON
                  </button>
                </div>

                <div class="border border-gray-200 rounded-xl p-6 hover:border-[#f18585] transition-colors duration-300">
                  <div class="w-12 h-12 bg-gradient-to-r from-[#f18585] to-[#f49c9c] rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h4 class="text-lg font-bold text-gray-900 mb-2 font-['Montserrat']">Rapport Complet</h4>
                  <p class="text-gray-600 text-sm mb-4 font-['Open_Sans']">
                    Rapport détaillé de toutes les startups et leurs métriques.
                  </p>
                  <button
                          on:click={() => exportData('report')}
                          disabled={loading}
                          class="w-full bg-gradient-to-r from-[#f18585] to-[#f49c9c] text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50">
                    Exporter JSON
                  </button>
                </div>

                <div class="border border-gray-200 rounded-xl p-6 hover:border-[#d5a8f2] transition-colors duration-300">
                  <div class="w-12 h-12 bg-gradient-to-r from-[#d5a8f2] to-[#e4bef8] rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h4 class="text-lg font-bold text-gray-900 mb-2 font-['Montserrat']">Export CSV</h4>
                  <p class="text-gray-600 text-sm mb-4 font-['Open_Sans']">
                    Format CSV pour l'analyse dans Excel ou autres outils.
                  </p>
                  <button
                          on:click={() => exportData('csv')}
                          disabled={loading}
                          class="w-full bg-gradient-to-r from-[#d5a8f2] to-[#e4bef8] text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50">
                    Exporter CSV
                  </button>
                </div>
              </div>
            </div>
          {/if}

          <!-- Vue Projets (pour utilisateurs non-admin) -->
          {#if activeView === 'projects' && !isAdmin(user)}
            <div class="space-y-8">
              <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-2xl font-bold text-gray-900 font-['Montserrat']">Mes Projets</h3>
                  <button
                          on:click={() => goto('/projects')}
                          class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                    Découvrir plus de projets
                  </button>
                </div>

                {#if userProjects.length === 0}
                  <div class="text-center py-12">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <p class="text-gray-500 text-lg mb-4">Aucun projet pour le moment</p>
                    <p class="text-gray-400 mb-6">Explorez nos startups pour découvrir des opportunités passionnantes</p>
                  </div>
                {:else}
                  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {#each userProjects as project}
                      <div class="border border-gray-200 rounded-xl p-6 hover:border-[#c174f2] hover:shadow-lg transition-all duration-300 cursor-pointer"
                           on:click={() => goto(`/startup/${project.id}`)}>
                        <div class="flex items-center justify-between mb-4">
                          <div class="w-12 h-12 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold">{project.name.charAt(0)}</span>
                          </div>
                          <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{project.sector}</span>
                        </div>
                        <h4 class="font-bold text-gray-900 mb-2">{project.name}</h4>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-[#c174f2] font-medium">{project.maturity}</span>
                          <span class="text-gray-500">{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </section>
  {/if}

  <Footer />
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>