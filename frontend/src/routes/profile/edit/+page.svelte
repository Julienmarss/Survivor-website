<!-- frontend/src/routes/profile/edit/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { userStore } from '$lib/stores/userStore.js';
    import Header from '../../../lib/components/Header.svelte';
    import Footer from '../../../lib/components/Footer.svelte';
    import LoadingSpinner from '../../../lib/components/LoadingSpinner.svelte';
    import ErrorMessage from '../../../lib/components/ErrorMessage.svelte';

    // États
    let user = null;
    let loading = false;
    let error = null;
    let isSubmitting = false;
    let showDeleteModal = false;
    let activeTab = 'profile';

    // Données du formulaire
    let formData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        bio: '',
        linkedin: '',
        website: '',
        address: '',
        // Champs spécifiques selon le rôle
        school: '', // étudiant
        level: '', // étudiant
        field: '', // étudiant
        investorType: '', // investisseur
        experience: '', // investisseur
        preferredSectors: [], // investisseur
        sector: '', // startup
        maturity: '' // startup
    };

    // Données pour le changement de mot de passe
    let passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    // Configuration API
    const API_BASE = `${import.meta.env.PUBLIC_APIURL || 'http://localhost:3000'}/api`;

    // Options pour les selects
    const schools = [
        'EPITECH', 'École 42', 'Université Paris-Saclay', 'HEC Paris', 'ESSEC',
        'EDHEC', 'Centrale Paris', 'Polytechnique', 'Sciences Po', 'ESGI',
        'Supinfo', 'INSA', 'UTC', 'Autre'
    ];

    const levels = [
        'Bac +1', 'Bac +2', 'Bac +3 (Licence)', 'Bac +4', 'Bac +5 (Master)', 'Doctorat'
    ];

    const fields = [
        'Informatique', 'Ingénierie', 'Business/Management', 'Design', 'Marketing',
        'Finance', 'Droit', 'Sciences', 'Arts', 'Autre'
    ];

    const investorTypes = [
        'Business Angel', 'Fonds d\'investissement', 'Corporate Venture', 'Family Office',
        'Fonds de pension', 'Investisseur institutionnel', 'Crowdfunding platform', 'Autre'
    ];

    const experiences = [
        'Moins d\'1 an', '1-3 ans', '3-5 ans', '5-10 ans', '10-15 ans', 'Plus de 15 ans'
    ];

    const sectors = [
        'FinTech', 'HealthTech', 'EdTech', 'GreenTech', 'AgriTech', 'PropTech',
        'FoodTech', 'RetailTech', 'Mobility', 'Cybersécurité', 'Intelligence Artificielle',
        'Blockchain', 'IoT', 'Robotique', 'Gaming', 'Media & Entertainment',
        'E-commerce', 'SaaS', 'DeepTech', 'Autre'
    ];

    const maturities = [
        'Idéation', 'Prototype', 'MVP', 'Validation', 'Traction', 'Croissance', 'Scale-up'
    ];

    // S'abonner au store utilisateur
    userStore.subscribe(value => {
        user = value;
        if (user) {
            loadUserProfile();
        }
    });

    function loadUserProfile() {
        if (!user) return;

        formData = {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            company: user.company || '',
            position: user.position || '',
            bio: user.bio || '',
            linkedin: user.linkedin || '',
            website: user.website || '',
            address: user.address || '',
            // Champs spécifiques
            school: user.school || '',
            level: user.level || '',
            field: user.field || '',
            investorType: user.investorType || '',
            experience: user.experience || '',
            preferredSectors: user.preferredSectors || [],
            sector: user.sector || '',
            maturity: user.maturity || ''
        };
    }

    async function apiCall(endpoint, options = {}) {
        const token = userStore.getToken();
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || `Erreur ${response.status}`;
            } catch {
                errorMessage = `Erreur ${response.status}: ${errorText}`;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    async function updateProfile() {
        try {
            isSubmitting = true;
            error = null;

            // Validation
            if (!formData.firstName.trim() || !formData.lastName.trim()) {
                throw new Error('Le prénom et le nom sont obligatoires');
            }

            if (!formData.email.trim()) {
                throw new Error('L\'email est obligatoire');
            }

            // Préparer les données selon le rôle
            let updateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phone: formData.phone?.trim() || '',
                company: formData.company?.trim() || '',
                position: formData.position?.trim() || '',
                bio: formData.bio?.trim() || '',
                linkedin: formData.linkedin?.trim() || '',
                website: formData.website?.trim() || '',
                address: formData.address?.trim() || ''
            };

            // Ajouter les champs spécifiques selon le rôle
            if (user.role === 'student') {
                updateData = {
                    ...updateData,
                    school: formData.school,
                    level: formData.level,
                    field: formData.field
                };
            } else if (user.role === 'investor') {
                updateData = {
                    ...updateData,
                    investorType: formData.investorType,
                    experience: formData.experience,
                    preferredSectors: formData.preferredSectors
                };
            } else if (user.role === 'startup') {
                updateData = {
                    ...updateData,
                    sector: formData.sector,
                    maturity: formData.maturity
                };
            }

            const data = await apiCall('/auth/me', {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            if (data.success) {
                // Mettre à jour le store utilisateur
                await userStore.refreshUser();
                showSuccessMessage('Profil mis à jour avec succès');
            }
        } catch (err) {
            console.error('Erreur mise à jour profil:', err);
            error = err.message;
        } finally {
            isSubmitting = false;
        }
    }

    async function changePassword() {
        try {
            isSubmitting = true;
            error = null;

            // Validation
            if (!passwordData.currentPassword) {
                throw new Error('Le mot de passe actuel est obligatoire');
            }

            if (!passwordData.newPassword) {
                throw new Error('Le nouveau mot de passe est obligatoire');
            }

            if (passwordData.newPassword.length < 6) {
                throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
            }

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                throw new Error('Les mots de passe ne correspondent pas');
            }

            const data = await apiCall('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (data.success) {
                showSuccessMessage('Mot de passe modifié avec succès');
                // Réinitialiser le formulaire
                passwordData = {
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                };
            }
        } catch (err) {
            console.error('Erreur changement mot de passe:', err);
            error = err.message;
        } finally {
            isSubmitting = false;
        }
    }

    async function deleteAccount() {
        try {
            isSubmitting = true;
            error = null;

            const data = await apiCall('/auth/me', {
                method: 'DELETE'
            });

            if (data.success) {
                showSuccessMessage('Compte supprimé avec succès');
                // Déconnecter l'utilisateur et rediriger
                await userStore.logout();
                setTimeout(() => {
                    goto('/');
                }, 2000);
            }
        } catch (err) {
            console.error('Erreur suppression compte:', err);
            error = err.message;
        } finally {
            isSubmitting = false;
            showDeleteModal = false;
        }
    }

    function showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }

    function handleSectorChange(sector) {
        if (formData.preferredSectors.includes(sector)) {
            formData.preferredSectors = formData.preferredSectors.filter(s => s !== sector);
        } else if (formData.preferredSectors.length < 8) {
            formData.preferredSectors = [...formData.preferredSectors, sector];
        }
    }

    function getRoleLabel(role) {
        const roles = {
            admin: 'Administrateur',
            startup: 'Startup',
            investor: 'Investisseur',
            student: 'Étudiant'
        };
        return roles[role] || role;
    }

    onMount(async () => {
        await userStore.init();
        
        if (!user) {
            goto('/login');
            return;
        }
    });
