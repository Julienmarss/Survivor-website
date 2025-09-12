<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import StartupModal from '../modals/StartupModal.svelte';
    import BulkActionsStartupPanel from '../panels/BulkActionsStartupPanel.svelte';
    
    const dispatch = createEventDispatcher();
    
    export let user = null;
    
    let loading = false;
    let error = null;
    let searchTerm = '';
    let selectedSector = 'all';
    let selectedMaturity = 'all';
    let selectedStatus = 'all';
    let showStartupModal = false;
    let editingStartup = null;
    let selectedStartups = [];
    let showBulkPanel = false;
    let showAnalytics = false;
    let selectedStartupForAnalytics = null;
    
    let startups = [];
    let sectors = [];
    let stats = {
        total: 0,
        bySector: [],
        byMaturity: [],
        byStatus: [],
        newThisMonth: 0,
        newThisWeek: 0,
        activeProjects: 0,
        needsFunding: 0,
        topSectors: [],
        recentStartups: [],
        monthlyGrowth: []
    };
    
    let pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    };

    const API_BASE = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

    async function loadStartups(page = 1) {
        try {
            loading = true;
            error = null;

            console.log('=== CHARGEMENT STARTUPS ADMIN ===');
            console.log('1. User:', user?.email);
            console.log('2. Token disponible:', !!user?.token);

            if (!user?.token) {
                throw new Error('Token d\'authentification manquant');
            }

            // Préparer les paramètres
            const params = {
                page,
                limit: pagination.limit
            };

            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }

            if (selectedSector !== 'all') {
                params.sector = selectedSector;
            }

            if (selectedMaturity !== 'all') {
                params.maturity = selectedMaturity;
            }

            if (selectedStatus !== 'all') {
                params.projectStatus = selectedStatus;
            }

            console.log('3. Paramètres de requête:', params);

            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_BASE}/admin/startups?${queryString}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('4. Réponse status:', response.status);

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('5. Données reçues:', data);

            if (data.success) {
                startups = data.data.startups || [];
                pagination = data.data.pagination || {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0
                };
                console.log('6. ✅ Startups chargées:', startups.length);
            } else {
                throw new Error(data.message || 'Erreur lors du chargement');
            }

        } catch (err) {
            console.error('❌ ERREUR CHARGEMENT STARTUPS:', err);
            error = err.message;
            
            // Données de test en cas d'erreur
            if (!err.message.includes('authentification')) {
                console.log('🔄 Utilisation de données de test...');
                startups = [
                    {
                        id: 'test-1',
                        name: 'TestCorp',
                        description: 'Startup de test',
                        sector: 'FinTech',
                        maturity: 'MVP',
                        project_status: 'Active',
                        email: 'test@testcorp.com',
                        phone: '+33123456789',
                        created_at: new Date().toISOString(),
                        founders: [{ name: 'John Doe' }]
                    }
                ];
                pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };
            }
        } finally {
            loading = false;
        }
    }

    async function loadStats() {
        try {
            const response = await fetch(`${API_BASE}/admin/startups/stats`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    stats = data.data;
                }
            }
        } catch (err) {
            console.error('Erreur chargement stats:', err);
        }
    }

    async function loadSectors() {
        try {
            const response = await fetch(`${API_BASE}/admin/startups/sectors`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    sectors = data.data || [];
                }
            }
        } catch (err) {
            console.error('Erreur chargement secteurs:', err);
        }
    }

    async function syncWithJebApi() {
        try {
            loading = true;
            
            const response = await fetch(`${API_BASE}/admin/startups/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                await Promise.all([
                    loadStartups(pagination.page),
                    loadStats(),
                    loadSectors()
                ]);
                showSuccessMessage(`Synchronisation réussie: ${data.data.created} créées, ${data.data.updated} mises à jour`);
            } else {
                throw new Error(data.message || 'Erreur de synchronisation');
            }
        } catch (err) {
            console.error('Erreur sync:', err);
            error = 'Erreur lors de la synchronisation: ' + err.message;
        } finally {
            loading = false;
        }
    }

    async function deleteStartup(startupId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette startup ?')) {
            return;
        }

        try {
            loading = true;
            const response = await fetch(`${API_BASE}/admin/startups/${startupId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                await Promise.all([
                    loadStartups(pagination.page),
                    loadStats()
                ]);
                showSuccessMessage('Startup supprimée avec succès');
            } else {
                throw new Error(data.message || 'Erreur lors de la suppression');
            }
        } catch (err) {
            console.error('Erreur suppression:', err);
            error = 'Impossible de supprimer la startup: ' + err.message;
        } finally {
            loading = false;
        }
    }

    async function exportStartupsCSV() {
        try {
            loading = true;
            
            const filters = {};
            if (selectedSector !== 'all') {
                filters.sector = selectedSector;
            }
            if (selectedMaturity !== 'all') {
                filters.maturity = selectedMaturity;
            }
            if (searchTerm.trim()) {
                filters.search = searchTerm.trim();
            }

            const queryString = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_BASE}/admin/startups/export/csv?${queryString}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    downloadFile(data.data, `startups-export-${new Date().toISOString().split('T')[0]}.csv`);
                    showSuccessMessage('Export réussi !');
                } else {
                    throw new Error(data.message || 'Erreur lors de l\'export');
                }
            } else {
                throw new Error(`Erreur ${response.status}`);
            }
        } catch (err) {
            console.error('Erreur export:', err);
            error = 'Erreur lors de l\'export: ' + err.message;
        } finally {
            loading = false;
        }
    }

    async function viewStartupAnalytics(startupId) {
        try {
            const response = await fetch(`${API_BASE}/admin/startups/${startupId}/analytics`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    selectedStartupForAnalytics = {
                        startup: startups.find(s => s.id === startupId),
                        analytics: data.data
                    };
                    showAnalytics = true;
                }
            }
        } catch (err) {
            console.error('Erreur analytics:', err);
            error = 'Erreur lors du chargement des analytics';
        }
    }

    function downloadFile(data, filename) {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
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
        dispatch('success', { message });
    }

    function openCreateModal() {
        editingStartup = null;
        showStartupModal = true;
    }

    function openEditModal(startup) {
        editingStartup = startup;
        showStartupModal = true;
    }

    function closeStartupModal() {
        showStartupModal = false;
        editingStartup = null;
    }

    function handleStartupSaved() {
        closeStartupModal();
        Promise.all([
            loadStartups(pagination.page),
            loadStats()
        ]);
        showSuccessMessage(editingStartup ? 'Startup modifiée' : 'Startup créée');
    }

    function toggleStartupSelection(startupId) {
        if (selectedStartups.includes(startupId)) {
            selectedStartups = selectedStartups.filter(id => id !== startupId);
        } else {
            selectedStartups = [...selectedStartups, startupId];
        }
        showBulkPanel = selectedStartups.length > 0;
    }

    function selectAllStartups() {
        if (selectedStartups.length === startups.length) {
            selectedStartups = [];
        } else {
            selectedStartups = startups.map(s => s.id);
        }
        showBulkPanel = selectedStartups.length > 0;
    }

    function handleBulkAction(event) {
        selectedStartups = [];
        showBulkPanel = false;
        Promise.all([
            loadStartups(pagination.page),
            loadStats()
        ]);
        showSuccessMessage(`Action en lot effectuée : ${event.detail.action}`);
    }

    function getSectorColor(sector) {
        const colors = {
            'FinTech': 'bg-green-100 text-green-800',
            'HealthTech': 'bg-red-100 text-red-800',
            'EdTech': 'bg-blue-100 text-blue-800',
            'GreenTech': 'bg-emerald-100 text-emerald-800',
            'AgriTech': 'bg-yellow-100 text-yellow-800',
            'PropTech': 'bg-purple-100 text-purple-800',
            'FoodTech': 'bg-orange-100 text-orange-800',
            'RetailTech': 'bg-pink-100 text-pink-800'
        };
        return colors[sector] || 'bg-gray-100 text-gray-800';
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Seeking Investment': return 'bg-blue-100 text-blue-800';
            case 'Paused': return 'bg-yellow-100 text-yellow-800';
            case 'Completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getMaturityColor(maturity) {
        switch (maturity) {
            case 'Idéation': return 'bg-purple-100 text-purple-800';
            case 'Prototype': return 'bg-indigo-100 text-indigo-800';
            case 'MVP': return 'bg-blue-100 text-blue-800';
            case 'Validation': return 'bg-cyan-100 text-cyan-800';
            case 'Traction': return 'bg-green-100 text-green-800';
            case 'Croissance': return 'bg-yellow-100 text-yellow-800';
            case 'Scale-up': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function changePage(newPage) {
        loadStartups(newPage);
    }

    let searchTimeout;
    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            pagination.page = 1;
            loadStartups(1);
        }, 500);
    }

    function handleFilterChange() {
        pagination.page = 1;
        loadStartups(1);
    }

    onMount(async () => {
        if (!user?.token) {
            error = 'Authentification requise';
            return;
        }

        await Promise.all([
            loadStartups(),
            loadStats(),
            loadSectors()
        ]);
    });
