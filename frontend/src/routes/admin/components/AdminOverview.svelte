<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { goto } from '$app/navigation';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    
    const dispatch = createEventDispatcher();
    
    export let user = null;
    
    let loading = false;
    let error = null;
    
    // Stats du dashboard
    let stats = {
        totalUsers: 0,
        totalStartups: 0,
        totalEvents: 0,
        totalNews: 0,
        activeUsers: 0,
        pendingApplications: 0,
        monthlyGrowth: 0,
        usersByRole: {
            admin: 0,
            startup: 0,
            investor: 0,
            user: 0
        }
    };

    // Données
    let recentActivity = [];
    let recentUsers = [];
    let topSectors = [];

    const API_BASE = 'http://localhost:3000/api';

    async function loadDashboardData() {
        try {
            loading = true;
            error = null;

            const token = authApi.getToken(); // Utiliser authApi pour le token
            
            // Charger les stats des utilisateurs
            const userStatsResponse = await fetch(`${API_BASE}/admin/users/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (userStatsResponse.ok) {
                const userStatsData = await userStatsResponse.json();
                if (userStatsData.success) {
                    const userStats = userStatsData.data;
                    stats.totalUsers = userStats.total;
                    stats.usersByRole = userStats.byRole;
                    stats.activeUsers = userStats.activeThisMonth;
                    stats.monthlyGrowth = userStats.newThisMonth;
                    recentUsers = userStats.recentRegistrations;
                    topSectors = userStats.topSectors;
                }
            }

            // Charger les startups
            const startupsResponse = await fetch(`${API_BASE}/startups?limit=5`);
            if (startupsResponse.ok) {
                const startupsData = await startupsResponse.json();
                if (startupsData.success) {
                    stats.totalStartups = startupsData.total || startupsData.data?.length || 0;
                }
            }

            // Charger les événements
            const eventsResponse = await fetch(`${API_BASE}/api/events?limit=5`);
            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                stats.totalEvents = Array.isArray(eventsData) ? eventsData.length : 0;
            }

            // Charger les actualités
            const newsResponse = await fetch(`${API_BASE}/api/news?limit=5`);
            if (newsResponse.ok) {
                const newsData = await newsResponse.json();
                stats.totalNews = Array.isArray(newsData) ? newsData.length : 0;
            }

            // Mock recent activity - à remplacer par de vraies données
            recentActivity = [
                {
                    id: 1,
                    message: 'Nouvelle startup inscrite : TechCorp',
                    time: 'Il y a 2 heures',
                    type: 'startup'
                },
                {
                    id: 2,
                    message: 'Nouvel investisseur : Jean Dupont',
                    time: 'Il y a 4 heures',
                    type: 'investor'
                },
                {
                    id: 3,
                    message: 'Événement publié : Demo Day',
                    time: 'Il y a 6 heures',
                    type: 'event'
                },
                {
                    id: 4,
                    message: 'Article publié : Innovation 2025',
                    time: 'Il y a 1 jour',
                    type: 'news'
                }
            ];

        } catch (err) {
            console.error('Erreur lors du chargement:', err);
            error = 'Impossible de charger les données du dashboard';
        } finally {
            loading = false;
        }
    }

    async function handleExport() {
        try {
            loading = true;
            
            const response = await fetch(`${API_BASE}/admin/users/export/csv`, {
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                downloadFile(blob, `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
                dispatch('success', { message: 'Export réussi !' });
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

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    }

    function getActivityIcon(type) {
        switch (type) {
            case 'startup': return '🏢';
            case 'investor': return '💰';
            case 'event': return '📅';
            case 'news': return '📰';
            case 'user': return '👤';
            default: return '📊';
        }
    }

    function getRoleLabel(role) {
        switch (role) {
            case 'startup': return 'Startups';
            case 'investor': return 'Investisseurs';
            case 'user': return 'Étudiants';
            case 'admin': return 'Admins';
            default: return role;
        }
    }

    onMount(() => {
        loadDashboardData();
    });
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Vue d'ensemble</h1>
        <div class="flex gap-2">
            <button 
                on:click={handleExport}
                disabled={loading}
                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50">
                {#if loading}
                    <LoadingSpinner size="sm" color="#ffffff" />
                {:else}
                    📥
                {/if}
                Exporter
            </button>
            <button 
                on:click={loadDashboardData}
                disabled={loading}
                class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50">
                🔄 Actualiser
            </button>
        </div>
    </div>

    {#if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-red-800">{error}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button
                        on:click={loadDashboardData}
                        class="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors">
                        Réessayer
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Utilisateurs Total</p>
                    <p class="text-3xl font-bold text-gray-900">{formatNumber(stats.totalUsers)}</p>
                    <p class="text-sm text-green-600 mt-1">+{stats.monthlyGrowth} ce mois</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-white text-xl">👥</span>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Startups Actives</p>
                    <p class="text-3xl font-bold text-gray-900">{formatNumber(stats.totalStartups)}</p>
                    <p class="text-sm text-green-600 mt-1">+{stats.usersByRole.startup} inscrites</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-full flex items-center justify-center">
                    <span class="text-white text-xl">🏢</span>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Événements</p>
                    <p class="text-3xl font-bold text-gray-900">{formatNumber(stats.totalEvents)}</p>
                    <p class="text-sm text-blue-600 mt-1">En cours</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span class="text-white text-xl">📅</span>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 mb-1">Actualités</p>
                    <p class="text-3xl font-bold text-gray-900">{formatNumber(stats.totalNews)}</p>
                    <p class="text-sm text-orange-600 mt-1">Publiées</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <span class="text-white text-xl">📰</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 font-['Montserrat']">Actions rapides</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
                on:click={() => goto('/register/user')}
                class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                <div class="text-center">
                    <span class="text-4xl text-gray-400 group-hover:text-purple-500 block mb-2">👤</span>
                    <p class="text-sm font-medium text-gray-600 group-hover:text-purple-600">Nouvel utilisateur</p>
                </div>
            </button>
            <button 
                on:click={() => goto('/register/startup')}
                class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                <div class="text-center">
                    <span class="text-4xl text-gray-400 group-hover:text-purple-500 block mb-2">🏢</span>
                    <p class="text-sm font-medium text-gray-600 group-hover:text-purple-600">Nouvelle startup</p>
                </div>
            </button>
            <button 
                on:click={() => goto('/events')}
                class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                <div class="text-center">
                    <span class="text-4xl text-gray-400 group-hover:text-purple-500 block mb-2">📅</span>
                    <p class="text-sm font-medium text-gray-600 group-hover:text-purple-600">Nouvel événement</p>
                </div>
            </button>
            <button 
                on:click={() => goto('/news')}
                class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                <div class="text-center">
                    <span class="text-4xl text-gray-400 group-hover:text-purple-500 block mb-2">📰</span>
                    <p class="text-sm font-medium text-gray-600 group-hover:text-purple-600">Nouvelle actualité</p>
                </div>
            </button>
        </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Activity -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900 mb-4 font-['Montserrat']">Activité récente</h2>
            <div class="space-y-4">
                {#if loading}
                    <div class="flex justify-center py-8">
                        <LoadingSpinner size="md" />
                    </div>
                {:else if recentActivity.length === 0}
                    <p class="text-gray-500 text-center py-8">Aucune activité récente</p>
                {:else}
                    {#each recentActivity.slice(0, 6) as activity}
                        <div class="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                            <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span class="text-lg">{getActivityIcon(activity.type)}</span>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-900">{activity.message}</p>
                                <p class="text-xs text-gray-500">{activity.time}</p>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>

        <!-- Statistics Panel -->
        <div class="space-y-6">
            <!-- User Breakdown -->
            <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 font-['Montserrat']">Répartition des utilisateurs</h3>
                <div class="space-y-3">
                    {#each Object.entries(stats.usersByRole) as [role, count]}
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">{getRoleLabel(role)}</span>
                            <div class="flex items-center gap-2">
                                <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        class="h-full bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-full transition-all duration-500"
                                        style="width: {stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0}%">
                                    </div>
                                </div>
                                <span class="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Top Sectors -->
            <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 font-['Montserrat']">Secteurs populaires</h3>
                <div class="space-y-3">
                    {#if topSectors.length === 0}
                        <p class="text-gray-500 text-sm text-center py-4">Aucun secteur disponible</p>
                    {:else}
                        {#each topSectors.slice(0, 5) as sector}
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600 truncate">{sector.sector}</span>
                                <div class="flex items-center gap-2">
                                    <div class="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            class="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                                            style="width: {topSectors[0]?.count > 0 ? (sector.count / topSectors[0].count) * 100 : 0}%">
                                        </div>
                                    </div>
                                    <span class="text-xs font-semibold text-gray-900 w-6 text-right">{sector.count}</span>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>

            <!-- Recent Users -->
            <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 font-['Montserrat']">Nouveaux inscrits</h3>
                <div class="space-y-3">
                    {#if recentUsers.length === 0}
                        <p class="text-gray-500 text-sm text-center py-4">Aucune inscription récente</p>
                    {:else}
                        {#each recentUsers.slice(0, 4) as newUser}
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {newUser.firstName ? newUser.firstName[0] : newUser.email[0]}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate">
                                        {newUser.firstName && newUser.lastName ? `${newUser.firstName} ${newUser.lastName}` : newUser.email}
                                    </p>
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full {
                                            newUser.role === 'startup' ? 'bg-purple-100 text-purple-800' :
                                            newUser.role === 'investor' ? 'bg-green-100 text-green-800' :
                                            newUser.role === 'user' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }">
                                            {getRoleLabel(newUser.role)}
                                        </span>
                                        <span class="text-xs text-gray-500">
                                            {newUser.createdAt ? new Date(newUser.createdAt).toLocaleDateString('fr-FR') : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- System Status -->
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 font-['Montserrat']">État du système</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-sm font-medium text-green-800">API</span>
                </div>
                <span class="text-xs text-green-600">Opérationnel</span>
            </div>
            
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-sm font-medium text-green-800">Base de données</span>
                </div>
                <span class="text-xs text-green-600">Opérationnel</span>
            </div>
            
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-sm font-medium text-green-800">Authentification</span>
                </div>
                <span class="text-xs text-green-600">Opérationnel</span>
            </div>
        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>