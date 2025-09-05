<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Header from '../../lib/components/Header.svelte';
    import Footer from '../../lib/components/Footer.svelte';
    import LoadingSpinner from '../../lib/components/LoadingSpinner.svelte';
    import ErrorMessage from '../../lib/components/ErrorMessage.svelte';

    import {
        startupsList,
        sectors,
        loading,
        error,
        pagination,
        filters,
        startupsActions
    } from '../../lib/stores/startups.js';

    let searchInput = '';
    let selectedSector = 'all';
    let selectedMaturity = 'all';

    // Variables réactives
    $: startups = $startupsList;
    $: availableSectors = $sectors;
    $: isLoading = $loading;
    $: errorMessage = $error;
    $: paginationInfo = $pagination;
    $: currentFilters = $filters;

    // Sync des filtres locaux avec le store
    $: {
        if (searchInput !== currentFilters.search) {
            searchInput = currentFilters.search;
        }
        if (selectedSector !== currentFilters.sector) {
            selectedSector = currentFilters.sector;
        }
    }

    function getCategoryGradient(category) {
        const gradients = {
            'GreenTech': 'from-green-400 to-emerald-600',
            'HealthTech': 'from-blue-400 to-cyan-600',
            'FinTech': 'from-purple-400 to-indigo-600',
            'AgriTech': 'from-yellow-400 to-orange-600',
            'EdTech': 'from-pink-400 to-rose-600',
            'CyberSecurity': 'from-red-400 to-pink-600',
            'Tech': 'from-blue-400 to-purple-600',
            'Santé': 'from-blue-400 to-cyan-600',
            'Finance': 'from-purple-400 to-indigo-600',
            'Agriculture': 'from-yellow-400 to-orange-600',
            'Éducation': 'from-pink-400 to-rose-600',
            'Environnement': 'from-green-400 to-emerald-600',
            'Technologie': 'from-blue-400 to-purple-600',
            'default': 'from-gray-400 to-gray-600'
        };
        return gradients[category] || gradients.default;
    }

    onMount(async () => {
        await Promise.all([
            startupsActions.loadStartups(),
            startupsActions.loadSectors()
        ]);
    });

    async function handleSearch() {
        await startupsActions.searchStartups(searchInput);
    }

    async function handleSectorChange() {
        await startupsActions.filterBySector(selectedSector);
    }

    async function handleMaturityChange() {
        await startupsActions.filterByMaturity(selectedMaturity);
    }

    async function handlePageChange(newPage) {
        await startupsActions.loadStartups(newPage);
    }

    function navigateToStartup(startupId) {
        goto(`/startup/${startupId}`);
    }

    function retryLoad() {
        startupsActions.clearError();
        startupsActions.loadStartups();
        startupsActions.loadSectors();
    }

    // Debounce pour la recherche
    let searchTimeout;
    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 500);
    }

    // Fonction pour générer les numéros de page
    function generatePageNumbers() {
        const current = paginationInfo.page;
        const total = paginationInfo.totalPages;
        const pages = [];

        // Affiche toujours la première page
        pages.push(1);

        // Calcule la plage autour de la page courante
        let start = Math.max(2, current - 2);
        let end = Math.min(total - 1, current + 2);

        // Ajoute des points de suspension si nécessaire
        if (start > 2) {
            pages.push('...');
        }

        // Ajoute les pages de la plage
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Ajoute des points de suspension si nécessaire
        if (end < total - 1) {
            pages.push('...');
        }

        // Affiche toujours la dernière page (si elle est différente de la première)
        if (total > 1) {
            pages.push(total);
        }

        return pages;
    }
</script>

