<script>
    import Phone from 'lucide-svelte/icons/phone';
    import Video from 'lucide-svelte/icons/video';
    import Settings from 'lucide-svelte/icons/settings';
    import Hash from 'lucide-svelte/icons/hash';
    import User from 'lucide-svelte/icons/user';

    export let activeConversation;
    export let getConversationTitle = () => 'Conversation';
    export let isConnected = false;
</script>

<div class="text-white p-3 sm:p-4 md:p-5 flex items-center justify-between rounded-t-2xl"
     style="background: linear-gradient(135deg, #CB90F1 0%, #D5A8F2 100%);">
    <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div class="w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-white/20 backdrop-blur-sm 
                    flex items-center justify-center shadow-lg flex-shrink-0">
            {#if activeConversation?.type === 'group'}
                <Hash size="20" class="sm:hidden" />
                <Hash size="22" class="hidden sm:block md:hidden" />
                <Hash size="26" class="hidden md:block" />
            {:else}
                <User size="20" class="sm:hidden" />
                <User size="22" class="hidden sm:block md:hidden" />
                <User size="26" class="hidden md:block" />
            {/if}
        </div>
        <div class="min-w-0 flex-1">
            <h3 class="text-base sm:text-lg md:text-xl font-bold mb-0.5 sm:mb-1 font-['Montserrat'] truncate">
                {getConversationTitle(activeConversation)}
            </h3>
            <p class="text-xs sm:text-sm opacity-90 font-['Open_Sans'] truncate">
                <span class="hidden sm:inline">
                    {activeConversation?.participants?.length || 0} participant{(activeConversation?.participants?.length || 0) > 1 ? 's' : ''}
                    {#if isConnected}
                        • En ligne
                    {:else}
                        • Hors ligne
                    {/if}
                </span>
                <!-- Mobile version - shorter -->
                <span class="sm:hidden">
                    {#if isConnected}
                        En ligne
                    {:else}
                        Hors ligne
                    {/if}
                </span>
            </p>
        </div>
    </div>

    <div class="flex gap-1 sm:gap-2 flex-shrink-0">
        <!-- Phone button - hidden on mobile -->
        <button class="hidden sm:flex w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/15 backdrop-blur-sm 
                       hover:bg-white/25 transition-all duration-200 
                       items-center justify-center shadow-sm hover:shadow-md">
            <Phone size="16" class="md:hidden" />
            <Phone size="18" class="hidden md:block" />
        </button>
        
        <!-- Video button - visible on all sizes -->
        <button class="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full bg-white/15 backdrop-blur-sm 
                       hover:bg-white/25 transition-all duration-200 
                       flex items-center justify-center shadow-sm hover:shadow-md">
            <Video size="16" class="sm:hidden" />
            <Video size="16" class="hidden sm:block md:hidden" />
            <Video size="18" class="hidden md:block" />
        </button>
        
        <!-- Settings button - always visible but smaller on mobile -->
        <button class="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full bg-white/15 backdrop-blur-sm 
                       hover:bg-white/25 transition-all duration-200 
                       flex items-center justify-center shadow-sm hover:shadow-md">
            <Settings size="16" class="sm:hidden" />
            <Settings size="16" class="hidden sm:block md:hidden" />
            <Settings size="18" class="hidden md:block" />
        </button>
    </div>
</div>
