<script>
    import { onMount } from 'svelte';
    import { userStore } from '../../lib/stores/userStore.js';
    import { goto } from '$app/navigation';
    import Header from '../../lib/components/Header.svelte';
    import Footer from '../../lib/components/Footer.svelte';

    let user = null;
    let visible = false;

    userStore.subscribe(value => {
        user = value;
    });

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

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
    <meta name="description" content="Consultez votre profil JEB Incubator">
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
        <!-- En-tête du profil -->
        <section class="pt-24 pb-8 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-1000 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
                    <!-- Banner -->
                    <div class="h-32 bg-gradient-to-r from-[#c174f2] via-[#cb90f1] to-[#f18585] relative">
                        <!-- Avatar -->
                        <div class="absolute -bottom-16 left-8">
                            <div class="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
                                {#if user.avatar}
                                    <img src={user.avatar} alt="Avatar" class="w-full h-full rounded-full object-cover">
                                {:else}
                                    <div class="w-full h-full rounded-full bg-gradient-to-r from-[#c174f2] to-[#f18585] flex items-center justify-center text-white text-3xl font-bold">
                                        {getUserInitials()}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <div class="pt-20 pb-6 px-8">
                        <div class="mb-6">
                            <h1 class="text-3xl font-bold text-gray-900 mb-2 font-['Montserrat']">
                                {getDisplayName()}
                            </h1>
                            <div class="flex items-center space-x-4 text-gray-600">
                                <span class="px-3 py-1 bg-[#c174f2] text-white rounded-full text-sm font-medium">
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
                            {#if user.bio || user.motivation}
                                <p class="text-gray-600 mt-3 max-w-2xl">{user.bio || user.motivation}</p>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="pb-20 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-2xl shadow-lg p-8">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6 font-['Montserrat']">Informations personnelles</h2>

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

                            {#if user.role === 'startup' && (user.companyName || user.company_name)}
                                <div>
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Entreprise</h3>
                                    <div class="flex items-center">
                                        <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                        </svg>
                                        <span class="text-gray-900">{user.companyName || user.company_name}</span>
                                    </div>
                                </div>
                            {/if}

                            {#if user.role === 'student' && (user.school || user.schoolName)}
                                <div>
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">École</h3>
                                    <div class="flex items-center">
                                        <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                                        </svg>
                                        <span class="text-gray-900">{user.school || user.schoolName}</span>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    {/if}

    <Footer />
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');

    .transform {
        transition: all 0.3s ease;
    }

    @media (max-width: 640px) {
    }
</style>