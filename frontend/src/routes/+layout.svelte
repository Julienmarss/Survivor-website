<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/logo.png';
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/userStore.js';

	onMount(() => {
		userStore.init();
	});
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
