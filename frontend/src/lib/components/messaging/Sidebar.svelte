<script>
    import Plus from 'lucide-svelte/icons/plus';
    import MessageCircle from 'lucide-svelte/icons/message-circle';
    import SearchBar from './SearchBar.svelte';
    import ConversationList from './ConversationList.svelte';

    export let conversations = [];
    export let searchResults = [];
    export let activeConversation = null;
    export let searchQuery = '';
    export let isSearchingUsers = false;
    export let loading = false;
    export let isConnected = false;
    export let onSelectConversation = () => {};
    export let onStartDirectConversation = () => {};
    export let onClearSearch = () => {};
    export let onOpenUserSearchModal = () => {};
    export let onOpenNewConversationModal = () => {};
    export let getConversationTitle = () => 'Conversation';
    export let getUserDisplayName = () => 'Utilisateur';
    export let getUserAvatar = () => 'U';
    export let formatTime = () => '';
</script>

<div class="h-full w-full flex flex-col relative overflow-hidden" 
     style="background: linear-gradient(145deg, #F18585 0%, #F6AEAE 50%, #EED5FB 100%);">
    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
    
    <!-- Header -->
    <div class="p-4 sm:p-5 md:p-6 bg-white/10 backdrop-blur-lg border-b border-white/15 relative z-10">
        <h2 class="text-white font-bold text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 md:mb-5 tracking-tight font-['Montserrat']">
            Messages
        </h2>
        <SearchBar 
            bind:searchQuery 
            onClear={onClearSearch}
            placeholder="Rechercher conversations..."
        />
    </div>

    <!-- Connection Status -->
    <div class="px-2 sm:px-3 py-1 sm:py-2 relative z-10">
        <div class="mx-2 sm:mx-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-sm text-center text-xs font-semibold
                    transition-all duration-300 border
                    {isConnected ? 'bg-green-500/20 text-green-100 border-green-500/30' : 'bg-red-500/20 text-red-100 border-red-500/30'}">
            <div class="flex items-center justify-center gap-2">
                <div class="w-2 h-2 rounded-full {isConnected ? 'bg-green-400' : 'bg-red-400'}"></div>
                <span class="hidden sm:inline">{isConnected ? 'Connecté' : 'Connexion...'}</span>
                <span class="sm:hidden">{isConnected ? 'En ligne' : 'Hors ligne'}</span>
            </div>
        </div>
    </div>

    <!-- Conversations List -->
    <ConversationList 
        {conversations}
        {searchResults}
        {activeConversation}
        {searchQuery}
        {isSearchingUsers}
        {loading}
        {onSelectConversation}
        {onStartDirectConversation}
        {getConversationTitle}
        {getUserDisplayName}
        {getUserAvatar}
        {formatTime}
    />

    <!-- Action Buttons -->
    <div class="p-3 sm:p-4 md:p-5 bg-white/10 backdrop-blur-lg border-t border-white/15 relative z-10">
        <button 
            class="w-full p-3 sm:p-4 bg-white/20 border-2 border-white/30 rounded-xl sm:rounded-2xl
                   text-white font-semibold text-xs sm:text-sm cursor-pointer
                   flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300
                   backdrop-blur-lg hover:bg-white/30 hover:border-white/40 
                   hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15 mb-2 sm:mb-3"
            on:click={onOpenUserSearchModal}
        >
            <MessageCircle size="16" class="sm:hidden" />
            <MessageCircle size="18" class="hidden sm:block" />
            <span class="hidden sm:inline">Chat rapide</span>
            <span class="sm:hidden">Chat</span>
        </button>
        
        <button 
            class="w-full p-3 sm:p-4 bg-white/20 border-2 border-white/30 rounded-xl sm:rounded-2xl
                   text-white font-semibold text-xs sm:text-sm cursor-pointer
                   flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300
                   backdrop-blur-lg hover:bg-white/30 hover:border-white/40 
                   hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15"
            on:click={onOpenNewConversationModal}
        >
            <Plus size="16" class="sm:hidden" />
            <Plus size="18" class="hidden sm:block" />
            <span class="hidden sm:inline">Nouvelle conversation</span>
            <span class="sm:hidden">Nouveau</span>
        </button>
    </div>
    
    <!-- Decorative border -->
    <div class="absolute top-0 right-0 w-px h-full bg-gradient-to-b
                from-transparent via-white/30 to-transparent z-20"></div>
</div>
