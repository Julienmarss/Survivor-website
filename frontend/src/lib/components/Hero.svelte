<script>
  import { onMount } from 'svelte';

  let heroSection;
  let heroVisual;
  let mounted = false;

  onMount(() => {
    mounted = true;

    const handleScroll = () => {
      if (heroVisual) {
        const scrolled = window.pageYOffset;
        heroVisual.style.transform = `translateY(${scrolled * 0.2}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function scrollToSection(href) {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
</script>

<section class="hero" id="home" bind:this={heroSection}>
  <div class="hero-container">
    <div class="hero-content" class:animate={mounted}>
      <h1 class="hero-title">
        Transformez Vos Idées en 
        <span class="highlight">Success Stories</span>
      </h1>
      <p class="hero-subtitle">
        JEB Incubator accompagne les startups innovantes depuis l'idée jusqu'à la réussite. 
        Rejoignez notre écosystème d'entrepreneurs visionnaires et façonnez l'avenir.
      </p>
      <div class="hero-buttons">
        <button class="btn-primary" on:click={() => scrollToSection('#projects')}>
          <i class="fas fa-rocket"></i>
          Découvrir les Projets
        </button>
        <button class="btn-secondary" on:click={() => scrollToSection('#contact')}>
          <i class="fas fa-handshake"></i>
          Rejoindre l'Incubateur
        </button>
      </div>
      
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-number">150+</span>
          <span class="stat-label">Startups</span>
        </div>
        <div class="stat">
          <span class="stat-number">€50M</span>
          <span class="stat-label">Levés</span>
        </div>
        <div class="stat">
          <span class="stat-number">85%</span>
          <span class="stat-label">Réussite</span>
        </div>
      </div>
    </div>
    
    <div class="hero-visual" bind:this={heroVisual} class:animate={mounted}>
      <div class="hero-image">
        <div class="floating-icon icon-1">
          <i class="fas fa-lightbulb"></i>
        </div>
        <div class="floating-icon icon-2">
          <i class="fas fa-rocket"></i>
        </div>
        <div class="floating-icon icon-3">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="floating-icon icon-4">
          <i class="fas fa-users"></i>
        </div>
        
        <div class="central-illustration">
          <div class="pulse-circle"></div>
          <i class="fas fa-star"></i>
        </div>
      </div>
    </div>
  </div>
  
  <div class="hero-bg-shapes">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
    <div class="shape shape-3"></div>
  </div>
</section>

<style>
  .hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #f8f9fa 0%, #eed5fb 50%, #e4bef8 100%);
    position: relative;
    overflow: hidden;
    padding: 6rem 2rem 2rem;
  }

  .hero-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    position: relative;
    z-index: 2;
  }

  .hero-content {
    opacity: 0;
    transform: translateX(-50px);
    transition: all 1s ease-out;
  }

  .hero-content.animate {
    opacity: 1;
    transform: translateX(0);
  }

  .hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 1.5rem;
    color: var(--black);
  }

  .highlight {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
  }

  .hero-subtitle {
    font-size: 1.3rem;
    color: var(--gray);
    margin-bottom: 2.5rem;
    font-weight: 400;
    line-height: 1.6;
  }

  .hero-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 3rem;
    flex-wrap: wrap;
  }

  .btn-primary, .btn-secondary {
    padding: 15px 30px;
    border-radius: 50px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    cursor: pointer;
    border: none;
    font-size: 1rem;
    text-decoration: none;
  }

  .btn-primary {
    background: var(--primary-gradient);
    color: white;
    box-shadow: 0 10px 30px rgba(241, 133, 133, 0.3);
  }

  .btn-secondary {
    background: transparent;
    color: var(--black);
    border: 2px solid var(--coral);
  }

  .btn-primary:hover, .btn-secondary:hover {
    transform: translateY(-3px);
  }

  .btn-primary:hover {
    box-shadow: 0 15px 40px rgba(241, 133, 133, 0.4);
  }

  .btn-secondary:hover {
    background: var(--coral);
    color: white;
  }

  .hero-stats {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .stat {
    text-align: center;
  }

  .stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 800;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'Montserrat', sans-serif;
  }

  .stat-label {
    font-size: 0.9rem;
    color: var(--gray);
    font-weight: 500;
  }

  .hero-visual {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transform: translateX(50px);
    transition: all 1s ease-out 0.3s;
  }

  .hero-visual.animate {
    opacity: 1;
    transform: translateX(0);
  }

  .hero-image {
    width: 100%;
    max-width: 500px;
    height: 500px;
    position: relative;
  }

  .central-illustration {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    background: var(--primary-gradient);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 20px 60px rgba(241, 133, 133, 0.3);
    z-index: 2;
  }

  .central-illustration i {
    font-size: 3rem;
    color: white;
  }

  .pulse-circle {
    position: absolute;
    top: -20px;
    left: -20px;
    right: -20px;
    bottom: -20px;
    border: 2px solid var(--coral);
    border-radius: 50%;
    opacity: 0.3;
    animation: pulse 2s ease-in-out infinite;
  }

  .floating-icon {
    position: absolute;
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(241, 133, 133, 0.2);
  }

  .floating-icon i {
    font-size: 1.5rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .icon-1 {
    top: 20px;
    left: 20px;
    animation: float 3s ease-in-out infinite;
  }

  .icon-2 {
    top: 20px;
    right: 20px;
    animation: float 3s ease-in-out infinite 0.5s;
  }

  .icon-3 {
    bottom: 20px;
    left: 20px;
    animation: float 3s ease-in-out infinite 1s;
  }

  .icon-4 {
    bottom: 20px;
    right: 20px;
    animation: float 3s ease-in-out infinite 1.5s;
  }

  .hero-bg-shapes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    overflow: hidden;
  }

  .shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
  }

  .shape-1 {
    width: 300px;
    height: 300px;
    background: var(--coral);
    top: 10%;
    right: -100px;
    animation: rotate 20s linear infinite;
  }

  .shape-2 {
    width: 200px;
    height: 200px;
    background: var(--deep-purple);
    bottom: 20%;
    left: -50px;
    animation: rotate 15s linear infinite reverse;
  }

  .shape-3 {
    width: 150px;
    height: 150px;
    background: var(--light-purple);
    top: 30%;
    left: 20%;
    animation: float 4s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.1); opacity: 0.1; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 1024px) {
    .hero-container {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 3rem;
    }

    .hero-title {
      font-size: 2.8rem;
    }

    .hero-image {
      height: 400px;
    }
  }

  @media (max-width: 768px) {
    .hero {
      padding: 5rem 1rem 2rem;
    }

    .hero-title {
      font-size: 2.2rem;
    }

    .hero-subtitle {
      font-size: 1.1rem;
    }

    .hero-buttons {
      flex-direction: column;
      align-items: center;
    }

    .btn-primary, .btn-secondary {
      width: 100%;
      max-width: 280px;
      justify-content: center;
    }

    .hero-stats {
      justify-content: center;
      gap: 1.5rem;
    }

    .hero-image {
      height: 300px;
    }

    .floating-icon {
      width: 60px;
      height: 60px;
    }

    .floating-icon i {
      font-size: 1.2rem;
    }

    .central-illustration {
      width: 100px;
      height: 100px;
    }

    .central-illustration i {
      font-size: 2.5rem;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 1.8rem;
    }

    .hero-subtitle {
      font-size: 1rem;
    }

    .stat-number {
      font-size: 1.5rem;
    }

    .hero-image {
      height: 250px;
    }
  }
</style>
