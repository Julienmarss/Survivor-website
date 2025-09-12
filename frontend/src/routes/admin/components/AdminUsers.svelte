<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import UserModal from '../modals/UserModal.svelte';
    import BulkActionsPanel from '../panels/BulkActionsPanel.svelte';
    import authApi from '$lib/services/authApi.js'; // Import par défaut
    
    const dispatch = createEventDispatcher();
    
    export let user = null;
    
    let loading = false;
    let error = null;
    let searchTerm = '';
    let selectedFilter = 'all';
    let showUserModal = false;
    let editingUser = null;
    let selectedUsers = [];
    let showBulkPanel = false;
    
    let users = [];
    let pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    };

    async function loadUsers(page = 1) {
        try {
            loading = true;
            error = null;

            console.log('=== CHARGEMENT UTILISATEURS ===');
            console.log('1. User reçu:', user?.email);
            console.log('2. Token disponible:', !!authApi.getToken());

            // Vérifier l'authentification
            if (!authApi.isAuthenticated()) {
                throw new Error('Non authentifié - veuillez vous reconnecter');
            }

            // Si pas d'utilisateur, le récupérer
            if (!user) {
                console.log('3. Récupération de l\'utilisateur actuel...');
                const currentUserResponse = await authApi.getCurrentUser();
                if (currentUserResponse.success) {
                    user = currentUserResponse.data.user;
                    console.log('4. Utilisateur récupéré:', user.email);
                } else {
                    throw new Error('Impossible de récupérer l\'utilisateur');
                }
            }

            // Vérifier les permissions admin
            if (!isAdmin(user)) {
                throw new Error('Permissions administrateur requises');
            }

            // Préparer les paramètres
            const params = {
                page,
                limit: pagination.limit
            };

            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }

            if (selectedFilter !== 'all') {
                params.role = selectedFilter;
            }

            console.log('5. Paramètres de requête:', params);

            // Appel API
            const response = await authApi.getAllUsers(params);
            console.log('6. Réponse API:', response);

            if (response.success) {
                users = response.data.users || [];
                pagination = response.data.pagination || {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0
                };
                console.log('7. ✅ Utilisateurs chargés:', users.length);
            } else {
                throw new Error(response.message || 'Erreur lors du chargement');
            }

        } catch (err) {
            console.error('❌ ERREUR CHARGEMENT UTILISATEURS:', err);
            error = err.message;
            
            // Données de fallback uniquement en cas d'erreur
            if (err.message.includes('authentifié') || err.message.includes('permission')) {
                users = [];
            } else {
                console.log('🔄 Utilisation de données de test...');
                users = [
                    {
                        id: 'test-1',
                        email: 'test@example.com',
                        firstName: 'Test',
                        lastName: 'User',
                        role: 'user',
                        isActive: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'test-2',
                        email: 'startup@example.com',
                        firstName: 'Test',
                        lastName: 'Startup',
                        role: 'startup',
                        isActive: true,
                        createdAt: new Date().toISOString()
                    }
                ];
                pagination = { page: 1, limit: 20, total: 2, totalPages: 1 };
            }
        } finally {
            loading = false;
        }
    }

    async function deleteUser(userId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            return;
        }

        try {
            loading = true;
            const response = await authApi.deleteUser(userId);

            if (response.success) {
                await loadUsers(pagination.page);
                showSuccessMessage('Utilisateur supprimé avec succès');
            } else {
                throw new Error(response.message || 'Erreur lors de la suppression');
            }
        } catch (err) {
            console.error('Erreur suppression:', err);
            error = 'Impossible de supprimer l\'utilisateur: ' + err.message;
        } finally {
            loading = false;
        }
    }

    async function exportUsers() {
        try {
            loading = true;
            
            const filters = {};
            if (selectedFilter !== 'all') {
                filters.role = selectedFilter;
            }
            if (searchTerm.trim()) {
                filters.search = searchTerm.trim();
            }

            const response = await authApi.exportUsersCSV(filters);

            if (response.success) {
                downloadFile(response.data, `users-export-${new Date().toISOString().split('T')[0]}.csv`);
                showSuccessMessage('Export réussi !');
            } else {
                throw new Error(response.message || 'Erreur lors de l\'export');
            }
        } catch (err) {
            console.error('Erreur export:', err);
            error = 'Erreur lors de l\'export: ' + err.message;
        } finally {
            loading = false;
        }
    }

    function downloadFile(data, filename) {
        let blob;
        if (typeof data === 'string') {
            blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        } else {
            blob = data;
        }

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
        editingUser = null;
        showUserModal = true;
    }

    function openEditModal(userData) {
    console.log("🟣 Bouton modifier cliqué :", userData); // ← Ajoute ça
    editingUser = userData;
    showUserModal = true;
    }

    function closeUserModal() {
        showUserModal = false;
        editingUser = null;
    }

    function handleUserSaved() {
        closeUserModal();
        loadUsers(pagination.page);
        showSuccessMessage(editingUser ? 'Utilisateur modifié' : 'Utilisateur créé');
    }

    function toggleUserSelection(userId) {
        if (selectedUsers.includes(userId)) {
            selectedUsers = selectedUsers.filter(id => id !== userId);
        } else {
            selectedUsers = [...selectedUsers, userId];
        }
        showBulkPanel = selectedUsers.length > 0;
    }

    function selectAllUsers() {
        if (selectedUsers.length === users.length) {
            selectedUsers = [];
        } else {
            selectedUsers = users.map(u => u.id);
        }
        showBulkPanel = selectedUsers.length > 0;
    }

    function handleBulkAction(event) {
        selectedUsers = [];
        showBulkPanel = false;
        loadUsers(pagination.page);
        showSuccessMessage(`Action en lot effectuée : ${event.detail.action}`);
    }

    function getUserInitials(userData) {
        const name = userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.name || userData.email;
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    function getRoleColor(role) {
        switch (role) {
            case 'startup': return 'bg-purple-100 text-purple-800';
            case 'investor': return 'bg-green-100 text-green-800';
            case 'user': return 'bg-blue-100 text-blue-800';
            case 'admin': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getRoleLabel(role) {
        switch (role) {
            case 'startup': return 'Startup';
            case 'investor': return 'Investisseur';
            case 'user': return 'Étudiant';
            case 'admin': return 'Admin';
            default: return role;
        }
    }

    function getStatusColor(status) {
        return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }

    function changePage(newPage) {
        loadUsers(newPage);
    }

    function isAdmin(user) {
        return user?.role === 'admin' || user?.isAdmin === true;
    }

    let searchTimeout;
    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            pagination.page = 1;
            loadUsers(1);
        }, 500);
    }

    function handleFilterChange() {
        pagination.page = 1;
        loadUsers(1);
    }

    // Test de connexion API
    async function testConnection() {
        try {
            console.log('🔧 Test de connexion admin...');
            const response = await authApi.testAdminConnection();
            console.log('✅ Test admin réussi:', response);
        } catch (testError) {
            console.log('⚠️ Test admin échoué:', testError);
            
            // Test fallback
            try {
                const noAuthResponse = await authApi.testNoAuthEndpoint();
                console.log('✅ Test sans auth réussi:', noAuthResponse);
            } catch (noAuthError) {
                console.error('❌ Tous les tests ont échoué:', noAuthError);
            }
        }
    }

    onMount(async () => {
        await testConnection();
        await loadUsers();
    });
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900 font-['Montserrat']">Gestion des utilisateurs</h1>
        <div class="flex gap-2">
            <button 
                on:click={exportUsers}
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
                on:click={openCreateModal}
                class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                ➕ Nouvel utilisateur
            </button>
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
                        on:click={() => loadUsers(pagination.page)}
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
                        placeholder="Rechercher par nom, email..."
                        bind:value={searchTerm}
                        on:input={debounceSearch}
                        class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                </div>
            </div>
            <div class="flex gap-2 flex-wrap">
                <button 
                    on:click={() => { selectedFilter = 'all'; handleFilterChange(); }}
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'all' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                    Tous
                </button>
                <button 
                    on:click={() => { selectedFilter = 'startup'; handleFilterChange(); }}
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'startup' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                    Startups
                </button>
                <button 
                    on:click={() => { selectedFilter = 'investor'; handleFilterChange(); }}
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'investor' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                    Investisseurs
                </button>
                <button 
                    on:click={() => { selectedFilter = 'user'; handleFilterChange(); }}
                    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedFilter === 'user' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}">
                    Étudiants
                </button>
            </div>
        </div>
    </div>

    <!-- Panel d'actions en lot -->
    {#if showBulkPanel}
        <BulkActionsPanel 
            {selectedUsers} 
            {user}
            on:action={handleBulkAction}
            on:close={() => { selectedUsers = []; showBulkPanel = false; }}
        />
    {/if}

    <!-- Tableau des utilisateurs -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {#if selectedUsers.length > 0}
            <div class="bg-purple-50 border-b border-purple-200 px-6 py-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-purple-800">
                        {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                    </span>
                    <button
                        on:click={() => { selectedUsers = []; showBulkPanel = false; }}
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
                                checked={selectedUsers.length === users.length && users.length > 0}
                                on:change={selectAllUsers}
                                class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                        </th>
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
                            <td colspan="6" class="px-6 py-8 text-center">
                                <LoadingSpinner size="lg" />
                            </td>
                        </tr>
                    {:else if users.length === 0}
                        <tr>
                            <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                                {error ? 'Erreur de chargement' : 'Aucun utilisateur trouvé'}
                            </td>
                        </tr>
                    {:else}
                        {#each users as userData}
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(userData.id)}
                                        on:change={() => toggleUserSelection(userData.id)}
                                        class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center text-white font-medium">
                                            {getUserInitials(userData)}
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">
                                                {userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.name || 'Nom inconnu'}
                                            </div>
                                            <div class="text-sm text-gray-500">{userData.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRoleColor(userData.role)}">
                                        {getRoleLabel(userData.role)}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(userData.isActive !== false)}">
                                        {userData.isActive !== false ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div class="flex items-center justify-end gap-2">
                                        <button
                                            on:click={() => openEditModal(userData)}
                                            class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200">
                                            ✏️ Modifier
                                        </button>
                                        <button
                                            on:click={() => deleteUser(userData.id)}
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

<!-- Modal utilisateur -->
{#if showUserModal}
    <UserModal 
        {user}
        {editingUser}
        on:close={closeUserModal}
        on:saved={handleUserSaved}
    />
{/if}

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>