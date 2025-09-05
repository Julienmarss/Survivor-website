<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Header from '../lib/components/Header.svelte';
  import Footer from '../lib/components/Footer.svelte';
  import LoadingSpinner from '../lib/components/LoadingSpinner.svelte';
  import ErrorMessage from '../lib/components/ErrorMessage.svelte';

  // Import des stores mis à jour
  import {
    featuredStartups,
    formattedStats,
    loading,
    error,
    startupsActions
  } from '../lib/stores/startups.js';

  let mounted = false;
  let heroRef;
  let statsRef;
  let projectsRef;
  let servicesRef;

  // Variables pour les animations
  let heroVisible = false;
  let statsVisible = false;
  let projectsVisible = false;
  let servicesVisible = false;

  // Animation des compteurs - maintenant connecté aux vraies données API
  let animatedStats = {
    startups: 0,
    funds: 0,
    success: 0,
    investors: 0
  };

  // Variables réactives pour les données de l'API
  $: realStats = $formattedStats;
  $: startupsList = $featuredStartups;
  $: isLoading = $loading;
  $: errorMessage = $error;

  // Fonctions utilitaires pour les catégories
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

  function getCategoryColor(category) {
    const colors = {
      'GreenTech': 'text-green-600',
      'HealthTech': 'text-blue-600',
      'FinTech': 'text-purple-600',
      'AgriTech': 'text-orange-600',
      'EdTech': 'text-pink-600',
      'CyberSecurity': 'text-red-600',
      'Tech': 'text-blue-600',
      'Santé': 'text-blue-600',
      'Finance': 'text-purple-600',
      'Agriculture': 'text-orange-600',
      'Éducation': 'text-pink-600',
      'Environnement': 'text-green-600',
      'Technologie': 'text-blue-600',
      'default': 'text-gray-600'
    };
    return colors[category] || colors.default;
  }

  function animateCounter(key, target, duration = 2000) {
    const start = performance.now();
    const startValue = animatedStats[key];

    function updateCounter(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      animatedStats[key] = Math.floor(startValue + (target - startValue) * easeOut);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }
    requestAnimationFrame(updateCounter);
  }

  function handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target === heroRef) {
          heroVisible = true;
        } else if (entry.target === statsRef) {
          statsVisible = true;
          // Démarrer les animations des compteurs avec les vraies données de l'API
          setTimeout(() => {
            animateCounter('startups', realStats.startups);
            animateCounter('funds', realStats.funds);
            animateCounter('success', realStats.success);
            animateCounter('investors', realStats.investors);
          }, 300);
        } else if (entry.target === projectsRef) {
          projectsVisible = true;
        } else if (entry.target === servicesRef) {
          servicesVisible = true;
        }
      }
    });
  }

  onMount(async () => {
    mounted = true;

    // Charger les données depuis l'API backend
    try {
      await Promise.all([
        startupsActions.loadFeatured(6),
        startupsActions.loadStats()
      ]);
    } catch (err) {
      console.error('Erreur lors du chargement initial:', err);
    }

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    });

    if (heroRef) observer.observe(heroRef);
    if (statsRef) observer.observe(statsRef);
    if (projectsRef) observer.observe(projectsRef);
    if (servicesRef) observer.observe(servicesRef);

    // Animation initiale du hero
    setTimeout(() => {
      heroVisible = true;
    }, 100);

    return () => {
      observer.disconnect();
    };
  });

  // Effet de parallax subtil
  let scrollY = 0;
  $: if (mounted) {
    const handleScroll = () => scrollY = window.scrollY;
    window.addEventListener('scroll', handleScroll);
  }

  // Fonction pour naviguer vers la page des projets
  function navigateToProjects() {
    goto('/projects');
  }

  // Fonction pour naviguer vers une startup spécifique
  function navigateToStartup(startupId) {
    goto(`/startup/${startupId}`);
  }

  // Fonction pour retenter le chargement en cas d'erreur
  function retryLoad() {
    startupsActions.clearError();
    startupsActions.loadFeatured(6);
    startupsActions.loadStats();
  }


</script>

