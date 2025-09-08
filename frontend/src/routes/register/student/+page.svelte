<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Header from '../../../lib/components/Header.svelte';
  import Footer from '../../../lib/components/Footer.svelte';
  import LoadingSpinner from '../../../lib/components/LoadingSpinner.svelte';

  let formData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    school: '',
    level: '',
    field: '',
    linkedin: '',
    motivation: '',
    interests: [],
    acceptTerms: false
  };

  let errors = {};
  let isSubmitting = false;
  let visible = false;
  let currentStep = 1;
  const totalSteps = 3;

  const schools = [
    'EPITECH',
    'École 42',
    'Université Paris-Saclay',
    'HEC Paris',
    'ESSEC',
    'EDHEC',
    'Centrale Paris',
    'Polytechnique',
    'Sciences Po',
    'ESGI',
    'Supinfo',
    'INSA',
    'UTC',
    'Autre'
  ];

  const levels = [
    'Bac +1',
    'Bac +2',
    'Bac +3 (Licence)',
    'Bac +4',
    'Bac +5 (Master)',
    'Doctorat'
  ];

  const fields = [
    'Informatique',
    'Ingénierie',
    'Business/Management',
    'Design',
    'Marketing',
    'Finance',
    'Droit',
    'Sciences',
    'Arts',
    'Autre'
  ];

  const interestOptions = [
    'Intelligence Artificielle',
    'Développement Web',
    'Blockchain',
    'Cybersécurité',
    'Data Science',
    'UX/UI Design',
    'Marketing Digital',
    'E-commerce',
    'FinTech',
    'HealthTech',
    'GreenTech',
    'Gaming'
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
      if (!formData.school) stepErrors.school = 'L\'école est obligatoire';
      if (!formData.level) stepErrors.level = 'Le niveau d\'études est obligatoire';
      if (!formData.field) stepErrors.field = 'Le domaine d\'études est obligatoire';
    }

    if (step === 3) {
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

    try {
      // Ici tu ajouteras l'appel à ton API backend
      console.log('Données du formulaire étudiant:', formData);
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirection vers une page de confirmation
      goto('/login?registered=true&type=student');
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      errors.submit = 'Une erreur est survenue. Veuillez réessayer.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleInterestChange(interest) {
    if (formData.interests.includes(interest)) {
      formData.interests = formData.interests.filter(i => i !== interest);
    } else if (formData.interests.length < 5) {
      formData.interests = [...formData.interests, interest];
    }
  }

  function goBack() {
    goto('/register');
  }
</script>

<svelte:head>
  <title>Inscription Étudiant - JEB Incubator</title>
  <meta name="description" content="Rejoignez JEB Incubator en tant qu'étudiant et accédez à notre écosystème d'innovation">
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
          <img src="/student.png" alt="Student" class="w-24 h-16 object-contain" />
        </div>
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 font-['Inter']">
          Inscription Étudiant
        </h1>
        <p class="text-gray-600 font-['Inter']">
          Rejoignez notre communauté d'étudiants entrepreneurs
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
                Email étudiant *
              </label>
              <input
                id="email"
                type="email"
                bind:value={formData.email}
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.email ? 'border-red-400' : ''}"
                placeholder="votre.email@ecole.fr"
              />
              {#if errors.email}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.email}</p>
              {/if}
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Téléphone
              </label>
              <input
                id="phone"
                type="tel"
                bind:value={formData.phone}
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter']"
                placeholder="06 12 34 56 78"
              />
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

        <!-- Étape 2: Informations académiques -->
        {#if currentStep === 2}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Informations académiques</h2>
            
            <div>
              <label for="school" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                École/Université *
              </label>
              <select
                id="school"
                bind:value={formData.school}
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.school ? 'border-red-400' : ''}"
              >
                <option value="">Sélectionnez votre école</option>
                {#each schools as school}
                  <option value={school}>{school}</option>
                {/each}
              </select>
              {#if errors.school}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.school}</p>
              {/if}
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label for="level" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Niveau d'études *
                </label>
                <select
                  id="level"
                  bind:value={formData.level}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.level ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez votre niveau</option>
                  {#each levels as level}
                    <option value={level}>{level}</option>
                  {/each}
                </select>
                {#if errors.level}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.level}</p>
                {/if}
              </div>

              <div>
                <label for="field" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                  Domaine d'études *
                </label>
                <select
                  id="field"
                  bind:value={formData.field}
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.field ? 'border-red-400' : ''}"
                >
                  <option value="">Sélectionnez votre domaine</option>
                  {#each fields as field}
                    <option value={field}>{field}</option>
                  {/each}
                </select>
                {#if errors.field}
                  <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.field}</p>
                {/if}
              </div>
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
        {/if}

        <!-- Étape 3: Motivations et centres d'intérêt -->
        {#if currentStep === 3}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6 font-['Inter']">Motivations et centres d'intérêt</h2>
            
            <div>
              <label for="motivation" class="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                Pourquoi souhaitez-vous rejoindre JEB Incubator ? *
              </label>
              <textarea
                id="motivation"
                bind:value={formData.motivation}
                rows="4"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300 font-['Inter'] {errors.motivation ? 'border-red-400' : ''}"
                placeholder="Expliquez vos motivations, vos objectifs et ce que vous espérez apporter à la communauté..."
              ></textarea>
              {#if errors.motivation}
                <p class="text-red-500 text-sm mt-1 font-['Inter']">{errors.motivation}</p>
              {/if}
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-4 font-['Inter']">
                Centres d'intérêt (maximum 5)
              </label>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                {#each interestOptions as interest}
                  <label class="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      on:change={() => handleInterestChange(interest)}
                      disabled={formData.interests.length >= 5 && !formData.interests.includes(interest)}
                      class="w-4 h-4 text-[#c174f2] border-gray-300 rounded focus:ring-[#c174f2] focus:ring-2"
                    />
                    <span class="text-sm text-gray-700 font-['Inter']">{interest}</span>
                  </label>
                {/each}
              </div>
              <p class="text-xs text-gray-500 mt-2 font-['Inter']">
                {formData.interests.length}/5 sélectionnés
              </p>
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
                <span>Créer mon compte</span>
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
</style>