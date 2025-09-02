<script>
  import Header from '$lib/components/Header.svelte';
  import Hero from '$lib/components/Hero.svelte';
  import Stats from '$lib/components/Stats.svelte';
  import ProjectGrid from '$lib/components/ProjectGrid.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { onMount } from 'svelte';

  let mounted = false;

  onMount(() => {
    mounted = true;
  });
</script>

<svelte:head>
  <title>JEB Incubator - Showcasing Innovation</title>
  <meta name="description" content="JEB Incubator accompagne les startups innovantes depuis l'idée jusqu'à la réussite." />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</svelte:head>

<div class="app" class:mounted>
  <Header />
  <main>
    <Hero />
    <Stats />
    <ProjectGrid />
  </main>
  <Footer />
</div>

<style>
  :global(:root) {
    --primary-gradient: linear-gradient(135deg, #f18585 0%, #c174f2 100%);
    --secondary-gradient: linear-gradient(135deg, #f49c9c 0%, #d5a8f2 100%);
    --accent-gradient: linear-gradient(135deg, #f6aeae 0%, #e4bef8 100%);
    --light-gradient: linear-gradient(135deg, #f8cacf 0%, #eed5fb 100%);
    --coral: #f18585;
    --pink: #f49c9c;
    --light-pink: #f6aeae;
    --blush: #f8cacf;
    --lavender: #eed5fb;
    --light-purple: #e4bef8;
    --purple: #d5a8f2;
    --medium-purple: #cb90f1;
    --deep-purple: #c174f2;
    --white: #ffffff;
    --black: #1a1a1a;
    --gray: #666666;
    --light-gray: #f8f9fa;
  }

  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: 'Open Sans', sans-serif;
    line-height: 1.6;
    color: var(--black);
    overflow-x: hidden;
  }

  :global(h1, h2, h3, h4, h5, h6) {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
  }

  .app {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s ease-out;
  }

  .app.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  main {
    position: relative;
    z-index: 1;
  }

  :global(.fade-in) {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s ease;
  }

  :global(.fade-in.visible) {
    opacity: 1;
    transform: translateY(0);
  }
</style>