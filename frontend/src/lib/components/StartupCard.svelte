<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let startup = {};
    export let index = 0;
    export let isVisible = true;

    function handleCardClick() {
        dispatch('cardClick', startup);
    }

    function handleWebsiteClick(event) {
        event.stopPropagation();
        dispatch('websiteClick', { startup, url: startup.website_url });
    }

    // Fonction pour obtenir une couleur de fond basée sur l'index
    function getCardColor(index) {
        const colors = [
            'from-pink-100 to-pink-50 border-pink-200',
            'from-purple-100 to-purple-50 border-purple-200',
            'from-indigo-100 to-indigo-50 border-indigo-200',
            'from-rose-100 to-rose-50 border-rose-200'
        ];
        return colors[index % colors.length];
    }

    // Fonction pour obtenir la couleur d'accent
    function getAccentColor(index) {
        const colors = ['text-pink-600', 'text-purple-600', 'text-indigo-600', 'text-rose-600'];
        return colors[index % colors.length];
    }

    // Fonction pour obtenir la couleur du bouton
    function getButtonColor(index) {
        const colors = [
            'bg-pink-500 hover:bg-pink-600',
            'bg-purple-500 hover:bg-purple-600',
            'bg-indigo-500 hover:bg-indigo-600',
            'bg-rose-500 hover:bg-rose-600'
        ];
        return colors[index % colors.length];
    }
</script>

<div class="startup-card bg-gradient-to-br {getCardColor(index)} border-2 rounded-2xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer relative overflow-hidden"
     on:click={handleCardClick}>

    <!-- Decoration circles -->
    <div class="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-20 rounded-full -translate-y-10 translate-x-10"></div>
    <div class="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full translate-y-8 -translate-x-8"></div>

    <!-- En-tête -->
    <div class="relative z-10 mb-5">
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <h3 class="startup-title text-xl font-bold text-gray-800 mb-2 leading-tight">
                    {startup.name}
                </h3>
                <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold {getAccentColor(index)} bg-white bg-opacity-80 shadow-sm">
                        {startup.sector}
                    </span>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-gray-600 bg-white bg-opacity-60">
                        {startup.maturity}
                    </span>
                </div>
            </div>
        </div>
    </div>

    <!-- Description -->
    <div class="relative z-10 mb-5">
        <p class="startup-description text-gray-700 text-sm leading-relaxed line-clamp-3">
            {startup.description}
        </p>
    </div>

    <!-- Informations supplémentaires -->
    <div class="relative z-10 space-y-3 mb-6">
        {#if startup.project_status}
            <div class="flex items-start">
                <div class="flex items-center justify-center w-6 h-6 rounded-full bg-white bg-opacity-80 mr-3 mt-0.5">
                    <div class="w-2 h-2 rounded-full {getAccentColor(index).replace('text-', 'bg-')}"></div>
                </div>
                <div class="flex-1">
                    <span class="startup-label text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</span>
                    <p class="startup-text text-sm text-gray-800 font-medium">{startup.project_status}</p>
                </div>
            </div>
        {/if}

        {#if startup.needs}
            <div class="flex items-start">
                <div class="flex items-center justify-center w-6 h-6 rounded-full bg-white bg-opacity-80 mr-3 mt-0.5">
                    <div class="w-2 h-2 rounded-full {getAccentColor(index).replace('text-', 'bg-')}"></div>
                </div>
                <div class="flex-1">
                    <span class="startup-label text-xs font-semibold text-gray-600 uppercase tracking-wider">Besoins</span>
                    <p class="startup-text text-sm text-gray-800">{startup.needs}</p>
                </div>
            </div>
        {/if}

        {#if startup.founders && startup.founders.length > 0}
            <div class="flex items-start">
                <div class="flex items-center justify-center w-6 h-6 rounded-full bg-white bg-opacity-80 mr-3 mt-0.5">
                    <div class="w-2 h-2 rounded-full {getAccentColor(index).replace('text-', 'bg-')}"></div>
                </div>
                <div class="flex-1">
                    <span class="startup-label text-xs font-semibold text-gray-600 uppercase tracking-wider">Équipe</span>
                    <p class="startup-text text-sm text-gray-800 font-medium">
                        {startup.founders.map(f => f.name).join(', ')}
                    </p>
                </div>
            </div>
        {/if}
    </div>

    <!-- Pied de carte -->
    <div class="relative z-10 flex items-center justify-between pt-4 border-t border-white border-opacity-40">
        {#if startup.website_url}
            <button
                    on:click={handleWebsiteClick}
                    class="inline-flex items-center px-4 py-2 {getButtonColor(index)} text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                <span class="startup-button-text">Voir le site</span>
                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
            </button>
        {:else}
            <div></div>
        {/if}

        <div class="startup-date text-xs text-gray-500 font-medium bg-white bg-opacity-60 px-2 py-1 rounded-full">
            {new Date(startup.created_at).toLocaleDateString('fr-FR')}
        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;500;600&display=swap');

    .startup-card {
        font-family: 'Open Sans', sans-serif;
        backdrop-filter: blur(10px);
    }

    .startup-title {
        font-family: 'Montserrat', sans-serif;
    }

    .startup-label {
        font-family: 'Montserrat', sans-serif;
    }

    .startup-button-text {
        font-family: 'Montserrat', sans-serif;
    }

    .startup-description {
        line-height: 1.6;
    }

    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .startup-card:hover {
        transform: translateY(-2px);
    }

    .startup-date {
        font-family: 'Montserrat', sans-serif;
    }
</style>