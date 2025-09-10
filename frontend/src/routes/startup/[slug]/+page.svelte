<script>
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import startupsApi from '$lib/services/startupsApi.js';
    import Footer from "$lib/components/Footer.svelte";

    // si tu n'utilises pas Svelte 5 (runes), remplace par: let startup = null; let loading = true; let error = null;
    let startup = $state(null);
    let loading = $state(true);
    let error = $state(null);

    // flags / actions used by the template
    let isClient = false;
    let isSaved = false;

    async function checkSavedStatus() {
        // plug your real logic here if needed
        isSaved = false;
    }

    function shareStartup() {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        if (navigator.share) {
            navigator.share({
                title: startup?.name || 'Startup',
                text: startup?.description || 'Découvrez cette startup',
                url
            }).catch(() => {});
        } else if (url) {
            navigator.clipboard?.writeText(url).catch(() => {});
            alert('Lien copié dans le presse‑papiers');
        }
    }

    function saveStartup() {
        // plug your persistence logic here; UI toggles for now
        isSaved = !isSaved;
    }

    // ----- UI helpers -----
    function getSectorGradient(sector) {
        const gradients = {
            'SaaS': 'from-[#c174f2] to-[#d5a8f2]',
            'HealthTech': 'from-[#f18585] to-[#f49c9c]',
            'FinTech': 'from-[#cb90f1] to-[#e4bef8]',
            'EdTech': 'from-[#f6aeae] to-[#f8cacf]',
            'AgriTech': 'from-[#d5a8f2] to-[#eed5fb]',
            'Tech': 'from-[#c174f2] to-[#cb90f1]',
            'default': 'from-[#c174f2] to-[#f18585]'
        };
        return gradients[sector] || gradients.default;
    }

    function getSectorIcon(sector) {
        const icons = {
            'SaaS': 'SaaS',
            'HealthTech': 'Health',
            'FinTech': 'Fintech',
            'EdTech': 'EdTech',
            'AgriTech': 'AgriTech',
            'Tech': 'Tech',
            'default': 'Startup'
        };
        return icons[sector] || icons.default;
    }

    function getMaturityColor(maturity) {
        const colors = {
            'Idée': 'bg-[#f8cacf] text-[#c174f2]',
            'Prototype': 'bg-[#e4bef8] text-[#c174f2]',
            'MVP': 'bg-[#d5a8f2] text-white',
            'Commercialisation': 'bg-[#cb90f1] text-white',
            'Croissance': 'bg-[#c174f2] text-white'
        };
        return colors[maturity] || 'bg-[#f6aeae] text-[#c174f2]';
    }

    function formatDate(dateString) {
        if (!dateString) return '—';
        const d = new Date(dateString);
        if (isNaN(d)) return '—';
        return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function openWebsite() {
        if (startup?.website_url) window.open(startup.website_url, '_blank', 'noopener,noreferrer');
    }

    function openSocialMedia() {
        if (startup?.social_media_url) window.open(startup.social_media_url, '_blank', 'noopener,noreferrer');
    }

    function sendEmail() {
        if (startup?.email) window.location.href = `mailto:${startup.email}`;
    }

    function callPhone() {
        if (startup?.phone) window.location.href = `tel:${startup.phone}`;
    }

    // ----- Chargement -----
    async function loadStartup(id) {
        try {
            loading = true;
            error = null;

            // Appel réel à l'API (slug ou id)
            const data = await startupsApi.getStartupById(id);

            if (!data) {
                throw new Error('Startup non trouvée');
            }

            // Normalise quelques champs si besoin
            startup = {
                ...data,
                // compat: certains back renvoient createdAt/updatedAt
                created_at: data.created_at ?? data.createdAt ?? null,
                db_created_at: data.db_created_at ?? data.dbCreatedAt ?? null,
                db_updated_at: data.db_updated_at ?? data.dbUpdatedAt ?? data.updated_at ?? data.updatedAt ?? null
            };
        } catch (e) {
            console.error('loadStartup error:', e);
            error = e?.message ?? 'Erreur de chargement';
            startup = null;
        } finally {
            loading = false;
        }
    }

    let currentId = null;
    let unsubscribePage;

    onMount(() => {
        isClient = true;

        unsubscribePage = page.subscribe(($p) => {
            const routeId = $p.params?.id ?? $p.params?.slug;

            if (routeId && routeId !== currentId) {
                currentId = routeId;
                loadStartup(routeId);
            } else if (!routeId) {
                if (loading === true) loading = false;
                error = 'Paramètre de route manquant (id/slug).';
            }
        });
    });

    $effect(() => {
        if (startup && isClient) {
            checkSavedStatus();
        }
    });

    onDestroy(() => {
        if (unsubscribePage) unsubscribePage();
    });

    const city = $derived(() => {
        const addr = startup?.address || '';
        const parts = addr.split(',').map((s) => s.trim()).filter(Boolean);
        return parts.length ? parts[parts.length - 1] : '—';
    });
</script>

<svelte:head>
    <title>{startup ? `${startup.name} - ${startup.sector ?? 'Startup'}` : 'Startup'} | Plateforme Startups</title>
    <meta name="description" content={startup ? (startup.description || 'Détails de la startup') : 'Détails de la startup'} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-[#eed5fb] to-white">
    {#if loading}
        <div class="flex items-center justify-center min-h-screen">
            <div class="flex flex-col items-center space-y-6">
                <div class="animate-spin rounded-full h-16 w-16 border-4 border-[#f6aeae] border-t-[#c174f2]"></div>
                <p class="text-[#c174f2] font-['Open_Sans'] text-lg font-medium">Chargement de la startup...</p>
            </div>
        </div>
    {:else if error || !startup}
        <div class="flex items-center justify-center min-h-screen p-6">
            <div class="text-center bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full border border-[#f6aeae]/20">
                <div class="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center">
                    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.044-5.709-2.573m0 0a15.999 15.999 0 01-.134-1.427c0-.509.027-1.012.08-1.5M6.857 10a11.952 11.952 0 002.143-1 11.952 11.952 0 00-2.143-1"></path>
                    </svg>
                </div>
                <h1 class="text-3xl font-bold text-[#c174f2] mb-4 font-['Montserrat']">Startup non trouvée</h1>
                <p class="text-gray-600 mb-8 font-['Open_Sans'] text-lg leading-relaxed">{error || 'Impossible de charger cette startup.'}</p>
                <button
                        on:click={() => goto('/projects')}
                        class="bg-gradient-to-r from-[#c174f2] to-[#f18585] text-white px-8 py-4 rounded-xl font-semibold font-['Montserrat'] hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                    Retour aux projets
                </button>
            </div>
        </div>
    {:else}
        <!-- Breadcrumb -->
        <div class="bg-white/90 backdrop-blur-sm border-b border-[#f6aeae]/20 sticky top-0 z-40">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <nav class="flex items-center space-x-3 text-sm font-['Open_Sans']">
                    <a href="/" class="text-gray-500 hover:text-[#c174f2] transition-colors font-medium">Accueil</a>
                    <svg class="w-4 h-4 text-[#f6aeae]" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <a href="/projects" class="text-gray-500 hover:text-[#c174f2] transition-colors font-medium">Projets</a>
                    <svg class="w-4 h-4 text-[#f6aeae]" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-[#c174f2] font-semibold">{startup.name}</span>
                </nav>
            </div>
        </div>

        <!-- Header -->
        <div class="relative">
            <div class="h-96 bg-gradient-to-br {getSectorGradient(startup.sector)} relative overflow-hidden">
                <!-- Motifs géométriques -->
                <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
                <div class="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full transform -translate-y-1/2"></div>
                <div class="absolute top-20 right-1/4 w-16 h-16 border-2 border-white/20 rounded-lg rotate-45"></div>
                <div class="absolute bottom-20 right-20 w-20 h-20 border-2 border-white/15 rounded-full"></div>

                <!-- Boutons Partager / Sauvegarder (version ultra-professionnelle) -->
                <div class="absolute bottom-6 right-6 z-10 flex gap-4">
                    <!-- Bouton Partager -->
                    <div class="relative group">
                        <button
                                on:click={shareStartup}
                                class="btn-professional flex items-center space-x-3 px-6 py-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
                        >
                            <div class="relative">
                                <svg class="w-5 h-5 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                                </svg>
                                <!-- Effet de particules -->
                                <div class="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div class="absolute w-1 h-1 bg-white/60 rounded-full animate-pulse" style="top: -2px; left: -2px; animation-delay: 0.1s;"></div>
                                    <div class="absolute w-1 h-1 bg-white/60 rounded-full animate-pulse" style="top: -2px; right: -2px; animation-delay: 0.3s;"></div>
                                    <div class="absolute w-1 h-1 bg-white/60 rounded-full animate-pulse" style="bottom: -2px; left: -2px; animation-delay: 0.5s;"></div>
                                    <div class="absolute w-1 h-1 bg-white/60 rounded-full animate-pulse" style="bottom: -2px; right: -2px; animation-delay: 0.7s;"></div>
                                </div>
                            </div>
                            <span class="font-semibold font-['Montserrat'] text-sm tracking-wide">Partager</span>

                            <!-- Effet de brillance -->
                            <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -skew-x-12"></div>
                        </button>

                        <!-- Tooltip amélioré -->
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                            <div class="bg-black/90 backdrop-blur-sm text-white text-xs px-4 py-2.5 rounded-xl whitespace-nowrap font-['Open_Sans'] shadow-2xl border border-white/10">
                                Partager cette startup
                                <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/90"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Bouton Sauvegarder -->
                    <div class="relative group">
                        <button
                                on:click={saveStartup}
                                class="btn-professional flex items-center space-x-3 px-6 py-3.5 rounded-2xl transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 active:scale-95 font-semibold font-['Montserrat'] text-sm tracking-wide border-2
                            {isSaved
                                ? 'bg-gradient-to-r from-red-400/20 to-pink-400/20 backdrop-blur-xl border-red-300/40 text-white shadow-red-400/20'
                                : 'bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 hover:border-white/40'
                            }"
                        >
                            <div class="relative">
                                <!-- Animation complexe du coeur -->
                                <div class="relative w-5 h-5">
                                    <!-- Coeur vide -->
                                    <svg
                                            class="absolute inset-0 w-5 h-5 transition-all duration-700 {isSaved ? 'scale-0 opacity-0 rotate-180' : 'scale-100 opacity-100 rotate-0'}"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            stroke-width="2.5"
                                    >
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                    </svg>

                                    <!-- Coeur plein -->
                                    <svg
                                            class="absolute inset-0 w-5 h-5 transition-all duration-700 text-red-300 {isSaved ? 'scale-110 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-180'}"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                    >
                                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                    </svg>
                                </div>

                                <!-- Effet de pulsation amélioré -->
                                {#if isSaved}
                                    <div class="absolute -inset-3 bg-red-300/20 rounded-full animate-ping"></div>
                                    <div class="absolute -inset-2 bg-red-300/30 rounded-full animate-pulse"></div>
                                    <!-- Particules flottantes -->
                                    <div class="absolute -inset-4 opacity-100 transition-opacity duration-500">
                                        <div class="absolute w-1.5 h-1.5 bg-red-300/80 rounded-full animate-bounce" style="top: -4px; left: 2px; animation-delay: 0.2s;"></div>
                                        <div class="absolute w-1 h-1 bg-pink-300/80 rounded-full animate-bounce" style="top: -2px; right: 0px; animation-delay: 0.6s;"></div>
                                        <div class="absolute w-1.5 h-1.5 bg-red-300/60 rounded-full animate-bounce" style="bottom: -4px; left: 0px; animation-delay: 1s;"></div>
                                        <div class="absolute w-1 h-1 bg-pink-300/60 rounded-full animate-bounce" style="bottom: -2px; right: 2px; animation-delay: 0.4s;"></div>
                                    </div>
                                {/if}
                            </div>

                            <span class="transition-all duration-300">
                                {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
                            </span>

                            <!-- Effet de brillance -->
                            <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -skew-x-12"></div>
                        </button>

                        <!-- Tooltip dynamique amélioré -->
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                            <div class="bg-black/90 backdrop-blur-sm text-white text-xs px-4 py-2.5 rounded-xl whitespace-nowrap font-['Open_Sans'] shadow-2xl border border-white/10">
                                {isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/90"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/50 via-black/20 to-transparent text-white">
                    <div class="max-w-7xl mx-auto">
                        <div class="flex items-end space-x-8">
                            <!-- Logo professionnel -->
                            <div class="w-32 h-32 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative overflow-hidden">
                                <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5"></div>
                                <div class="relative">
                                    <div class="text-2xl font-bold font-['Montserrat'] text-center leading-tight">
                                        {getSectorIcon(startup.sector)}
                                    </div>
                                </div>
                            </div>

                            <div class="flex-1">
                                <div class="flex items-center space-x-6 mb-4">
                                    <h1 class="text-5xl font-bold font-['Montserrat'] tracking-tight">{startup.name}</h1>
                                    <span class="bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full text-sm font-bold font-['Montserrat'] border border-white/30 uppercase tracking-wide">
                                        {startup.maturity}
                                    </span>
                                </div>
                                <p class="text-2xl opacity-90 mb-6 font-['Open_Sans'] font-light">{startup.sector}</p>
                                <!-- Actions principales dans le header -->
                                <div class="flex items-center space-x-8 text-base opacity-90 font-['Open_Sans']">
                                    <span class="flex items-center space-x-2">
                                        <div class="w-2 h-2 bg-white rounded-full"></div>
                                        <span>{startup.project_status}</span>
                                    </span>
                                    {#if startup.legal_status}
                                        <span class="flex items-center space-x-2">
                                            <div class="w-2 h-2 bg-white/70 rounded-full"></div>
                                            <span>{startup.legal_status}</span>
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div class="grid lg:grid-cols-3 gap-12">
                <!-- Main Content -->
                <div class="lg:col-span-2 space-y-12">
                    <!-- Description -->
                    <section class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-10 border border-[#f6aeae]/10">
                        <div class="flex items-center space-x-3 mb-8">
                            <div class="w-1 h-8 bg-gradient-to-b from-[#c174f2] to-[#f18585] rounded-full"></div>
                            <h2 class="text-3xl font-bold text-[#c174f2] font-['Montserrat']">À propos de {startup.name}</h2>
                        </div>
                        <p class="text-gray-700 leading-relaxed text-xl font-['Open_Sans'] font-light">
                            {startup.description}
                        </p>
                    </section>

                    <!-- Informations détaillées -->
                    <section class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-10 border border-[#f6aeae]/10">
                        <div class="flex items-center space-x-3 mb-10">
                            <div class="w-1 h-8 bg-gradient-to-b from-[#c174f2] to-[#f18585] rounded-full"></div>
                            <h2 class="text-3xl font-bold text-[#c174f2] font-['Montserrat']">Informations détaillées</h2>
                        </div>

                        <div class="grid md:grid-cols-2 gap-8">
                            <!-- Statut du projet -->
                            <div class="group">
                                <div class="flex items-center space-x-3 mb-4">
                                    <div class="w-12 h-12 bg-gradient-to-br from-[#eed5fb] to-[#f8cacf] rounded-lg flex items-center justify-center">
                                        <svg class="w-6 h-6 text-[#c174f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                        </svg>
                                    </div>
                                    <h3 class="text-xl font-semibold font-['Montserrat'] text-gray-800">Statut du projet</h3>
                                </div>
                                <div class="bg-gradient-to-r from-[#eed5fb] to-[#f8cacf] p-6 rounded-xl group-hover:shadow-lg transition-all duration-300">
                                    <p class="text-[#c174f2] font-bold text-lg font-['Montserrat']">{startup.project_status}</p>
                                    <p class="text-gray-600 text-sm font-['Open_Sans'] mt-1">Phase actuelle de développement</p>
                                </div>
                            </div>

                            <!-- Maturité -->
                            <div class="group">
                                <div class="flex items-center space-x-3 mb-4">
                                    <div class="w-12 h-12 bg-gradient-to-br from-[#d5a8f2] to-[#e4bef8] rounded-lg flex items-center justify-center">
                                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                    <h3 class="text-xl font-semibold font-['Montserrat'] text-gray-800">Maturité</h3>
                                </div>
                                <div class="bg-gradient-to-r from-[#d5a8f2] to-[#e4bef8] p-6 rounded-xl group-hover:shadow-lg transition-all duration-300">
                                    <p class="text-white font-bold text-lg font-['Montserrat']">{startup.maturity}</p>
                                    <p class="text-white/80 text-sm font-['Open_Sans'] mt-1">Niveau de développement</p>
                                </div>
                            </div>

                            <!-- Secteur -->
                            <div class="group">
                                <div class="flex items-center space-x-3 mb-4">
                                    <div class="w-12 h-12 bg-gradient-to-br from-[#cb90f1] to-[#c174f2] rounded-lg flex items-center justify-center">
                                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                        </svg>
                                    </div>
                                    <h3 class="text-xl font-semibold font-['Montserrat'] text-gray-800">Secteur</h3>
                                </div>
                                <div class="bg-gradient-to-r from-[#cb90f1] to-[#c174f2] p-6 rounded-xl group-hover:shadow-lg transition-all duration-300">
                                    <p class="text-white font-bold text-lg font-['Montserrat']">{startup.sector}</p>
                                    <p class="text-white/80 text-sm font-['Open_Sans'] mt-1">Domaine d'activité</p>
                                </div>
                            </div>

                            <!-- Besoins actuels -->
                            <div class="group">
                                <div class="flex items-center space-x-3 mb-4">
                                    <div class="w-12 h-12 bg-gradient-to-br from-[#f18585] to-[#f49c9c] rounded-lg flex items-center justify-center">
                                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </div>
                                    <h3 class="text-xl font-semibold font-['Montserrat'] text-gray-800">Besoins actuels</h3>
                                </div>
                                <div class="bg-gradient-to-r from-[#f18585] to-[#f49c9c] p-6 rounded-xl group-hover:shadow-lg transition-all duration-300">
                                    <p class="text-white font-bold text-lg font-['Montserrat']">{startup.needs}</p>
                                    <p class="text-white/80 text-sm font-['Open_Sans'] mt-1">Priorité actuelle</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Sidebar -->
                <div class="space-y-8">

                    <!-- Contact -->
                    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-[#f6aeae]/10">
                        <div class="flex items-center space-x-3 mb-6">
                            <div class="w-1 h-6 bg-gradient-to-b from-[#c174f2] to-[#f18585] rounded-full"></div>
                            <h3 class="text-2xl font-bold font-['Montserrat'] text-[#c174f2]">Contact</h3>
                        </div>
                        <div class="space-y-4">
                            {#if startup.email}
                                <button
                                        on:click={sendEmail}
                                        class="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-[#eed5fb] to-[#f8cacf] rounded-xl hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div class="w-12 h-12 bg-[#c174f2] rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                    <div class="text-left flex-1">
                                        <p class="font-semibold font-['Montserrat'] text-[#c174f2]">Email</p>
                                        <p class="text-sm text-gray-600 font-['Open_Sans'] truncate">{startup.email}</p>
                                    </div>
                                </button>
                            {/if}

                            {#if startup.phone}
                                <button
                                        on:click={callPhone}
                                        class="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-[#d5a8f2] to-[#e4bef8] rounded-xl hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div class="w-12 h-12 bg-[#cb90f1] rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                        </svg>
                                    </div>
                                    <div class="text-left flex-1">
                                        <p class="font-semibold font-['Montserrat'] text-white">Téléphone</p>
                                        <p class="text-sm text-white/80 font-['Open_Sans']">{startup.phone}</p>
                                    </div>
                                </button>
                            {/if}

                            {#if startup.address}
                                <div class="p-4 bg-gradient-to-r from-[#f6aeae] to-[#f8cacf] rounded-xl">
                                    <div class="flex items-center space-x-4">
                                        <div class="w-12 h-12 bg-[#f18585] rounded-lg flex items-center justify-center text-white">
                                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            </svg>
                                        </div>
                                        <div class="flex-1">
                                            <p class="font-semibold font-['Montserrat'] text-white">Localisation</p>
                                            <p class="text-sm text-white/80 font-['Open_Sans']">{startup.address}</p>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Informations complémentaires -->
                    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-[#f6aeae]/10">
                        <div class="flex items-center space-x-3 mb-6">
                            <div class="w-1 h-6 bg-gradient-to-b from-[#c174f2] to-[#f18585] rounded-full"></div>
                            <h3 class="text-2xl font-bold font-['Montserrat'] text-[#c174f2]">Informations</h3>
                        </div>
                        <div class="space-y-4 text-sm font-['Open_Sans']">
                            {#if startup.jeb_id}
                                <div class="flex justify-between items-center py-3 border-b border-[#f6aeae]/20">
                                    <span class="text-gray-600 font-medium">ID JEB:</span>
                                    <span class="font-bold text-[#c174f2] bg-[#eed5fb] px-3 py-1 rounded-full">#{startup.jeb_id}</span>
                                </div>
                            {/if}
                            {#if startup.legal_status}
                                <div class="flex justify-between items-center py-3 border-b border-[#f6aeae]/20">
                                    <span class="text-gray-600 font-medium">Statut légal:</span>
                                    <span class="font-semibold text-gray-900">{startup.legal_status}</span>
                                </div>
                            {/if}
                            <div class="flex justify-between items-center py-3">
                                <span class="text-gray-600 font-medium">Dernière mise à jour:</span>
                                <span class="font-semibold text-gray-900">{formatDate(startup.db_updated_at || startup.updated_at)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Statut badge -->
                    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-[#f6aeae]/10 text-center">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br {getSectorGradient(startup.sector)} rounded-full mb-4">
                            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <div class="w-3 h-3 bg-gradient-to-br {getSectorGradient(startup.sector)} rounded-full"></div>
                            </div>
                        </div>
                        <h4 class="font-bold font-['Montserrat'] text-[#c174f2] text-lg mb-2">Statut actuel</h4>
                        <div class="inline-block {getMaturityColor(startup.maturity)} px-4 py-2 rounded-full text-sm font-bold font-['Montserrat'] uppercase tracking-wide">
                            {startup.maturity}
                        </div>
                        <p class="text-gray-600 font-['Open_Sans'] text-sm mt-3">
                            Cette startup est actuellement en phase de {startup.maturity.toLowerCase()}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer CTA -->
        <div class="bg-gradient-to-r from-[#c174f2] to-[#f18585] py-16">
            <div class="max-w-4xl mx-auto text-center px-4">
                <h2 class="text-4xl font-bold text-white mb-6 font-['Montserrat']">Intéressé par cette startup ?</h2>
                <p class="text-white/90 text-xl mb-8 font-['Open_Sans'] font-light">
                    Découvrez comment vous pouvez collaborer ou investir dans ce projet innovant
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    {#if startup.email}
                        <button
                                on:click={sendEmail}
                                class="bg-white text-[#c174f2] px-8 py-4 rounded-xl font-bold font-['Montserrat'] hover:bg-gray-50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
                        >
                            Prendre contact
                        </button>
                    {/if}
                    <button
                            on:click={() => goto('/projects')}
                            class="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold font-['Montserrat'] hover:bg-white/30 transform hover:-translate-y-1 transition-all duration-300 border border-white/30"
                    >
                        Voir plus de projets
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<Footer />

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700&display=swap');


    .group:hover .group-hover\:scale-110 {
        animation: float 2s ease-in-out infinite;
    }
</style>