<!-- src/routes/admin/startups/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { userStore } from '$lib/stores/userStore.js';
    import { goto } from '$app/navigation';
    import Header from '../../../lib/components/Header.svelte';
    import Footer from '../../../lib/components/Footer.svelte';
    import LoadingSpinner from '../../../lib/components/LoadingSpinner.svelte';
    import ErrorMessage from '../../../lib/components/ErrorMessage.svelte';

    // États
    let user = null;
    let loading = false;
    let error = null;
    let showModal = false;
    let editingStartup = null;
    let searchTerm = '';
    let selectedSector = 'all';
    let selectedStatus = 'all';

    // Données
    let startups = [];
    let sectors = [];
    let pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    };

    // Formulaire
    let formData = {
        name: '',
        description: '',
        sector: '',
        maturity: 'Idéation',
        project_status: 'En cours',
        needs: '',
        website_url: '',
        contact_email: '',
        founders: []
    };

    // Configuration API
    const API_BASE = `${import.meta.env.PUBLIC_APIURL || 'http://localhost:3000'}/api`;

    // S'abonner au store utilisateur
    userStore.subscribe(value => {
        user = value;
        if (user && !isAdmin(user)) {
            goto('/');
        }
    });

    function isAdmin(user) {
        return user?.role === 'admin' || user?.isAdmin === true;
    }

    async function loadStartups(page = 1) {
        try {
            loading = true;
            error = null;

            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });

            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }

            if (selectedSector !== 'all') {
                params.append('sector', selectedSector);
            }

            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }

            const response = await fetch(`${API_BASE}/startups?${params}`);
            const data = await response.json();

            if (data.success) {
                startups = data.data;
                pagination = {
                    page: data.page,
                    limit: data.limit,
                    total: data.total,
                    totalPages: data.totalPages
                };
            } else {
                throw new Error(data.message || 'Erreur lors du chargement');
            }
        } catch (err) {
            console.error('Erreur:', err);
            error = 'Impossible de charger les startups';
        } finally {
            loading = false;
        }
    }

    async function loadSectors() {
        try {
            const response = await fetch(`${API_BASE}/startups/sectors`);
            const data = await response.json();

            if (data.success) {
                sectors = data.data || data;
            }
        } catch (err) {
            console.error('Erreur secteurs:', err);
        }
    }

    async function syncWithAPI() {
        try {
            loading = true;
            const response = await fetch(`${API_BASE}/startups/sync`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                await loadStartups();
                showSuccessMessage('Synchronisation réussie !');
            } else {
                throw new Error(data.message || 'Erreur de synchronisation');
            }
        } catch (err) {
            console.error('Erreur sync:', err);
            error = 'Erreur lors de la synchronisation';
        } finally {
            loading = false;
        }
    }

    async function deleteStartup(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette startup ?')) {
            return;
        }

        try {
            loading = true;
            const response = await fetch(`${API_BASE}/startups/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                await loadStartups(pagination.page);
                showSuccessMessage('Startup supprimée avec succès');
            } else {
                throw new Error(data.message || 'Erreur lors de la suppression');
            }
        } catch (err) {
            console.error('Erreur suppression:', err);
            error = 'Impossible de supprimer la startup';
        } finally {
            loading = false;
        }
    }

    async function saveStartup() {
        try {
            loading = true;
            error = null;

            const method = editingStartup ? 'PUT' : 'POST';
            const url = editingStartup
                ? `${API_BASE}/startups/${editingStartup.id}`
                : `${API_BASE}/startups`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                closeModal();
                await loadStartups(pagination.page);
                showSuccessMessage(editingStartup ? 'Startup modifiée' : 'Startup créée');
            } else {
                throw new Error(data.message || 'Erreur lors de la sauvegarde');
            }
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            error = 'Impossible de sauvegarder la startup';
        } finally {
            loading = false;
        }
    }

    function openCreateModal() {
        editingStartup = null;
        formData = {
            name: '',
            description: '',
            sector: '',
            maturity: 'Idéation',
            project_status: 'En cours',
            needs: '',
            website_url: '',
            contact_email: '',
            founders: []
        };
        showModal = true;
    }

    function openEditModal(startup) {
        editingStartup = startup;
        formData = {
            name: startup.name || '',
            description: startup.description || '',
            sector: startup.sector || '',
            maturity: startup.maturity || 'Idéation',
            project_status: startup.project_status || 'En cours',
            needs: startup.needs || '',
            website_url: startup.website_url || '',
            contact_email: startup.contact_email || '',
            founders: startup.founders || []
        };
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        editingStartup = null;
        error = null;
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

    function handleSearch() {
        pagination.page = 1;
        loadStartups(1);
    }

    function handleSectorFilter() {
        pagination.page = 1;
        loadStartups(1);
    }

    function handleStatusFilter() {
        pagination.page = 1;
        loadStartups(1);
    }

    function changePage(newPage) {
        loadStartups(newPage);
    }

    // Debounce pour la recherche
    let searchTimeout;
    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 500);
    }

    onMount(async () => {
        await userStore.init();

        if (!user || !isAdmin(user)) {
            goto('/');
            return;
        }

        await Promise.all([
            loadStartups(),
            loadSectors()
        ]);
    });
</script>

<svelte:head>
    <title>Gestion des Startups - Admin JEB Incubator</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
    <Header />

    <!-- Vérification des permissions -->
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
        <!-- Affichage des erreurs -->
        {#if error}
            <ErrorMessage message={error} onRetry={() => loadStartups(pagination.page)} />
        {/if}

        <!-- En-tête -->
        <section class="pt-24 pb-8 px-6 sm:px-8 lg:px-12">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 class="text-4xl font-bold text-gray-900 mb-2 font-['Montserrat']">
                            Gestion des Startups
                        </h1>
                        <p class="text-xl text-gray-600 font-['Open_Sans']">
                            Administrez les startups de l'incubateur
                        </p>
                    </div>
                    <div class="mt-4 lg:mt-0 flex gap-3">
                        <button
                                on:click={syncWithAPI}
                                disabled={loading}
                                class="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 disabled:opacity-50">
                            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            Synchroniser
                        </button>
                        <button
                                on:click={openCreateModal}
                                class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Ajouter Startup
                        </button>
                    </div>
                </div>

                <!-- Filtres -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div class="grid md:grid-cols-4 gap-4">
                        <div>
                            <label for="search" class="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
                            <input
                                    id="search"
                                    type="text"
                                    bind:value={searchTerm}
                                    on:input={debounceSearch}
                                    placeholder="Nom, description..."
                                    class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                            />
                        </div>

                        <div>
                            <label for="sector" class="block text-sm font-semibold text-gray-700 mb-2">Secteur</label>
                            <select
                                    id="sector"
                                    bind:value={selectedSector}
                                    on:change={handleSectorFilter}
                                    class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                            >
                                <option value="all">Tous les secteurs</option>
                                {#each sectors as sector}
                                    <option value={sector.name}>{sector.name}</option>
                                {/each}
                            </select>
                        </div>

                        <div>
                            <label for="status" class="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
                            <select
                                    id="status"
                                    bind:value={selectedStatus}
                                    on:change={handleStatusFilter}
                                    class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="En cours">En cours</option>
                                <option value="Suspendu">Suspendu</option>
                                <option value="Terminé">Terminé</option>
                                <option value="Archivé">Archivé</option>
                            </select>
                        </div>

                        <div class="flex items-end">
                            <div class="text-sm text-gray-600">
                                <strong>{pagination.total}</strong> startups au total
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Liste des startups -->
        <section class="pb-20 px-6 sm:px-8 lg:px-12">
            <div class="max-w-7xl mx-auto">
                {#if loading}
                    <div class="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                {:else if startups.length === 0}
                    <div class="text-center py-12">
                        <p class="text-gray-500 text-lg mb-4">Aucune startup trouvée.</p>
                        <button
                                on:click={openCreateModal}
                                class="bg-[#c174f2] text-white px-6 py-2 rounded-full hover:bg-[#cb90f1] transition-colors duration-300">
                            Créer la première startup
                        </button>
                    </div>
                {:else}
                    <!-- Table des startups -->
                    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Startup</th>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Secteur</th>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maturité</th>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                                    <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                {#each startups as startup}
                                    <tr class="hover:bg-gray-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-10 w-10">
                                                    <div class="h-10 w-10 rounded-full bg-gradient-to-r from-[#c174f2] to-[#f18585] flex items-center justify-center">
                                                        <span class="text-white font-bold text-sm">{startup.name.charAt(0)}</span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">{startup.name}</div>
                                                    <div class="text-sm text-gray-500 max-w-xs truncate">{startup.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {startup.sector}
                        </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {startup.maturity}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {
                          startup.project_status === 'En cours' ? 'bg-green-100 text-green-800' :
                          startup.project_status === 'Suspendu' ? 'bg-yellow-100 text-yellow-800' :
                          startup.project_status === 'Terminé' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }">
                          {startup.project_status}
                        </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(startup.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex justify-end space-x-2">
                                                <button
                                                        on:click={() => openEditModal(startup)}
                                                        class="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition-colors duration-200">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                        on:click={() => deleteStartup(startup.id)}
                                                        class="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors duration-200">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                {/each}
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

                                                {#each Array.from({length: pagination.totalPages}, (_, i) => i + 1) as pageNumber}
                                                    {#if pageNumber <= 5 || (pageNumber >= pagination.totalPages - 2)}
                                                        <button
                                                                on:click={() => changePage(pageNumber)}
                                                                class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {
                                pageNumber === pagination.page
                                  ? 'z-10 bg-[#c174f2] border-[#c174f2] text-white'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }">
                                                            {pageNumber}
                                                        </button>
                                                    {:else if pageNumber === 6}
                                                        <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                                                    {/if}
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
                {/if}
            </div>
        </section>
    {/if}

    <!-- Modal de création/édition -->
    {#if showModal}
        <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={closeModal}></div>

                <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form on:submit|preventDefault={saveStartup}>
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="sm:flex sm:items-start">
                                <div class="w-full">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        {editingStartup ? 'Modifier la startup' : 'Créer une nouvelle startup'}
                                    </h3>

                                    <div class="space-y-4">
                                        <div>
                                            <label for="name" class="block text-sm font-medium text-gray-700">Nom *</label>
                                            <input
                                                    type="text"
                                                    id="name"
                                                    bind:value={formData.name}
                                                    required
                                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                    placeholder="Nom de la startup"
                                            />
                                        </div>

                                        <div>
                                            <label for="description" class="block text-sm font-medium text-gray-700">Description *</label>
                                            <textarea
                                                    id="description"
                                                    bind:value={formData.description}
                                                    required
                                                    rows="3"
                                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                    placeholder="Description de la startup"
                                            ></textarea>
                                        </div>

                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label for="sector" class="block text-sm font-medium text-gray-700">Secteur *</label>
                                                <select
                                                        id="sector"
                                                        bind:value={formData.sector}
                                                        required
                                                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                >
                                                    <option value="">Sélectionner...</option>
                                                    <option value="HealthTech">HealthTech</option>
                                                    <option value="FinTech">FinTech</option>
                                                    <option value="EdTech">EdTech</option>
                                                    <option value="GreenTech">GreenTech</option>
                                                    <option value="AgriTech">AgriTech</option>
                                                    <option value="CyberSecurity">CyberSecurity</option>
                                                    <option value="Tech">Tech</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label for="maturity" class="block text-sm font-medium text-gray-700">Maturité</label>
                                                <select
                                                        id="maturity"
                                                        bind:value={formData.maturity}
                                                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                >
                                                    <option value="Idéation">Idéation</option>
                                                    <option value="Prototype">Prototype</option>
                                                    <option value="Validation">Validation</option>
                                                    <option value="Croissance">Croissance</option>
                                                    <option value="Scale-up">Scale-up</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label for="project_status" class="block text-sm font-medium text-gray-700">Statut du projet</label>
                                                <select
                                                        id="project_status"
                                                        bind:value={formData.project_status}
                                                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                >
                                                    <option value="En cours">En cours</option>
                                                    <option value="Suspendu">Suspendu</option>
                                                    <option value="Terminé">Terminé</option>
                                                    <option value="Archivé">Archivé</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label for="contact_email" class="block text-sm font-medium text-gray-700">Email de contact</label>
                                                <input
                                                        type="email"
                                                        id="contact_email"
                                                        bind:value={formData.contact_email}
                                                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                        placeholder="contact@startup.com"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label for="website_url" class="block text-sm font-medium text-gray-700">Site web</label>
                                            <input
                                                    type="url"
                                                    id="website_url"
                                                    bind:value={formData.website_url}
                                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                    placeholder="https://www.startup.com"
                                            />
                                        </div>

                                        <div>
                                            <label for="needs" class="block text-sm font-medium text-gray-700">Besoins</label>
                                            <textarea
                                                    id="needs"
                                                    bind:value={formData.needs}
                                                    rows="2"
                                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                    placeholder="Financement, mentoring, partenariats..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                    type="submit"
                                    disabled={loading}
                                    class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-base font-medium text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c174f2] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {#if loading}
                                    <LoadingSpinner size="sm" color="#ffffff" />
                                {:else}
                                    {editingStartup ? 'Modifier' : 'Créer'}
                                {/if}
                            </button>
                            <button
                                    type="button"
                                    on:click={closeModal}
                                    class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    {/if}

    <Footer />
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>