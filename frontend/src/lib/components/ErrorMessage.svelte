<!-- lib/components/ErrorMessage.svelte -->
<script>
    export let message = '';
    export let onRetry = null;
    export let dismissible = true;

    let visible = true;

    function handleDismiss() {
        if (dismissible) {
            visible = false;
        }
    }

    function handleRetry() {
        if (onRetry && typeof onRetry === 'function') {
            onRetry();
        }
    }
</script>

{#if visible && message}
    <div class="bg-red-50 border-l-4 border-red-400 p-4 mx-6 my-4 rounded-r-lg shadow-sm">
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-red-700 font-medium">
                        {message}
                    </p>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                {#if onRetry}
                    <button
                            on:click={handleRetry}
                            class="text-sm text-red-600 hover:text-red-800 font-medium underline transition-colors duration-200">
                        Réessayer
                    </button>
                {/if}

                {#if dismissible}
                    <button
                            on:click={handleDismiss}
                            class="text-red-400 hover:text-red-600 transition-colors duration-200">
                        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                {/if}
            </div>
        </div>
    </div>
{/if}