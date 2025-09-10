<script>
    import X from 'lucide-svelte/icons/x';
    import Paperclip from 'lucide-svelte/icons/paperclip';

    export let show = false;
    export let selectedFiles = [];
    export let isDragOver = false;
    export let onClose = () => {};
    export let onSendAttachments = () => {};
    export let handleFileSelect = () => {};
    export let handleDragOver = () => {};
    export let handleDragLeave = () => {};
    export let handleDrop = () => {};
    export let removeFile = () => {};
    export let getFileIcon = () => '📎';
    export let formatFileSize = () => '';

    let fileInput;

    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }
</script>

{#if show}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50
                animate-in fade-in duration-300" 
         on:click={handleBackdropClick}>
        <div class="bg-white rounded-2xl p-8 max-w-2xl w-[90%] max-h-[80vh] overflow-y-auto
                    shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300"
             on:click|stopPropagation>
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-gray-800" style="font-family: 'Montserrat', sans-serif;">
                    Ajouter des pièces jointes
                </h3>
                <button 
                    class="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    on:click={onClose}
                >
                    <X size="24" class="text-gray-500" />
                </button>
            </div>

            <!-- Drop Zone -->
            <div
                class="border-2 border-dashed rounded-xl p-8 text-center bg-gray-50
                       transition-all duration-200 mb-4
                       {isDragOver ? 'bg-white shadow-lg' : 'border-gray-300'}"
                style="{isDragOver ? 'border-color: #F18585; box-shadow: 0 0 0 4px rgba(241, 133, 133, 0.1);' : ''}"
                on:dragover={handleDragOver}
                on:dragleave={handleDragLeave}
                on:drop={handleDrop}
            >
                <div class="flex flex-col items-center">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center text-white mb-4"
                         style="background: linear-gradient(135deg, #F18585, #F49C9C);">
                        <Paperclip size="24" />
                    </div>
                    <h4 class="font-semibold text-gray-800 mb-2">Glissez-déposez vos fichiers ici</h4>
                    <p class="text-gray-500 mb-4">ou</p>
                    <button 
                        class="px-6 py-3 text-sm font-semibold text-gray-600 bg-white 
                               rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300
                               transition-all duration-200"
                        on:click={() => fileInput?.click()}
                    >
                        Choisir des fichiers
                    </button>
                </div>
            </div>

            <!-- Hidden File Input -->
            <input
                bind:this={fileInput}
                type="file"
                multiple
                class="hidden"
                on:change={handleFileSelect}
            />

            <!-- Selected Files -->
            {#if selectedFiles.length > 0}
                <div class="mb-6">
                    <h4 class="font-semibold text-gray-800 mb-4">
                        Fichiers sélectionnés ({selectedFiles.length})
                    </h4>
                    <div class="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                        {#each selectedFiles as file, index}
                            <div class="flex items-center justify-between p-3 border border-gray-200 
                                        rounded-xl bg-white hover:bg-gray-50 transition-colors duration-200">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                                         style="background: linear-gradient(135deg, #F18585, #F49C9C);">
                                        {getFileIcon(file)}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-semibold text-gray-800 text-sm truncate">
                                            {file.name}
                                        </div>
                                        <div class="text-gray-500 text-xs">
                                            {formatFileSize(file.size)} • {file.type || 'Type inconnu'}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    class="p-2 hover:rounded-lg transition-colors duration-200"
                                    style="color: #F18585; background: rgba(241, 133, 133, 0.1);"
                                    on:mouseover={(e) => e.target.style.background = 'rgba(241, 133, 133, 0.15)'}
                                    on:mouseout={(e) => e.target.style.background = 'rgba(241, 133, 133, 0.1)'}
                                    on:click={() => removeFile(index)}
                                >
                                    <X size="16" />
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
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
                    on:click={onSendAttachments}
                    disabled={selectedFiles.length === 0}
                >
                    <Paperclip size="18" />
                    Envoyer {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
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