</script>

<svelte:head>
    <title>Modifier mon profil - JEB Incubator</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
    <Header />

    <!-- Vérification de la connexion -->
    {#if !user}
        <div class="pt-24 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto text-center py-16">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Connexion requise</h1>
                <p class="text-gray-600 mb-8">Vous devez être connecté pour modifier votre profil.</p>
                <button
                        on:click={() => goto('/login')}
                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                    Se connecter
                </button>
            </div>
        </div>
    {:else}
        <!-- Affichage des erreurs -->
        {#if error}
            <ErrorMessage message={error} onRetry={() => error = null} />
        {/if}

        <!-- En-tête -->
        <section class="pt-24 pb-8 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto">
                <button
                        on:click={() => goto('/dashboard')}
                        class="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-300 mb-6">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Retour au dashboard
                </button>

                <div class="flex items-center space-x-6 mb-8">
                    <div class="w-16 h-16 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-2xl">
                            {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 class="text-4xl font-bold text-gray-900 font-['Montserrat']">
                            Mon profil
                        </h1>
                        <p class="text-xl text-gray-600 font-['Open_Sans']">
                            {getRoleLabel(user.role)} • {user.email}
                        </p>
                    </div>
                </div>

                <!-- Navigation par onglets -->
                <div class="border-b border-gray-200 mb-8">
                    <nav class="-mb-px flex space-x-8">
                        <button
                                on:click={() => activeTab = 'profile'}
                                class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                                activeTab === 'profile'
                                  ? 'border-[#c174f2] text-[#c174f2]'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }">
                            Informations personnelles
                        </button>
                        <button
                                on:click={() => activeTab = 'security'}
                                class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                                activeTab === 'security'
                                  ? 'border-[#c174f2] text-[#c174f2]'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }">
                            Sécurité
                        </button>
                        <button
                                on:click={() => activeTab = 'danger'}
                                class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-300 {
                                activeTab === 'danger'
                                  ? 'border-red-500 text-red-500'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }">
                            Zone de danger
                        </button>
                    </nav>
                </div>
            </div>
        </section>

        <!-- Contenu des onglets -->
        <section class="pb-20 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto">
                
                <!-- Onglet Profil -->
                {#if activeTab === 'profile'}
                    <form on:submit|preventDefault={updateProfile} class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div class="space-y-8">
                            <!-- Informations de base -->
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Informations personnelles</h2>
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                                        <input
                                                type="text"
                                                id="firstName"
                                                bind:value={formData.firstName}
                                                required
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        />
                                    </div>

                                    <div>
                                        <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                                        <input
                                                type="text"
                                                id="lastName"
                                                bind:value={formData.lastName}
                                                required
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        />
                                    </div>

                                    <div>
                                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                        <input
                                                type="email"
                                                id="email"
                                                bind:value={formData.email}
                                                required
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        />
                                    </div>

                                    <div>
                                        <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                        <input
                                                type="tel"
                                                id="phone"
                                                bind:value={formData.phone}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        />
                                    </div>
                                </div>

                                <div class="mt-6">
                                    <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">Biographie</label>
                                    <textarea
                                            id="bio"
                                            bind:value={formData.bio}
                                            rows="4"
                                            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            placeholder="Présentez-vous en quelques mots..."
                                    ></textarea>
                                </div>
                            </div>

                            <!-- Informations professionnelles -->
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Informations professionnelles</h2>
                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label for="company" class="block text-sm font-medium text-gray-700 mb-2">Entreprise</label>
                                        <input
                                                type="text"
                                                id="company"
                                                bind:value={formData.company}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        />
                                    </div>

                                    <div>
                                        <label for="position" class="block text-sm font-medium text-gray-700 mb-2">Poste</label>
                                        <input
                                                type="text"
                                                id="position"
                                                bind:value={formData.position}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                        />
                                    </div>

                                    <div>
                                        <label for="linkedin" class="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                                        <input
                                                type="url"
                                                id="linkedin"
                                                bind:value={formData.linkedin}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                                placeholder="https://linkedin.com/in/votre-profil"
                                        />
                                    </div>

                                    <div>
                                        <label for="website" class="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                                        <input
                                                type="url"
                                                id="website"
                                                bind:value={formData.website}
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                                placeholder="https://votre-site.com"
                                        />
                                    </div>
                                </div>

                                <div class="mt-6">
                                    <label for="address" class="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                                    <input
                                            type="text"
                                            id="address"
                                            bind:value={formData.address}
                                            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                    />
                                </div>
                            </div>

                            <!-- Champs spécifiques selon le rôle -->
                            {#if user.role === 'student'}
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Informations académiques</h2>
                                    <div class="grid md:grid-cols-3 gap-6">
                                        <div>
                                            <label for="school" class="block text-sm font-medium text-gray-700 mb-2">École</label>
                                            <select
                                                    id="school"
                                                    bind:value={formData.school}
                                                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            >
                                                <option value="">Sélectionner</option>
                                                {#each schools as school}
                                                    <option value={school}>{school}</option>
                                                {/each}
                                            </select>
                                        </div>

                                        <div>
                                            <label for="level" class="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                                            <select
                                                    id="level"
                                                    bind:value={formData.level}
                                                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            >
                                                <option value="">Sélectionner</option>
                                                {#each levels as level}
                                                    <option value={level}>{level}</option>
                                                {/each}
                                            </select>
                                        </div>

                                        <div>
                                            <label for="field" class="block text-sm font-medium text-gray-700 mb-2">Domaine</label>
                                            <select
                                                    id="field"
                                                    bind:value={formData.field}
                                                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            >
                                                <option value="">Sélectionner</option>
                                                {#each fields as field}
                                                    <option value={field}>{field}</option>
                                                {/each}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            {/if}

                            {#if user.role === 'investor'}
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Profil investisseur</h2>
                                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label for="investorType" class="block text-sm font-medium text-gray-700 mb-2">Type d'investisseur</label>
                                            <select
                                                    id="investorType"
                                                    bind:value={formData.investorType}
                                                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            >
                                                <option value="">Sélectionner</option>
                                                {#each investorTypes as type}
                                                    <option value={type}>{type}</option>
                                                {/each}
                                            </select>
                                        </div>

                                        <div>
                                            <label for="experience" class="block text-sm font-medium text-gray-700 mb-2">Expérience</label>
                                            <select
                                                    id="experience"
                                                    bind:value={formData.experience}
                                                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            >
                                                <option value="">Sélectionner</option>
                                                {#each experiences as exp}
                                                    <option value={exp}>{exp}</option>
                                                {/each}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-4">Secteurs d'intérêt (max 8)</label>
                                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {#each sectors as sector}
                                                <label class="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                                                    <input
                                                            type="checkbox"
                                                            checked={formData.preferredSectors.includes(sector)}
                                                            on:change={() => handleSectorChange(sector)}
                                                            disabled={formData.preferredSectors.length >= 8 && !formData.preferredSectors.includes(sector)}
                                                            class="w-4 h-4 text-[#c174f2] border-gray-300 rounded focus:ring-[#c174f2]"
                                                    />
                                                    <span class="text-sm text-gray-700">{sector}</span>
                                                </label>
                                            {/each}
                                        </div>
                                        <p class="text-xs text-gray-500 mt-2">
                                            {formData.preferredSectors.length}/8 sélectionnés
                                        </p>
                                    </div>
                                </div>
                            {/if}

                            {#if user.role === 'startup'}
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Profil startup</h2>
                                    <div class="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label for="sector" class="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
                                            <select
                                                    id="sector"
                                                    bind:value={formData.sector}
                                                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            >
                                                <option value="">Sélectionner</option>
                                                {#each sectors as sector}
                                                    <option value={sector}>{sector}</option>
                                                {/each}
                                            </select>
                                        </div>

                                        <div>
                                            <label for="maturity" class="block text-sm font-medium text-gray-700 mb-2">Maturité</label>
                                            <select
                                                    id="maturity"
                                                    bind:value={formData.maturity}
                                                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            >
                                                <option value="">Sélectionner</option>
                                                {#each maturities as maturity}
                                                    <option value={maturity}>{maturity}</option>
                                                {/each}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            {/if}

                            <!-- Boutons d'action -->
                            <div class="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                                <button
                                        type="button"
                                        on:click={() => goto('/dashboard')}
                                        class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                                >
                                    Annuler
                                </button>

                                <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {#if isSubmitting}
                                        <LoadingSpinner size="sm" color="#ffffff" />
                                        <span>Mise à jour...</span>
                                    {:else}
                                        <span>Enregistrer les modifications</span>
                                    {/if}
                                </button>
                            </div>
                        </div>
                    </form>
                {/if}

                <!-- Onglet Sécurité -->
                {#if activeTab === 'security'}
                    <form on:submit|preventDefault={changePassword} class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div class="space-y-6">
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Changer le mot de passe</h2>
                                <p class="text-gray-600 mb-6 font-['Open_Sans']">
                                    Pour votre sécurité, utilisez un mot de passe fort avec au moins 6 caractères.
                                </p>
                            </div>

                            <div class="space-y-6">
                                <div>
                                    <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel *</label>
                                    <input
                                            type="password"
                                            id="currentPassword"
                                            bind:value={passwordData.currentPassword}
                                            required
                                            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                            placeholder="Entrez votre mot de passe actuel"
                                    />
                                </div>

                                <div class="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe *</label>
                                        <input
                                                type="password"
                                                id="newPassword"
                                                bind:value={passwordData.newPassword}
                                                required
                                                minlength="6"
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                                placeholder="Nouveau mot de passe"
                                        />
                                    </div>

                                    <div>
                                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe *</label>
                                        <input
                                                type="password"
                                                id="confirmPassword"
                                                bind:value={passwordData.confirmPassword}
                                                required
                                                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#c174f2] focus:ring-2 focus:ring-[#c174f2]/20 transition-colors duration-300"
                                                placeholder="Confirmez le nouveau mot de passe"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                        type="button"
                                        on:click={() => {
                                            passwordData = {
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: ''
                                            };
                                        }}
                                        class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                                >
                                    Réinitialiser
                                </button>

                                <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {#if isSubmitting}
                                        <LoadingSpinner size="sm" color="#ffffff" />
                                        <span>Modification...</span>
                                    {:else}
                                        <span>Modifier le mot de passe</span>
                                    {/if}
                                </button>
                            </div>
                        </div>
                    </form>
                {/if}

                <!-- Onglet Zone de danger -->
                {#if activeTab === 'danger'}
                    <div class="bg-white rounded-2xl shadow-lg p-8 border border-red-200">
                        <div class="space-y-6">
                            <div>
                                <h2 class="text-2xl font-bold text-red-600 mb-4 font-['Montserrat']">Zone de danger</h2>
                                <p class="text-gray-600 mb-6 font-['Open_Sans']">
                                    Les actions ci-dessous sont irréversibles. Procédez avec précaution.
                                </p>
                            </div>

                            <!-- Suppression du compte -->
                            <div class="border border-red-200 rounded-lg p-6 bg-red-50">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <h3 class="text-lg font-semibold text-red-800 mb-2 font-['Montserrat']">
                                            Supprimer mon compte
                                        </h3>
                                        <p class="text-red-600 text-sm font-['Open_Sans']">
                                            Cette action supprimera définitivement votre compte et toutes les données associées. 
                                            Cette action ne peut pas être annulée.
                                        </p>
                                        <ul class="mt-3 text-sm text-red-600 space-y-1">
                                            <li>• Toutes vos données personnelles seront supprimées</li>
                                            <li>• Votre historique et vos interactions seront perdus</li>
                                            <li>• Vous ne pourrez plus accéder à votre compte</li>
                                        </ul>
                                    </div>
                                    <button
                                            on:click={() => showDeleteModal = true}
                                            class="ml-6 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-300 flex items-center space-x-2"
                                    >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                        <span>Supprimer mon compte</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </section>
    {/if}

    <!-- Modal de suppression de compte -->
    {#if showDeleteModal}
        <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => showDeleteModal = false}></div>

                <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                            </div>
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">
                                    Supprimer votre compte
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500">
                                        Êtes-vous absolument sûr de vouloir supprimer votre compte ? 
                                        Cette action est <strong>irréversible</strong> et toutes vos données seront définitivement perdues.
                                    </p>
                                    <div class="mt-4 p-3 bg-red-50 rounded border border-red-200">
                                        <p class="text-sm text-red-700 font-medium">
                                            Tapez "SUPPRIMER" ci-dessous pour confirmer :
                                        </p>
                                        <input
                                                type="text"
                                                placeholder="SUPPRIMER"
                                                bind:value={confirmDeleteText}
                                                class="mt-2 w-full px-3 py-2 border border-red-300 rounded text-sm focus:border-red-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                                type="button"
                                on:click={deleteAccount}
                                disabled={isSubmitting || confirmDeleteText !== 'SUPPRIMER'}
                                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {#if isSubmitting}
                                <LoadingSpinner size="sm" color="#ffffff" />
                            {:else}
                                Supprimer définitivement
                            {/if}
                        </button>
                        <button
                                type="button"
                                on:click={() => {
                                    showDeleteModal = false;
                                    confirmDeleteText = '';
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
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>

<script>
    let confirmDeleteText = '';
</script>