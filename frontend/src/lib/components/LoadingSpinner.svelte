<script>
    export let size = 'md'; // sm, md, lg
    export let color = '#c174f2';

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };
</script>

<div class="flex items-center justify-center">
    <div
            class="animate-spin rounded-full {sizeClasses[size]} border-2 border-gray-200"
            style="border-top-color: {color};"
    ></div>
</div>