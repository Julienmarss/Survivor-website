<!-- frontend/src/routes/admin/users/+page.svelte -->
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
    let showDeleteModal = false;
    let editingUser = null;
    let deletingUser = null;
    let searchTerm = '';
    let selectedRole = 'all';

    // Données
    let users = [];
    let pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    };

    // Formulaire
    let formData = {
        firstName: '',
        lastName: '',
        email: '',
        role: 'student',
        phone: '',
        company: '',
        position: ''
    };

    // Configuration API
    const API_BASE = `${import.meta.env.PUBLIC_APIURL || 'http://localhost:3000'}/api`;

    // Rôles disponibles
    const roles = [
        { value: 'admin', label: 'Administrateur', color: 'bg-red-100 text-red-800' },
        { value: 'startup', label: 'Startup', color: 'bg-purple-100 text-purple-800' },
        { value: 'investor', label: 'Investisseur', color: 'bg-green-100 text-green-800' },
        { value: 'student', label: 'Étudiant', color: 'bg-blue-100 text-blue-800' }
    ];

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

    async function apiCall(endpoint, options = {}) {
        const token = userStore.getToken();
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || `Erreur ${response.status}`;
            } catch {
                errorMessage = `Erreur ${response.status}: ${errorText}`;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    async function loadUsers(page = 1) {
        try {
            loading = true;
            error = null;

            const params = new URLSearchParams({
                limit: pagination.limit.toString()
            });

            if (selectedRole !== 'all') {
                params.append('role', selectedRole);
            }

            const data = await apiCall(`/auth/users?${params}`);
            
            if (data.success) {
                users = data.data.users || [];
                pagination = {
                    page: 1,
                    limit: pagination.limit,
                    total: users.length,
                    totalPages: 1
                };
            }
        } catch (err) {
            console.error('Erreur lors du chargement des utilisateurs:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function updateUserProfile() {
        try {
            loading = true;
            error = null;

            // Validation
            if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
                throw new Error('Les champs prénom, nom et email sont obligatoires');
            }

            const updateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phone: formData.phone?.trim() || '',
                company: formData.company?.trim() || '',
                position: formData.position?.trim() || ''
            };

            const data = await apiCall(`/auth/users/${editingUser.id}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            if (data.success) {
                await loadUsers();
                closeModal();
                showSuccessMessage('Profil utilisateur mis à jour avec succès');
            }
        } catch (err) {
            console.error('Erreur mise à jour profil:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function updateUserRole(userId, newRole) {
        try {
            loading = true;
            error = null;

            const data = await apiCall(`/auth/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            });

            if (data.success) {
                await loadUsers();
                showSuccessMessage(`Rôle utilisateur mis à jour: ${newRole}`);
            }
        } catch (err) {
            console.error('Erreur mise à jour rôle:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function deleteUser() {
        try {
            loading = true;
            error = null;

            const data = await apiCall(`/auth/users/${deletingUser.id}`, {
                method: 'DELETE'
            });

            if (data.success) {
                await loadUsers();
                closeDeleteModal();
                showSuccessMessage('Utilisateur supprimé avec succès');
            }
        } catch (err) {
            console.error('Erreur suppression utilisateur:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function openEditModal(userToEdit) {
        editingUser = userToEdit;
        formData = {
            firstName: userToEdit.firstName || '',
            lastName: userToEdit.lastName || '',
            email: userToEdit.email || '',
            role: userToEdit.role || 'student',
            phone: userToEdit.phone || '',
            company: userToEdit.company || '',
            position: userToEdit.position || ''
        };
        showModal = true;
    }

    function openDeleteModal(userToDelete) {
        deletingUser = userToDelete;
        showDeleteModal = true;
    }

    function closeModal() {
        showModal = false;
        editingUser = null;
        error = null;
        formData = {
            firstName: '',
            lastName: '',
            email: '',
            role: 'student',
            phone: '',
            company: '',
            position: ''
        };
    }

    function closeDeleteModal() {
        showDeleteModal = false;
        deletingUser = null;
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

    function getRoleColor(role) {
        const roleConfig = roles.find(r => r.value === role);
        return roleConfig ? roleConfig.color : 'bg-gray-100 text-gray-800';
    }

    function getRoleLabel(role) {
        const roleConfig = roles.find(r => r.value === role);
        return roleConfig ? roleConfig.label : role;
    }

    function formatDate(dateString) {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    function retryLoad() {
        error = null;
        loadUsers();
    }

    // Filtres
    $: filteredUsers = users.filter(u => {
        const matchesSearch = !searchTerm || 
            u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.company?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    function handleRoleFilter() {
        loadUsers();
    }

    // Debounce pour la recherche
    let searchTimeout;
    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            // La recherche se fait côté client pour simplifier
        }, 300);
    }

    onMount(async () => {
        await userStore.init();

        if (!user || !isAdmin(user)) {
            goto('/');
            return;
        }

        await loadUsers();
    });
</script>

<svelte:head>
    <title>Gestion des Utilisateurs - Admin JEB Incubator</title>
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
            <ErrorMessage message={error} onRetry={retryLoad} />
        {/if}

        <!-- En-tête -->
        <section class="pt-24 pb-8 px-6 sm:px-8 lg:px-12">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 class="text-4xl font-bold text-gray-900 mb-2 font-['Montserrat']">
                            Gestion des Utilisateurs
                        </h1>
                        <p class="text-xl text-gray-600 font-['Open_Sans']">
                            Administrez les comptes utilisateurs de la plateforme
                        </p>
                    </div>
                    <div class="mt-4 lg:mt-0">
                        <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                            </svg>
                            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <!-- Filtres -->
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <label for="search" class="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
                            <input
                                    id="search"
                                    type="text"
                                    bind:value={searchTerm}
                                    on:input={debounceSearch}
                                    placeholder="Nom, email, entreprise..."
                                    class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                            />
                        </div>

                        <div>
                            <label for="role" class="block text-sm font-semibold text-gray-700 mb-2">Rôle</label>
                            <select
                                    id="role"
                                    bind:value={selectedRole}
                                    on:change={handleRoleFilter}
                                    class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                            >
                                <option value="all">Tous les rôles</option>
                                {#each roles as role}
                                    <option value={role.value}>{role.label}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="flex items-end">
                            <button
                                    on:click={loadUsers}
                                    disabled={loading}
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 disabled:opacity-50">
                                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                            </div>
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">
                                    Supprimer l'utilisateur
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500">
                                        Êtes-vous sûr de vouloir supprimer l'utilisateur 
                                        <strong>{deletingUser?.firstName} {deletingUser?.lastName}</strong> ?
                                        Cette action est irréversible.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                                type="button"
                                on:click={deleteUser}
                                disabled={loading}
                                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                            {#if loading}
                                <LoadingSpinner size="sm" color="#ffffff" />
                            {:else}
                                Supprimer
                            {/if}
                        </button>
                        <button
                                type="button"
                                on:click={closeDeleteModal}
                                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <Footer />
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Actualiser
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Liste des utilisateurs -->
        <section class="pb-20 px-6 sm:px-8 lg:px-12">
            <div class="max-w-7xl mx-auto">
                {#if loading}
                    <div class="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                {:else if filteredUsers.length === 0}
                    <div class="text-center py-12">
                        <p class="text-gray-500 text-lg mb-4">Aucun utilisateur trouvé.</p>
                    </div>
                {:else}
                    <!-- Table des utilisateurs -->
                    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                                    <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                {#each filteredUsers as userData}
                                    <tr class="hover:bg-gray-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-10 w-10">
                                                    <div class="h-10 w-10 rounded-full bg-gradient-to-r from-[#c174f2] to-[#f18585] flex items-center justify-center">
                                                        <span class="text-white font-bold text-sm">
                                                            {(userData.firstName?.[0] || userData.email?.[0] || 'U').toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">
                                                        {userData.firstName || ''} {userData.lastName || ''}
                                                    </div>
                                                    <div class="text-sm text-gray-500">{userData.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center space-x-2">
                                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getRoleColor(userData.role)}">
                                                    {getRoleLabel(userData.role)}
                                                </span>
                                                {#if userData.role !== 'admin'}
                                                    <select
                                                            on:change={(e) => updateUserRole(userData.id, e.target.value)}
                                                            class="text-xs border border-gray-300 rounded px-2 py-1"
                                                            value={userData.role}
                                                    >
                                                        {#each roles.filter(r => r.value !== 'admin') as role}
                                                            <option value={role.value}>{role.label}</option>
                                                        {/each}
                                                    </select>
                                                {/if}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {userData.company || '—'}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(userData.createdAt)}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex justify-end space-x-2">
                                                <button
                                                        on:click={() => openEditModal(userData)}
                                                        class="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition-colors duration-200">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                    </svg>
                                                </button>
                                                {#if userData.role !== 'admin' && userData.id !== user?.id}
                                                    <button
                                                            on:click={() => openDeleteModal(userData)}
                                                            class="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors duration-200">
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                        </svg>
                                                    </button>
                                                {/if}
                                            </div>
                                        </td>
                                    </tr>
                                {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                {/if}
            </div>
        </section>
    {/if}

    <!-- Modal d'édition -->
    {#if showModal}
        <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={closeModal}></div>

                <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form on:submit|preventDefault={updateUserProfile}>
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="sm:flex sm:items-start">
                                <div class="w-full">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        Modifier le profil utilisateur
                                    </h3>

                                    {#if error}
                                        <div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p class="text-red-600 text-sm">{error}</p>
                                        </div>
                                    {/if}

                                    <div class="space-y-4">
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label for="firstName" class="block text-sm font-medium text-gray-700">Prénom *</label>
                                                <input
                                                        type="text"
                                                        id="firstName"
                                                        bind:value={formData.firstName}
                                                        required
                                                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                />
                                            </div>

                                            <div>
                                                <label for="lastName" class="block text-sm font-medium text-gray-700">Nom *</label>
                                                <input
                                                        type="text"
                                                        id="lastName"
                                                        bind:value={formData.lastName}
                                                        required
                                                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label for="email" class="block text-sm font-medium text-gray-700">Email *</label>
                                            <input
                                                    type="email"
                                                    id="email"
                                                    bind:value={formData.email}
                                                    required
                                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                            />
                                        </div>

                                        <div>
                                            <label for="phone" class="block text-sm font-medium text-gray-700">Téléphone</label>
                                            <input
                                                    type="tel"
                                                    id="phone"
                                                    bind:value={formData.phone}
                                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                            />
                                        </div>

                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label for="company" class="block text-sm font-medium text-gray-700">Entreprise</label>
                                                <input
                                                        type="text"
                                                        id="company"
                                                        bind:value={formData.company}
                                                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                />
                                            </div>

                                            <div>
                                                <label for="position" class="block text-sm font-medium text-gray-700">Poste</label>
                                                <input
                                                        type="text"
                                                        id="position"
                                                        bind:value={formData.position}
                                                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2]"
                                                />
                                            </div>
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
                                    Enregistrer
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

    <!-- Modal de suppression -->
    {#if showDeleteModal}
        <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={closeDeleteModal}></div>

                <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"