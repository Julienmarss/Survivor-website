<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Header from '../../../lib/components/Header.svelte';
  import Footer from '../../../lib/components/Footer.svelte';
  import LoadingSpinner from '../../../lib/components/LoadingSpinner.svelte';
  import { userStore } from '../../../lib/stores/userStore.js';

  let formData = {
    // Informations personnelles du fondateur principal
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    linkedin: '',
    
    // Informations de la startup
    companyName: '',
    sector: '',
    description: '',
    stage: '',
    foundingYear: '',
    website: '',
    
    // Équipe et financement
    teamSize: '',
    coFounders: '',
    fundingNeeds: '',
    currentFunding: '',
    
    // Vision et objectifs
    vision: '',
    challenges: '',
    why: '',
    
    acceptTerms: false
  };

  let errors = {};
  let isSubmitting = false;
  let visible = false;
  let currentStep = 1;
  const totalSteps = 4;

  const sectors = [
    'FinTech',
    'HealthTech',
    'EdTech',
    'GreenTech',
    'AgriTech',
    'PropTech',
    'FoodTech',
    'RetailTech',
    'Mobility',
    'Cybersécurité',
    'Intelligence Artificielle',
    'Blockchain',
    'IoT',
    'Robotique',
    'Gaming',
    'Media & Entertainment',
    'E-commerce',
    'SaaS',
    'Autre'
  ];

  const stages = [
    'Idéation',
    'Prototype',
    'MVP',
    'Validation',
    'Traction',
    'Croissance',
    'Scale-up'
  ];

  const teamSizes = [
    '1 (Solo founder)',
    '2-3 personnes',
    '4-6 personnes',
    '7-10 personnes',
    '11-20 personnes',
    '20+ personnes'
  ];

  const fundingNeeds = [
    'Pas de financement nécessaire',
    'Moins de 50K€',
    '50K€ - 100K€',
    '100K€ - 500K€',
    '500K€ - 1M€',
    '1M€ - 5M€',
    'Plus de 5M€'
  ];

  const currentYear = new Date().getFullYear();
  const foundingYears = Array.from({length: 10}, (_, i) => currentYear - i);

  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 100);
  });

  function validateStep(step) {
    const stepErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) stepErrors.firstName = 'Le prénom est obligatoire';
      if (!formData.lastName.trim()) stepErrors.lastName = 'Le nom est obligatoire';
      if (!formData.email.trim()) {
        stepErrors.email = 'L\'email est obligatoire';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = 'Format d\'email invalide';
      }
      if (!formData.password) {
        stepErrors.password = 'Le mot de passe est obligatoire';
      } else if (formData.password.length < 6) {
        stepErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      if (formData.password !== formData.confirmPassword) {
        stepErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    if (step === 2) {
      if (!formData.companyName.trim()) stepErrors.companyName = 'Le nom de la startup est obligatoire';
      if (!formData.sector) stepErrors.sector = 'Le secteur est obligatoire';
      if (!formData.description.trim()) stepErrors.description = 'La description est obligatoire';
      if (!formData.stage) stepErrors.stage = 'Le stade de développement est obligatoire';
      if (!formData.foundingYear) stepErrors.foundingYear = 'L\'année de création est obligatoire';
    }

    if (step === 3) {
      if (!formData.teamSize) stepErrors.teamSize = 'La taille de l\'équipe est obligatoire';
      if (!formData.fundingNeeds) stepErrors.fundingNeeds = 'Les besoins de financement sont obligatoires';
    }

    if (step === 4) {
      if (!formData.vision.trim()) stepErrors.vision = 'La vision est obligatoire';
      if (!formData.why.trim()) stepErrors.why = 'Cette motivation est obligatoire';
      if (!formData.acceptTerms) stepErrors.acceptTerms = 'Vous devez accepter les conditions';
    }

    errors = stepErrors;
    return Object.keys(stepErrors).length === 0;
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        currentStep++;
      }
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }

  async function handleSubmit() {
    if (!validateStep(currentStep)) return;

    isSubmitting = true;
    errors = {}; // Reset errors

    try {
      console.log('Données du formulaire startup:', formData);
      
      // ✅ CORRECTION : Appel du vrai backend via userStore
      const result = await userStore.registerStartup(formData);
      
      if (result.success) {
        console.log('Startup registration successful:', result.user);
        
        // Redirection vers login avec message de succès
        goto('/login?registered=true&type=startup');
      } else {
        // Gestion des erreurs spécifiques
        console.error('Startup registration failed:', result.error);
        errors.submit = result.error || 'Une erreur est survenue lors de l\'inscription.';
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      errors.submit = 'Une erreur est survenue. Veuillez réessayer.';
    } finally {
      isSubmitting = false;
    }
  }

  function goBack() {
    goto('/register');
  }
</script>

<svelte:head>
  <title>Inscription Startup - JEB Incubator</title>
  <meta name="description" content="Rejoignez JEB Incubator avec votre startup et accédez à notre programme d'incubation">
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <Header />

  <section class="pt-24 pb-20 px-6 sm:px-8 lg:px-12">
    <div class="max-w-2xl mx-auto">
      
      <!-- Bouton retour -->
      <button 
        on:click={goBack}
        class="mb-8 flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-300 transform transition-all duration-1000 {visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Retour
      </button>

      <!-- En-tête -->
      <div class="text-center mb-12 transform transition-all duration-1000 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <div class="flex justify-center mb-6">
          <img src="/startup.png" alt="Startup" class="w-24 h-16 object-contain" />
        </div>
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 font-['Inter']">
          Inscription Startup
        </h1>
        <p class="text-gray-600 font-['Inter']">
          Rejoignez notre programme d'incubation et développez votre entreprise
        </p>
      </div>

      <!-- Indicateur de progression -->
      <div class="mb-8 transform transition-all duration-1000 delay-200 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <div class="flex items-center justify-center space-x-4">
          {#each Array(totalSteps) as _, i}
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 {
                i + 1 === currentStep ? 'bg-[#c174f2] text-white' :
                i + 1 < currentStep ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-500'
              }">
                {i + 1 < currentStep ? '✓' : i + 1}
              </div>
              {#if i < totalSteps - 1}
                <div class="w-12 h-0.5 mx-2 transition-colors duration-300 {
                  i + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }"></div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="text-center mt-3">
          <span class="text-sm text-gray-500 font-['Inter']">
            Étape {currentStep} sur {totalSteps}
          </span>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transform transition-all duration-1000 delay-400 {visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
        
        <!-- Étape 1: Informations du fondateur -->
        {#if currentStep === 1}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Informations du fondateur principal</h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Prénom *
                </label>
                <input
                  id="firstName"
                  type="text"
                  bind:value={formData.firstName}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.firstName ? 'border-red-400' : ''}"
                  placeholder="Votre prénom"
                />
                {#if errors.firstName}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.firstName}</p>
                {/if}
              </div>

              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Nom *
                </label>
                <input
                  id="lastName"
                  type="text"
                  bind:value={formData.lastName}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.lastName ? 'border-red-400' : ''}"
                  placeholder="Votre nom"
                />
                {#if errors.lastName}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.lastName}</p>
                {/if}
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Email professionnel *
              </label>
              <input
                id="email"
                type="email"
                bind:value={formData.email}
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.email ? 'border-red-400' : ''}"
                placeholder="votre.email@startup.com"
              />
              {#if errors.email}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.email}</p>
              {/if}
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Téléphone *
                </label>
                <input
                  id="phone"
                  type="tel"
                  bind:value={formData.phone}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <label for="linkedin" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Profil LinkedIn
                </label>
                <input
                  id="linkedin"
                  type="url"
                  bind:value={formData.linkedin}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                  placeholder="https://linkedin.com/in/votre-profil"
                />
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Mot de passe *
                </label>
                <input
                  id="password"
                  type="password"
                  bind:value={formData.password}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.password ? 'border-red-400' : ''}"
                  placeholder="Minimum 6 caractères"
                />
                {#if errors.password}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.password}</p>
                {/if}
              </div>

              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Confirmer le mot de passe *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  bind:value={formData.confirmPassword}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.confirmPassword ? 'border-red-400' : ''}"
                  placeholder="Répétez votre mot de passe"
                />
                {#if errors.confirmPassword}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.confirmPassword}</p>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Étape 2: Informations de la startup -->
        {#if currentStep === 2}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Informations de votre startup</h2>
            
            <div>
              <label for="companyName" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Nom de la startup *
              </label>
              <input
                id="companyName"
                type="text"
                bind:value={formData.companyName}
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.companyName ? 'border-red-400' : ''}"
                placeholder="Le nom de votre entreprise"
              />
              {#if errors.companyName}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.companyName}</p>
              {/if}
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="sector" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Secteur d'activité *
                </label>
                <select
                  id="sector"
                  bind:value={formData.sector}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.sector ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez votre secteur</option>
                  {#each sectors as sector}
                    <option value={sector}>{sector}</option>
                  {/each}
                </select>
                {#if errors.sector}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.sector}</p>
                {/if}
              </div>

              <div>
                <label for="stage" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Stade de développement *
                </label>
                <select
                  id="stage"
                  bind:value={formData.stage}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.stage ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez le stade</option>
                  {#each stages as stage}
                    <option value={stage}>{stage}</option>
                  {/each}
                </select>
                {#if errors.stage}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.stage}</p>
                {/if}
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="foundingYear" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Année de création *
                </label>
                <select
                  id="foundingYear"
                  bind:value={formData.foundingYear}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.foundingYear ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez l'année</option>
                  {#each foundingYears as year}
                    <option value={year}>{year}</option>
                  {/each}
                </select>
                {#if errors.foundingYear}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.foundingYear}</p>
                {/if}
              </div>

              <div>
                <label for="website" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Site web
                </label>
                <input
                  id="website"
                  type="url"
                  bind:value={formData.website}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                  placeholder="https://votre-startup.com"
                />
              </div>
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Description de votre startup *
              </label>
              <textarea
                id="description"
                bind:value={formData.description}
                rows="4"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.description ? 'border-red-400' : ''}"
                placeholder="Décrivez votre activité, votre produit/service et votre proposition de valeur..."
              ></textarea>
              {#if errors.description}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.description}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Étape 3: Équipe et financement -->
        {#if currentStep === 3}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Équipe et financement</h2>
            
            <div>
              <label for="teamSize" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Taille de l'équipe *
              </label>
              <select
                id="teamSize"
                bind:value={formData.teamSize}
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.teamSize ? 'border-red-400' : ''}"
              >
                <option value="">Sélectionnez la taille</option>
                {#each teamSizes as size}
                  <option value={size}>{size}</option>
                {/each}
              </select>
              {#if errors.teamSize}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.teamSize}</p>
              {/if}
            </div>

            <div>
              <label for="coFounders" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Co-fondateurs
              </label>
              <textarea
                id="coFounders"
                bind:value={formData.coFounders}
                rows="3"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                placeholder="Listez vos co-fondateurs avec leurs rôles et compétences..."
              ></textarea>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="fundingNeeds" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Besoins de financement *
                </label>
                <select
                  id="fundingNeeds"
                  bind:value={formData.fundingNeeds}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.fundingNeeds ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez vos besoins</option>
                  {#each fundingNeeds as need}
                    <option value={need}>{need}</option>
                  {/each}
                </select>
                {#if errors.fundingNeeds}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.fundingNeeds}</p>
                {/if}
              </div>

              <div>
                <label for="currentFunding" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Financement actuel
                </label>
                <input
                  id="currentFunding"
                  type="text"
                  bind:value={formData.currentFunding}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                  placeholder="ex: Autofinancement, Love Money..."
                />
              </div>
            </div>
          </div>
        {/if}

        <!-- Étape 4: Vision et motivations -->
        {#if currentStep === 4}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Vision et motivations</h2>
            
            <div>
              <label for="vision" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Votre vision à long terme *
              </label>
              <textarea
                id="vision"
                bind:value={formData.vision}
                rows="4"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.vision ? 'border-red-400' : ''}"
                placeholder="Où voyez-vous votre startup dans 3-5 ans ? Quel impact voulez-vous créer ?"
              ></textarea>
              {#if errors.vision}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.vision}</p>
              {/if}
            </div>

            <div>
              <label for="challenges" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Principaux défis actuels
              </label>
              <textarea
                id="challenges"
                bind:value={formData.challenges}
                rows="3"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                placeholder="Quels sont vos principaux défis techniques, commerciaux ou financiers ?"
              ></textarea>
            </div>

            <div>
              <label for="why" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Pourquoi rejoindre JEB Incubator ? *
              </label>
              <textarea
                id="why"
                bind:value={formData.why}
                rows="4"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.why ? 'border-red-400' : ''}"
                placeholder="Que recherchez-vous ? Quels sont vos objectifs en rejoignant notre programme ?"
              ></textarea>
              {#if errors.why}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.why}</p>
              {/if}
            </div>

            <div class="pt-6 border-t border-gray-200">
              <div class="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  bind:checked={formData.acceptTerms}
                  class="w-4 h-4 text-[#c174f2] border-gray-300 rounded focus:ring-[#c174f2] focus:ring-2 mt-1"
                />
                <label for="terms" class="text-sm text-gray-600 font-['Inter']">
                  J'accepte les 
                  <a href="/terms" class="text-[#c174f2] hover:text-[#cb90f1] underline" target="_blank">
                    conditions d'utilisation
                  </a> 
                  et la 
                  <a href="/privacy" class="text-[#c174f2] hover:text-[#cb90f1] underline" target="_blank">
                    politique de confidentialité
                  </a>
                  de JEB Incubator
                </label>
              </div>
              {#if errors.acceptTerms}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.acceptTerms}</p>
              {/if}
            </div>

            {#if errors.submit}
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-600 text-sm font-['Inter']">{errors.submit}</p>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Boutons de navigation -->
        <div class="flex justify-between pt-8 border-t border-gray-200 mt-8">
          <button
            type="button"
            on:click={prevStep}
            disabled={currentStep === 1}
            class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 font-['Inter']"
          >
            Précédent
          </button>

          {#if currentStep < totalSteps}
            <button
              type="button"
              on:click={nextStep}
              class="bg-[#c174f2] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#cb90f1] transition-colors duration-300 font-['Inter']"
            >
              Suivant
            </button>
          {:else}
            <button
              type="button"
              on:click={handleSubmit}
              disabled={isSubmitting}
              class="bg-[#c174f2] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#cb90f1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 font-['Inter'] flex items-center space-x-2"
            >
              {#if isSubmitting}
                <LoadingSpinner size="sm" color="#ffffff" />
                <span>Inscription en cours...</span>
              {:else}
                <span>Rejoindre JEB Incubator</span>
              {/if}
            </button>
          {/if}
        </div>
      </div>

      <!-- Lien de connexion -->
      <div class="text-center mt-8 transform transition-all duration-1000 delay-600 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <p class="text-gray-500 font-['Inter']">
          Vous avez déjà un compte ? 
          <a href="/login" class="text-[#c174f2] hover:text-[#cb90f1] font-medium transition-colors duration-300">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  </section>

  <Footer />
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* Styles pour les inputs avec erreur */
  .border-red-400:focus {
    border-color: #f87171;
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .grid.md\\:grid-cols-2 {
      grid-template-columns: 1fr;
    }
  }

  /* Focus styles pour l'accessibilité */
  input:focus, select:focus, textarea:focus {
    outline: none;
  }

  /* Style pour les checkboxes */
  input[type="checkbox"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Animation pour les étapes */
  .transform {
    transition: all 0.3s ease;
  }

  /* Amélioration du style des textareas */
  textarea {
    resize: vertical;
    min-height: 100px;
  }

  /* Style pour les liens */
  a:hover {
    text-decoration: underline;
  }
</style>