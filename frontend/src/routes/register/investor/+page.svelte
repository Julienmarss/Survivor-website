<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Header from '../../../lib/components/Header.svelte';
  import Footer from '../../../lib/components/Footer.svelte';
  import LoadingSpinner from '../../../lib/components/LoadingSpinner.svelte';
  import { userStore } from '../../../lib/stores/userStore.js';

  let formData = {
    // Informations personnelles
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    linkedin: '',
    
    // Informations professionnelles
    company: '',
    position: '',
    investorType: '',
    experience: '',
    website: '',
    
    // Préférences d'investissement
    investmentRange: '',
    preferredSectors: [],
    preferredStages: [],
    geography: '',
    investmentCriteria: '',
    
    // Profil et motivations
    portfolio: '',
    expertise: '',
    motivation: '',
    
    acceptTerms: false
  };

  let errors = {};
  let isSubmitting = false;
  let visible = false;
  let currentStep = 1;
  const totalSteps = 4;

  const investorTypes = [
    'Business Angel',
    'Fonds d\'investissement',
    'Corporate Venture',
    'Family Office',
    'Fonds de pension',
    'Investisseur institutionnel',
    'Crowdfunding platform',
    'Autre'
  ];

  const investmentRanges = [
    'Moins de 10K€',
    '10K€ - 50K€',
    '50K€ - 100K€',
    '100K€ - 500K€',
    '500K€ - 1M€',
    '1M€ - 5M€',
    '5M€ - 10M€',
    'Plus de 10M€'
  ];

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
    'DeepTech'
  ];

  const stages = [
    'Pre-seed',
    'Seed',
    'Série A',
    'Série B',
    'Série C+',
    'Growth',
    'Bridge',
    'Tous stades'
  ];

  const geographies = [
    'France uniquement',
    'Europe',
    'Europe + États-Unis',
    'Global',
    'Marchés émergents',
    'Asie-Pacifique',
    'Afrique',
    'Amérique du Nord'
  ];

  const experiences = [
    'Moins d\'1 an',
    '1-3 ans',
    '3-5 ans',
    '5-10 ans',
    '10-15 ans',
    'Plus de 15 ans'
  ];

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
      if (!formData.company.trim()) stepErrors.company = 'La société est obligatoire';
      if (!formData.position.trim()) stepErrors.position = 'Le poste est obligatoire';
      if (!formData.investorType) stepErrors.investorType = 'Le type d\'investisseur est obligatoire';
      if (!formData.experience) stepErrors.experience = 'L\'expérience est obligatoire';
    }

    if (step === 3) {
      if (!formData.investmentRange) stepErrors.investmentRange = 'La fourchette d\'investissement est obligatoire';
      if (formData.preferredSectors.length === 0) stepErrors.preferredSectors = 'Sélectionnez au moins un secteur';
      if (formData.preferredStages.length === 0) stepErrors.preferredStages = 'Sélectionnez au moins un stade';
      if (!formData.geography) stepErrors.geography = 'La zone géographique est obligatoire';
    }

    if (step === 4) {
      if (!formData.motivation.trim()) stepErrors.motivation = 'La motivation est obligatoire';
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
    errors = {}; 

    try {
      console.log('Données du formulaire investisseur:', formData);
      
      const result = await userStore.registerInvestor(formData);
      
      if (result.success) {
        console.log('Investor registration successful:', result.user);
        
        goto('/login?registered=true&type=investor');
      } else {
        // Gestion des erreurs spécifiques
        console.error('Investor registration failed:', result.error);
        errors.submit = result.error || 'Une erreur est survenue lors de l\'inscription.';
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      errors.submit = 'Une erreur est survenue. Veuillez réessayer.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleSectorChange(sector) {
    if (formData.preferredSectors.includes(sector)) {
      formData.preferredSectors = formData.preferredSectors.filter(s => s !== sector);
    } else if (formData.preferredSectors.length < 8) {
      formData.preferredSectors = [...formData.preferredSectors, sector];
    }
  }

  function handleStageChange(stage) {
    if (formData.preferredStages.includes(stage)) {
      formData.preferredStages = formData.preferredStages.filter(s => s !== stage);
    } else {
      formData.preferredStages = [...formData.preferredStages, stage];
    }
  }

  function goBack() {
    goto('/register');
  }
</script>

<svelte:head>
  <title>Inscription Investisseur - JEB Incubator</title>
  <meta name="description" content="Rejoignez JEB Incubator en tant qu'investisseur et découvrez les meilleures opportunités">
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
          <img src="/investor.png" alt="Investor" class="w-24 h-16 object-contain" />
        </div>
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 font-['Inter']">
          Inscription Investisseur
        </h1>
        <p class="text-gray-600 font-['Inter']">
          Accédez aux meilleures opportunités d'investissement
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
        
        <!-- Étape 1: Informations personnelles -->
        {#if currentStep === 1}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Informations personnelles</h2>
            
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
                placeholder="votre.email@societe.com"
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

        <!-- Étape 2: Informations professionnelles -->
        {#if currentStep === 2}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Informations professionnelles</h2>
            
            <div>
              <label for="company" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Société/Organisation *
              </label>
              <input
                id="company"
                type="text"
                bind:value={formData.company}
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.company ? 'border-red-400' : ''}"
                placeholder="Nom de votre société ou fonds"
              />
              {#if errors.company}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.company}</p>
              {/if}
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="position" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Poste/Fonction *
                </label>
                <input
                  id="position"
                  type="text"
                  bind:value={formData.position}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.position ? 'border-red-400' : ''}"
                  placeholder="ex: Partner, Investment Manager..."
                />
                {#if errors.position}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.position}</p>
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
                  placeholder="https://votre-societe.com"
                />
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="investorType" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Type d'investisseur *
                </label>
                <select
                  id="investorType"
                  bind:value={formData.investorType}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.investorType ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez votre type</option>
                  {#each investorTypes as type}
                    <option value={type}>{type}</option>
                  {/each}
                </select>
                {#if errors.investorType}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.investorType}</p>
                {/if}
              </div>

              <div>
                <label for="experience" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Expérience en investissement *
                </label>
                <select
                  id="experience"
                  bind:value={formData.experience}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.experience ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez votre expérience</option>
                  {#each experiences as exp}
                    <option value={exp}>{exp}</option>
                  {/each}
                </select>
                {#if errors.experience}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.experience}</p>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Étape 3: Préférences d'investissement -->
        {#if currentStep === 3}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Préférences d'investissement</h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="investmentRange" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Ticket d'investissement *
                </label>
                <select
                  id="investmentRange"
                  bind:value={formData.investmentRange}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.investmentRange ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez votre fourchette</option>
                  {#each investmentRanges as range}
                    <option value={range}>{range}</option>
                  {/each}
                </select>
                {#if errors.investmentRange}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.investmentRange}</p>
                {/if}
              </div>

              <div>
                <label for="geography" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Zone géographique *
                </label>
                <select
                  id="geography"
                  bind:value={formData.geography}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.geography ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez votre zone</option>
                  {#each geographies as geo}
                    <option value={geo}>{geo}</option>
                  {/each}
                </select>
                {#if errors.geography}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.geography}</p>
                {/if}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-4 font-['Inter']">
                Secteurs d'intérêt * (maximum 8)
              </label>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                {#each sectors as sector}
                  <label class="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={formData.preferredSectors.includes(sector)}
                      on:change={() => handleSectorChange(sector)}
                      disabled={formData.preferredSectors.length >= 8 && !formData.preferredSectors.includes(sector)}
                      class="w-4 h-4 text-[#c174f2] border-gray-300 rounded focus:ring-[#c174f2] focus:ring-2"
                    />
                    <span class="text-sm text-gray-700 font-['Inter']">{sector}</span>
                  </label>
                {/each}
              </div>
              <p class="text-xs text-gray-500 mt-2 font-['Inter']">
                {formData.preferredSectors.length}/8 sélectionnés
              </p>
              {#if errors.preferredSectors}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.preferredSectors}</p>
              {/if}
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-4 font-['Inter']">
                Stades d'investissement préférés *
              </label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                {#each stages as stage}
                  <label class="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={formData.preferredStages.includes(stage)}
                      on:change={() => handleStageChange(stage)}
                      class="w-4 h-4 text-[#c174f2] border-gray-300 rounded focus:ring-[#c174f2] focus:ring-2"
                    />
                    <span class="text-sm text-gray-700 font-['Inter']">{stage}</span>
                  </label>
                {/each}
              </div>
              {#if errors.preferredStages}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.preferredStages}</p>
              {/if}
            </div>

            <div>
              <label for="investmentCriteria" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Critères d'investissement
              </label>
              <textarea
                id="investmentCriteria"
                bind:value={formData.investmentCriteria}
                rows="3"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                placeholder="Décrivez vos critères d'évaluation (équipe, marché, business model, traction...)"
              ></textarea>
            </div>
          </div>
        {/if}

        <!-- Étape 4: Profil et motivations -->
        {#if currentStep === 4}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Profil et motivations</h2>
            
            <div>
              <label for="portfolio" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Portefeuille d'investissements
              </label>
              <textarea
                id="portfolio"
                bind:value={formData.portfolio}
                rows="3"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                placeholder="Présentez quelques-uns de vos investissements marquants..."
              ></textarea>
            </div>

            <div>
              <label for="expertise" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Expertise et valeur ajoutée
              </label>
              <textarea
                id="expertise"
                bind:value={formData.expertise}
                rows="4"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                placeholder="Quelle expertise apportez-vous aux startups ? (conseil stratégique, réseau, expérience sectorielle...)"
              ></textarea>
            </div>

            <div>
              <label for="motivation" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Pourquoi rejoindre JEB Incubator ? *
              </label>
              <textarea
                id="motivation"
                bind:value={formData.motivation}
                rows="4"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.motivation ? 'border-red-400' : ''}"
                placeholder="Qu'attendez-vous de notre plateforme ? Quels types de projets recherchez-vous ?"
              ></textarea>
              {#if errors.motivation}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.motivation}</p>
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
                <span>Rejoindre le réseau</span>
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
    
    .grid.md\\:grid-cols-3 {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .grid.md\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr);
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

  /* Amélioration des checkboxes dans les grilles */
  .grid label:hover {
    background-color: #f9fafb;
  }

  /* Style pour les labels de checkbox */
  .grid label {
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }

  .grid label:hover {
    border-color: #e5e7eb;
  }
</style>