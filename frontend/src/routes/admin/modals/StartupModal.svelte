<script>
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  const dispatch = createEventDispatcher();

  export let user = null;          // admin connecté (pour token)
  export let editingStartup = null;   // startup à éditer (ou null pour créer)

  let loading = false;
  let error = null;
  let currentStep = 1;
  const totalSteps = 3;

  const API_BASE = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

  // valeurs par défaut sûres pour éviter les undefined
  function defaults(s = {}) {
    return {
      name: s.name || '',
      description: s.description || '',
      sector: s.sector || 'FinTech',
      maturity: s.maturity || 'Idéation',
      projectStatus: s.project_status || s.projectStatus || 'Active',
      needs: s.needs || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      websiteUrl: s.website_url || s.websiteUrl || '',
      socialMediaUrl: s.social_media_url || s.socialMediaUrl || '',
      legalStatus: s.legal_status || s.legalStatus || 'SAS',
      foundingDate: s.founding_date || s.foundingDate || s.created_at ? new Date(s.created_at || s.foundingDate || s.founding_date).toISOString().split('T')[0] : '',
      founders: Array.isArray(s.founders) ? [...s.founders] : []
    };
  }

  let formData = defaults(editingStartup);

  // si on change de startup à éditer après montage
  $: if (editingStartup) {
    formData = defaults(editingStartup);
  }

  const sectors = [
    'FinTech', 'HealthTech', 'EdTech', 'GreenTech', 'AgriTech', 'PropTech', 
    'FoodTech', 'RetailTech', 'Mobility', 'Cybersécurité', 'Intelligence Artificielle', 
    'Blockchain', 'IoT', 'Robotique', 'Gaming', 'Media & Entertainment', 'E-commerce', 
    'SaaS', 'Autre'
  ];

  const maturities = [
    'Idéation', 'Prototype', 'MVP', 'Validation', 'Traction', 'Croissance', 'Scale-up'
  ];

  const statuses = [
    'Active', 'Seeking Investment', 'Paused', 'Completed'
  ];

  const legalStatuses = [
    'SAS', 'SARL', 'SA', 'SNC', 'SCS', 'Auto-entrepreneur', 'EURL'
  ];

  function closeModal() {
    dispatch('close');
  }

  function canProceedToNextStep() {
    if (currentStep === 1) {
      return formData.name && formData.description && formData.sector;
    }
    if (currentStep === 2) {
      return formData.email || formData.phone;
    }
    return true;
  }

  function nextStep() {
    if (currentStep < totalSteps && canProceedToNextStep()) currentStep++;
  }
  function prevStep() {
    if (currentStep > 1) currentStep--;
  }

  function addFounder() {
    formData.founders = [...formData.founders, { name: '', email: '', role: '' }];
  }

  function removeFounder(index) {
    formData.founders = formData.founders.filter((_, i) => i !== index);
  }

  function updateFounder(index, field, value) {
    formData.founders[index][field] = value;
  }

  function cleanFormData(data) {
    const cleanedData = {
      name: data.name,
      description: data.description,
      sector: data.sector,
      maturity: data.maturity,
      projectStatus: data.projectStatus,
      needs: data.needs || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      websiteUrl: data.websiteUrl || undefined,
      socialMediaUrl: data.socialMediaUrl || undefined,
      legalStatus: data.legalStatus,
      foundingDate: data.foundingDate || undefined,
      founders: (data.founders || []).filter(f => f.name && f.name.trim())
    };

    // Nettoyer les valeurs undefined
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });

    return cleanedData;
  }

  async function saveStartup() {
    try {
      loading = true;
      error = null;

      if (!formData.name || !formData.description || !formData.sector) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      const cleanedData = cleanFormData(formData);
      console.log('💾 Données à sauvegarder:', cleanedData);

      const method = editingStartup ? 'PUT' : 'POST';
      const url = editingStartup
        ? `${API_BASE}/admin/startups/${editingStartup.id}`
        : `${API_BASE}/admin/startups`;

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
      });

      console.log('📡 Réponse status:', res.status);

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('📦 Données reçues:', data);

      if (data.success) {
        dispatch('saved');
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (e) {
      console.error('❌ Erreur sauvegarde:', e);
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<!-- Backdrop semi-transparent -->
<div class="fixed inset-0 z-50">
  <div class="absolute inset-0 bg-white/70 backdrop-blur-sm" on:click={closeModal}></div>

  <div class="relative z-10 min-h-screen flex items-start sm:items-center justify-center p-4">
    <div class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] px-6 py-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold font-['Montserrat']">
              {editingStartup ? "Modifier la startup" : "Créer une startup"}
            </h3>
            <p class="text-sm text-purple-100">Étape {currentStep} / {totalSteps}</p>
          </div>
          <button on:click={closeModal} class="text-white/90 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div class="mt-3 bg-purple-300 h-2 rounded-full overflow-hidden">
          <div class="bg-white h-full rounded-full transition-all" style="width: {(currentStep/totalSteps)*100}%"></div>
        </div>
      </div>

      <form on:submit|preventDefault={saveStartup}>
        <div class="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {#if error}
            <div class="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
          {/if}

          <!-- Step 1: Informations de base -->
          {#if currentStep === 1}
            <div class="space-y-6">
              <h4 class="text-lg font-semibold text-gray-900 font-['Montserrat']">Informations de base</h4>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom de la startup *</label>
                <input type="text" bind:value={formData.name} required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" 
                  placeholder="TechCorp SAS" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea rows="4" bind:value={formData.description} required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Décrivez votre startup, votre mission et vos objectifs..."></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Secteur *</label>
                  <select bind:value={formData.sector} required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    {#each sectors as sector}
                      <option value={sector}>{sector}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Maturité</label>
                  <select bind:value={formData.maturity}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    {#each maturities as maturity}
                      <option value={maturity}>{maturity}</option>
                    {/each}
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Statut du projet</label>
                  <select bind:value={formData.projectStatus}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    {#each statuses as status}
                      <option value={status}>{status}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Statut juridique</label>
                  <select bind:value={formData.legalStatus}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    {#each legalStatuses as status}
                      <option value={status}>{status}</option>
                    {/each}
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Besoins</label>
                <textarea rows="3" bind:value={formData.needs}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Financement, mentoring, partenariats, expertise technique..."></textarea>
              </div>
            </div>
          {/if}

          <!-- Step 2: Informations de contact -->
          {#if currentStep === 2}
            <div class="space-y-6">
              <h4 class="text-lg font-semibold text-gray-900 font-['Montserrat']">Informations de contact</h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                  <input type="email" bind:value={formData.email}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="contact@startup.com" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" bind:value={formData.phone}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="+33 1 23 45 67 89" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <textarea rows="2" bind:value={formData.address}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="123 Innovation Street, 75001 Paris, France"></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                  <input type="url" bind:value={formData.websiteUrl}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="https://www.startup.com" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Réseaux sociaux</label>
                  <input type="url" bind:value={formData.socialMediaUrl}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="https://linkedin.com/company/startup" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                <input type="date" bind:value={formData.foundingDate}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" />
              </div>
            </div>
          {/if}

          <!-- Step 3: Équipe -->
          {#if currentStep === 3}
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h4 class="text-lg font-semibold text-gray-900 font-['Montserrat']">Équipe fondatrice</h4>
                <button type="button" on:click={addFounder}
                  class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-3 py-1 rounded text-sm hover:shadow-lg">
                  + Ajouter fondateur
                </button>
              </div>

              {#if formData.founders.length === 0}
                <div class="text-center py-8 border-2 border-dashed border-gray