<svelte:head>
    <title>Projets - JEB Incubator</title>
    <meta name="description" content="Découvrez tous les projets et startups incubés par JEB Incubator">
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
    <Header />

    <!-- Affichage des erreurs -->
    {#if errorMessage}
        <ErrorMessage message={errorMessage} onRetry={retryLoad} />
    {/if}

    <!-- En-tête de la page -->
    <section class="pt-24 pb-12 px-6 sm:px-8 lg:px-12">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-12">
                <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 font-['Montserrat']">
                    Nos Projets
                </h1>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto font-['Open_Sans']">
                    Explorez l'écosystème complet des startups incubées par JEB Incubator,
                    des projets en phase d'idéation aux entreprises en pleine croissance.
                </p>
            </div>

            <!-- Filtres et recherche -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div class="grid md:grid-cols-3 gap-4">
                    <!-- Recherche -->
                    <div>
                        <label for="search" class="block text-sm font-semibold text-gray-700 mb-2">
                            Rechercher
                        </label>
                        <input
                                id="search"
                                type="text"
                                bind:value={searchInput}
                                on:input={debounceSearch}
                                placeholder="Nom, description, secteur..."
                                class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                        />
                    </div>

                    <!-- Filtre par secteur -->
                    <div>
                        <label for="sector" class="block text-sm font-semibold text-gray-700 mb-2">
                            Secteur
                        </label>
                        <select
                                id="sector"
                                bind:value={selectedSector}
                                on:change={handleSectorChange}
                                class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                        >
                            <option value="all">Tous les secteurs</option>
                            {#each availableSectors as sector}
                                <option value={sector.name}>{sector.name} ({sector.count})</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Filtre par maturité -->
                    <div>
                        <label for="maturity" class="block text-sm font-semibold text-gray-700 mb-2">
                            Maturité
                        </label>
                        <select
                                id="maturity"
                                bind:value={selectedMaturity}
                                on:change={handleMaturityChange}
                                class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                        >
                            <option value="all">Toutes les phases</option>
                            <option value="Idéation">Idéation</option>
                            <option value="Prototype">Prototype</option>
                            <option value="Validation">Validation</option>
                            <option value="Croissance">Croissance</option>
                            <option value="Scale-up">Scale-up</option>
                        </select>
                    </div>
                </div>

                <!-- Statistiques rapides -->
                <div class="mt-6 pt-6 border-t border-gray-200">
                    <div class="flex justify-between items-center text-sm text-gray-600">
            <span>
              {#if paginationInfo.total > 0}
                Affichage de {((paginationInfo.page - 1) * paginationInfo.limit) + 1}
                  à {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}
                  sur {paginationInfo.total} projets
              {:else}
                Aucun projet trouvé
              {/if}
            </span>
                        <span>
              Page {paginationInfo.page} sur {paginationInfo.totalPages}
            </span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Liste des startups -->
    <section class="pb-20 px-6 sm:px-8 lg:px-12">
        <div class="max-w-7xl mx-auto">
            {#if isLoading}
                <div class="flex justify-center py-12">
                    <LoadingSpinner size="lg" color="#ff6b6b" />
                </div>
            {:else if startups.length === 0}
                <div class="text-center py-12">

                    <p class="text-gray-500 text-lg mb-4">
                        {currentFilters.search || currentFilters.sector !== 'all'
                            ? 'Aucun projet ne correspond à vos critères.'
                            : 'Aucun projet disponible pour le moment.'}
                    </p>
                    <button
                            on:click={() => {
              startupsActions.resetFilters();
              retryLoad();
            }}
                            class="bg-[#c174f2] text-white px-6 py-2 rounded-full hover:bg-[#cb90f1] transition-colors duration-300">
                        {currentFilters.search || currentFilters.sector !== 'all' ? 'Réinitialiser les filtres' : 'Réessayer'}
                    </button>
                </div>
            {:else}
                <!-- Grille des startups -->
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {#each startups as startup}
                        <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer transform hover:-translate-y-2"
                             on:click={() => navigateToStartup(startup.id)}>
                            <div class="h-48 bg-gradient-to-r {getCategoryGradient(startup.sector)} relative overflow-hidden">
                                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                                <div class="absolute bottom-4 left-4 text-white">
                                    <div class="text-sm font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                        {startup.sector}
                                    </div>
                                </div>
                                <div class="absolute top-4 right-4">
                                    <div class="text-xs font-medium bg-white/90 text-gray-700 px-2 py-1 rounded-full">
                                        {startup.maturity}
                                    </div>
                                </div>
                            </div>

                            <div class="p-6">
                                <h3 class="text-xl font-bold text-gray-900 mb-2 font-['Montserrat'] group-hover:text-[#c174f2] transition-colors duration-300">
                                    {startup.name}
                                </h3>
                                <p class="text-gray-600 mb-4 font-['Open_Sans'] line-clamp-3">
                                    {startup.description}
                                </p>

                                <!-- Fondateurs -->
                                {#if startup.founders && startup.founders.length > 0}
                                    <div class="flex items-center mb-4">
                                        <span class="text-sm text-gray-500 font-semibold mr-3">Fondateurs:</span>
                                        <div class="flex -space-x-2">
                                            {#each startup.founders.slice(0, 3) as founder, i}
                                                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-[#c174f2] to-[#f18585] border-2 border-white transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center text-white text-xs font-bold"
                                                     style="transition-delay: {i * 50}ms;"
                                                     title="{founder.name}">
                                                    {founder.name.charAt(0).toUpperCase()}
                                                </div>
                                            {/each}
                                            {#if startup.founders.length > 3}
                                                <div class="w-8 h-8 rounded-full bg-gray-300 border-2 border-white transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center text-gray-600 text-xs font-bold"
                                                     title="+{startup.founders.length - 3} autres">
                                                    +{startup.founders.length - 3}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                {/if}

                                <!-- Informations supplémentaires -->
                                <div class="space-y-2 text-sm text-gray-500">
                                    {#if startup.project_status}
                                        <div><span class="font-semibold">Statut :</span> {startup.project_status}</div>
                                    {/if}
                                    {#if startup.needs}
                                        <div><span class="font-semibold">Besoins :</span> {startup.needs}</div>
                                    {/if}
                                    {#if startup.website_url}
                                        <div>
                                            <a href="{startup.website_url}"
                                               target="_blank"
                                               rel="noopener noreferrer"
                                               on:click|stopPropagation
                                               class="text-[#c174f2] hover:text-[#f18585] transition-colors duration-300 font-semibold">
                                                Visiter le site →
                                            </a>
                                        </div>
                                    {/if}
                                    <div class="text-xs text-gray-400 mt-2">
                                        Créé le {new Date(startup.created_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>

                                <!-- Tags additionnels -->
                                {#if startup.tags && startup.tags.length > 0}
                                    <div class="flex flex-wrap gap-2 mt-3">
                                        {#each startup.tags.slice(0, 3) as tag}
                      <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full group-hover:bg-[#c174f2] group-hover:text-white transition-colors duration-300">
                        {tag}
                      </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>

                <!-- Pagination -->
                {#if paginationInfo.totalPages > 1}
                    <div class="flex justify-center items-center space-x-2 mt-12">
                        <!-- Bouton Précédent -->
                        <button
                                on:click={() => handlePageChange(paginationInfo.page - 1)}
                                disabled={paginationInfo.page === 1}
                                class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>

                        <!-- Numéros de page -->
                        {#each generatePageNumbers() as pageNumber}
                            {#if pageNumber === '...'}
                                <span class="px-4 py-2 text-gray-400">...</span>
                            {:else}
                                <button
                                        on:click={() => handlePageChange(pageNumber)}
                                        class="px-4 py-2 rounded-lg border transition-colors duration-300 {
                    pageNumber === paginationInfo.page
                      ? 'bg-[#c174f2] text-white border-[#c174f2]'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }">
                                    {pageNumber}
                                </button>
                            {/if}
                        {/each}

                        <!-- Bouton Suivant -->
                        <button
                                on:click={() => handlePageChange(paginationInfo.page + 1)}
                                disabled={paginationInfo.page === paginationInfo.totalPages}
                                class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Informations de pagination -->
                    <div class="text-center mt-4 text-sm text-gray-600">
                        Affichage de {((paginationInfo.page - 1) * paginationInfo.limit) + 1}
                        à {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}
                        sur {paginationInfo.total} projets
                    </div>
                {/if}
            {/if}
        </div>
    </section>

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

    html {
        scroll-behavior: smooth;
    }

    button:focus {
        outline: 2px solid #c174f2;
        outline-offset: 2px;
    }

    input:focus, select:focus {
        outline: none;
    }

    /* Animation pour les cartes */
    .group:hover .transform {
        transform: translateY(-2px);
    }

    /* Responsive pour mobile */
    @media (max-width: 640px) {
        .grid.md\\:grid-cols-2.lg\\:grid-cols-3 {
            grid-template-columns: 1fr;
        }

        .grid.md\\:grid-cols-3 {
            grid-template-columns: 1fr;
        }
    }
</style>