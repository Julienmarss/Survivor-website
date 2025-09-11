<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Header from '../../lib/components/Header.svelte';
    import Footer from '../../lib/components/Footer.svelte';
    import LoadingSpinner from '../../lib/components/LoadingSpinner.svelte';
    import ErrorMessage from '../../lib/components/ErrorMessage.svelte';
    import StartupCard from '../../lib/components/StartupCard.svelte';

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
    let viewMode = 'default'; // 'default', 'compact', 'minimal', 'detailed'
    let isVisible = true;

    // Variables réactives
    $: startups = Array.isArray($startupsList) ? $startupsList : [];
    $: availableSectors = Array.isArray($sectors) ? $sectors : [];
    $: isLoading = $loading;
    $: errorMessage = $error;
    $: paginationInfo = $pagination ?? { page: 1, limit: 12, total: 0, totalPages: 1 };
    $: currentFilters = $filters ?? { search: '', sector: 'all', maturity: 'all' };

    // Sync des filtres locaux avec le store
    $: {
        if (searchInput !== currentFilters.search) searchInput = currentFilters.search ?? '';
        if (selectedSector !== currentFilters.sector) selectedSector = currentFilters.sector ?? 'all';
        if (selectedMaturity !== currentFilters.maturity) selectedMaturity = currentFilters.maturity ?? 'all';
    }

    onMount(async () => {
        try {
            await Promise.all([
                startupsActions.loadStartups(),
                startupsActions.loadSectors()
            ]);
        } catch (e) {
            console.error('Init load error:', e);
        }
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
        if (newPage < 1 || newPage > (paginationInfo.totalPages ?? 1)) return;
        await startupsActions.loadStartups(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleCardClick(event) {
        const startup = event.detail;
        if (!startup?.id) return;
        goto(`/startup/${startup.id}`);
    }

    function handleWebsiteClick(event) {
        const { url } = event.detail || {};
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }

    function retryLoad() {
        startupsActions.clearError();
        startupsActions.loadStartups();
        startupsActions.loadSectors();
    }

    let searchTimeout;
    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 500);
    }

    function generatePageNumbers() {
        const current = paginationInfo.page ?? 1;
        const total = paginationInfo.totalPages ?? 1;
        const pages = [];

        if (total <= 1) return [1];

        pages.push(1);

        let start = Math.max(2, current - 2);
        let end = Math.min(total - 1, current + 2);

        if (start > 2) pages.push('...');

        for (let i = start; i <= end; i++) pages.push(i);

        if (end < total - 1) pages.push('...');

        if (total > 1) pages.push(total);
        return pages;
    }

    // Configuration de la grille selon le mode d'affichage
    function getGridClasses() {
        switch (viewMode) {
            case 'compact':
                return 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
            case 'minimal':
                return 'space-y-2';
            case 'detailed':
                return 'grid lg:grid-cols-2 gap-8';
            default:
                return 'grid md:grid-cols-2 lg:grid-cols-3 gap-6';
        }
    }
</script>

<svelte:head>
    <title>Projets - JEB Incubator</title>
    <meta name="description" content="Découvrez tous les projets et startups incubés par JEB Incubator">
</svelte:head>

<div class="min-h-screen bg-gray-50">
    <Header />

    {#if errorMessage}
        <ErrorMessage message={errorMessage} onRetry={retryLoad} />
    {/if}

    <!-- En-tête de la page -->
    <section class="pt-24 pb-12 px-6 sm:px-8 lg:px-12">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-12">
                <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    Nos Projets
                </h1>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Explorez l'écosystème complet des startups incubées par JEB Incubator,
                    des projets en phase d'idéation aux entreprises en pleine croissance.
                </p>
            </div>

            <!-- Filtres et recherche -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <div class="grid md:grid-cols-4 gap-4 mb-6">
                    <!-- Recherche -->
                    <div>
                        <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
                            Rechercher
                        </label>
                        <input
                                id="search"
                                type="text"
                                bind:value={searchInput}
                                on:input={debounceSearch}
                                placeholder="Nom, description..."
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-300"
                        />
                    </div>

                    <!-- Filtre par secteur -->
                    <div>
                        <label for="sector" class="block text-sm font-medium text-gray-700 mb-2">
                            Secteur
                        </label>
                        <select
                                id="sector"
                                bind:value={selectedSector}
                                on:change={handleSectorChange}
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-300"
                        >
                            <option value="all">Tous les secteurs</option>
                            {#each availableSectors as sector}
                                <option value={sector.name}>{sector.name} {sector.count ? `(${sector.count})` : ''}</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Filtre par maturité -->
                    <div>
                        <label for="maturity" class="block text-sm font-medium text-gray-700 mb-2">
                            Maturité
                        </label>
                        <select
                                id="maturity"
                                bind:value={selectedMaturity}
                                on:change={handleMaturityChange}
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-300"
                        >
                            <option value="all">Toutes les phases</option>
                            <option value="Idéation">Idéation</option>
                            <option value="Prototype">Prototype</option>
                            <option value="Validation">Validation</option>
                            <option value="Croissance">Croissance</option>
                            <option value="Scale-up">Scale-up</option>
                        </select>
                    </div>

                    <!-- Sélecteur de vue -->
                    <div>
                        <label for="viewMode" class="block text-sm font-medium text-gray-700 mb-2">
                            Affichage
                        </label>
                        <select
                                id="viewMode"
                                bind:value={viewMode}
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-300"
                        >
                            <option value="default">Standard</option>
                            <option value="compact">Compact</option>
                            <option value="minimal">Minimal</option>
                            <option value="detailed">Détaillé</option>
                        </select>
                    </div>
                </div>

                <!-- Statistiques rapides -->
                <div class="pt-4 border-t border-gray-200">
                    <div class="flex justify-between items-center text-sm text-gray-600">
                        <span>
                            {#if (paginationInfo.total ?? 0) > 0}
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
                    <LoadingSpinner size="lg" color="#6366f1" />
                </div>
            {:else if startups.length === 0}
                <div class="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <div class="max-w-md mx-auto">
                        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.383-1.005-5.824-2.618M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun projet trouvé</h3>
                        <p class="text-gray-500 mb-6">
                            {currentFilters.search || currentFilters.sector !== 'all'
                                ? 'Aucun projet ne correspond à vos critères de recherche.'
                                : 'Aucun projet disponible pour le moment.'}
                        </p>
                        <button
                                on:click={() => {
                                startupsActions.resetFilters();
                                retryLoad();
                            }}
                                class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-300">
                            {currentFilters.search || currentFilters.sector !== 'all' ? 'Réinitialiser les filtres' : 'Réessayer'}
                        </button>
                    </div>
                </div>
            {:else}
                <!-- Grille des startups -->
                <div class="{getGridClasses()} mb-12">
                    {#each startups as startup, index}
                        <StartupCard
                                {startup}
                                {index}
                                {isVisible}
                                variant={viewMode}
                                on:cardClick={handleCardClick}
                                on:websiteClick={handleWebsiteClick}
                        />
                    {/each}
                </div>

                <!-- Pagination -->
                {#if (paginationInfo.totalPages ?? 1) > 1}
                    <div class="bg-white rounded-lg border border-gray-200 p-6">
                        <div class="flex justify-center items-center space-x-2 mb-4">
                            <button
                                    on:click={() => handlePageChange(paginationInfo.page - 1)}
                                    disabled={paginationInfo.page === 1}
                                    class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>

                            {#each generatePageNumbers() as pageNumber}
                                {#if pageNumber === '...'}
                                    <span class="px-4 py-2 text-gray-400">...</span>
                                {:else}
                                    <button
                                            on:click={() => handlePageChange(pageNumber)}
                                            class="px-4 py-2 rounded-lg border transition-colors duration-300 {
                                            pageNumber === paginationInfo.page
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }">
                                        {pageNumber}
                                    </button>
                                {/if}
                            {/each}

                            <button
                                    on:click={() => handlePageChange(paginationInfo.page + 1)}
                                    disabled={paginationInfo.page === paginationInfo.totalPages}
                                    class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        </div>

                        <div class="text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
                            Affichage de {((paginationInfo.page - 1) * paginationInfo.limit) + 1}
                            à {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}
                            sur {paginationInfo.total} projets
                        </div>
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
        .grid.md\:grid-cols-2.lg\:grid-cols-3 {
            grid-template-columns: 1fr;
        }
        .grid.md\:grid-cols-3 {
            grid-template-columns: 1fr;
        }
        .grid.md\:grid-cols-4 {
            grid-template-columns: 1fr;
        }
    }
</style>