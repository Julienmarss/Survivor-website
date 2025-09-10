<script>
    import { onMount } from 'svelte';
    import MessageItem from './MessageItem.svelte';

    export let messages = [];
    export let currentUser = null;
    export let typingUsers = [];
    export let formatTime = (date) => date;
    export let getFileIcon = () => '📎';
    export let formatFileSize = () => '';
    export let getReadStatus = () => 'sent';
    export let isMessageFromCurrentUser = () => false;

    let messagesContainer;

    function scrollToBottom() {
        setTimeout(() => {
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 50);
    }

    onMount(() => {
        scrollToBottom();
    });

    $: if (messages.length) {
        scrollToBottom();
    }
</script>

<div 
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 bg-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400"
>
    {#each messages as message, index}
        <MessageItem 
            {message}
            {currentUser}
            isFromCurrentUser={isMessageFromCurrentUser(message)}
            {formatTime}
            {getFileIcon}
            {formatFileSize}
            {getReadStatus}
        />
    {/each}

    <!-- Typing Indicator -->
    {#if typingUsers.length > 0}
        <div class="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 bg-white rounded-2xl 
                    shadow-sm border border-gray-100 ml-10 sm:ml-12 md:ml-13 mb-4 sm:mb-5">
            <div class="flex gap-1">
                <div class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"></div>
            </div>
            <span class="text-xs sm:text-sm text-gray-600 italic">
                <span class="hidden sm:inline">
                    {typingUsers.map(u => u.userName).join(', ')}
                    {typingUsers.length > 1 ? 'sont en train' : 'est en train'} de taper...
                </span>
                <span class="sm:hidden">
                    {typingUsers.length > 1 ? 'Tapent...' : 'Tape...'}
                </span>
            </span>
        </div>
    {/if}
</div>

<style>
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Custom scrollbar for webkit browsers */
    @media (max-width: 767px) {
        div::-webkit-scrollbar {
            width: 3px;
        }
    }
</style>
