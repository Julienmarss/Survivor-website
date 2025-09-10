<script>
    import { onMount } from 'svelte';
    import X from 'lucide-svelte/icons/x';
    import Search from 'lucide-svelte/icons/search';
    import MessageCircle from 'lucide-svelte/icons/message-circle';
    import Users from 'lucide-svelte/icons/users';

    export let show = false;
    export let searchResults = [];
    export let userSearchQuery = '';
    export let isSearchingUsers = false;
    export let onClose = () => {};
    export let onStartDirectConversation = () => {};
    export let getUserDisplayName = () => 'Utilisateur';
    export let getUserAvatar = () => 'U';

    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    onMount(() => {
        if (show) {
            const searchInput = document.querySelector('#user-search-input');
            if (searchInput) searchInput.focus();
        }
    });

    $: if (show) {
        setTimeout(() => {
            const searchInput = document.querySelector('#user-search-input');
            if (searchInput) searchInput.focus();
        }, 100);
    }
</script>

{#if show}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50
                animate-in fade-in duration-300" 
         on:click={handleBackdropClick}>
        <div class="bg-white rounded-2xl p-8 max-w-lg w-[90%] max-h-[80vh] overflow-y-auto
                    shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300"
             on:click|stopPropagation>
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-gray-800" 
                     style="font-family: 'Montserrat', sans-serif; background: linear-gradient(135deg, #F18585, #CB90F1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    Démarrer une conversation
                </h3>
                <button 
                    class="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    on:click={onClose}
                >
                    <X size="24" class="text-gray-500" />
                </button>
            </div>

            <!-- Search Input -->
            <div class="relative mb-6">
                <Search class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size="20" />
                <input
                    id="user-search-input"
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    class="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl
                           outline-none text-sm bg-gray-50 transition-all duration-300
                           focus:bg-white focus:shadow-lg"
                    style="font-family: 'Open Sans', sans-serif;"
                    on:focus={(e) => {
                        e.target.style.borderColor = '#F18585';
                        e.target.style.boxShadow = '0 0 0 4px rgba(241, 133, 133, 0.1), 0 10px 25px rgba(241, 133, 133, 0.15)';
                    }}
                    on:blur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                    }}
                    bind:value={userSearchQuery}
                />
            </div>

            <!-- Results -->
            <div class="max-h-96 overflow-y-auto custom-scrollbar">
                {#if searchResults.length > 0}
                    {#each searchResults as user}
                        <div class="p-4 rounded-xl cursor-pointer transition-all duration-200
                                   border border-transparent hover:bg-gray-50 hover:border-gray-200
                                   flex items-center gap-4 mb-2"
                             on:click={() => {
                                 onStartDirectConversation(user.id);
                                 onClose();
                             }}>
                            <div class="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm
                                        shadow-lg flex-shrink-0"
                                 style="background: linear-gradient(135deg, #F18585, #F49C9C);">
                                {getUserAvatar(user)}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-gray-800 text-sm mb-1 truncate">
                                    {getUserDisplayName(user)}
                                </div>
                                {#if user.email && user.email !== getUserDisplayName(user)}
                                    <div class="text-gray-500 text-xs truncate">
                                        {user.email}
                                    </div>
                                {/if}
                            </div>
                            <MessageCircle size="18" class="text-gray-400 flex-shrink-0" />
                        </div>
                    {/each}
                {:else if userSearchQuery && !isSearchingUsers}
                    <div class="text-center py-12 text-gray-500">
                        <div class="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                            <Users size="24" class="text-gray-400" />
                        </div>
                        <h4 class="font-semibold text-gray-800 mb-2">Aucun utilisateur trouvé</h4>
                        <p class="text-sm">Essayez avec un autre terme de recherche</p>
                    </div>
                {:else if !userSearchQuery}
                    <div class="text-center py-12 text-gray-500">
                        <div class="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                            <Search size="24" class="text-gray-400" />
                        </div>
                        <p class="text-sm">Tapez pour rechercher des utilisateurs</p>
                    </div>
                {/if}

                {#if isSearchingUsers}
                    <div class="text-center py-8">
                        <div class="w-5 h-5 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-3"></div>
                        <p class="text-sm text-gray-500">Recherche en cours...</p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
    
    @keyframes animate-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    .animate-in {
        animation: animate-in var(--duration, 300ms) ease-out;
    }
    
    .fade-in {
        animation: fade-in var(--duration, 300ms) ease-out;
    }
    
    .zoom-in-95 {
        animation: zoom-in-95 var(--duration, 300ms) ease-out;
    }
    
    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    @keyframes zoom-in-95 {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
</style>
