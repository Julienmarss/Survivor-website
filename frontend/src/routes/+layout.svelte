<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/userStore.js';

	onMount(() => {
		// Initialiser le store au démarrage de l'app
		userStore.init();
	});
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
