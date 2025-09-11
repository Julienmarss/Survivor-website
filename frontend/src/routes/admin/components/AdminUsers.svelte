<script>
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import UserModal from '../modals/UserModal.svelte';
    import BulkActionsPanel from '../panels/BulkActionsPanel.svelte';
    
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

    const API_BASE = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000/api'; // ← Ajouté /api

    async function loadUsers(page = 1) {
        try {
            loading = true;
            error = null;

            // Debug détaillé
            console.log('=== DEBUG LOAD USERS ===');
            console.log('1. User object:', user);
            console.log('2. User token:', user?.token);
            console.log('3. API_BASE:', API_BASE);

            // Si pas d'utilisateur, essayer de le récupérer depuis localStorage
            if (!user || !user.token) {
                console.log('4. No user/token, trying localStorage...');
                const token = localStorage.getItem('auth_token');
                const userData = localStorage.getItem('user_data');
                
                if (token && userData) {
                    try {
                        const parsedUser = JSON.parse(userData);
                        parsedUser.token = token;
                        user = parsedUser; // Mettre à jour la variable user
                        console.log('5. User loaded from localStorage:', { email: user.email, hasToken: !!user.token });
                    } catch (parseError) {
                        console.error('6. Error parsing user data:', parseError);
                        throw new Error('Impossible de charger les données utilisateur');
                    }
                } else {
                    throw new Error('Pas de token d\'authentification disponible - veuillez vous reconnecter');
                }
            }

            // Test simple d'abord
            console.log('7. Testing simple endpoint...');
            try {
                const testResponse = await fetch(`${API_BASE}/admin/users/test-no-auth`);
                console.log('8. Test response status:', testResponse.status);
                const testData = await testResponse.json();
                console.log('9. Test response data:', testData);
            } catch (testError) {
                console.log('10. Test endpoint failed:', testError);
            }

            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });

            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }

            if (selectedFilter !== 'all') {
                params.append('role', selectedFilter);
            }

            const url = `${API_BASE}/admin/users?${params}`;
            console.log('11. Full URL:', url);
            console.log('12. Headers:', {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            });

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('13. Response status:', response.status);
            console.log('14. Response headers:', response.headers);

            const data = await response.json();
            console.log('15. Response data:', data);

            if (data.success) {
                users = data.data.users || [];
                pagination = data.data.pagination || {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0
                };
                console.log('16. Users loaded successfully:', users.length);
                
                // Supprimer les données de test si on a des vraies données
                if (users.length > 0) {
                    console.log('✅ Real data loaded, removing fallback');
                }
            } else {
                throw new Error(data.message || 'Erreur lors du chargement');
            }
        } catch (err) {
            console.error('=== ERROR IN LOAD USERS ===');
            console.error('Error object:', err);
            console.error('Error message:', err.message);
            
            error = `Erreur API: ${err.message}`;
            
            // Données de test SEULEMENT en cas d'erreur
            console.log('❌ Falling back to test data...');
            users = [
                {
                    id: 'test-1',
                    email: 'test@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'user',
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'test-2',
                    email: 'startup@example.com',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    role: 'startup',
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ];
            pagination = {
                page: 1,
                limit: 20,
                total: 2,
                totalPages: 1
            };
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
            const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                await loadUsers(pagination.page);
                showSuccessMessage('Utilisateur supprimé avec succès');
            } else {
                throw new Error(data.message || 'Erreur lors de la suppression');
            }
        } catch (err) {
            console.error('Erreur suppression:', err);
            error = 'Impossible de supprimer l\'utilisateur';
        } finally {
            loading = false;
        }
    }

    async function exportUsers() {
        try {
            loading = true;
            const token = authApi.getToken(); // Utiliser authApi
            
            const params = new URLSearchParams();
            
            if (selectedFilter !== 'all') {
                params.append('role', selectedFilter);
            }
            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }

            const response = await fetch(`${API_BASE}/admin/users/export/csv?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                downloadFile(blob, `users-export-${new Date().toISOString().split('T')[0]}.csv`);
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
        dispatch('success', { message });
    }

    function openCreateModal() {
        editingUser = null;
        showUserModal = true;
    }

    function openEditModal(userData) {
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
            case 'startup':
                return 'bg-purple-100 text-purple-800';
            case 'investor':
                return 'bg-green-100 text-green-800';
            case 'user':
                return 'bg-blue-100 text-blue-800';
            case 'admin':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    function getStatusColor(status) {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    function changePage(newPage) {
        loadUsers(newPage);
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

    onMount(() => {
        loadUsers();
    });
</script>

<div class="space-y-6">
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

    <!-- Filters -->
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

    <!-- Bulk Actions Panel -->
    {#if showBulkPanel}
        <BulkActionsPanel 
            {selectedUsers} 
            {user}
            on:action={handleBulkAction}
            on:close={() => { selectedUsers = []; showBulkPanel = false; }}
        />
    {/if}

    <!-- Users Table -->
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
                                Aucun utilisateur trouvé
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
                                        {userData.role === 'startup' ? 'Startup' : userData.role === 'investor' ? 'Investisseur' : userData.role === 'user' ? 'Étudiant' : userData.role === 'admin' ? 'Admin' : userData.role}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(userData.isActive !== false ? 'active' : 'inactive')}">
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

<!-- User Modal -->
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