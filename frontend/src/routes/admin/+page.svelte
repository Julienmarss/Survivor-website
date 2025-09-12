<script>
    import { onMount } from 'svelte';
    import { userStore } from '$lib/stores/userStore.js';
    import { goto } from '$app/navigation';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import AdminOverview from './components/AdminOverview.svelte';
    import AdminUsers from './components/AdminUsers.svelte';
    import AdminStartups from './components/AdminStartups.svelte';
    /* import AdminEvents from './components/AdminEvents.svelte';
    import AdminNews from './components/AdminNews.svelte';
    import AdminAnalytics from './components/AdminAnalytics.svelte';
    import AdminSettings from './components/AdminSettings.svelte'; */

    let user = null;
    let activeSection = 'overview';
    let showSuccessToast = false;
    let successMessage = '';

    userStore.subscribe(value => {
        user = value;
        if (user && !isAdmin(user)) {
            goto('/');
        }
    });

    function isAdmin(user) {
        return user?.role === 'admin' || user?.isAdmin === true;
    }

    const sidebarItems = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '📊', component: AdminOverview },
        { id: 'users', label: 'Utilisateurs', icon: '👥', component: AdminUsers },
        { id: 'startups', label: 'Startups', icon: '🏢', component: AdminStartups },
        /* { id: 'events', label: 'Événements', icon: '📅', component: AdminEvents },
        { id: 'news', label: 'Actualités', icon: '📰', component: AdminNews },
        { id: 'analytics', label: 'Analytics', icon: '📈', component: AdminAnalytics },
        { id: 'settings', label: 'Paramètres', icon: '⚙️', component: AdminSettings } */
    ];

    function handleSuccess(event) {
        successMessage = event.detail.message;
        showSuccessToast = true;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            showSuccessToast = false;
        }, 3000);
    }

    function getUserInitials(user) {
        if (!user) return 'A';
        const name = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.name || user.email;
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    function getCurrentComponent() {
        const item = sidebarItems.find(item => item.id === activeSection);
        return item ? item.component : AdminOverview;
    }

    onMount(async () => {
        await userStore.init();
        
        // Forcer la récupération du token
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        console.log('🔍 Admin page - Token check:', { 
            hasToken: !!token, 
            hasUserData: !!userData,
            userFromStore: !!user 
        });
        
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                parsedUser.token = token; // S'assurer que le token est attaché
                user = parsedUser;
                console.log('✅ User loaded with token:', { email: user.email, role: user.role, hasToken: !!user.token });
            } catch (error) {
                console.error('❌ Error parsing user data:', error);
                goto('/');
                return;
            }
        }

        if (!user || !isAdmin(user)) {
            console.warn('❌ Access denied:', { user: !!user, isAdmin: user ? isAdmin(user) : false });
            goto('/');
            return;
        }
    });
</script>

<svelte:head>
    <title>Administration - JEB Incubator</title>
    <meta name="description" content="Interface d'administration JEB Incubator">
</svelte:head>

<div class="min-h-screen bg-gray-50">
    <Header />

    {#if !user || !isAdmin(user)}
        <div class="pt-24 px-6 sm:px-8 lg:px-12">
            <div class="max-w-4xl mx-auto text-center py-16">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Accès Refusé</h1>
                <p class="text-gray-600 mb-8">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                <button
                    on:click={() => goto('/')}
                    class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                    Retour à l'accueil
                </button>
            </div>
        </div>
    {:else}
        <div class="flex pt-20">
            <!-- Sidebar -->
            <div class="fixed left-0 top-20 bottom-0 w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold">🛠️</span>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900 font-['Montserrat']">JEB Admin</h1>
                            <p class="text-sm text-gray-500">Interface d'administration</p>
                        </div>
                    </div>
                </div>
                
                <nav class="p-4">
                    <ul class="space-y-2">
                        {#each sidebarItems as item}
                            <li>
                                <button
                                    on:click={() => activeSection = item.id}
                                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-medium {
                                        activeSection === item.id 
                                            ? 'bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white shadow-lg' 
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }"
                                >
                                    <span class="text-lg">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                </nav>

                <!-- User Info -->
                <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {getUserInitials(user)}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">
                                {user.firstName || user.first_name || user.name || 'Admin'}
                            </p>
                            <p class="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 ml-64">
                <div class="p-8">
                    <svelte:component 
                        this={getCurrentComponent()} 
                        {user} 
                        on:success={handleSuccess}
                    />
                </div>
            </div>
        </div>
    {/if}

    <!-- Success Toast -->
    {#if showSuccessToast}
        <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 {showSuccessToast ? 'translate-y-0 opacity-100' : 'translate-y-[-100%] opacity-0'}">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {successMessage}
            </div>
        </div>
    {/if}

    <Footer />
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');

    /* Scrollbar pour la sidebar */
    .overflow-y-auto::-webkit-scrollbar {
        width: 4px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #c174f2;
        border-radius: 2px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: #cb90f1;
    }
</style>