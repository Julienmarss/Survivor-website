<script>
    import Hash from 'lucide-svelte/icons/hash';
    import User from 'lucide-svelte/icons/user';
    import MessageCircle from 'lucide-svelte/icons/message-circle';

    export let conversations = [];
    export let searchResults = [];
    export let activeConversation = null;
    export let searchQuery = '';
    export let isSearchingUsers = false;
    export let loading = false;
    export let onSelectConversation = () => {};
    export let onStartDirectConversation = () => {};
    export let getConversationTitle = () => 'Conversation';
    export let getUserDisplayName = () => 'Utilisateur';
    export let getUserAvatar = () => 'U';
    export let formatTime = () => '';

    $: filteredConversations = conversations.filter(conv => {
        if (searchResults.length > 0) return false;
        const title = getConversationTitle(conv);
        return title.toLowerCase().includes(searchQuery.toLowerCase());
    }).sort((a, b) => {
        const aTime = a.lastMessageAt || a.createdAt;
        const bTime = b.lastMessageAt || b.createdAt;
        return new Date(bTime) - new Date(aTime);
    });
</script>

<div class="flex-1 overflow-y-auto custom-scrollbar">
    {#if loading}
        <div class="flex items-center justify-center p-6 text-white/70 text-sm">
            <div class="flex items-center gap-3">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Chargement...
            </div>
        </div>
    {:else}
        <!-- Search Results -->
        {#if searchResults.length > 0}
            <div class="px-5 py-3 text-white/90 text-xs font-semibold uppercase tracking-wide
                        bg-white/10 mx-3 rounded-xl mb-3 backdrop-blur-sm">
                Utilisateurs ({searchResults.length})
            </div>
            {#each searchResults as user}
                <div class="px-5 py-4 mx-3 mb-2 rounded-2xl cursor-pointer
                            bg-white/15 backdrop-blur-sm border border-white/20
                            hover:bg-white/25 hover:translate-x-1.5 hover:shadow-lg
                            transition-all duration-300 flex items-center gap-4"
                     on:click={() => onStartDirectConversation(user.id)}>
                    <div class="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm
                                flex items-center justify-center text-white font-semibold text-lg
                                shadow-sm">
                        {getUserAvatar(user)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-white font-semibold text-sm mb-1 truncate">
                            {getUserDisplayName(user)}
                        </h4>
                        {#if user.email && user.email !== getUserDisplayName(user)}
                            <p class="text-white/70 text-xs truncate">
                                {user.email}
                            </p>
                        {/if}
                    </div>
                    <MessageCircle size="16" class="text-white/60" />
                </div>
            {/each}
        {:else if searchQuery && !isSearchingUsers}
            <div class="p-6 text-center text-white/70">
                <div class="w-8 h-8 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center">
                    <User size="20" />
                </div>
                <p class="text-sm">Aucun utilisateur trouvé</p>
            </div>
        {/if}

        <!-- Conversations List -->
        {#if filteredConversations.length === 0 && !searchQuery}
            <div class="p-6 text-center text-white/70">
                <div class="w-8 h-8 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center">
                    <MessageCircle size="20" />
                </div>
                <p class="text-sm font-medium">Aucune conversation</p>
                <p class="text-xs mt-2 opacity-80">Commencez une nouvelle conversation</p>
            </div>
        {:else if filteredConversations.length > 0}
            {#if searchResults.length > 0}
                <div class="px-5 py-3 text-white/90 text-xs font-semibold uppercase tracking-wide
                            bg-white/10 mx-3 rounded-xl mb-3 backdrop-blur-sm">
                    Conversations
                </div>
            {/if}
            {#each filteredConversations as conversation}
                <div class="px-5 py-4 mx-3 mb-2 rounded-2xl cursor-pointer
                            bg-white/15 backdrop-blur-sm border border-white/20
                            hover:bg-white/25 hover:translate-x-1.5 hover:shadow-lg
                            transition-all duration-300 flex items-center gap-4
                            {activeConversation?.id === conversation.id ? 'bg-white/30 border-white/40 shadow-lg' : ''}"
                     on:click={() => onSelectConversation(conversation)}>
                    <div class="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm
                                flex items-center justify-center text-white shadow-sm">
                        {#if conversation.type === 'group'}
                            <Hash size="22" />
                        {:else}
                            <User size="22" />
                        {/if}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center mb-1.5">
                            <h4 class="text-white font-semibold text-sm truncate">
                                {getConversationTitle(conversation)}
                            </h4>
                            {#if conversation.unreadCount > 0}
                                <span class="text-white rounded-xl px-2 py-1 text-xs font-semibold min-w-[20px] text-center
                                             shadow-lg"
                                      style="background: linear-gradient(135deg, #F18585, #F49C9C); box-shadow: 0 2px 8px rgba(241, 133, 133, 0.3);">
                                    {conversation.unreadCount}
                                </span>
                            {/if}
                        </div>
                        {#if conversation.lastMessage}
                            <p class="text-white/80 text-sm mb-1 truncate">
                                <strong>{conversation.lastMessage.senderName}:</strong> {conversation.lastMessage.content}
                            </p>
                            <p class="text-white/60 text-xs">
                                {formatTime(conversation.lastMessage.createdAt || conversation.lastMessageAt)}
                            </p>
                        {:else}
                            <p class="text-white/60 text-sm">
                                Nouvelle conversation
                            </p>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}

        {#if isSearchingUsers}
            <div class="flex items-center justify-center p-5 text-white/70 text-sm">
                <div class="flex items-center gap-3">
                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Recherche...
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.4);
    }
</style>
