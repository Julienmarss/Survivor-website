<script>
    import X from 'lucide-svelte/icons/x';
    import Plus from 'lucide-svelte/icons/plus';

    export let show = false;
    export let allUsers = [];
    export let currentUser = null;
    export let newConversationName = '';
    export let newConversationType = 'direct';
    export let selectedParticipants = [];
    export let onClose = () => {};
    export let onCreateConversation = () => {};
    export let getUserDisplayName = () => 'Utilisateur';
    export let getUserAvatar = () => 'U';

    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    $: filteredUsers = allUsers.filter(u => u.id !== currentUser?.id);
</script>

{#if show}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50
                animate-in fade-in duration-300" 
         on:click={handleBackdropClick}>
        <div class="bg-white rounded-2xl p-8 max-w-xl w-[90%] max-h-[80vh] overflow-y-auto
                    shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300"
             on:click|stopPropagation>
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-gray-800" style="font-family: 'Montserrat', sans-serif;">
                    Nouvelle conversation
                </h3>
                <button 
                    class="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    on:click={onClose}
                >
                    <X size="24" class="text-gray-500" />
                </button>
            </div>

            <!-- Form -->
            <div class="space-y-6">
                <!-- Conversation Type -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        Type de conversation
                    </label>
                    <select 
                        bind:value={newConversationType} 
                        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                               outline-none text-sm bg-gray-50 transition-all duration-300
                               focus:bg-white focus:shadow-lg"
                        style="font-family: 'Open Sans', sans-serif;"
                        on:focus={(e) => {
                            e.target.style.borderColor = '#F18585';
                            e.target.style.boxShadow = '0 0 0 3px rgba(241, 133, 133, 0.1)';
                        }}
                        on:blur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <option value="direct">Conversation directe</option>
                        <option value="group">Groupe</option>
                    </select>
                </div>

                <!-- Group Name (only for groups) -->
                {#if newConversationType === 'group'}
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Nom du groupe
                        </label>
                        <input
                            type="text"
                            bind:value={newConversationName}
                            placeholder="Entrez le nom du groupe"
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                                   outline-none text-sm bg-gray-50 transition-all duration-300
                                   focus:bg-white focus:shadow-lg"
                            style="font-family: 'Open Sans', sans-serif;"
                            on:focus={(e) => {
                                e.target.style.borderColor = '#F18585';
                                e.target.style.boxShadow = '0 0 0 3px rgba(241, 133, 133, 0.1)';
                            }}
                            on:blur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                {/if}

                <!-- Participants -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        Participants
                        {#if selectedParticipants.length > 0}
                            <span class="text-pink-500 font-normal">
                                ({selectedParticipants.length} sélectionné{selectedParticipants.length > 1 ? 's' : ''})
                            </span>
                        {/if}
                    </label>
                    <div class="max-h-72 overflow-y-auto border-2 border-gray-200 rounded-lg bg-gray-50 custom-scrollbar">
                        {#each filteredUsers as user}
                            <label class="flex items-center gap-3 p-4 cursor-pointer transition-all duration-200
                                          hover:bg-white border-b border-gray-200 last:border-b-0
                                          {selectedParticipants.includes(user.id) ? 'bg-pink-50 border-pink-200' : ''}">
                                <input
                                    type="checkbox"
                                    class="w-4 h-4 text-pink-500 rounded focus:ring-pink-500 focus:ring-2"
                                    bind:group={selectedParticipants}
                                    value={user.id}
                                />
                                <div class="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm
                                            shadow-sm flex-shrink-0"
                                     style="background: linear-gradient(135deg, #F18585, #F49C9C);">
                                    {getUserAvatar(user)}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-semibold text-gray-800 text-sm truncate">
                                        {getUserDisplayName(user)}
                                    </div>
                                    {#if user.email && user.email !== getUserDisplayName(user)}
                                        <div class="text-gray-500 text-xs truncate">
                                            {user.email}
                                        </div>
                                    {/if}
                                </div>
                            </label>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button 
                    class="px-6 py-3 text-sm font-semibold text-gray-600 bg-gray-50 
                           rounded-xl border-2 border-gray-200 hover:bg-white hover:border-gray-300
                           transition-all duration-200"
                    on:click={onClose}
                >
                    Annuler
                </button>
                <button 
                    class="px-6 py-3 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl
                           hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style="background: linear-gradient(135deg, #F18585, #F49C9C); box-shadow: 0 4px 12px rgba(241, 133, 133, 0.3); font-family: 'Montserrat', sans-serif;"
                    on:click={onCreateConversation}
                    disabled={selectedParticipants.length === 0}
                >
                    <Plus size="18" />
                    Créer la conversation
                </button>
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
