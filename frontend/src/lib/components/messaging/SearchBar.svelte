<script>
    import Search from 'lucide-svelte/icons/search';
    import X from 'lucide-svelte/icons/x';

    export let searchQuery = '';
    export let onClear = () => {};
    export let placeholder = "Rechercher conversations...";
</script>

<div class="relative">
    <Search class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 z-10" size="20" />
    <input
        type="text"
        {placeholder}
        class="w-full pl-12 pr-12 py-3.5 border-2 border-white/20 rounded-3xl 
               bg-white/15 backdrop-blur-lg text-white outline-none text-sm
               transition-all duration-300 placeholder-white/70
               focus:border-white/40 focus:bg-white/20 focus:shadow-lg focus:shadow-white/10"
        bind:value={searchQuery}
    />
    {#if searchQuery}
        <button 
            class="absolute right-3 top-1/2 transform -translate-y-1/2 
                   bg-white/20 rounded-full w-7 h-7 flex items-center justify-center
                   text-white/80 transition-all duration-300 hover:bg-white/30"
            on:click={() => { searchQuery = ''; onClear(); }}
        >
            <X size="16" />
        </button>
    {/if}
</div>
