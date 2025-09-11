<script>
    import { onMount } from 'svelte';
    import { userStore } from '../../lib/stores/userStore.js';
    import { goto } from '$app/navigation';
    import Header from '../../lib/components/Header.svelte';
    import Footer from '../../lib/components/Footer.svelte';
    import LoadingSpinner from '../../lib/components/LoadingSpinner.svelte';

    let user = null;
    let visible = false;
    let isEditing = false;
    let isLoading = false;
    let showPasswordModal = false;
    let activeTab = 'personal';
    let uploadingAvatar = false;

    // Données du formulaire d'édition
    let editData = {};
    let passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    let errors = {};
    let successMessage = '';

    // Options pour les select
    const sectors = [
        'FinTech', 'HealthTech', 'EdTech', 'GreenTech', 'AgriTech', 'PropTech',
        'FoodTech', 'RetailTech', 'Mobility', 'Cybersécurité', 'Intelligence Artificielle',
        'Blockchain', 'IoT', 'Robotique', 'Gaming', 'Media & Entertainment',
        'E-commerce', 'SaaS', 'DeepTech', 'Autre'
    ];

    const investorTypes = [
        'Business Angel', 'Fonds d\'investissement', 'Corporate Venture',
        'Family Office', 'Fonds de pension', 'Investisseur institutionnel',
        'Crowdfunding platform', 'Autre'
    ];

    const investmentRanges = [
        'Moins de 10K€', '10K€ - 50K€', '50K€ - 100K€', '100K€ - 500K€',
        '500K€ - 1M€', '1M€ - 5M€', '5M€ - 10M€', 'Plus de 10M€'
    ];

    const schools = [
        'EPITECH', 'École 42', 'Université Paris-Saclay', 'HEC Paris',
        'ESSEC', 'EDHEC', 'Centrale Paris', 'Polytechnique', 'Sciences Po',
        'ESGI', 'Supinfo', 'INSA', 'UTC', 'Autre'
    ];

    const studyLevels = [
        'Bac +1', 'Bac +2', 'Bac +3 (Licence)', 'Bac +4',
        'Bac +5 (Master)', 'Doctorat'
    ];

    const studyFields = [
        'Informatique', 'Ingénierie', 'Business/Management', 'Design',
        'Marketing', 'Finance', 'Droit', 'Sciences', 'Arts', 'Autre'
    ];

    userStore.subscribe(value => {
        user = value;
        if (user && !editData.email) {
            initializeEditData();
        }
    });

    function initializeEditData() {
        editData = {
            // Informations personnelles communes
            firstName: user.firstName || user.first_name || '',
            lastName: user.lastName || user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            linkedin: user.linkedin || user.linkedinUrl || '',
            bio: user.bio || user.motivation || '',
            location: user.location || user.address || '',
            website: user.website || user.website_url || '',

            // Spécifique aux startups
            companyName: user.companyName || user.company_name || '',
            sector: user.sector || '',
            companyDescription: user.companyDescription || user.description || '',
            foundingYear: user.foundingYear || user.founding_year || '',
            teamSize: user.teamSize || user.team_size || '',
            fundingStage: user.fundingStage || user.funding_stage || '',
            businessModel: user.businessModel || user.business_model || '',
            currentFunding: user.currentFunding || user.current_funding || '',
            fundingNeeds: user.fundingNeeds || user.funding_needs || '',

            // Spécifique aux investisseurs
            company: user.company || '',
            position: user.position || '',
            investorType: user.investorType || user.investor_type || '',
            experience: user.experience || '',
            investmentRange: user.investmentRange || user.investment_range || '',
            preferredSectors: user.preferredSectors || user.preferred_sectors || [],
            preferredStages: user.preferredStages || user.preferred_stages || [],
            geography: user.geography || '',
            investmentCriteria: user.investmentCriteria || user.investment_criteria || '',
            portfolio: user.portfolio || '',
            expertise: user.expertise || '',

            // Spécifique aux étudiants
            school: user.school || user.schoolName || '',
            studyLevel: user.studyLevel || user.study_level || user.level || '',
            studyField: user.studyField || user.study_field || user.field || '',
            interests: user.interests || [],
            graduationYear: user.graduationYear || user.graduation_year || ''
        };
    }

    function getUserInitials() {
        if (!user) return '';
        const firstName = user.firstName || user.first_name || user.name?.split(' ')[0] || '';
        const lastName = user.lastName || user.last_name || user.name?.split(' ')[1] || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    function getDisplayName() {
        if (!user) return '';
        const firstName = user.firstName || user.first_name || user.prenom || '';
        const lastName = user.lastName || user.last_name || user.nom || '';
        return `${firstName} ${lastName}`.trim() || user.name || user.email || '';
    }

    function getUserRole() {
        if (!user) return '';
        switch (user.role) {
            case 'admin': return 'Administrateur';
            case 'startup': return 'Startup';
            case 'investor': return 'Investisseur';
            case 'student': return 'Étudiant';
            default: return 'Utilisateur';
        }
    }

    function getRoleColor() {
        switch (user?.role) {
            case 'admin': return 'bg-red-500';
            case 'startup': return 'bg-[#c174f2]';
            case 'investor': return 'bg-green-500';
            case 'student': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function startEditing() {
        isEditing = true;
        errors = {};
        successMessage = '';
    }

    function cancelEditing() {
        isEditing = false;
        initializeEditData();
        errors = {};
        successMessage = '';
    }

    async function saveProfile() {
        try {
            isLoading = true;
            errors = {};

            // Validation basique
            if (!editData.firstName.trim()) {
                errors.firstName = 'Le prénom est obligatoire';
                return;
            }
            if (!editData.lastName.trim()) {
                errors.lastName = 'Le nom est obligatoire';
                return;
            }
            if (!editData.email.trim()) {
                errors.email = 'L\'email est obligatoire';
                return;
            }

            // Appel API pour mettre à jour le profil
            const response = await fetch(`${API_BASE}/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editData)
            });

            const data = await response.json();

            if (data.success) {
                // Mettre à jour le store utilisateur
                await userStore.updateUserData(data.user);
                
                isEditing = false;
                successMessage = 'Profil mis à jour avec succès !';
                
                setTimeout(() => {
                    successMessage = '';
                }, 5000);
            } else {
                errors.submit = data.message || 'Erreur lors de la mise à jour';
            }
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            errors.submit = 'Une erreur est survenue lors de la mise à jour';
        } finally {
            isLoading = false;
        }
    }

    async function changePassword() {
        try {
            isLoading = true;
            errors = {};

            // Validation
            if (!passwordData.currentPassword) {
                errors.currentPassword = 'Mot de passe actuel requis';
                return;
            }
            if (!passwordData.newPassword) {
                errors.newPassword = 'Nouveau mot de passe requis';
                return;
            }
            if (passwordData.newPassword.length < 6) {
                errors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
                return;
            }
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                errors.confirmPassword = 'Les mots de passe ne correspondent pas';
                return;
            }

            // Appel API
            const response = await fetch(`${API_BASE}/users/${user.id}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                showPasswordModal = false;
                passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
                successMessage = 'Mot de passe modifié avec succès !';
                
                setTimeout(() => {
                    successMessage = '';
                }, 5000);
            } else {
                errors.passwordSubmit = data.message || 'Erreur lors du changement de mot de passe';
            }
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            errors.passwordSubmit = 'Une erreur est survenue';
        } finally {
            isLoading = false;
        }
    }

    async function uploadAvatar(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validation du fichier
        if (!file.type.startsWith('image/')) {
            errors.avatar = 'Veuillez sélectionner une image';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            errors.avatar = 'L\'image doit faire moins de 5MB';
            return;
        }

        try {
            uploadingAvatar = true;
            errors.avatar = '';

            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${API_BASE}/users/${user.id}/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                await userStore.updateUserData({ ...user, avatar: data.avatarUrl });
                successMessage = 'Photo de profil mise à jour !';
                
                setTimeout(() => {
                    successMessage = '';
                }, 5000);
            } else {
                errors.avatar = data.message || 'Erreur lors de l\'upload';
            }
        } catch (error) {
            console.error('Erreur upload avatar:', error);
            errors.avatar = 'Erreur lors de l\'upload de l\'image';
        } finally {
            uploadingAvatar = false;
        }
    }

    function handleSectorChange(sector, isChecked) {
        if (isChecked) {
            if (!editData.preferredSectors.includes(sector)) {
                editData.preferredSectors = [...editData.preferredSectors, sector];
            }
        } else {
            editData.preferredSectors = editData.preferredSectors.filter(s => s !== sector);
        }
    }

    function handleInterestChange(interest, isChecked) {
        if (isChecked) {
            if (!editData.interests.includes(interest)) {
                editData.interests = [...editData.interests, interest];
            }
        } else {
            editData.interests = editData.interests.filter(i => i !== interest);
        }
    }

    onMount(async () => {
        await userStore.init();

        if (!user) {
            goto('/login');
            return;
        }

        setTimeout(() => {
            visible = true;
        }, 100);
    });
</script>

<svelte:head>
    <title>Mon Profil - JEB Incubator</title>
    <meta name="description" content="Consultez et modifiez votre profil JEB Incubator">
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
    <Header />

    {#if !user}
        <div class="pt-24 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto text-center py-16">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Connexion Requise</h1>
                <p class="text-gray-600 mb-8">Vous devez être connecté pour accéder à votre profil.</p>
                <button
                        on:click={() => goto('/login')}
                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                    Se connecter
                </button>
            </div>
        </div>
    {:else}
        <!-- Messages de succès -->
        {#if successMessage}
            <div class="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300">
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    {successMessage}
                </div>
            </div>
        {/if}

        <!-- En-tête du profil -->
        <section class="pt-24 pb-8 px-6 sm:px-8 lg:px-12">
            <div class="max-w-6xl mx-auto">
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-1000 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
                    <!-- Banner -->
                    <div class="h-32 bg-gradient-to-r from-[#c174f2] via-[#cb90f1] to-[#f18585] relative">
                        <!-- Avatar -->
                        <div class="absolute -bottom-16 left-8">
                            <div class="relative group">
                                <div class="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
                                    {#if user.avatar}
                                        <img src={user.avatar} alt="Avatar" class="w-full h-full rounded-full object-cover">
                                    {:else}
                                        <div class="w-full h-full rounded-full bg-gradient-to-r from-[#c174f2] to-[#f18585] flex items-center justify-center text-white text-3xl font-bold">
                                            {getUserInitials()}
                                        </div>
                                    {/if}
                                    
                                    <!-- Overlay pour changer l'avatar -->
                                    {#if isEditing}
                                        <div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                on:change={uploadAvatar}
                                                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={uploadingAvatar}
                                            />
                                            {#if uploadingAvatar}
                                                <LoadingSpinner size="sm" color="#ffffff" />
                                            {:else}
                                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                </svg>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                {#if errors.avatar}
                                    <p class="absolute top-full left-0 text-red-500 text-xs mt-1">{errors.avatar}</p>
                                {/if}
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="absolute top-4 right-4 flex gap-2">
                            {#if !isEditing}
                                <button
                                    on:click={startEditing}
                                    class="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    Modifier
                                </button>
                                <button
                                    on:click={() => showPasswordModal = true}
                                    class="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                    </svg>
                                    Mot de passe
                                </button>
                            {:else}
                                <button
                                    on:click={saveProfile}
                                    disabled={isLoading}
                                    class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {#if isLoading}
                                        <LoadingSpinner size="sm" color="#ffffff" />
                                    {:else}
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    {/if}
                                    Sauvegarder
                                </button>
                                <button
                                    on:click={cancelEditing}
                                    class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-300 flex items-center gap-2"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                    Annuler
                                </button>
                            {/if}
                        </div>
                    </div>

                    <div class="pt-20 pb-6 px-8">
                        <div class="mb-6">
                            {#if isEditing}
                                <div class="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                        <input
                                            type="text"
                                            bind:value={editData.firstName}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 {errors.firstName ? 'border-red-400' : ''}"
                                        />
                                        {#if errors.firstName}
                                            <p class="text-red-500 text-sm mt-1">{errors.firstName}</p>
                                        {/if}
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                        <input
                                            type="text"
                                            bind:value={editData.lastName}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 {errors.lastName ? 'border-red-400' : ''}"
                                        />
                                        {#if errors.lastName}
                                            <p class="text-red-500 text-sm mt-1">{errors.lastName}</p>
                                        {/if}
                                    </div>
                                </div>
                            {:else}
                                <h1 class="text-3xl font-bold text-gray-900 mb-2 font-['Montserrat']">
                                    {getDisplayName()}
                                </h1>
                            {/if}

                            <div class="flex items-center space-x-4 text-gray-600">
                                <span class="px-3 py-1 {getRoleColor()} text-white rounded-full text-sm font-medium">
                                    {getUserRole()}
                                </span>
                                {#if user.location}
                                    <span class="flex items-center">
                                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                        {user.location}
                                    </span>
                                {/if}
                            </div>

                            {#if isEditing}
                                <div class="mt-3">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Bio / Motivation</label>
                                    <textarea
                                        bind:value={editData.bio}
                                        rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="Parlez-nous de vous..."
                                    ></textarea>
                                </div>
                            {:else if user.bio || user.motivation}
                                <p class="text-gray-600 mt-3 max-w-2xl">{user.bio || user.motivation}</p>
                            {/if}
                        </div>

                        {#if errors.submit}
                            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p class="text-red-600 text-sm">{errors.submit}</p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </section>

        <!-- Contenu principal avec onglets -->
        <section class="pb-20 px-6 sm:px-8 lg:px-12">
            <div class="max-w-6xl mx-auto">
                <!-- Navigation des onglets -->
                <div class="border-b border-gray-200 mb-8">
                    <nav class="-mb-px flex space-x-8">
                        <button
                            on:click={() => activeTab = 'personal'}
                            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                                activeTab === 'personal'
                                    ? 'border-[#c174f2] text-[#c174f2]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }"
                        >
                            Informations personnelles
                        </button>

                        {#if user.role === 'startup'}
                            <button
                                on:click={() => activeTab = 'startup'}
                                class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                                    activeTab === 'startup'
                                        ? 'border-[#c174f2] text-[#c174f2]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }"
                            >
                                Informations startup
                            </button>
                        {/if}

                        {#if user.role === 'investor'}
                            <button
                                on:click={() => activeTab = 'investor'}
                                class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                                    activeTab === 'investor'
                                        ? 'border-[#c174f2] text-[#c174f2]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }"
                            >
                                Profil investisseur
                            </button>
                        {/if}

                        {#if user.role === 'student'}
                            <button
                                on:click={() => activeTab = 'student'}
                                class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                                    activeTab === 'student'
                                        ? 'border-[#c174f2] text-[#c174f2]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }"
                            >
                                Profil étudiant
                            </button>
                        {/if}

                        <button
                            on:click={() => activeTab = 'account'}
                            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                                activeTab === 'account'
                                    ? 'border-[#c174f2] text-[#c174f2]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }"
                        >
                            Compte
                        </button>
                    </nav>
                </div>

                <!-- Contenu des onglets -->
                <div class="bg-white rounded-2xl shadow-lg p-8">
                    
                    <!-- Onglet Informations personnelles -->
                    {#if activeTab === 'personal'}
                        <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Informations personnelles</h2>
                        
                        {#if isEditing}
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        bind:value={editData.email}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 {errors.email ? 'border-red-400' : ''}"
                                    />
                                    {#if errors.email}
                                        <p class="text-red-500 text-sm mt-1">{errors.email}</p>
                                    {/if}
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                    <input
                                        type="tel"
                                        bind:value={editData.phone}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="06 12 34 56 78"
                                    />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                                    <input
                                        type="url"
                                        bind:value={editData.linkedin}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="https://linkedin.com/in/votre-profil"
                                    />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                                    <input
                                        type="url"
                                        bind:value={editData.website}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="https://votre-site.com"
                                    />
                                </div>

                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
                                    <input
                                        type="text"
                                        bind:value={editData.location}
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="Ville, Pays"
                                    />
                                </div>
                            </div>
                        {:else}
                            <div class="grid md:grid-cols-2 gap-8">
                                <div class="space-y-6">
                                    <div>
                                        <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Contact</h3>
                                        <div class="space-y-3">
                                            <div class="flex items-center">
                                                <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                                </svg>
                                                <span class="text-gray-900">{user.email}</span>
                                            </div>
                                            
                                            {#if user.phone}
                                                <div class="flex items-center">
                                                    <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                                    </svg>
                                                    <span class="text-gray-900">{user.phone}</span>
                                                </div>
                                            {/if}

                                            {#if user.linkedin || user.linkedinUrl}
                                                <div class="flex items-center">
                                                    <svg class="w-5 h-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                                    </svg>
                                                    <a href={user.linkedin || user.linkedinUrl} target="_blank" class="text-[#c174f2] hover:text-[#cb90f1] transition-colors duration-300">
                                                        Profil LinkedIn
                                                    </a>
                                                </div>
                                            {/if}

                                            {#if user.website || user.website_url}
                                                <div class="flex items-center">
                                                    <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9 9m9-9v18"></path>
                                                    </svg>
                                                    <a href={user.website || user.website_url} target="_blank" class="text-[#c174f2] hover:text-[#cb90f1] transition-colors duration-300">
                                                        Site web
                                                    </a>
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-6">
                                    <div>
                                        <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Informations du compte</h3>
                                        <div class="space-y-3">
                                            <div class="flex items-center">
                                                <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                </svg>
                                                <span class="text-gray-900">{getUserRole()}</span>
                                            </div>
                                            
                                            <div class="flex items-center">
                                                <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8"></path>
                                                </svg>
                                                <span class="text-gray-700">Membre depuis {formatDate(user.created_at || user.createdAt || Date.now())}</span>
                                            </div>

                                            {#if user.id}
                                                <div class="flex items-center">
                                                    <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                                                    </svg>
                                                    <span class="text-gray-700">ID: #{user.id}</span>
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/if}

                    <!-- Onglet Startup -->
                    {#if activeTab === 'startup' && user.role === 'startup'}
                        <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Informations de votre startup</h2>
                        
                        {#if isEditing}
                            <div class="space-y-6">
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Nom de la startup</label>
                                        <input
                                            type="text"
                                            bind:value={editData.companyName}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                            placeholder="Nom de votre entreprise"
                                        />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
                                        <select
                                            bind:value={editData.sector}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        >
                                            <option value="">Sélectionnez un secteur</option>
                                            {#each sectors as sector}
                                                <option value={sector}>{sector}</option>
                                            {/each}
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Année de création</label>
                                        <input
                                            type="number"
                                            bind:value={editData.foundingYear}
                                            min="1900"
                                            max="2024"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Taille de l'équipe</label>
                                        <input
                                            type="text"
                                            bind:value={editData.teamSize}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                            placeholder="ex: 5 personnes"
                                        />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Stade de financement</label>
                                        <input
                                            type="text"
                                            bind:value={editData.fundingStage}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                            placeholder="ex: Seed, Série A..."
                                        />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Financement actuel</label>
                                        <input
                                            type="text"
                                            bind:value={editData.currentFunding}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                            placeholder="ex: 500K€"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Description de l'entreprise</label>
                                    <textarea
                                        bind:value={editData.companyDescription}
                                        rows="4"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="Décrivez votre startup, votre mission, votre produit..."
                                    ></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Modèle économique</label>
                                    <textarea
                                        bind:value={editData.businessModel}
                                        rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="Comment votre startup génère-t-elle des revenus ?"
                                    ></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Besoins de financement</label>
                                    <textarea
                                        bind:value={editData.fundingNeeds}
                                        rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="Décrivez vos besoins actuels de financement et l'utilisation prévue des fonds"
                                    ></textarea>
                                </div>
                            </div>
                        {:else}
                            <div class="grid md:grid-cols-2 gap-8">
                                <div class="space-y-6">
                                    {#if user.companyName || user.company_name}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Entreprise</h3>
                                            <p class="text-lg font-semibold text-gray-900">{user.companyName || user.company_name}</p>
                                        </div>
                                    {/if}

                                    {#if user.sector}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Secteur</h3>
                                            <span class="inline-block bg-[#c174f2] text-white px-3 py-1 rounded-full text-sm font-medium">{user.sector}</span>
                                        </div>
                                    {/if}

                                    {#if user.foundingYear || user.founding_year}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Année de création</h3>
                                            <p class="text-gray-900">{user.foundingYear || user.founding_year}</p>
                                        </div>
                                    {/if}

                                    {#if user.teamSize || user.team_size}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Taille de l'équipe</h3>
                                            <p class="text-gray-900">{user.teamSize || user.team_size}</p>
                                        </div>
                                    {/if}
                                </div>

                                <div class="space-y-6">
                                    {#if user.fundingStage || user.funding_stage}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Stade de financement</h3>
                                            <p class="text-gray-900">{user.fundingStage || user.funding_stage}</p>
                                        </div>
                                    {/if}

                                    {#if user.currentFunding || user.current_funding}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Financement actuel</h3>
                                            <p class="text-gray-900">{user.currentFunding || user.current_funding}</p>
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            {#if user.companyDescription || user.description}
                                <div class="mt-8">
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Description</h3>
                                    <p class="text-gray-700 leading-relaxed">{user.companyDescription || user.description}</p>
                                </div>
                            {/if}

                            {#if user.businessModel || user.business_model}
                                <div class="mt-6">
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Modèle économique</h3>
                                    <p class="text-gray-700 leading-relaxed">{user.businessModel || user.business_model}</p>
                                </div>
                            {/if}

                            {#if user.fundingNeeds || user.funding_needs}
                                <div class="mt-6">
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Besoins de financement</h3>
                                    <p class="text-gray-700 leading-relaxed">{user.fundingNeeds || user.funding_needs}</p>
                                </div>
                            {/if}
                        {/if}
                    {/if}

                    <!-- Onglet Investisseur -->
                    {#if activeTab === 'investor' && user.role === 'investor'}
                        <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Profil investisseur</h2>
                        
                        {#if isEditing}
                            <div class="space-y-6">
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Société/Organisation</label>
                                        <input
                                            type="text"
                                            bind:value={editData.company}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                            placeholder="Nom de votre société"
                                        />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Poste/Fonction</label>
                                        <input
                                            type="text"
                                            bind:value={editData.position}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                            placeholder="ex: Partner, Investment Manager"
                                        />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Type d'investisseur</label>
                                        <select
                                            bind:value={editData.investorType}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        >
                                            <option value="">Sélectionnez votre type</option>
                                            {#each investorTypes as type}
                                                <option value={type}>{type}</option>
                                            {/each}
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Expérience</label>
                                        <input
                                            type="text"
                                            bind:value={editData.experience}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                            placeholder="ex: 10+ ans en investissement"
                                        />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Ticket d'investissement</label>
                                        <select
                                            bind:value={editData.investmentRange}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        >
                                            <option value="">Sélectionnez votre fourchette</option>
                                            {#each investmentRanges as range}
                                                <option value={range}>{range}</option>
                                            {/each}
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Zone géographique</label>
                                        <input
                                            type="text"
                                            bind:value={editData.geography}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                            placeholder="ex: Europe, Global"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-3">Secteurs d'intérêt</label>
                                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {#each sectors as sector}
                                            <label class="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={editData.preferredSectors.includes(sector)}
                                                    on:change={(e) => handleSectorChange(sector, e.target.checked)}
                                                    class="w-4 h-4 text-[#c174f2] border-gray-300 rounded focus:ring-[#c174f2]"
                                                />
                                                <span class="text-sm text-gray-700">{sector}</span>
                                            </label>
                                        {/each}
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Critères d'investissement</label>
                                    <textarea
                                        bind:value={editData.investmentCriteria}
                                        rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="Décrivez vos critères d'évaluation"
                                    ></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Portefeuille</label>
                                    <textarea
                                        bind:value={editData.portfolio}
                                        rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="Présentez vos investissements marquants"
                                    ></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Expertise et valeur ajoutée</label>
                                    <textarea
                                        bind:value={editData.expertise}
                                        rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        placeholder="Quelle expertise apportez-vous aux startups ?"
                                    ></textarea>
                                </div>
                            </div>
                        {:else}
                            <div class="grid md:grid-cols-2 gap-8">
                                <div class="space-y-6">
                                    {#if user.company}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Société/Organisation</h3>
                                            <p class="text-lg font-semibold text-gray-900">{user.company}</p>
                                        </div>
                                    {/if}

                                    {#if user.position}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Poste</h3>
                                            <p class="text-gray-900">{user.position}</p>
                                        </div>
                                    {/if}

                                    {#if user.investorType || user.investor_type}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Type d'investisseur</h3>
                                            <span class="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">{user.investorType || user.investor_type}</span>
                                        </div>
                                    {/if}

                                    {#if user.experience}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Expérience</h3>
                                            <p class="text-gray-900">{user.experience}</p>
                                        </div>
                                    {/if}
                                </div>

                                <div class="space-y-6">
                                    {#if user.investmentRange || user.investment_range}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Ticket d'investissement</h3>
                                            <p class="text-gray-900">{user.investmentRange || user.investment_range}</p>
                                        </div>
                                    {/if}

                                    {#if user.geography}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Zone géographique</h3>
                                            <p class="text-gray-900">{user.geography}</p>
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            {#if user.preferredSectors || user.preferred_sectors}
                                <div class="mt-8">
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Secteurs d'intérêt</h3>
                                    <div class="flex flex-wrap gap-2">
                                        {#each (user.preferredSectors || user.preferred_sectors || []) as sector}
                                            <span class="bg-[#c174f2] text-white px-3 py-1 rounded-full text-sm">{sector}</span>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            {#if user.investmentCriteria || user.investment_criteria}
                                <div class="mt-6">
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Critères d'investissement</h3>
                                    <p class="text-gray-700 leading-relaxed">{user.investmentCriteria || user.investment_criteria}</p>
                                </div>
                            {/if}

                            {#if user.portfolio}
                                <div class="mt-6">
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Portefeuille</h3>
                                    <p class="text-gray-700 leading-relaxed">{user.portfolio}</p>
                                </div>
                            {/if}

                            {#if user.expertise}
                                <div class="mt-6">
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Expertise et valeur ajoutée</h3>
                                    <p class="text-gray-700 leading-relaxed">{user.expertise}</p>
                                </div>
                            {/if}
                        {/if}
                    {/if}

                    <!-- Onglet Étudiant -->
                    {#if activeTab === 'student' && user.role === 'student'}
                        <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Profil étudiant</h2>
                        
                        {#if isEditing}
                            <div class="space-y-6">
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">École/Université</label>
                                        <select
                                            bind:value={editData.school}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        >
                                            <option value="">Sélectionnez votre école</option>
                                            {#each schools as school}
                                                <option value={school}>{school}</option>
                                            {/each}
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Niveau d'études</label>
                                        <select
                                            bind:value={editData.studyLevel}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        >
                                            <option value="">Sélectionnez votre niveau</option>
                                            {#each studyLevels as level}
                                                <option value={level}>{level}</option>
                                            {/each}
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Domaine d'études</label>
                                        <select
                                            bind:value={editData.studyField}
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        >
                                            <option value="">Sélectionnez votre domaine</option>
                                            {#each studyFields as field}
                                                <option value={field}>{field}</option>
                                            {/each}
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Année de diplôme</label>
                                        <input
                                            type="number"
                                            bind:value={editData.graduationYear}
                                            min="2020"
                                            max="2030"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-3">Centres d'intérêt</label>
                                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {#each ['Intelligence Artificielle', 'Développement Web', 'Blockchain', 'Cybersécurité', 'Data Science', 'UX/UI Design', 'Marketing Digital', 'E-commerce', 'FinTech', 'HealthTech', 'GreenTech', 'Gaming'] as interest}
                                            <label class="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={editData.interests.includes(interest)}
                                                    on:change={(e) => handleInterestChange(interest, e.target.checked)}
                                                    class="w-4 h-4 text-[#c174f2] border-gray-300 rounded focus:ring-[#c174f2]"
                                                />
                                                <span class="text-sm text-gray-700">{interest}</span>
                                            </label>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {:else}
                            <div class="grid md:grid-cols-2 gap-8">
                                <div class="space-y-6">
                                    {#if user.school || user.schoolName}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">École/Université</h3>
                                            <p class="text-lg font-semibold text-gray-900">{user.school || user.schoolName}</p>
                                        </div>
                                    {/if}

                                    {#if user.studyLevel || user.study_level || user.level}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Niveau d'études</h3>
                                            <span class="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">{user.studyLevel || user.study_level || user.level}</span>
                                        </div>
                                    {/if}

                                    {#if user.studyField || user.study_field || user.field}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Domaine d'études</h3>
                                            <p class="text-gray-900">{user.studyField || user.study_field || user.field}</p>
                                        </div>
                                    {/if}
                                </div>

                                <div class="space-y-6">
                                    {#if user.graduationYear || user.graduation_year}
                                        <div>
                                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Année de diplôme</h3>
                                            <p class="text-gray-900">{user.graduationYear || user.graduation_year}</p>
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            {#if user.interests && user.interests.length > 0}
                                <div class="mt-8">
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Centres d'intérêt</h3>
                                    <div class="flex flex-wrap gap-2">
                                        {#each user.interests as interest}
                                            <span class="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">{interest}</span>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        {/if}
                    {/if}

                    <!-- Onglet Compte -->
                    {#if activeTab === 'account'}
                        <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Paramètres du compte</h2>
                        
                        <div class="space-y-8">
                            <!-- Informations du compte -->
                            <div class="bg-gray-50 rounded-lg p-6">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Informations du compte</h3>
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500 mb-1">ID utilisateur</label>
                                        <p class="text-gray-900 font-mono">#{user.id}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500 mb-1">Rôle</label>
                                        <span class="inline-block {getRoleColor()} text-white px-3 py-1 rounded-full text-sm font-medium">
                                            {getUserRole()}
                                        </span>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500 mb-1">Membre depuis</label>
                                        <p class="text-gray-900">{formatDate(user.created_at || user.createdAt)}</p>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-500 mb-1">Dernière connexion</label>
                                        <p class="text-gray-900">{formatDate(user.last_login || user.lastLogin)}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Actions du compte -->
                            <div class="bg-gray-50 rounded-lg p-6">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions du compte</h3>
                                <div class="space-y-4">
                                    <button
                                        on:click={() => showPasswordModal = true}
                                        class="w-full md:w-auto bg-[#c174f2] text-white px-6 py-3 rounded-lg hover:bg-[#cb90f1] transition-colors duration-300 flex items-center justify-center gap-2"
                                    >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                        </svg>
                                        Changer le mot de passe
                                    </button>

                                    <button
                                        on:click={() => userStore.logout()}
                                        class="w-full md:w-auto bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-300 flex items-center justify-center gap-2"
                                    >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                        </svg>
                                        Se déconnecter
                                    </button>
                                </div>
                            </div>

                            <!-- Zone de danger -->
                            <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                                <h3 class="text-lg font-semibold text-red-900 mb-4">Zone de danger</h3>
                                <p class="text-red-700 text-sm mb-4">
                                    La suppression de votre compte est irréversible. Toutes vos données seront définitivement perdues.
                                </p>
                                <button
                                    class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center gap-2"
                                    on:click={() => {
                                        if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
                                            // Logique de suppression de compte
                                            console.log('Suppression du compte demandée');
                                        }
                                    }}
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    Supprimer mon compte
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </section>
    {/if}

    <!-- Modal changement de mot de passe -->
    {#if showPasswordModal}
        <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => showPasswordModal = false}></div>

                <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="w-full">
                                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Changer le mot de passe
                                </h3>

                                <div class="space-y-4">
                                    <div>
                                        <label for="currentPassword" class="block text-sm font-medium text-gray-700">Mot de passe actuel *</label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            bind:value={passwordData.currentPassword}
                                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2] {errors.currentPassword ? 'border-red-400' : ''}"
                                        />
                                        {#if errors.currentPassword}
                                            <p class="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                                        {/if}
                                    </div>

                                    <div>
                                        <label for="newPassword" class="block text-sm font-medium text-gray-700">Nouveau mot de passe *</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            bind:value={passwordData.newPassword}
                                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2] {errors.newPassword ? 'border-red-400' : ''}"
                                        />
                                        {#if errors.newPassword}
                                            <p class="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                                        {/if}
                                    </div>

                                    <div>
                                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe *</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            bind:value={passwordData.confirmPassword}
                                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#c174f2] focus:border-[#c174f2] {errors.confirmPassword ? 'border-red-400' : ''}"
                                        />
                                        {#if errors.confirmPassword}
                                            <p class="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                                        {/if}
                                    </div>

                                    {#if errors.passwordSubmit}
                                        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p class="text-red-600 text-sm">{errors.passwordSubmit}</p>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            on:click={changePassword}
                            disabled={isLoading}
                            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#c174f2] text-base font-medium text-white hover:bg-[#cb90f1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c174f2] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                            {#if isLoading}
                                <LoadingSpinner size="sm" color="#ffffff" />
                            {:else}
                                Changer
                            {/if}
                        </button>
                        <button
                            type="button"
                            on:click={() => {
                                showPasswordModal = false;
                                passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
                                errors = {};
                            }}
                            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <Footer />
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');

    .transform {
        transition: all 0.3s ease;
    }

    /* Animation pour les messages de succès */
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    /* Focus styles pour l'accessibilité */
    input:focus, select:focus, textarea:focus {
        outline: none;
    }

    /* Style pour les inputs avec erreur */
    .border-red-400:focus {
        border-color: #f87171;
        box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
    }

    /* Responsive pour mobile */
    @media (max-width: 640px) {
        .grid.md\\:grid-cols-2 {
            grid-template-columns: 1fr;
        }
        
        .grid.md\\:grid-cols-3 {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>