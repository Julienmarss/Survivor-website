<script>
    import Send from 'lucide-svelte/icons/send';
    import Paperclip from 'lucide-svelte/icons/paperclip';
    import Smile from 'lucide-svelte/icons/smile';

    export let messageInput = '';
    export let onSendMessage = () => {};
    export let onTyping = () => {};
    export let openAttachmentModal = () => {};
</script>

<div class="p-3 sm:p-4 md:p-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
    <div class="flex items-center gap-2 sm:gap-3 md:gap-4">
        <!-- Attachment button - hidden on small mobile, visible on larger screens -->
        <button 
            class="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-full transition-all duration-200 
                   items-center justify-center shadow-sm hover:shadow-md"
            style="background: rgba(241, 133, 133, 0.1); color: #F18585;"
            on:click={openAttachmentModal}
        >
            <Paperclip size="18" class="md:hidden" />
            <Paperclip size="20" class="hidden md:block" />
        </button>

        <div class="flex-1 relative">
            <input
                type="text"
                placeholder="Tapez votre message..."
                class="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl sm:rounded-3xl 
                       outline-none text-sm bg-white transition-all duration-300
                       focus:shadow-lg font-['Open_Sans']"
                on:focus={(e) => {
                    e.target.style.borderColor = '#F18585';
                    e.target.style.boxShadow = '0 0 0 4px rgba(241, 133, 133, 0.1), 0 10px 25px rgba(241, 133, 133, 0.15)';
                }}
                on:blur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                }}
                bind:value={messageInput}
                on:input={onTyping}
                on:keydown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSendMessage();
                    }
                }}
            />
            
            <!-- Mobile attachment button - positioned inside input -->
            <button 
                class="sm:hidden absolute right-2 top-1/2 transform -translate-y-1/2 
                       w-8 h-8 rounded-full transition-all duration-200 
                       flex items-center justify-center"
                style="background: rgba(241, 133, 133, 0.1); color: #F18585;"
                on:click={openAttachmentModal}
            >
                <Paperclip size="16" />
            </button>
        </div>

        <!-- Emoji button - hidden on mobile -->
        <button 
            class="hidden md:flex w-12 h-12 rounded-full transition-all duration-200 
                   items-center justify-center shadow-sm hover:shadow-md"
            style="background: rgba(241, 133, 133, 0.1); color: #F18585;"
        >
            <Smile size="20" />
        </button>

        <!-- Send button -->
        <button 
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white shadow-lg 
                   hover:shadow-xl hover:-translate-y-0.5
                   transition-all duration-200 flex items-center justify-center
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                   flex-shrink-0"
            style="background: linear-gradient(135deg, #F18585, #F49C9C); box-shadow: 0 4px 12px rgba(241, 133, 133, 0.3);"
            on:click={onSendMessage} 
            disabled={!messageInput.trim()}
        >
            <Send size="16" class="sm:hidden" />
            <Send size="20" class="hidden sm:block" />
        </button>
    </div>
</div>
