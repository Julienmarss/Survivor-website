<script>
    import { onMount } from 'svelte';
    import { userStore } from '$lib/stores/userStore.js';
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';

    let user = null;
    let loading = false;
    let error = null;
    let activeSection = 'overview';
    let searchTerm = '';
    let selectedFilter = 'all';
    let showModal = false;
    let modalType = '';

    // Stats du dashboard
    let stats = {
        totalUsers: 0,
        totalStartups: 0,
        totalEvents: 0,
        totalNews: 0,
        activeUsers: 0,
        pendingApplications: 0,
        monthlyGrowth: 0,
        revenue: 0
    };

    // Données
    let users = [];
    let startups = [];
    let events = [];
    let news = [];
    let recentActivity = [];

    const API_BASE = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

    userStore.subscribe(value => {
        user = value;
        if (user && !isAdmin(user)) {
            goto('/');
        }
    });

    function isAdmin(user) {
        return user?.role === 'admin' || user?.isAdmin === true;
    }

    const sidebarItems = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
        { id: 'users', label: 'Utilisateurs', icon: '👥' },
        { id: 'startups', label: 'Startups', icon: '🏢' },
        { id: 'events', label: 'Événements', icon: '📅' },
        { id: 'news', label: 'Actualités', icon: '📰' },
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'settings', label: 'Paramètres', icon: '⚙️' }
    ];

    async function loadDashboardData() {
        try {
            loading = true;
            error = null;

            // Charger les stats générales
            const statsResponse = await fetch(`${API_BASE}/analytics/dashboard`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                if (statsData.success) {
                    stats = { ...stats, ...statsData.data };
                }
            }

            // Charger les utilisateurs
            const usersResponse = await fetch(`${API_BASE}/admin/users`);
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                if (usersData.success) {
                    users = usersData.data || [];
                }
            }

            // Charger les startups
            const startupsResponse = await fetch(`${API_BASE}/startups`);
            if (startupsResponse.ok) {
                const startupsData = await startupsResponse.json();
                if (startupsData.success) {
                    startups = startupsData.data.data || startupsData.data || [];
                }
            }

            // Charger les événements
            const eventsResponse = await fetch(`${API_BASE}/api/events`);
            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                events = eventsData || [];
            }

            // Charger les actualités
            const newsResponse = await fetch(`${API_BASE}/api/news`);
            if (newsResponse.ok) {
                const newsData = await newsResponse.json();
                news = newsData || [];
            }

            // Charger l'activité récente
            const activityResponse = await fetch(`${API_BASE}/analytics/recent-activity`);
            if (activityResponse.ok) {
                const activityData = await activityResponse.json();
                if (activityData.success) {
                    recentActivity = activityData.data || [];
                }
            }

        } catch (err) {
            console.error('Erreur lors du chargement:', err);
            error = 'Impossible de charger les données du dashboard';
        } finally {
            loading = false;
        }
    }

    async function handleCreate(type) {
        modalType = type;
        showModal = true;
    }

    async function handleEdit(type, id) {
        goto(`/admin/${type}/${id}`);
    }

    async function handleDelete(type, id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
            return;
        }

        try {
            loading = true;
            let endpoint = '';
            
            switch (type) {
                case 'user':
                    endpoint = `${API_BASE}/admin/users/${id}`;
                    break;
                case 'startup':
                    endpoint = `${API_BASE}/startups/${id}`;
                    break;
                case 'event':
                    endpoint = `${API_BASE}/api/events/${id}`;
                    break;
                case 'news':
                    endpoint = `${API_BASE}/api/news/${id}`;
                    break;
            }

            const response = await fetch(endpoint, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadDashboardData();
                showSuccessMessage(`${type} supprimé avec succès`);
            } else {
                throw new Error('Erreur lors de la suppression');
            }
        } catch (err) {
            console.error('Erreur suppression:', err);
            error = `Erreur lors de la suppression du ${type}`;
        } finally {
            loading = false;
        }
    }

    async function handleExport(type) {
        try {
            loading = true;
            let endpoint = '';
            let filename = '';

            switch (type) {
                case 'users':
                    endpoint = `${API_BASE}/admin/export/users`;
                    filename = `users-${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                case 'startups':
                    endpoint = `${API_BASE}/export/investor-report/csv`;
                    filename = `startups-${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                case 'dashboard':
                    endpoint = `${API_BASE}/export/investor-highlights`;
                    filename = `dashboard-${new Date().toISOString().split('T')[0]}.json`;
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
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
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

    function getUserInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    function getStatusColor(status) {
        switch (status) {
            case 'active':
            case 'En cours':
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'pending':
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'inactive':
            case 'Suspendu':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    function getRoleColor(role) {
        switch (role) {
            case 'startup':
                return 'bg-purple-100 text-purple-800';
            case 'investor':
                return 'bg-green-100 text-green-800';
            case 'student':
                return 'bg-blue-100 text-blue-800';
            case 'admin':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    $: filteredUsers = users.filter(user => {
        const matchesSearch = searchTerm === '' || 
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = selectedFilter === 'all' || 
            user.role === selectedFilter ||
            user.status === selectedFilter;
        
        return matchesSearch && matchesFilter;
    });

    $: filteredStartups = startups.filter(startup => {
        const matchesSearch = searchTerm === '' || 
            startup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            startup.sector?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = selectedFilter === 'all' || 
            startup.sector === selectedFilter ||
            startup.project_status === selectedFilter;
        
        return matchesSearch && matchesFilter;
    });

    onMount(async () => {
        await userStore.init();

        if (!user || !isAdmin(user)) {
            goto('/');
            return;
        }

        await loadDashboardData();
    });
</script>

<svelte:head>
    <title>Administration - JEB Incubator</title>
    <meta name="description" content="Interface d'administration JEB Incubator">
</svelte:head>

<div class="min-h-screen bg-gray-50">
    <Header />

    {#if !user || !isAdmin(user)}
        <div class="pt-24 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto text-center py-16">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Accès Refusé</h1>
                <p class="text-gray-600 mb-8">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                <button
                        on:click={() => goto('/')}
                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                    Retour à l'accueil
                </button>
            </div>
        </div>
    {:else}
        {#if error}
            <ErrorMessage message={error} onRetry={() => loadDashboardData()} />
        {/if}

        <div class="flex pt-20">
            <!-- Sidebar -->
            <div class="fixed left-0 top-20 bottom-0 w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold">🛠️</span>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900 font-['Montserrat']">JEB Admin</h1>
                            <p class="text-sm text-gray-500">Interface d'administration</p>
                        </div>
                    </div>
                </div>
                
                <nav class="p-4">
                    <ul class="space-y-2">
                        {#each sidebarItems as item}
                            <li>
                                <button
                                    on:click={() => activeSection = item.id}
                                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-medium {
                                        activeSection === item.id 
                                            ? 'bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white shadow-lg' 
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }"
                                >
                                    <span class="text-lg">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                </nav>

                <!-- User Info -->
                <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {getUserInitials(user.firstName || user.first_name || user.name || user.email)}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">{user.firstName || user.first_name || user.name || 'Admin'}</p>
                            <p class="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 ml-64">
                <div class="p-8">
                    
                    <!-- Overview Section -->
                    {#if activeSection === 'overview'}
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Vue d'ensemble</h1>
                                <div class="flex gap-2">
                                    <button 
                                        on:click={() => handleExport('dashboard')}
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
                                        on:click={() => loadDashboardData()}
                                        class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2">
                                        🔄 Actualiser
                                    </button>
                                </div>
                            </div>

                            <!-- Stats Cards -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm font-medium text-gray-500 mb-1">Utilisateurs Total</p>
                                            <p class="text-3xl font-bold text-gray-900">{formatNumber(users.length)}</p>
                                            <p class="text-sm text-green-600 mt-1">+12.5%</p>
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
                                            <p class="text-3xl font-bold text-gray-900">{startups.length}</p>
                                            <p class="text-sm text-green-600 mt-1">+8.2%</p>
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
                                            <p class="text-3xl font-bold text-gray-900">{events.length}</p>
                                            <p class="text-sm text-red-600 mt-1">-2.1%</p>
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
                                            <p class="text-3xl font-bold text-gray-900">{news.length}</p>
                                            <p class="text-sm text-green-600 mt-1">+15.3%</p>
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
                                        on:click={() => goto('/admin/users/create')}
                                        class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                                        <div class="text-center">
                                            <span class="text-4xl text-gray-400 group-hover:text-purple-500 block mb-2">➕</span>
                                            <p class="text-sm font-medium text-gray-600 group-hover:text-purple-600">Nouvel utilisateur</p>
                                        </div>
                                    </button>
                                    <button 
                                        on:click={() => goto('/admin/startups/create')}
                                        class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                                        <div class="text-center">
                                            <span class="text-4xl text-gray-400 group-hover:text-purple-500 block mb-2">➕</span>
                                            <p class="text-sm font-medium text-gray-600 group-hover:text-purple-600">Nouvelle startup</p>
                                        </div>
                                    </button>
                                    <button 
                                        on:click={() => goto('/events')}
                                        class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                                        <div class="text-center">
                                            <span class="text-4xl text-gray-400 group-hover:text-purple-500 block mb-2">➕</span>
                                            <p class="text-sm font-medium text-gray-600 group-hover:text-purple-600">Nouvel événement</p>
                                        </div>
                                    </button>
                                    <button 
                                        on:click={() => goto('/news')}
                                        class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                                        <div class="text-center">
                                            <span class="text-4xl text-gray-400 group-hover:text-purple-500 block mb-2">➕</span>
                                            <p class="text-sm font-medium text-gray-600 group-hover:text-purple-600">Nouvelle actualité</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <!-- Recent Activity -->
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                    <h2 class="text-lg font-semibold text-gray-900 mb-4 font-['Montserrat']">Activité récente</h2>
                                    <div class="space-y-4">
                                        {#if recentActivity.length === 0}
                                            <p class="text-gray-500 text-center py-4">Aucune activité récente</p>
                                        {:else}
                                            {#each recentActivity.slice(0, 5) as activity}
                                                <div class="flex items-center gap-3">
                                                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                        <span class="text-green-600 text-sm">✓</span>
                                                    </div>
                                                    <div class="flex-1">
                                                        <p class="text-sm font-medium text-gray-900">{activity.message}</p>
                                                        <p class="text-xs text-gray-500">{activity.time || 'Il y a quelques instants'}</p>
                                                    </div>
                                                </div>
                                            {/each}
                                        {/if}
                                    </div>
                                </div>

                                <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                    <h2 class="text-lg font-semibold text-gray-900 mb-4 font-['Montserrat']">Statistiques en temps réel</h2>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600">Utilisateurs actifs</span>
                                            <span class="text-lg font-semibold text-gray-900">{users.filter(u => u.status === 'active').length}</span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600">Startups en attente</span>
                                            <span class="text-lg font-semibold text-yellow-600">{startups.filter(s => s.project_status === 'En attente').length}</span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600">Événements à venir</span>
                                            <span class="text-lg font-semibold text-blue-600">{events.filter(e => new Date(e.dates) > new Date()).length}</span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600">Articles publiés</span>
                                            <span class="text-lg font-semibold text-green-600">{news.filter(n => n.status === 'published').length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Users Section -->
                    {#if activeSection === 'users'}
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Gestion des utilisateurs</h1>
                                <div class="flex gap-2">
                                    <button 
                                        on:click={() => handleExport('users')}
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
                                        on:click={() => goto('/admin/users/create')}
                                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                                        ➕ Nouvel utilisateur
                                    </button>
                                </div>
                            </div>

                            <!-- Filters -->
                            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div class="flex flex-col md:flex-row gap-4">
                                    <div class="flex-1">
                                        <div class="relative">
                                            <input
                                                type="text"
                                                placeholder="Rechercher par nom, email..."
                                                bind:value={searchTerm}
                                                class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                                        </div>
                                    </div>
                                    <div class="flex gap-2 flex-wrap">
                                        <button 
                                            on:click={() => selectedFilter = 'all'}
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'all' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                                            Tous
                                        </button>
                                        <button 
                                            on:click={() => selectedFilter = 'startup'}
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'startup' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                                            Startups
                                        </button>
                                        <button 
                                            on:click={() => selectedFilter = 'investor'}
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'investor' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                                            Investisseurs
                                        </button>
                                        <button 
                                            on:click={() => selectedFilter = 'student'}
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'student' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                                            Étudiants
                                        </button>
                                        <button 
                                            on:click={() => selectedFilter = 'pending'}
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'pending' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                                            En attente
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Users Table -->
                            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div class="overflow-x-auto">
                                    <table class="w-full">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscription</th>
                                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            {#if loading}
                                                <tr>
                                                    <td colspan="5" class="px-6 py-8 text-center">
                                                        <LoadingSpinner size="lg" />
                                                    </td>
                                                </tr>
                                            {:else if filteredUsers.length === 0}
                                                <tr>
                                                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                                                        Aucun utilisateur trouvé
                                                    </td>
                                                </tr>
                                            {:else}
                                                {#each filteredUsers as user}
                                                    <tr class="hover:bg-gray-50 transition-colors">
                                                        <td class="px-6 py-4 whitespace-nowrap">
                                                            <div class="flex items-center">
                                                                <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center text-white font-medium">
                                                                    {getUserInitials(user.name || user.firstName + ' ' + user.lastName || user.email)}
                                                                </div>
                                                                <div class="ml-4">
                                                                    <div class="text-sm font-medium text-gray-900">{user.name || user.firstName + ' ' + user.lastName || 'Nom inconnu'}</div>
                                                                    <div class="text-sm text-gray-500">{user.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap">
                                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRoleColor(user.role)}">
                                                                {user.role || 'Utilisateur'}
                                                            </span>
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap">
                                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(user.status)}">
                                                                {user.status === 'active' ? 'Actif' : user.status === 'pending' ? 'En attente' : 'Inactif'}
                                                            </span>
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                                        </td>
                                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div class="flex items-center justify-end gap-2">
                                                                <button
                                                                    on:click={() => goto(`/profile/${user.id}`)}
                                                                    class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                                    👁️ Voir
                                                                </button>
                                                                <button
                                                                    on:click={() => handleEdit('user', user.id)}
                                                                    class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200">
                                                                    ✏️ Modifier
                                                                </button>
                                                                <button
                                                                    on:click={() => handleDelete('user', user.id)}
                                                                    class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200">
                                                                    🗑️ Supprimer
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                {/each}
                                            {/if}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Startups Section -->
                    {#if activeSection === 'startups'}
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Gestion des startups</h1>
                                <div class="flex gap-2">
                                    <button 
                                        on:click={() => handleExport('startups')}
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
                                        on:click={() => goto('/admin/startups')}
                                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                                        ➕ Nouvelle startup
                                    </button>
                                </div>
                            </div>

                            <!-- Filters -->
                            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div class="flex flex-col md:flex-row gap-4">
                                    <div class="flex-1">
                                        <div class="relative">
                                            <input
                                                type="text"
                                                placeholder="Rechercher par nom, secteur..."
                                                bind:value={searchTerm}
                                                class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                                        </div>
                                    </div>
                                    <div class="flex gap-2 flex-wrap">
                                        <button 
                                            on:click={() => selectedFilter = 'all'}
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'all' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                                            Toutes
                                        </button>
                                        <button 
                                            on:click={() => selectedFilter = 'FinTech'}
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'FinTech' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                                            FinTech
                                        </button>
                                        <button 
                                            on:click={() => selectedFilter = 'HealthTech'}
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'HealthTech' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                                            HealthTech
                                        </button>
                                        <button 
                                            on:click={() => selectedFilter = 'GreenTech'}
                                            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'GreenTech' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                                            GreenTech
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Startups Grid -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {#if loading}
                                    <div class="col-span-full flex justify-center py-12">
                                        <LoadingSpinner size="lg" />
                                    </div>
                                {:else if filteredStartups.length === 0}
                                    <div class="col-span-full text-center py-12 text-gray-500">
                                        Aucune startup trouvée
                                    </div>
                                {:else}
                                    {#each filteredStartups as startup}
                                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                            <div class="flex items-start justify-between mb-4">
                                                <div class="w-12 h-12 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                                    {startup.name ? startup.name[0] : '?'}
                                                </div>
                                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(startup.project_status)}">
                                                    {startup.project_status || 'Statut inconnu'}
                                                </span>
                                            </div>
                                            
                                            <h3 class="text-lg font-semibold text-gray-900 mb-2 font-['Montserrat']">{startup.name || 'Nom inconnu'}</h3>
                                            <p class="text-sm text-purple-600 mb-3">{startup.sector || 'Secteur non spécifié'}</p>
                                            
                                            <div class="space-y-2 mb-4">
                                                <div class="flex justify-between text-sm">
                                                    <span class="text-gray-500">Maturité:</span>
                                                    <span class="font-medium text-gray-900">{startup.maturity || 'Non spécifiée'}</span>
                                                </div>
                                                <div class="flex justify-between text-sm">
                                                    <span class="text-gray-500">Création:</span>
                                                    <span class="font-medium text-gray-900">
                                                        {startup.created_at ? new Date(startup.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                                    </span>
                                                </div>
                                                {#if startup.needs}
                                                    <div class="text-sm">
                                                        <span class="text-gray-500">Besoins:</span>
                                                        <p class="text-gray-700 text-xs mt-1 line-clamp-2">{startup.needs}</p>
                                                    </div>
                                                {/if}
                                            </div>

                                            <div class="flex gap-2">
                                                <button
                                                    on:click={() => goto(`/startup/${startup.id}`)}
                                                    class="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                    👁️ Voir
                                                </button>
                                                <button
                                                    on:click={() => goto(`/admin/startups/${startup.id}`)}
                                                    class="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200">
                                                    ✏️ Modifier
                                                </button>
                                                <button
                                                    on:click={() => handleDelete('startup', startup.id)}
                                                    class="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <!-- Events Section -->
                    {#if activeSection === 'events'}
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Gestion des événements</h1>
                                <div class="flex gap-2">
                                    <button 
                                        on:click={() => goto('/events')}
                                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                                        ➕ Nouvel événement
                                    </button>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {#if loading}
                                    <div class="col-span-full flex justify-center py-12">
                                        <LoadingSpinner size="lg" />
                                    </div>
                                {:else if events.length === 0}
                                    <div class="col-span-full text-center py-12 text-gray-500">
                                        Aucun événement trouvé
                                    </div>
                                {:else}
                                    {#each events as event}
                                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                            <div class="flex items-start justify-between mb-4">
                                                <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
                                                    <span class="text-xl">📅</span>
                                                </div>
                                                {#if event.featured}
                                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        En vedette
                                                    </span>
                                                {/if}
                                            </div>
                                            
                                            <h3 class="text-lg font-semibold text-gray-900 mb-2 font-['Montserrat']">{event.name}</h3>
                                            <p class="text-sm text-green-600 mb-3">{event.event_type}</p>
                                            
                                            <div class="space-y-2 mb-4">
                                                <div class="flex justify-between text-sm">
                                                    <span class="text-gray-500">Lieu:</span>
                                                    <span class="font-medium text-gray-900">{event.location}</span>
                                                </div>
                                                <div class="flex justify-between text-sm">
                                                    <span class="text-gray-500">Date:</span>
                                                    <span class="font-medium text-gray-900">
                                                        {event.dates ? new Date(event.dates).toLocaleDateString('fr-FR') : 'Date non définie'}
                                                    </span>
                                                </div>
                                                {#if event.target_audience}
                                                    <div class="flex justify-between text-sm">
                                                        <span class="text-gray-500">Public:</span>
                                                        <span class="font-medium text-gray-900">{event.target_audience}</span>
                                                    </div>
                                                {/if}
                                            </div>

                                            <div class="flex gap-2">
                                                <button
                                                    on:click={() => goto('/events')}
                                                    class="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200">
                                                    ✏️ Modifier
                                                </button>
                                                <button
                                                    on:click={() => handleDelete('event', event.firebaseId)}
                                                    class="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <!-- News Section -->
                    {#if activeSection === 'news'}
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Gestion des actualités</h1>
                                <div class="flex gap-2">
                                    <button 
                                        on:click={() => goto('/news')}
                                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                                        ➕ Nouvelle actualité
                                    </button>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {#if loading}
                                    <div class="col-span-full flex justify-center py-12">
                                        <LoadingSpinner size="lg" />
                                    </div>
                                {:else if news.length === 0}
                                    <div class="col-span-full text-center py-12 text-gray-500">
                                        Aucune actualité trouvée
                                    </div>
                                {:else}
                                    {#each news as article}
                                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                            <div class="flex items-start justify-between mb-4">
                                                <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
                                                    <span class="text-xl">📰</span>
                                                </div>
                                                <div class="flex flex-col gap-1">
                                                    {#if article.featured}
                                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            En vedette
                                                        </span>
                                                    {/if}
                                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(article.status)}">
                                                        {article.status === 'published' ? 'Publié' : article.status === 'draft' ? 'Brouillon' : article.status}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <h3 class="text-lg font-semibold text-gray-900 mb-2 font-['Montserrat']">{article.title}</h3>
                                            <p class="text-sm text-orange-600 mb-3">{article.category}</p>
                                            
                                            <div class="space-y-2 mb-4">
                                                <div class="flex justify-between text-sm">
                                                    <span class="text-gray-500">Lieu:</span>
                                                    <span class="font-medium text-gray-900">{article.location}</span>
                                                </div>
                                                <div class="flex justify-between text-sm">
                                                    <span class="text-gray-500">Date:</span>
                                                    <span class="font-medium text-gray-900">
                                                        {article.news_date ? new Date(article.news_date).toLocaleDateString('fr-FR') : 'Date non définie'}
                                                    </span>
                                                </div>
                                                {#if article.description}
                                                    <div class="text-sm">
                                                        <p class="text-gray-700 text-xs mt-1 line-clamp-3">{article.description}</p>
                                                    </div>
                                                {/if}
                                            </div>

                                            <div class="flex gap-2">
                                                <button
                                                    on:click={() => goto('/news')}
                                                    class="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-orange-100 text-orange-700 hover:bg-orange-200">
                                                    ✏️ Modifier
                                                </button>
                                                <button
                                                    on:click={() => handleDelete('news', article.firebaseId)}
                                                    class="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <!-- Analytics Section -->
                    {#if activeSection === 'analytics'}
                        <div class="space-y-6">
                            <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Analytics</h1>
                            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                                <span class="text-6xl mb-4 block">📊</span>
                                <h2 class="text-xl font-semibold text-gray-900 mb-2">Analytics avancées</h2>
                                <p class="text-gray-600">Cette section sera développée prochainement avec des graphiques détaillés et des métriques avancées.</p>
                            </div>
                        </div>
                    {/if}

                    <!-- Settings Section -->
                    {#if activeSection === 'settings'}
                        <div class="space-y-6">
                            <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Paramètres</h1>
                            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                                <span class="text-6xl mb-4 block">⚙️</span>
                                <h2 class="text-xl font-semibold text-gray-900 mb-2">Paramètres système</h2>
                                <p class="text-gray-600">Configuration générale, permissions, sauvegardes et autres paramètres d'administration.</p>
                            </div>
                        </div>
                    {/if}

                </div>
            </div>
        </div>
    {/if}

    <Footer />
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');

    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* Scrollbar pour la sidebar */
    .overflow-y-auto::-webkit-scrollbar {
        width: 4px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #c174f2;
        border-radius: 2px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: #cb90f1;
    }
</style>