<script lang="ts">
  import { slide } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/userStore.js';

  let isMenuOpen = $state(false);
  let showDropdown = $state(false);

  // Utiliser le store au lieu des props
  let user = $state(null);
  let isAdmin = $derived(user?.role === 'admin' || user?.isAdmin === true);
  let unreadCount = $state(0);

  // S'abonner au store utilisateur
  userStore.subscribe(value => {
    user = value;
    console.log('User data in header:', user);
  });

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  function toggleDropdown() {
    showDropdown = !showDropdown;
  }

  function handleLogout() {
    showDropdown = false;
    userStore.logout();
    window.location.href = '/';
  }

  // Fermer le dropdown si on clique ailleurs
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const userMenuButton = document.querySelector('[aria-label="Menu utilisateur"]');
    const dropdown = document.querySelector('.user-dropdown');

    if (userMenuButton && dropdown &&
            !userMenuButton.contains(target) &&
            !dropdown.contains(target)) {
      showDropdown = false;
    }
  }

  onMount(() => {
    userStore.init();
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  // Fonction pour obtenir les initiales de l'utilisateur
  function getUserInitials(user: any): string {
    if (!user) return '';

    const firstName = user.firstName || user.first_name || user.prenom || user.name?.split(' ')[0];
    const lastName = user.lastName || user.last_name || user.nom || user.name?.split(' ')[1];

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '';
  }

  // Fonction pour obtenir le nom d'affichage
  function getDisplayName(user: any): string {
    if (!user) return '';

    const firstName = user.firstName || user.first_name || user.prenom;
    const lastName = user.lastName || user.last_name || user.nom;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (user.name) {
      return user.name;
    } else if (user.email) {
      return user.email;
    }
    return '';
  }
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/20">
  <nav class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="flex items-center space-x-2">
            <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-xl font-['Montserrat']">J</span>
            </div>
            <div class="hidden sm:block">
              <h1 class="text-xl font-bold text-gray-900 font-['Montserrat']">JEB <span class="text-[#c174f2]">Incubateur</span></h1>
              <p class="text-xs text-gray-500 font-['Open_Sans']">Pôle Innovation</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Desktop -->
      <div class="hidden md:block">
        <div class="ml-10 flex items-baseline space-x-8">
          <a href="#" class="text-gray-900 hover:text-[#c174f2] px-3 py-2 text-sm font-medium font-['Open_Sans'] transition-colors duration-300">
            Accueil
          </a>
          <a href="/projects" class="text-gray-600 hover:text-[#c174f2] px-3 py-2 text-sm font-medium font-['Open_Sans'] transition-colors duration-300">
            Projets
          </a>
          <a href="#" class="text-gray-600 hover:text-[#c174f2] px-3 py-2 text-sm font-medium font-['Open_Sans'] transition-colors duration-300">
            Actualités
          </a>
          <a href="#" class="text-gray-600 hover:text-[#c174f2] px-3 py-2 text-sm font-medium font-['Open_Sans'] transition-colors duration-300">
            Événements
          </a>
          <a href="#" class="text-gray-600 hover:text-[#c174f2] px-3 py-2 text-sm font-medium font-['Open_Sans'] transition-colors duration-300">
            À propos
          </a>
        </div>
      </div>

      <!-- Menu utilisateur & CTA -->
      <div class="flex items-center space-x-4">
        <!-- Menu utilisateur -->
        <div class="relative">
          <button
                  class="flex items-center gap-2 text-gray-600 hover:text-[#c174f2] px-3 py-2 rounded-md transition-colors duration-300"
                  on:click={toggleDropdown}
                  aria-label="Menu utilisateur"
          >
            {#if user}
              <!-- Avatar avec initiales -->
              <div class="w-8 h-8 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center text-sm font-semibold text-white">
                {getUserInitials(user)}
              </div>
              <!-- Nom de l'utilisateur -->
              <span class="hidden lg:block text-sm font-medium font-['Open_Sans']">
                {getDisplayName(user)}
              </span>
            {:else}
              <!-- Icône utilisateur par défaut -->
              <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            {/if}

            {#if unreadCount > 0}
              <span class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">{unreadCount}</span>
            {/if}

            <!-- Flèche -->
            <svg class="w-4 h-4 transition-transform {showDropdown ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {#if showDropdown}
            <div
                    class="user-dropdown absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl z-[10000] border border-gray-200"
                    transition:slide={{ duration: 200 }}
            >
              <div class="py-2">
                {#if user}
                  <!-- Section utilisateur connecté -->
                  <div class="px-4 py-3 border-b border-gray-100">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center text-white font-semibold">
                        {getUserInitials(user)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <p class="text-gray-900 font-medium text-sm truncate font-['Open_Sans']">
                            {getDisplayName(user)}
                          </p>
                        </div>
                        <p class="text-gray-500 text-xs truncate font-['Open_Sans']">{user.email || ''}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Menu connecté -->
                  <a href="/profile" class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#c174f2]">
                    Mon profil
                  </a>
                  <a href="/dashboard" class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#c174f2]">
                    Tableau de bord
                  </a>
                  <a href="/projects" class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#c174f2]">
                    Mes projets
                  </a>
                  {#if isAdmin}
                    <a href="/admin" class="flex items-center gap-3 px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 hover:text-orange-700">
                      Administration
                    </a>
                  {/if}

                  <hr class="border-gray-100 my-2">

                  <button on:click={handleLogout} class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 text-left">
                    Se déconnecter
                  </button>
                {:else}
                  <!-- Menu non connecté -->
                  <a href="/login" class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#c174f2]">
                    Se connecter
                  </a>
                  <a href="/register" class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#c174f2]">
                    S'inscrire
                  </a>
                {/if}
              </div>
            </div>
          {/if}
        </div>

        <!-- Bouton CTA -->
        {#if !user}
          <div class="hidden md:block">
            <button class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">
              Rejoignez-nous
            </button>
          </div>
        {/if}

        <!-- Bouton menu mobile -->
        <div class="md:hidden">
          <button
                  on:click={toggleMenu}
                  class="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#c174f2] hover:bg-gray-100"
          >
            <span class="sr-only">Ouvrir le menu principal</span>
            {#if !isMenuOpen}
              <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            {:else}
              <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation Mobile -->
    {#if isMenuOpen}
      <div class="md:hidden" transition:slide={{ duration: 300 }}>
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200 shadow-lg">
          <a href="#" on:click={closeMenu} class="block px-3 py-2 text-base font-medium text-gray-900 hover:text-[#c174f2]">
            Accueil
          </a>
          <a href="/projects" on:click={closeMenu} class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-[#c174f2]">
            Projets
          </a>
          <a href="#" on:click={closeMenu} class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-[#c174f2]">
            Actualités
          </a>
          <a href="#" on:click={closeMenu} class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-[#c174f2]">
            Événements
          </a>
          <a href="#" on:click={closeMenu} class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-[#c174f2]">
            À propos
          </a>

          {#if !user}
            <div class="border-t border-gray-200 pt-4 pb-3">
              <div class="flex flex-col items-stretch px-3 space-y-2">
                <a href="/login" class="text-[#c174f2] hover:text-[#cb90f1] block px-3 py-2 text-base font-medium">
                  Se connecter
                </a>
                <button class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-full text-base font-medium hover:shadow-lg">
                  Rejoignez-nous
                </button>
              </div>
            </div>
          {:else}
            <div class="border-t border-gray-200 pt-4 pb-3">
              <div class="flex items-center px-3 mb-3">
                <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center text-white font-semibold">
                  {getUserInitials(user)}
                </div>
                <div class="ml-3">
                  <div class="text-base font-medium text-gray-800">{getDisplayName(user)}</div>
                  <div class="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <a href="/dashboard" on:click={closeMenu} class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-[#c174f2]">
                Tableau de bord
              </a>
              <a href="/profile" on:click={closeMenu} class="block px-3 py-2 text-base font-medium text-gray-600 hover:text-[#c174f2]">
                Mon profil
              </a>
              {#if isAdmin}
                <a href="/admin" on:click={closeMenu} class="block px-3 py-2 text-base font-medium text-orange-600 hover:text-orange-700">
                  Administration
                </a>
              {/if}
              <button on:click={handleLogout} class="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700">
                Se déconnecter
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </nav>
</header>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>