<svelte:window bind:scrollY />

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 overflow-hidden">
  <Header />

  <!-- Affichage des erreurs -->
  {#if errorMessage}
    <ErrorMessage message={errorMessage} onRetry={retryLoad} />
  {/if}

  <!-- Section Hero -->
  <section bind:this={heroRef} class="relative px-6 pt-20 pb-16 sm:px-8 lg:px-12">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h1 class="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 font-['Montserrat'] leading-tight transform transition-all duration-1000 {heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
          Transformons les idées en
          <span class="bg-gradient-to-r from-[#c174f2] via-[#f18585] to-[#f49c9c] bg-clip-text text-transparent inline-block transform transition-all duration-1000 delay-300 {heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
            Startups à Succès
          </span>
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto font-['Open_Sans'] leading-relaxed transform transition-all duration-1000 delay-500 {heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
          JEB Incubator est là où l'innovation rencontre l'opportunité. Nous accompagnons les entrepreneurs ambitieux
          et les connectons avec des investisseurs, des partenaires et les ressources dont ils ont besoin pour prospérer.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-1000 delay-700 {heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
          <button
                  on:click={navigateToProjects}
                  class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-purple-500/25 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
            <span class="relative z-10">Découvrir les Projets</span>
            <div class="absolute inset-0 bg-gradient-to-r from-[#cb90f1] to-[#c174f2] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
          <button class="border-2 border-[#c174f2] text-[#c174f2] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#c174f2] hover:text-white hover:shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
            <span class="relative z-10">Devenir Investisseur</span>
            <div class="absolute inset-0 bg-[#c174f2] transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Particules flottantes décoratives -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-[#c174f2] rounded-full opacity-60 animate-ping" style="animation-delay: 0s;"></div>
      <div class="absolute top-1/3 right-1/4 w-1 h-1 bg-[#f18585] rounded-full opacity-40 animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute bottom-1/3 left-1/6 w-3 h-3 bg-[#d5a8f2] rounded-full opacity-50 animate-bounce" style="animation-delay: 2s;"></div>
    </div>
  </section>

  <!-- Section Statistiques -->
  <section bind:this={statsRef} class="py-16 bg-white/70 backdrop-blur-sm relative">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      {#if isLoading && realStats.startups === 0}
        <div class="flex justify-center">
          <LoadingSpinner />
        </div>
      {:else}
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div class="text-center transform transition-all duration-700 {statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 100ms;">
            <div class="text-4xl font-bold text-[#c174f2] mb-2 font-['Montserrat'] hover:scale-110 transition-transform duration-300">
              {animatedStats.startups}+
            </div>
            <div class="text-gray-600 font-['Open_Sans']">Startups Incubées</div>
            <div class="w-12 h-1 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-full mx-auto mt-2 transform scale-x-0 {statsVisible ? 'scale-x-100' : ''} transition-transform duration-500 delay-300"></div>
          </div>
          <div class="text-center transform transition-all duration-700 {statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 200ms;">
            <div class="text-4xl font-bold text-[#f18585] mb-2 font-['Montserrat'] hover:scale-110 transition-transform duration-300">
              €{animatedStats.funds}M+
            </div>
            <div class="text-gray-600 font-['Open_Sans']">Fonds Levés</div>
            <div class="w-12 h-1 bg-gradient-to-r from-[#f18585] to-[#f49c9c] rounded-full mx-auto mt-2 transform scale-x-0 {statsVisible ? 'scale-x-100' : ''} transition-transform duration-500 delay-400"></div>
          </div>
          <div class="text-center transform transition-all duration-700 {statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
            <div class="text-4xl font-bold text-[#d5a8f2] mb-2 font-['Montserrat'] hover:scale-110 transition-transform duration-300">
              {animatedStats.success}%
            </div>
            <div class="text-gray-600 font-['Open_Sans']">Taux de Réussite</div>
            <div class="w-12 h-1 bg-gradient-to-r from-[#d5a8f2] to-[#e4bef8] rounded-full mx-auto mt-2 transform scale-x-0 {statsVisible ? 'scale-x-100' : ''} transition-transform duration-500 delay-500"></div>
          </div>
          <div class="text-center transform transition-all duration-700 {statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 400ms;">
            <div class="text-4xl font-bold text-[#f49c9c] mb-2 font-['Montserrat'] hover:scale-110 transition-transform duration-300">
              {animatedStats.investors}+
            </div>
            <div class="text-gray-600 font-['Open_Sans']">Investisseurs Connectés</div>
            <div class="w-12 h-1 bg-gradient-to-r from-[#f49c9c] to-[#f6aeae] rounded-full mx-auto mt-2 transform scale-x-0 {statsVisible ? 'scale-x-100' : ''} transition-transform duration-500 delay-600"></div>
          </div>
        </div>
      {/if}
    </div>
  </section>

  <!-- Projets en Vedette -->
  <section bind:this={projectsRef} class="py-20 px-6 sm:px-8 lg:px-12">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16 transform transition-all duration-1000 {projectsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <h2 class="text-4xl font-bold text-gray-900 mb-4 font-['Montserrat']">Projets en Vedette</h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto font-['Open_Sans']">
          Découvrez les startups innovantes qui façonnent l'avenir dans différents secteurs
        </p>
      </div>

      {#if isLoading && startupsList.length === 0}
        <div class="flex justify-center">
          <LoadingSpinner />
        </div>
      {:else if startupsList.length === 0}
        <div class="text-center py-12">
          <p class="text-gray-500 text-lg">Aucune startup disponible pour le moment.</p>
          <button
                  on:click={retryLoad}
                  class="mt-4 bg-[#c174f2] text-white px-6 py-2 rounded-full hover:bg-[#cb90f1] transition-colors duration-300">
            Réessayer
          </button>
        </div>
      {:else}
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {#each startupsList as startup, index}
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group transform {projectsVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} cursor-pointer"
                 style="transition-delay: {(index + 1) * 200}ms;"
                 on:click={() => navigateToStartup(startup.id)}>
              <div class="h-48 bg-gradient-to-r {startup.gradient || getCategoryGradient(startup.category)} relative overflow-hidden">
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                <div class="absolute bottom-4 left-4 text-white transform group-hover:translate-x-1 transition-transform duration-300">
                  <div class="text-sm font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">{startup.sector}</div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 transform scale-0 group-hover:scale-100 transition-transform duration-500 origin-top-left"></div>
              </div>
              <div class="p-6 transform group-hover:translate-y-[-2px] transition-transform duration-300">
                <h3 class="text-xl font-bold text-gray-900 mb-2 font-['Montserrat'] group-hover:{getCategoryColor(startup.category)} transition-colors duration-300">{startup.name}</h3>
                <p class="text-gray-600 mb-4 font-['Open_Sans'] line-clamp-3">
                  {startup.description}
                </p>
                <div class="flex items-center justify-between mb-3">
                  <div class="flex -space-x-2">
                    {#each (startup.founders || []).slice(0, 3) as founder, i}
                      <div class="w-8 h-8 rounded-full bg-gradient-to-r from-[#c174f2] to-[#f18585] border-2 border-white transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center text-white text-xs font-bold"
                           style="transition-delay: {i * 50}ms;"
                           title="{founder.name}">
                        {founder.name.charAt(0).toUpperCase()}
                      </div>
                    {/each}
                    {#if (startup.founders || []).length > 3}
                      <div class="w-8 h-8 rounded-full bg-gray-300 border-2 border-white transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center text-gray-600 text-xs font-bold"
                           title="+{startup.founders.length - 3} autres">
                        +{startup.founders.length - 3}
                      </div>
                    {/if}
                  </div>
                  <span class="text-sm text-gray-500 font-['Open_Sans'] bg-gray-100 px-3 py-1 rounded-full group-hover:bg-gradient-to-r group-hover:from-[#c174f2] group-hover:to-[#f18585] group-hover:text-white transition-all duration-300">{startup.maturity}</span>
                </div>

                <!-- Informations de la base de données -->
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
              </div>
            </div>
          {/each}
        </div>

        <div class="text-center mt-12 transform transition-all duration-1000 delay-800 {projectsVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
          <button
                  on:click={navigateToProjects}
                  class="bg-white border-2 border-[#c174f2] text-[#c174f2] px-8 py-3 rounded-full font-semibold hover:bg-[#c174f2] hover:text-white hover:shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
            <span class="relative z-10">Voir Tous les Projets</span>
            <div class="absolute inset-0 bg-[#c174f2] transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
          </button>
        </div>
      {/if}
    </div>
  </section>

  <!-- Section Services -->
  <section bind:this={servicesRef} class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      <div class="text-center mb-16 transform transition-all duration-1000 {servicesVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <h2 class="text-4xl font-bold text-gray-900 mb-4 font-['Montserrat']">Ce Que Nous Offrons</h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto font-['Open_Sans']">
          Un accompagnement complet pour transformer vos idées innovantes en entreprises prospères
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="text-center group transform transition-all duration-700 {servicesVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 200ms;">
          <div class="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-[#f18585] to-[#f49c9c] rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative overflow-hidden">
            <svg class="w-8 h-8 text-white transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <div class="absolute inset-0 bg-white/20 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-500"></div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-4 font-['Montserrat'] group-hover:text-[#f18585] transition-colors duration-300">Mentorat</h3>
          <p class="text-gray-600 font-['Open_Sans'] group-hover:text-gray-700 transition-colors duration-300">Connectez-vous avec des experts du secteur et des entrepreneurs expérimentés qui vous guident à chaque étape de votre parcours.</p>
        </div>

        <div class="text-center group transform transition-all duration-700 {servicesVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 400ms;">
          <div class="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative overflow-hidden">
            <svg class="w-8 h-8 text-white transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
            <div class="absolute inset-0 bg-white/20 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-500"></div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-4 font-['Montserrat'] group-hover:text-[#c174f2] transition-colors duration-300">Financement</h3>
          <p class="text-gray-600 font-['Open_Sans'] group-hover:text-gray-700 transition-colors duration-300">Accès à notre réseau d'investisseurs, de capital-risqueurs et d'opportunités de financement pour alimenter la croissance de votre startup.</p>
        </div>

        <div class="text-center group transform transition-all duration-700 {servicesVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 600ms;">
          <div class="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-[#d5a8f2] to-[#e4bef8] rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative overflow-hidden">
            <svg class="w-8 h-8 text-white transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <div class="absolute inset-0 bg-white/20 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-500"></div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-4 font-['Montserrat'] group-hover:text-[#d5a8f2] transition-colors duration-300">Réseau</h3>
          <p class="text-gray-600 font-['Open_Sans'] group-hover:text-gray-700 transition-colors duration-300">Rejoignez une communauté dynamique d'entrepreneurs, de partenaires et de leaders du secteur qui se soutiennent mutuellement pour réussir.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section CTA -->
  <section class="py-20 bg-gradient-to-r from-[#c174f2] via-[#cb90f1] to-[#d5a8f2] relative overflow-hidden">
    <div class="max-w-4xl mx-auto text-center px-6 sm:px-8 lg:px-12 relative z-10">
      <h2 class="text-4xl font-bold text-white mb-6 font-['Montserrat'] transform hover:scale-105 transition-transform duration-300">Prêt à Transformer Votre Idée ?</h2>
      <p class="text-xl text-white/90 mb-8 font-['Open_Sans']">
        Rejoignez JEB Incubator et franchissez le premier pas vers la création de votre startup à succès
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button class="bg-white text-[#c174f2] px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
          <span class="relative z-10">Postuler Maintenant</span>
          <div class="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </button>
        <button class="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-[#c174f2] transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
          <span class="relative z-10">En Savoir Plus</span>
          <div class="absolute inset-0 bg-white transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
        </button>
      </div>
    </div>

    <!-- Éléments de fond animés -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse" style="animation-delay: 0s;"></div>
      <div class="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-lg animate-bounce" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 right-1/6 w-16 h-16 bg-white/5 rounded-full blur-md animate-ping" style="animation-delay: 2s;"></div>
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

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  html {
    scroll-behavior: smooth;
  }

  button:focus {
    outline: 2px solid #c174f2;
    outline-offset: 2px;
  }
</style>