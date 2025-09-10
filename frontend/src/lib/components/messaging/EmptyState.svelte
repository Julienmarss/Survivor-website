<script>
    import MessageCircle from 'lucide-svelte/icons/message-circle';

    export let onOpenUserSearchModal = () => {};
</script>

<div class="flex-1 flex items-center justify-center bg-white rounded-xl sm:rounded-2xl">
    <div class="text-center max-w-sm sm:max-w-md p-6 sm:p-8 md:p-10">
        <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mx-auto mb-4 sm:mb-6 flex items-center justify-center
                    animate-bounce">
            <MessageCircle size="24" class="text-gray-400 sm:hidden" />
            <MessageCircle size="32" class="text-gray-400 hidden sm:block" />
        </div>
        <h3 class="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 font-['Montserrat']">
            <span class="hidden sm:inline">Sélectionnez une conversation</span>
            <span class="sm:hidden">Choisir conversation</span>
        </h3>
        <p class="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed font-['Open_Sans']">
            <span class="hidden sm:inline">Choisissez une conversation dans la liste ou démarrez un chat rapide pour commencer à discuter avec vos contacts.</span>
            <span class="sm:hidden">Sélectionnez une conversation ou démarrez un nouveau chat.</span>
        </p>
        <button
            on:click={onOpenUserSearchModal}
            class="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white font-semibold text-sm sm:text-base
                   bg-gradient-to-r from-pink-500 to-pink-400
                   hover:from-pink-600 hover:to-pink-500 hover:-translate-y-0.5
                   transition-all duration-200 shadow-lg shadow-pink-500/30 
                   hover:shadow-xl hover:shadow-pink-500/40 flex items-center gap-2 mx-auto"
        >
            <MessageCircle size="16" class="sm:hidden" />
            <MessageCircle size="18" class="hidden sm:block" />
            <span class="hidden sm:inline">Démarrer un chat</span>
            <span class="sm:hidden">Chat</span>
        </button>
    </div>
</div>
