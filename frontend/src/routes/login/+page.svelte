<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Header from '../../lib/components/Header.svelte';
  import Footer from '../../lib/components/Footer.svelte';
  import LoadingSpinner from '../../lib/components/LoadingSpinner.svelte';
  import { userStore } from '../../lib/stores/userStore.js';

  let formData = {
    email: '',
    password: ''
  };

  let errors = {};
  let isSubmitting = false;
  let visible = false;
  let showSuccessMessage = false;
  let registrationMessage = '';

  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 100);

    // Vérifier si on vient d'un processus d'inscription
    const urlParams = new URLSearchParams(window.location.search);
    const registered = urlParams.get('registered');
    const type = urlParams.get('type');

    if (registered === 'true') {
      showSuccessMessage = true;
      switch (type) {
        case 'startup':
          registrationMessage = 'Votre startup a été inscrite avec succès ! Connectez-vous pour accéder à votre dashboard.';
          break;
        case 'investor':
          registrationMessage = 'Votre compte investisseur a été créé avec succès ! Connectez-vous pour découvrir les opportunités.';
          break;
        case 'student':
          registrationMessage = 'Votre compte étudiant a été créé avec succès ! Connectez-vous pour rejoindre la communauté.';
          break;
        default:
          registrationMessage = 'Votre compte a été créé avec succès ! Connectez-vous pour continuer.';
      }
    }
  });

  function validateForm() {
    const formErrors = {};

    if (!formData.email.trim()) {
      formErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      formErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      formErrors.password = 'Le mot de passe est obligatoire';
    } else if (formData.password.length < 6) {
      formErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    errors = formErrors;
    return Object.keys(formErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    isSubmitting = true;
    errors = {};

    try {
      console.log('Attempting login for:', formData.email);
      
      const result = await userStore.login(formData.email, formData.password);
      
      if (result.success) {
        console.log('Login successful:', result.user);
        
        // Rediriger selon le rôle de l'utilisateur
        const userRole = result.user.role;
        switch (userRole) {
          case 'admin':
            goto('/admin');
            break;
          case 'startup':
            goto('/');
            break;
          case 'investor':
            goto('/');
            break;
          default:
            goto('/');
        }
      } else {
        errors.submit = result.error || 'Email ou mot de passe incorrect.';
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      errors.submit = 'Une erreur est survenue. Veuillez réessayer.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }

  function dismissSuccessMessage() {
    showSuccessMessage = false;
  }
</script>

<svelte:head>
  <title>Connexion - JEB Incubator</title>
  <meta name="description" content="Connectez-vous à votre compte JEB Incubator">
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <Header />

  <section class="pt-24 pb-20 px-6 sm:px-8 lg:px-12">
    <div class="max-w-md mx-auto">
      
      <!-- Message de succès après inscription -->
      {#if showSuccessMessage}
        <div class="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 transform transition-all duration-1000 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm text-green-700 font-['Inter']">
                {registrationMessage}
              </p>
            </div>
            <div class="ml-auto pl-3">
              <button
                on:click={dismissSuccessMessage}
                class="text-green-400 hover:text-green-600 transition-colors duration-200"
              >
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- En-tête -->
      <div class="text-center mb-12 transform transition-all duration-1000 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center">
            <span class="text-white font-bold text-2xl font-['Montserrat']">J</span>
          </div>
        </div>
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 font-['Inter']">
          Connexion
        </h1>
        <p class="text-gray-600 font-['Inter']">
          Accédez à votre espace JEB Incubator
        </p>
      </div>

      <!-- Formulaire de connexion -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transform transition-all duration-1000 delay-200 {visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
        
        <!-- Message d'erreur global -->
        {#if errors.submit}
          <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-red-600 text-sm font-['Inter']">{errors.submit}</p>
              </div>
            </div>
          </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
              Email *
            </label>
            <input
              id="email"
              type="email"
              bind:value={formData.email}
              on:keypress={handleKeyPress}
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.email ? 'border-red-400' : ''}"
              placeholder="votre.email@exemple.com"
              autocomplete="email"
            />
            {#if errors.email}
              <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.email}</p>
            {/if}
          </div>

          <!-- Mot de passe -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
              Mot de passe *
            </label>
            <input
              id="password"
              type="password"
              bind:value={formData.password}
              on:keypress={handleKeyPress}
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.password ? 'border-red-400' : ''}"
              placeholder="Votre mot de passe"
              autocomplete="current-password"
            />
            {#if errors.password}
              <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.password}</p>
            {/if}
          </div>

          <!-- Options -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember"
                type="checkbox"
                class="h-4 w-4 text-[#c174f2] border-gray-300 rounded focus:ring-[#c174f2] focus:ring-2"
              />
              <label for="remember" class="ml-2 text-sm text-gray-600 font-['Inter']">
                Se souvenir de moi
              </label>
            </div>
            <a href="/forgot-password" class="text-sm text-[#c174f2] hover:text-[#cb90f1] font-medium transition-colors duration-300">
              Mot de passe oublié ?
            </a>
          </div>

          <!-- Bouton de connexion -->
          <button
            type="submit"
            disabled={isSubmitting}
            class="w-full bg-[#c174f2] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#cb90f1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 font-['Inter'] flex items-center justify-center space-x-2"
          >
            {#if isSubmitting}
              <LoadingSpinner size="sm" color="#ffffff" />
              <span>Connexion en cours...</span>
            {:else}
              <span>Se connecter</span>
            {/if}
          </button>
        </form>

        <!-- Divider -->
        <div class="mt-8 mb-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500 font-['Inter']">Ou</span>
            </div>
          </div>
        </div>

        <!-- Liens d'inscription -->
        <div class="space-y-3">
          <p class="text-center text-sm text-gray-600 font-['Inter']">
            Vous n'avez pas encore de compte ?
          </p>
          <div class="grid grid-cols-1 gap-3">
            <a 
              href="/register/startup" 
              class="w-full py-2 px-4 border border-[#c174f2] text-[#c174f2] rounded-lg text-center font-medium hover:bg-[#c174f2] hover:text-white transition-colors duration-300 font-['Inter']"
            >
              Créer un compte Startup
            </a>
            <a 
              href="/register/investor" 
              class="w-full py-2 px-4 border border-[#f18585] text-[#f18585] rounded-lg text-center font-medium hover:bg-[#f18585] hover:text-white transition-colors duration-300 font-['Inter']"
            >
              Créer un compte Investisseur
            </a>
            <a 
              href="/register/student" 
              class="w-full py-2 px-4 border border-[#d5a8f2] text-[#d5a8f2] rounded-lg text-center font-medium hover:bg-[#d5a8f2] hover:text-white transition-colors duration-300 font-['Inter']"
            >
              Créer un compte Étudiant
            </a>
          </div>
        </div>
      </div>

      <!-- Lien de retour -->
      <div class="text-center mt-8 transform transition-all duration-1000 delay-400 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <p class="text-gray-500 font-['Inter']">
          <a href="/" class="text-[#c174f2] hover:text-[#cb90f1] font-medium transition-colors duration-300">
            ← Retour à l'accueil
          </a>
        </p>
      </div>
    </div>
  </section>

  <Footer />
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;600;700;800&display=swap');

  /* Styles pour les inputs avec erreur */
  .border-red-400:focus {
    border-color: #f87171;
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
  }

  /* Focus styles pour l'accessibilité */
  input:focus {
    outline: none;
  }

  /* Animation pour le message de succès */
  .transform {
    transition: all 0.3s ease;
  }

  /* Style pour les liens d'inscription */
  a:hover {
    transform: translateY(-1px);
  }
</style>
