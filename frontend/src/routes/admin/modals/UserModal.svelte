<script>
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  const dispatch = createEventDispatcher();

  export let user = null;          // admin connecté (pour token)
  export let editingUser = null;   // user à éditer (ou null pour créer)

  let loading = false;
  let error = null;
  let currentStep = 1;
  const totalSteps = 2;

  const API_BASE = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

  // valeurs par défaut sûres pour éviter les undefined
  function defaults(u = {}) {
    return {
      email: u.email || '',
      password: '', // jamais pré-rempli
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      role: u.role || 'user',
      phone: u.phone || '',

      // student
      age: u.age ?? '',
      gender: u.gender || 'prefer_not_to_say',
      school: u.school || '',
      level: u.level || '',
      field: u.field || '',

      // startup
      companyName: u.companyName || '',
      sector: u.sector || '',
      description: u.description || '',
      maturity: u.maturity || 'Idéation',
      projectStatus: u.projectStatus || 'Active',
      needs: u.needs || '',
      websiteUrl: u.websiteUrl || '',
      legalStatus: u.legalStatus || 'SAS',
      address: u.address || '',
      teamSize: u.teamSize ?? '',

      // investor
      investorType: u.investorType || 'angel',
      investmentRange: u.investmentRange && typeof u.investmentRange === 'object'
        ? { min: u.investmentRange.min ?? 0, max: u.investmentRange.max ?? 0 }
        : { min: 0, max: 0 },
      preferredSectors: Array.isArray(u.preferredSectors) ? [...u.preferredSectors] : [],
      preferredStages: Array.isArray(u.preferredStages) ? [...u.preferredStages] : [],
      portfolioSize: u.portfolioSize ?? '',
      investmentExperience: u.investmentExperience ?? '',
      linkedinUrl: u.linkedinUrl || '',
      companyWebsite: u.companyWebsite || '',
      investmentCriteria: u.investmentCriteria || '',
      geographicalPreferences: Array.isArray(u.geographicalPreferences) ? [...u.geographicalPreferences] : []
    };
  }

  let formData = defaults(editingUser);

  // si on change d'utilisateur à éditer après montage
  $: if (editingUser) {
    formData = defaults(editingUser);
  }

  function closeModal() {
    dispatch('close');
  }

  function addToArray(field) {
    formData[field] = [...formData[field], ''];
  }
  function updateArrayItem(field, idx, val) {
    formData[field][idx] = val;
  }
  function removeFromArray(field, idx) {
    formData[field] = formData[field].filter((_, i) => i !== idx);
  }

  function canProceedToNextStep() {
    if (currentStep === 1) {
      return formData.email && formData.firstName && formData.lastName && formData.role;
    }
    return true;
  }

  function nextStep() {
    if (currentStep < totalSteps && canProceedToNextStep()) currentStep++;
  }
  function prevStep() {
    if (currentStep > 1) currentStep--;
  }

  function cleanFormDataByRole(data) {
    const baseData = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone || undefined
    };

    if (!editingUser && data.password) {
      baseData.password = data.password;
    }

    switch (data.role) {
      case 'user':
        return {
          ...baseData,
          age: data.age ? parseInt(data.age) : undefined,
          gender: data.gender,
          school: data.school || undefined,
          level: data.level || undefined,
          field: data.field || undefined
        };

      case 'startup':
        return {
          ...baseData,
          companyName: data.companyName || undefined,
          sector: data.sector || undefined,
          description: data.description || undefined,
          maturity: data.maturity,
          projectStatus: data.projectStatus,
          needs: data.needs || undefined,
          websiteUrl: data.websiteUrl || undefined,
          legalStatus: data.legalStatus,
          address: data.address || undefined,
          teamSize: data.teamSize !== '' ? parseInt(data.teamSize) : undefined
        };

      case 'investor':
        return {
          ...baseData,
          investorType: data.investorType,
          investmentRange:
            (data.investmentRange && (data.investmentRange.min || data.investmentRange.max))
              ? {
                  min: Number(data.investmentRange.min) || 0,
                  max: Number(data.investmentRange.max) || 0
                }
              : undefined,
          preferredSectors: (data.preferredSectors || []).filter(s => s && s.trim()),
          preferredStages: (data.preferredStages || []).filter(s => s && s.trim()),
          portfolioSize: data.portfolioSize !== '' ? parseInt(data.portfolioSize) : undefined,
          investmentExperience: data.investmentExperience !== '' ? parseInt(data.investmentExperience) : undefined,
          linkedinUrl: data.linkedinUrl || undefined,
          companyWebsite: data.companyWebsite || undefined,
          investmentCriteria: data.investmentCriteria || undefined,
          geographicalPreferences: (data.geographicalPreferences || []).filter(g => g && g.trim())
        };

      default:
        return baseData;
    }
  }

  async function saveUser() {
    try {
      loading = true;
      error = null;

      if (!formData.email || !formData.firstName || !formData.lastName) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }
      if (!editingUser && !formData.password) {
        throw new Error('Le mot de passe est obligatoire pour un nouvel utilisateur');
      }

      const cleanedData = cleanFormDataByRole(formData);

      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser
        ? `${API_BASE}/admin/users/${editingUser.id}`
        : `${API_BASE}/admin/users`;

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
      });

      const data = await res.json();
      if (data.success) {
        dispatch('saved');
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (e) {
      console.error(e);
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<!-- Backdrop semi-transparent, on voit le site -->
<div class="fixed inset-0 z-50">
  <div class="absolute inset-0 bg-white/70 backdrop-blur-sm" on:click={closeModal}></div>

  <div class="relative z-10 min-h-screen flex items-start sm:items-center justify-center p-4">
    <div class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] px-6 py-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold font-['Montserrat']">
              {editingUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}
            </h3>
            <p class="text-sm text-purple-100">Étape {currentStep} / {totalSteps}</p>
          </div>
          <button on:click={closeModal} class="text-white/90 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div class="mt-3 bg-purple-300 h-2 rounded-full overflow-hidden">
          <div class="bg-white h-full rounded-full transition-all" style="width: {(currentStep/totalSteps)*100}%"></div>
        </div>
      </div>

      <form on:submit|preventDefault={saveUser}>
        <div class="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {#if error}
            <div class="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
          {/if}

          <!-- Step 1: base -->
          {#if currentStep === 1}
            <div class="space-y-6">
              <h4 class="text-lg font-semibold text-gray-900 font-['Montserrat']">Informations de base</h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input type="text" bind:value={formData.firstName}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input type="text" bind:value={formData.lastName}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" bind:value={formData.email}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>

              {#if !editingUser}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                  <input type="password" bind:value={formData.password} minlength="6"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
              {/if}

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                  <select bind:value={formData.role}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    <option value="user">Étudiant</option>
                    <option value="startup">Startup</option>
                    <option value="investor">Investisseur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" bind:value={formData.phone}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
              </div>
            </div>
          {/if}

          <!-- Step 2: role-specific -->
          {#if currentStep === 2}
            <div class="space-y-6">
              <h4 class="text-lg font-semibold text-gray-900 font-['Montserrat']">
                Informations spécifiques — 
                {formData.role === 'user' ? 'Étudiant' :
                 formData.role === 'startup' ? 'Startup' :
                 formData.role === 'investor' ? 'Investisseur' : 'Administrateur'}
              </h4>

              {#if formData.role === 'user'}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Âge</label>
                    <input type="number" min="13" max="120" bind:value={formData.age}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                    <select bind:value={formData.gender}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                      <option value="other">Autre</option>
                      <option value="prefer_not_to_say">Préfère ne pas dire</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">École/Université</label>
                  <input type="text" bind:value={formData.school}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                    <input type="text" bind:value={formData.level}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Domaine</label>
                    <input type="text" bind:value={formData.field}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                </div>
              {/if}

              {#if formData.role === 'startup'}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
                  <input type="text" bind:value={formData.companyName}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                    <input type="text" bind:value={formData.sector}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Maturité</label>
                    <select bind:value={formData.maturity}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                      <option value="Idéation">Idéation</option>
                      <option value="Prototype">Prototype</option>
                      <option value="MVP">MVP</option>
                      <option value="Validation">Validation</option>
                      <option value="Traction">Traction</option>
                      <option value="Croissance">Croissance</option>
                      <option value="Scale-up">Scale-up</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="3" bind:value={formData.description}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                    <input type="url" bind:value={formData.websiteUrl}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Taille de l'équipe</label>
                    <input type="number" min="1" bind:value={formData.teamSize}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Besoins</label>
                  <textarea rows="2" bind:value={formData.needs}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"></textarea>
                </div>
              {/if}

              {#if formData.role === 'investor'}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Type d'investisseur</label>
                    <select bind:value={formData.investorType}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                      <option value="angel">Business Angel</option>
                      <option value="venture_capital">Fonds d'investissement</option>
                      <option value="private_equity">Private Equity</option>
                      <option value="corporate">Corporate Venture</option>
                      <option value="government">Investisseur public</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                    <input type="url" bind:value={formData.companyWebsite}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Fourchette d'investissement (€)</label>
                  <div class="grid grid-cols-2 gap-4">
                    <!-- IMPORTANT: pas de ?., l'objet existe déjà -->
                    <input type="number" min="0" bind:value={formData.investmentRange.min}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="Minimum" />
                    <input type="number" min="0" bind:value={formData.investmentRange.max}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="Maximum" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Secteurs préférés</label>
                  <div class="space-y-2">
                    {#each formData.preferredSectors as sector, i}
                      <div class="flex gap-2">
                        <input type="text" bind:value={formData.preferredSectors[i]}
                          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          placeholder="FinTech, HealthTech..." />
                        <button type="button" on:click={() => removeFromArray('preferredSectors', i)}
                          class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">✕</button>
                      </div>
                    {/each}
                    <button type="button" on:click={() => addToArray('preferredSectors')}
                      class="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-300 hover:text-purple-600">
                      + Ajouter un secteur
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Stades préférés</label>
                  <div class="space-y-2">
                    {#each formData.preferredStages as stage, i}
                      <div class="flex gap-2">
                        <input type="text" bind:value={formData.preferredStages[i]}
                          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          placeholder="Seed, Series A..." />
                        <button type="button" on:click={() => removeFromArray('preferredStages', i)}
                          class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">✕</button>
                      </div>
                    {/each}
                    <button type="button" on:click={() => addToArray('preferredStages')}
                      class="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-300 hover:text-purple-600">
                      + Ajouter un stade
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Taille du portefeuille</label>
                    <input type="number" min="0" bind:value={formData.portfolioSize}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                    <input type="number" min="0" bind:value={formData.investmentExperience}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <input type="url" bind:value={formData.linkedinUrl}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Critères d'investissement</label>
                    <input type="text" bind:value={formData.investmentCriteria}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                  </div>
                </div>
              {/if}

              {#if formData.role === 'admin'}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">🔐</div>
                  <h5 class="text-lg font-medium text-gray-900 mb-2">Compte Administrateur</h5>
                  <p class="text-gray-600">Aucun champ supplémentaire.</p>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <div class="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            {#if currentStep > 1}
              <button type="button" on:click={prevStep}
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">← Précédent</button>
            {/if}
          </div>

          <div class="flex items-center gap-2">
            <button type="button" on:click={closeModal}
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Annuler</button>

            {#if currentStep < totalSteps}
              <button type="button" on:click={nextStep} disabled={!canProceedToNextStep()}
                class="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-[#c174f2] to-[#cb90f1] hover:shadow-lg disabled:opacity-50">
                Suivant →
              </button>
            {:else}
              <button type="submit" disabled={loading}
                class="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-[#c174f2] to-[#cb90f1] hover:shadow-lg flex items-center gap-2 disabled:opacity-50">
                {#if loading}
                  <LoadingSpinner size="sm" color="#ffffff" />
                {:else}
                  💾
                {/if}
                {editingUser ? 'Modifier' : 'Créer'}
              </button>
            {/if}
          </div>
        </div>
      </form>
    </div>
  </div>
</div>
