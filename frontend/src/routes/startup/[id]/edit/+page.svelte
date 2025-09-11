<!-- frontend/src/routes/startup/[id]/edit/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { userStore } from '$lib/stores/userStore.js';
    import Header from '../../../../lib/components/Header.svelte';
    import Footer from '../../../../lib/components/Footer.svelte';
    import LoadingSpinner from '../../../../lib/components/LoadingSpinner.svelte';
    import ErrorMessage from '../../../../lib/components/ErrorMessage.svelte';

    // États
    let user = null;
    let startup = null;
    let loading = false;
    let error = null;
    let isSubmitting = false;
    let showDeleteModal = false;

    // Données du formulaire
    let formData = {
        name: '',
        description: '',
        sector: '',
        maturity: '',
        project_status: '',
        needs: '',
        website_url: '',
        email: '',
        phone: '',
        address: '',
        legal_status: ''
    };

    // Configuration API
    const API_BASE = `${import.meta.env.PUBLIC_APIURL || 'http://localhost:3000'}/api`;

    // Options pour les selects
    const sectors = [
        'FinTech', 'HealthTech', 'EdTech', 'GreenTech', 'AgriTech', 'PropTech',
        'FoodTech', 'RetailTech', 'Mobility', 'Cybersécurité', 'Intelligence Artificielle',
        'Blockchain', 'IoT', 'Robotique', 'Gaming', 'Media & Entertainment',
        'E-commerce', 'SaaS', 'DeepTech', 'Autre'
    ];

    const maturities = [
        'Idéation', 'Prototype', 'MVP', 'Validation', 'Traction', 'Croissance', 'Scale-up'
    ];

    const projectStatuses = [
        'En cours', 'Suspendu', 'Terminé', 'Archivé'
    ];

    const legalStatuses = [
        'SARL', 'SAS', 'SASU', 'EURL', 'SA', 'SNC', 'SCS', 'Auto-entrepreneur', 'Association', 'Autre'
    ];

    // S'abonner au store utilisateur
    userStore.subscribe(value => {
        user = value;
    });

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

    async function loadStartup(id) {
        try {
            loading = true;
            error = null;

            const data = await apiCall(`/startups/${id}`);
            
            if (data.success) {
                startup = data.data;
                
                // Pré-remplir le formulaire
                formData = {
                    name: startup.name || '',
                    description: startup.description || '',
                    sector: startup.sector || '',
                    maturity: startup.maturity || '',
                    project_status: startup.project_status || '',
                    needs: startup.needs || '',
                    website_url: startup.website_url || '',
                    email: startup.email || '',
                    phone: startup.phone || '',
                    address: startup.address || '',
                    legal_status: startup.legal_status || ''
                };
            }
        } catch (err) {
            console.error('Erreur lors du chargement:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function updateStartup() {
        try {
            isSubmitting = true;
            error = null;

            // Validation
            if (!formData.name.trim()) {
                throw new Error('Le nom de la startup est obligatoire');
            }
            if (!formData.description.trim()) {
                throw new Error('La description est obligatoire');
            }
            if (!formData.sector) {
                throw new Error('Le secteur est obligatoire');
            }

            const updateData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                sector: formData.sector,
                maturity: formData.maturity,
                project_status: formData.project_status,
                needs: formData.needs?.trim() || '',
                website_url: formData.website_url?.trim() || '',
                email: formData.email?.trim() || '',
                phone: formData.phone?.trim() || '',
                address: formData.address?.trim() || '',
                legal_status: formData.legal_status || ''
            };

            const data = await apiCall(`/startups/${startup.id}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            if (data.success) {
                showSuccessMessage('Startup mise à jour avec succès');
                // Rediriger vers la page de détail
                setTimeout(() => {
                    goto(`/startup/${startup.id}`);
                }, 2000);
            }
        } catch (err) {
            console.error('Erreur mise à jour:', err);
            error = err.message;
        } finally {
            isSubmitting = false;
        }
    }

    async function deleteStartup() {
        try {
            isSubmitting = true;
            error = null;

            const data = await apiCall(`/startups/${startup.id}`, {
                method: 'DELETE'
            });

            if (data.success) {
                showSuccessMessage('Startup supprimée avec succès');
                // Rediriger vers la liste des projets
                setTimeout(() => {
                    goto('/projects');
                }, 2000);
            }
        } catch (err) {
            console.error('Erreur suppression:', err);
            error = err.message;
        } finally {
            isSubmitting = false;
            showDeleteModal = false;
        }
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

    function canEditStartup() {
        if (!user || !startup) return false;
        
        // Admin peut tout modifier
        if (user.role === 'admin') return true;
        
        // Fondateur peut modifier sa startup
        if (user.role === 'startup' && startup.created_by === user.id) return true;
        
        return false;
    }

    function retryLoad() {
        error = null;
        const id = $page.params.id;
        if (id) loadStartup(id);
    }

    onMount(async () => {
        await userStore.init();

        const id = $page.params.id;
        if (!id) {
            error = 'ID de startup manquant';
            return;
        }

        await loadStartup(id);
    });
</script>

<svelte:head>
    <title>Modifier la startup - JEB Incubator</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
    <Header />

    <!-- Vérification des permissions -->
    {#if !user}
        <div class="pt-24 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto text-center py-16">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Connexion requise</h1>
                <p class="text-gray-600 mb-8">Vous devez être connecté pour modifier une startup.</p>
                <button
                        on:click={() => goto('/login')}
                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                    Se connecter
                </button>
        </div>
    </div>
{/if}

<Footer />
</div>

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>
        </div>
    {:else if startup && !canEditStartup()}
        <div class="pt-24 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto text-center py-16">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Accès refusé</h1>
                <p class="text-gray-600 mb-8">Vous n'êtes pas autorisé à modifier cette startup.</p>
                <button
                        on:click={() => goto(`/startup/${startup.id}`)}
                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                    Retour à la startup
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
            <div class="max-w-4xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <button
                                on:click={() => goto(startup ? `/startup/${startup.id}` : '/projects')}
                                class="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-300 mb-4">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                            Retour
                        </button>
                        <h1 class="text-4xl font-bold text-gray-900 mb-2 font-['Montserrat']">
                            {startup ? `Modifier ${startup.name}` : 'Modifier la startup'}
                        </h1>
                        <p class="text-xl text-gray-600 font-['Open_Sans']">
                            Mettez à jour les informations de votre startup
                        </p>
                    </div>
                    {#if startup && user?.role === 'admin'}
                        <button
                                on:click={() => showDeleteModal = true}
                                class="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300">
                            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Supprimer
                        </button>
                    {/if}
                </div>
            </div>
        </section>

        <!-- Formulaire -->
        <section class="pb-20 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto">
                {#if loading}
                    <div class="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                {:else if startup}
                    <form on:submit|preventDefault={updateStartup} class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div class="space-y-8">
                            <!-- Informations de base -->
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Informations de base</h2>
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Nom de la startup *</label>
                                        <input
                                                type="text"
                                                id="name"
                                                bind:value={formData.name}
                                                required
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                                placeholder="Nom de votre startup"
                                        />
                                    </div>

                                    <div>
                                        <label for="sector" class="block text-sm font-medium text-gray-700 mb-2">Secteur *</label>
                                        <select
                                                id="sector"
                                                bind:value={formData.sector}
                                                required
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        >
                                            <option value="">Sélectionner un secteur</option>
                                            {#each sectors as sector}
                                                <option value={sector}>{sector}</option>
                                            {/each}
                                        </select>
                                    </div>

                                    <div>
                                        <label for="maturity" class="block text-sm font-medium text-gray-700 mb-2">Maturité</label>
                                        <select
                                                id="maturity"
                                                bind:value={formData.maturity}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        >
                                            <option value="">Sélectionner la maturité</option>
                                            {#each maturities as maturity}
                                                <option value={maturity}>{maturity}</option>
                                            {/each}
                                        </select>
                                    </div>

                                    <div>
                                        <label for="project_status" class="block text-sm font-medium text-gray-700 mb-2">Statut du projet</label>
                                        <select
                                                id="project_status"
                                                bind:value={formData.project_status}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        >
                                            <option value="">Sélectionner le statut</option>
                                            {#each projectStatuses as status}
                                                <option value={status}>{status}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>

                                <div class="mt-6">
                                    <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                    <textarea
                                            id="description"
                                            bind:value={formData.description}
                                            required
                                            rows="4"
                                            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            placeholder="Décrivez votre startup, votre mission et votre proposition de valeur..."
                                    ></textarea>
                                </div>

                                <div class="mt-6">
                                    <label for="needs" class="block text-sm font-medium text-gray-700 mb-2">Besoins actuels</label>
                                    <textarea
                                            id="needs"
                                            bind:value={formData.needs}
                                            rows="3"
                                            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            placeholder="Financement, mentoring, partenariats, recrutement..."
                                    ></textarea>
                                </div>
                            </div>

                            <!-- Informations de contact -->
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Contact et localisation</h2>
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input
                                                type="email"
                                                id="email"
                                                bind:value={formData.email}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                                placeholder="contact@startup.com"
                                        />
                                    </div>

                                    <div>
                                        <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                        <input
                                                type="tel"
                                                id="phone"
                                                bind:value={formData.phone}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                                placeholder="06 12 34 56 78"
                                        />
                                    </div>

                                    <div>
                                        <label for="website_url" class="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                                        <input
                                                type="url"
                                                id="website_url"
                                                bind:value={formData.website_url}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                                placeholder="https://www.startup.com"
                                        />
                                    </div>

                                    <div>
                                        <label for="legal_status" class="block text-sm font-medium text-gray-700 mb-2">Statut légal</label>
                                        <select
                                                id="legal_status"
                                                bind:value={formData.legal_status}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        >
                                            <option value="">Sélectionner le statut légal</option>
                                            {#each legalStatuses as status}
                                                <option value={status}>{status}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>

                                <div class="mt-6">
                                    <label for="address" class="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                                    <input
                                            type="text"
                                            id="address"
                                            bind:value={formData.address}
                                            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            placeholder="Adresse complète de votre startup"
                                    />
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex justify-between pt-8 border-t border-gray-200">
                                <button
                                        type="button"
                                        on:click={() => goto(`/startup/${startup.id}`)}
                                        class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                                >
                                    Annuler
                                </button>

                                <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {#if isSubmitting}
                                        <LoadingSpinner size="sm" color="#ffffff" />
                                        <span>Mise à jour...</span>
                                    {:else}
                                        <span>Enregistrer les modifications</span>
                                    {/if}
                                </button>
                            </div>
                        </div>
                    </form>
                {/if}
            </div>
        </section>
    {/if}

    <!-- Modal de suppression -->
    {#if showDeleteModal}
        <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => showDeleteModal = false}></div>

                <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                            </div>
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">
                                    Supprimer la startup
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500">
                                        Êtes-vous sûr de vouloir supprimer la startup <strong>{startup?.name}</strong> ?
                                        Cette action est irréversible et toutes les données associées seront perdues.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                                type="button"
                                on:click={deleteStartup}
                                disabled={isSubmitting}
                                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                            {#if isSubmitting}
                                <LoadingSpinner size="sm" color="#ffffff" />
                            {:else}
                                Supprimer définitivement
                            {/if}
                        </button>
                        <button
                                type="button"
                                on:click={() => showDeleteModal = false}
                                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>