</script>

<div class="space-y-6">
    <!-- Header avec stats rapides -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Gestion des startups</h1>
            <div class="flex items-center gap-6 mt-2">
                <div class="text-sm text-gray-600">
                    <span class="font-semibold text-purple-600">{stats.total}</span> startups
                </div>
                <div class="text-sm text-gray-600">
                    <span class="font-semibold text-green-600">{stats.activeProjects}</span> actives
                </div>
                <div class="text-sm text-gray-600">
                    <span class="font-semibold text-blue-600">{stats.newThisMonth}</span> ce mois
                </div>
            </div>
        </div>
        <div class="flex gap-2">
            <button 
                on:click={syncWithJebApi}
                disabled={loading}
                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50">
                {#if loading}
                    <LoadingSpinner size="sm" color="#ffffff" />
                {:else}
                    🔄
                {/if}
                Sync JEB API
            </button>
            <button 
                on:click={exportStartupsCSV}
                disabled={loading}
                class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50">
                {#if loading}
                    <LoadingSpinner size="sm" color="#ffffff" />
                {:else}
                    📥
                {/if}
                Exporter
            </button>
            <button 
                on:click={openCreateModal}
                class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                ➕ Nouvelle startup
            </button>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span class="text-purple-600 font-bold">🏢</span>
                    </div>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-500">Total</p>
                    <p class="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span class="text-green-600 font-bold">✅</span>
                    </div>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-500">Actives</p>
                    <p class="text-2xl font-semibold text-gray-900">{stats.activeProjects}</p>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 font-bold">💰</span>
                    </div>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-500">Cherchent financement</p>
                    <p class="text-2xl font-semibold text-gray-900">{stats.needsFunding}</p>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span class="text-yellow-600 font-bold">📈</span>
                    </div>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-500">Nouvelles (mois)</p>
                    <p class="text-2xl font-semibold text-gray-900">{stats.newThisMonth}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Message d'erreur -->
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
                        on:click={() => loadStartups(pagination.page)}
                        class="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors">
                        Réessayer
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Filtres -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
                <div class="relative">
                    <input
                        type="text"
                        placeholder="Rechercher par nom, description..."
                        bind:value={searchTerm}
                        on:input={debounceSearch}
                        class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                </div>
            </div>
            <div class="flex gap-2 flex-wrap">
                <select 
                    bind:value={selectedSector} 
                    on:change={handleFilterChange}
                    class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="all">Tous les secteurs</option>
                    {#each sectors as sector}
                        <option value={sector.name}>{sector.name} ({sector.count})</option>
                    {/each}
                </select>

                <select 
                    bind:value={selectedMaturity} 
                    on:change={handleFilterChange}
                    class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="all">Toutes maturités</option>
                    <option value="Idéation">Idéation</option>
                    <option value="Prototype">Prototype</option>
                    <option value="MVP">MVP</option>
                    <option value="Validation">Validation</option>
                    <option value="Traction">Traction</option>
                    <option value="Croissance">Croissance</option>
                    <option value="Scale-up">Scale-up</option>
                </select>

                <select 
                    bind:value={selectedStatus} 
                    on:change={handleFilterChange}
                    class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="all">Tous les statuts</option>
                    <option value="Active">Active</option>
                    <option value="Seeking Investment">Seeking Investment</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Panel d'actions en lot -->
    {#if showBulkPanel}
        <BulkActionsStartupPanel 
            selectedStartups={selectedStartups} 
            {user}
            on:action={handleBulkAction}
            on:close={() => { selectedStartups = []; showBulkPanel = false; }}
        />
    {/if}

    <!-- Tableau des startups -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {#if selectedStartups.length > 0}
            <div class="bg-purple-50 border-b border-purple-200 px-6 py-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-purple-800">
                        {selectedStartups.length} startup{selectedStartups.length > 1 ? 's' : ''} sélectionnée{selectedStartups.length > 1 ? 's' : ''}
                    </span>
                    <button
                        on:click={() => { selectedStartups = []; showBulkPanel = false; }}
                        class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        Désélectionner tout
                    </button>
                </div>
            </div>
        {/if}
        
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left">
                            <input
                                type="checkbox"
                                checked={selectedStartups.length === startups.length && startups.length > 0}
                                on:change={selectAllStartups}
                                class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Startup</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Secteur</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maturité</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fondateurs</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créée</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {#if loading}
                        <tr>
                            <td colspan="8" class="px-6 py-8 text-center">
                                <LoadingSpinner size="lg" />
                            </td>
                        </tr>
                    {:else if startups.length === 0}
                        <tr>
                            <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                                {error ? 'Erreur de chargement' : 'Aucune startup trouvée'}
                            </td>
                        </tr>
                    {:else}
                        {#each startups as startup}
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedStartups.includes(startup.id)}
                                        on:change={() => toggleStartupSelection(startup.id)}
                                        class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-lg flex items-center justify-center text-white font-bold">
                                            {startup.name.charAt(0)}
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">{startup.name}</div>
                                            <div class="text-sm text-gray-500 max-w-xs truncate">{startup.description || 'Pas de description'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getMaturityColor(startup.maturity)}">
                                        {startup.maturity}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(startup.project_status)}">
                                        {startup.project_status || 'N/A'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {#if startup.founders && startup.founders.length > 0}
                                        <div class="flex items-center">
                                            <div class="flex -space-x-2">
                                                {#each startup.founders.slice(0, 3) as founder}
                                                    <div class="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white">
                                                        {founder.name.charAt(0)}
                                                    </div>
                                                {/each}
                                            </div>
                                            {#if startup.founders.length > 3}
                                                <span class="ml-2 text-xs text-gray-500">+{startup.founders.length - 3}</span>
                                            {/if}
                                        </div>
                                    {:else}
                                        <span class="text-gray-400">Aucun fondateur</span>
                                    {/if}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {startup.created_at ? new Date(startup.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div class="flex items-center justify-end gap-2">
                                        <button
                                            on:click={() => viewStartupAnalytics(startup.id)}
                                            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                                            title="Voir les analytics">
                                            📊
                                        </button>
                                        <button
                                            on:click={() => openEditModal(startup)}
                                            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200"
                                            title="Modifier">
                                            ✏️
                                        </button>
                                        <button
                                            on:click={() => deleteStartup(startup.id)}
                                            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                                            title="Supprimer">
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        {#if pagination.totalPages > 1}
            <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div class="flex items-center justify-between">
                    <div class="flex justify-between sm:hidden">
                        <button
                            on:click={() => changePage(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                            Précédent
                        </button>
                        <button
                            on:click={() => changePage(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                            Suivant
                        </button>
                    </div>
                    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm text-gray-700">
                                Affichage de <span class="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                                à <span class="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                                sur <span class="font-medium">{pagination.total}</span> résultats
                            </p>
                        </div>
                        <div>
                            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    on:click={() => changePage(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </button>

                                {#each Array.from({length: Math.min(pagination.totalPages, 7)}, (_, i) => i + 1) as pageNumber}
                                    <button
                                        on:click={() => changePage(pageNumber)}
                                        class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {
                                            pageNumber === pagination.page
                                                ? 'z-10 bg-[#c174f2] border-[#c174f2] text-white'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        }">
                                        {pageNumber}
                                    </button>
                                {/each}

                                <button
                                    on:click={() => changePage(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- Modal startup -->
{#if showStartupModal}
    <StartupModal 
        {user}
        {editingStartup}
        on:close={closeStartupModal}
        on:saved={handleStartupSaved}
    />
{/if}

<!-- Modal Analytics -->
{#if showAnalytics && selectedStartupForAnalytics}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => showAnalytics = false}></div>

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 font-['Montserrat']">
                            Analytics - {selectedStartupForAnalytics.startup.name}
                        </h3>
                        <button
                            on:click={() => showAnalytics = false}
                            class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600">{selectedStartupForAnalytics.analytics.views || 0}</div>
                            <div class="text-sm text-blue-800">Vues totales</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="text-2xl font-bold text-green-600">{selectedStartupForAnalytics.analytics.contacts || 0}</div>
                            <div class="text-sm text-green-800">Contacts</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <div class="text-2xl font-bold text-purple-600">{selectedStartupForAnalytics.analytics.shares || 0}</div>
                            <div class="text-sm text-purple-800">Partages</div>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg">
                            <div class="text-2xl font-bold text-yellow-600">{selectedStartupForAnalytics.analytics.engagementRate?.toFixed(1) || 0}%</div>
                            <div class="text-sm text-yellow-800">Engagement</div>
                        </div>
                    </div>

                    {#if selectedStartupForAnalytics.analytics.topReferrers}
                        <div class="mt-6">
                            <h4 class="text-md font-semibold text-gray-900 mb-3">Sources de trafic</h4>
                            <div class="space-y-2">
                                {#each selectedStartupForAnalytics.analytics.topReferrers as referrer}
                                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <span class="text-sm font-medium">{referrer.source}</span>
                                        <span class="text-sm text-gray-600">{referrer.count} visites</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        on:click={() => showAnalytics = false}
                        class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>