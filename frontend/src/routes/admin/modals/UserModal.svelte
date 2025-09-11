<script>
    import { createEventDispatcher } from 'svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    
    const dispatch = createEventDispatcher();
    
    export let user = null;
    export let editingUser = null;
    
    let loading = false;
    let error = null;
    let currentStep = 1;
    const totalSteps = 2;
    
    let formData = {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'user',
        phone: '',
        
        // User/Student fields
        age: '',
        gender: 'prefer_not_to_say',
        school: '',
        level: '',
        field: '',
        
        // Startup fields
        companyName: '',
        sector: '',
        description: '',
        maturity: 'Idéation',
        projectStatus: 'Active',
        needs: '',
        websiteUrl: '',
        legalStatus: 'SAS',
        address: '',
        teamSize: '',
        
        // Investor fields
        investorType: 'angel',
        investmentRange: { min: 0, max: 0 },
        preferredSectors: [],
        preferredStages: [],
        portfolioSize: '',
        investmentExperience: '',
        linkedinUrl: '',
        companyWebsite: '',
        investmentCriteria: '',
        geographicalPreferences: []
    };

    const API_BASE = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

    // Initialize form with editing data
    $: if (editingUser) {
        formData = {
            email: editingUser.email || '',
            password: '', // Don't populate password for editing
            firstName: editingUser.firstName || '',
            lastName: editingUser.lastName || '',
            role: editingUser.role || 'user',
            phone: editingUser.phone || '',
            
            age: editingUser.age || '',
            gender: editingUser.gender || 'prefer_not_to_say',
            school: editingUser.school || '',
            level: editingUser.level || '',
            field: editingUser.field || '',
            
            companyName: editingUser.companyName || '',
            sector: editingUser.sector || '',
            description: editingUser.description || '',
            maturity: editingUser.maturity || 'Idéation',
            projectStatus: editingUser.projectStatus || 'Active',
            needs: editingUser.needs || '',
            websiteUrl: editingUser.websiteUrl || '',
            legalStatus: editingUser.legalStatus || 'SAS',
            address: editingUser.address || '',
            teamSize: editingUser.teamSize || '',
            
            investorType: editingUser.investorType || 'angel',
            investmentRange: editingUser.investmentRange || { min: 0, max: 0 },
            preferredSectors: editingUser.preferredSectors || [],
            preferredStages: editingUser.preferredStages || [],
            portfolioSize: editingUser.portfolioSize || '',
            investmentExperience: editingUser.investmentExperience || '',
            linkedinUrl: editingUser.linkedinUrl || '',
            companyWebsite: editingUser.companyWebsite || '',
            investmentCriteria: editingUser.investmentCriteria || '',
            geographicalPreferences: editingUser.geographicalPreferences || []
        };
    }

    async function saveUser() {
        try {
            loading = true;
            error = null;

            // Validate required fields
            if (!formData.email || !formData.firstName || !formData.lastName) {
                throw new Error('Veuillez remplir tous les champs obligatoires');
            }

            if (!editingUser && !formData.password) {
                throw new Error('Le mot de passe est obligatoire pour un nouvel utilisateur');
            }

            // Clean form data based on role
            const cleanedData = cleanFormDataByRole(formData);

            const method = editingUser ? 'PUT' : 'POST';
            const url = editingUser
                ? `${API_BASE}/admin/users/${editingUser.id}`
                : `${API_BASE}/admin/users`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanedData)
            });

            const data = await response.json();

            if (data.success) {
                dispatch('saved');
            } else {
                throw new Error(data.message || 'Erreur lors de la sauvegarde');
            }
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function cleanFormDataByRole(data) {
        const baseData = {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            phone: data.phone || undefined
        };

        // Add password only for new users
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
                    teamSize: data.teamSize ? parseInt(data.teamSize) : undefined
                };

            case 'investor':
                return {
                    ...baseData,
                    investorType: data.investorType,
                    investmentRange: data.investmentRange.min || data.investmentRange.max ? data.investmentRange : undefined,
                    preferredSectors: data.preferredSectors.filter(s => s.trim()),
                    preferredStages: data.preferredStages.filter(s => s.trim()),
                    portfolioSize: data.portfolioSize ? parseInt(data.portfolioSize) : undefined,
                    investmentExperience: data.investmentExperience ? parseInt(data.investmentExperience) : undefined,
                    linkedinUrl: data.linkedinUrl || undefined,
                    companyWebsite: data.companyWebsite || undefined,
                    investmentCriteria: data.investmentCriteria || undefined,
                    geographicalPreferences: data.geographicalPreferences.filter(g => g.trim())
                };

            default:
                return baseData;
        }
    }

    function nextStep() {
        if (currentStep < totalSteps) {
            currentStep++;
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }

    function closeModal() {
        dispatch('close');
    }

    function addToArray(arrayName) {
        formData[arrayName] = [...formData[arrayName], ''];
    }

    function removeFromArray(arrayName, index) {
        formData[arrayName] = formData[arrayName].filter((_, i) => i !== index);
    }

    function updateArrayItem(arrayName, index, value) {
        formData[arrayName][index] = value;
    }

    // Role-specific validation
    function canProceedToNextStep() {
        if (currentStep === 1) {
            return formData.email && formData.firstName && formData.lastName && formData.role;
        }
        return true;
    }
</script>

<div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={closeModal}></div>

        <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] px-6 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold text-white font-['Montserrat']">
                            {editingUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
                        </h3>
                        <p class="text-purple-100 text-sm">
                            Étape {currentStep} sur {totalSteps}
                        </p>
                    </div>
                    <button
                        on:click={closeModal}
                        class="text-white hover:text-purple-200 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Progress bar -->
                <div class="mt-4">
                    <div class="w-full bg-purple-200 rounded-full h-2">
                        <div class="bg-white h-2 rounded-full transition-all duration-300" style="width: {(currentStep / totalSteps) * 100}%"></div>
                    </div>
                </div>
            </div>

            <form on:submit|preventDefault={saveUser}>
                <div class="bg-white px-6 py-6 max-h-96 overflow-y-auto">
                    {#if error}
                        <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p class="text-red-700 text-sm">{error}</p>
                        </div>
                    {/if}

                    <!-- Step 1: Basic Information -->
                    {#if currentStep === 1}
                        <div class="space-y-6">
                            <h4 class="text-lg font-semibold text-gray-900 font-['Montserrat']">Informations de base</h4>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        bind:value={formData.firstName}
                                        required
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Prénom"
                                    />
                                </div>

                                <div>
                                    <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        bind:value={formData.lastName}
                                        required
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Nom"
                                    />
                                </div>
                            </div>

                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    bind:value={formData.email}
                                    required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="email@example.com"
                                />
                            </div>

                            {#if !editingUser}
                                <div>
                                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                                    <input
                                        type="password"
                                        id="password"
                                        bind:value={formData.password}
                                        required={!editingUser}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Mot de passe (min. 6 caractères)"
                                        minlength="6"
                                    />
                                </div>
                            {/if}

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                                    <select
                                        id="role"
                                        bind:value={formData.role}
                                        required
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="user">Étudiant</option>
                                        <option value="startup">Startup</option>
                                        <option value="investor">Investisseur</option>
                                        <option value="admin">Administrateur</option>
                                    </select>
                                </div>

                                <div>
                                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        bind:value={formData.phone}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="+33 1 23 45 67 89"
                                    />
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Step 2: Role-specific Information -->
                    {#if currentStep === 2}
                        <div class="space-y-6">
                            <h4 class="text-lg font-semibold text-gray-900 font-['Montserrat']">
                                Informations spécifiques - 
                                {formData.role === 'user' ? 'Étudiant' : 
                                 formData.role === 'startup' ? 'Startup' : 
                                 formData.role === 'investor' ? 'Investisseur' : 'Administrateur'}
                            </h4>
                            
                            <!-- Student/User fields -->
                            {#if formData.role === 'user'}
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="age" class="block text-sm font-medium text-gray-700 mb-1">Âge</label>
                                        <input
                                            type="number"
                                            id="age"
                                            bind:value={formData.age}
                                            min="13"
                                            max="120"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="25"
                                        />
                                    </div>

                                    <div>
                                        <label for="gender" class="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                                        <select
                                            id="gender"
                                            bind:value={formData.gender}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="male">Homme</option>
                                            <option value="female">Femme</option>
                                            <option value="other">Autre</option>
                                            <option value="prefer_not_to_say">Préfère ne pas dire</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label for="school" class="block text-sm font-medium text-gray-700 mb-1">École/Université</label>
                                    <input
                                        type="text"
                                        id="school"
                                        bind:value={formData.school}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Epitech Paris"
                                    />
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="level" class="block text-sm font-medium text-gray-700 mb-1">Niveau d'études</label>
                                        <input
                                            type="text"
                                            id="level"
                                            bind:value={formData.level}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Bac +5"
                                        />
                                    </div>

                                    <div>
                                        <label for="field" class="block text-sm font-medium text-gray-700 mb-1">Domaine d'études</label>
                                        <input
                                            type="text"
                                            id="field"
                                            bind:value={formData.field}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Informatique"
                                        />
                                    </div>
                                </div>
                            {/if}

                            <!-- Startup fields -->
                            {#if formData.role === 'startup'}
                                <div>
                                    <label for="companyName" class="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        bind:value={formData.companyName}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="TechCorp SAS"
                                    />
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="sector" class="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                                        <select
                                            id="sector"
                                            bind:value={formData.sector}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="">Sélectionner...</option>
                                            <option value="FinTech">FinTech</option>
                                            <option value="HealthTech">HealthTech</option>
                                            <option value="EdTech">EdTech</option>
                                            <option value="GreenTech">GreenTech</option>
                                            <option value="AgriTech">AgriTech</option>
                                            <option value="PropTech">PropTech</option>
                                            <option value="FoodTech">FoodTech</option>
                                            <option value="RetailTech">RetailTech</option>
                                            <option value="Mobility">Mobility</option>
                                            <option value="Cybersécurité">Cybersécurité</option>
                                            <option value="Intelligence Artificielle">Intelligence Artificielle</option>
                                            <option value="Blockchain">Blockchain</option>
                                            <option value="IoT">IoT</option>
                                            <option value="Robotique">Robotique</option>
                                            <option value="Gaming">Gaming</option>
                                            <option value="SaaS">SaaS</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label for="maturity" class="block text-sm font-medium text-gray-700 mb-1">Maturité</label>
                                        <select
                                            id="maturity"
                                            bind:value={formData.maturity}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
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
                                    <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        id="description"
                                        bind:value={formData.description}
                                        rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Décrivez votre startup..."
                                    ></textarea>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="websiteUrl" class="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                                        <input
                                            type="url"
                                            id="websiteUrl"
                                            bind:value={formData.websiteUrl}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="https://www.startup.com"
                                        />
                                    </div>

                                    <div>
                                        <label for="teamSize" class="block text-sm font-medium text-gray-700 mb-1">Taille de l'équipe</label>
                                        <input
                                            type="number"
                                            id="teamSize"
                                            bind:value={formData.teamSize}
                                            min="1"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="5"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label for="needs" class="block text-sm font-medium text-gray-700 mb-1">Besoins</label>
                                    <textarea
                                        id="needs"
                                        bind:value={formData.needs}
                                        rows="2"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Financement, mentoring, partenariats..."
                                    ></textarea>
                                </div>
                            {/if}

                            <!-- Investor fields -->
                            {#if formData.role === 'investor'}
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="investorType" class="block text-sm font-medium text-gray-700 mb-1">Type d'investisseur</label>
                                        <select
                                            id="investorType"
                                            bind:value={formData.investorType}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="angel">Business Angel</option>
                                            <option value="venture_capital">Fonds d'investissement</option>
                                            <option value="private_equity">Private Equity</option>
                                            <option value="corporate">Corporate Venture</option>
                                            <option value="government">Investisseur public</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label for="companyWebsite" class="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                                        <input
                                            type="url"
                                            id="companyWebsite"
                                            bind:value={formData.companyWebsite}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="https://www.fund.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Fourchette d'investissement (€)</label>
                                    <div class="grid grid-cols-2 gap-4">
                                        <input
                                            type="number"
                                            bind:value={formData.investmentRange.min}
                                            min="0"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Minimum"
                                        />
                                        <input
                                            type="number"
                                            bind:value={formData.investmentRange.max}
                                            min="0"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Maximum"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Secteurs préférés</label>
                                    <div class="space-y-2">
                                        {#each formData.preferredSectors as sector, index}
                                            <div class="flex gap-2">
                                                <input
                                                    type="text"
                                                    bind:value={sector}
                                                    on:input={(e) => updateArrayItem('preferredSectors', index, e.target.value)}
                                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    placeholder="FinTech, HealthTech..."
                                                />
                                                <button
                                                    type="button"
                                                    on:click={() => removeFromArray('preferredSectors', index)}
                                                    class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                                                    ✕
                                                </button>
                                            </div>
                                        {/each}
                                        <button
                                            type="button"
                                            on:click={() => addToArray('preferredSectors')}
                                            class="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors">
                                            + Ajouter un secteur
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Stades préférés</label>
                                    <div class="space-y-2">
                                        {#each formData.preferredStages as stage, index}
                                            <div class="flex gap-2">
                                                <input
                                                    type="text"
                                                    bind:value={stage}
                                                    on:input={(e) => updateArrayItem('preferredStages', index, e.target.value)}
                                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    placeholder="Seed, Series A..."
                                                />
                                                <button
                                                    type="button"
                                                    on:click={() => removeFromArray('preferredStages', index)}
                                                    class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                                                    ✕
                                                </button>
                                            </div>
                                        {/each}
                                        <button
                                            type="button"
                                            on:click={() => addToArray('preferredStages')}
                                            class="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors">
                                            + Ajouter un stade
                                        </button>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="portfolioSize" class="block text-sm font-medium text-gray-700 mb-1">Taille du portefeuille</label>
                                        <input
                                            type="number"
                                            id="portfolioSize"
                                            bind:value={formData.portfolioSize}
                                            min="0"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="25"
                                        />
                                    </div>

                                    <div>
                                        <label for="investmentExperience" class="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                                        <input
                                            type="number"
                                            id="investmentExperience"
                                            bind:value={formData.investmentExperience}
                                            min="0"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="5"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label for="linkedinUrl" class="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                                    <input
                                        type="url"
                                        id="linkedinUrl"
                                        bind:value={formData.linkedinUrl}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="https://linkedin.com/in/profil"
                                    />
                                </div>
                            {/if}

                            <!-- Admin has no additional fields -->
                            {#if formData.role === 'admin'}
                                <div class="text-center py-8">
                                    <div class="text-4xl mb-4">🔐</div>
                                    <h5 class="text-lg font-medium text-gray-900 mb-2">Compte Administrateur</h5>
                                    <p class="text-gray-600">Les administrateurs ont accès à toutes les fonctionnalités de gestion de la plateforme.</p>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>

                <!-- Footer -->
                <div class="bg-gray-50 px-6 py-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        {#if currentStep > 1}
                            <button
                                type="button"
                                on:click={prevStep}
                                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                                ← Précédent
                            </button>
                        {/if}
                    </div>

                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            on:click={closeModal}
                            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                            Annuler
                        </button>
                        
                        {#if currentStep < totalSteps}
                            <button
                                type="button"
                                on:click={nextStep}
                                disabled={!canProceedToNextStep()}
                                class="px-4 py-2 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                Suivant →
                            </button>
                        {:else}
                            <button
                                type="submit"
                                disabled={loading}
                                class="px-6 py-2 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2">
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

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>