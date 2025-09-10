<script>
    import Check from 'lucide-svelte/icons/check';
    import CheckCheck from 'lucide-svelte/icons/check-check';

    export let message;
    export let currentUser;
    export let isFromCurrentUser;
    export let formatTime;
    export let getFileIcon;
    export let formatFileSize;
    export let getReadStatus;

    // Configuration API
    const API_URL = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

    function parseFirebaseTimestamp(timestamp) {
        if (!timestamp) return new Date();
        if (timestamp._seconds) {
            return new Date(timestamp._seconds * 1000);
        }
        return new Date(timestamp);
    }
</script>

<div class="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-5 {isFromCurrentUser ? 'flex-row-reverse' : ''} animate-[slideIn_0.3s_ease-out]">
    {#if !isFromCurrentUser}
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-lg flex-shrink-0"
             style="background: linear-gradient(135deg, #F49C9C, #E4BEF8);">
            {message.senderName?.[0]?.toUpperCase() || 'U'}
        </div>
    {/if}
    
    <div class="max-w-[80%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-3 sm:py-4 relative
                {isFromCurrentUser ? 'text-white shadow-lg' : 'bg-white border border-gray-100 shadow-sm'}"
         style="{isFromCurrentUser ? 'background: linear-gradient(135deg, #F18585, #F49C9C); box-shadow: 0 4px 16px rgba(241, 133, 133, 0.3);' : ''}">
        
        {#if !isFromCurrentUser}
            <div class="font-semibold mb-1 sm:mb-1.5 text-xs text-gray-500">
                {message.senderName}
            </div>
        {/if}
        
        <div class="mb-2 leading-relaxed text-sm">
            {#if message.messageType === 'image'}
                <img
                    src={message.fileUrl || (message.content.startsWith('/uploads/') ? `${API_URL}${message.content}` : message.content)}
                    alt="Image"
                    class="max-w-full rounded-xl mb-2"
                />
                {#if message.content && message.content !== message.fileUrl && !message.content.startsWith('/uploads/')}
                    <div class="text-sm">{message.content}</div>
                {/if}
            {:else if message.messageType === 'file'}
                <div class="flex items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-200">
                    <div class="text-base sm:text-lg flex-shrink-0">{getFileIcon({type: message.fileType || 'application/octet-stream'})}</div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-xs sm:text-sm truncate text-gray-800">{message.fileName || 'Fichier'}</div>
                        <div class="text-xs text-gray-500">{message.fileSize ? formatFileSize(message.fileSize) : ''}</div>
                    </div>
                    <a href={message.fileUrl || (message.content.startsWith('/uploads/') ? `${API_URL}${message.content}` : message.content)} 
                       download 
                       class="text-pink-500 font-semibold text-xs hover:text-pink-600 transition-colors flex-shrink-0">
                        Télécharger
                    </a>
                </div>
            {:else}
                <div class="text-sm break-words">{message.content}</div>
            {/if}
        </div>
        
        <div class="flex justify-between items-center text-xs {isFromCurrentUser ? 'text-white/70' : 'text-gray-400'}">
            <span class="text-xs">{formatTime(message.createdAt)}</span>
            {#if isFromCurrentUser}
                <span class="flex items-center ml-2">
                    {#if getReadStatus(message) === 'read'}
                        <CheckCheck size="14" />
                    {:else}
                        <Check size="14" />
                    {/if}
                </span>
            {/if}
        </div>
        
        <!-- Message tail -->
        <div class="absolute top-2 sm:top-3 {isFromCurrentUser ? 'right-[-5px] sm:right-[-7px]' : 'left-[-5px] sm:left-[-7px]'} w-0 h-0 
                    {isFromCurrentUser ? 'border-l-[6px] sm:border-l-8' : 'border-r-[6px] sm:border-r-8 border-r-white'}
                    border-t-[6px] sm:border-t-8 border-t-transparent border-b-[6px] sm:border-b-8 border-b-transparent"
             style="{isFromCurrentUser ? 'border-left-color: #F18585;' : ''}"></div>
    </div>
    
    {#if isFromCurrentUser}
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-lg flex-shrink-0"
             style="background: linear-gradient(135deg, #CB90F1, #D5A8F2);">
            {currentUser?.firstName?.[0] || currentUser?.name?.[0] || 'M'}
        </div>
    {/if}
</div>
