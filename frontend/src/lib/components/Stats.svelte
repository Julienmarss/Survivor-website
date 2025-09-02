<script>
  import { onMount } from 'svelte';
  import { projectStats } from '$lib/stores/projects.js';

  let statsSection;
  let visible = false;
  let animatedStats = {
    totalProjects: 0,
    totalFunding: 0,
    successRate: 0,
    jobsCreated: 0
  };

  $: stats = $projectStats;

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !visible) {
            visible = true;
            animateCounters();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  });

  function animateCounters() {
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    function updateCounters() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      animatedStats = {
        totalProjects: Math.floor(stats.totalProjects * easeOutCubic),
        totalFunding: Math.floor(stats.totalFunding * easeOutCubic),
        successRate: Math.floor(stats.successRate * easeOutCubic),
        jobsCreated: Math.floor(stats.jobsCreated * easeOutCubic)
      };

      if (progress < 1) {
        requestAnimationFrame(updateCounters);
      }
    }

    requestAnimationFrame(updateCounters);
  }

  function formatFunding(amount) {
    return `€${Math.floor(amount / 1000000)}M`;
  }
</script>

<section class="stats" bind:this={statsSection}>
  <div class="stats-container">
    <div class="stat-card" class:animate={visible} style="--delay: 0s">
      <div class="stat-icon">
        <i class="fas fa-rocket"></i>
      </div>
      <div class="stat-content">
        <div class="stat-number">{animatedStats.totalProjects}+</div>
        <div class="stat-label">Startups Incubées</div>
        <div class="stat-description">Depuis notre création</div>
      </div>
    </div>

    <div class="stat-card" class:animate={visible} style="--delay: 0.2s">
      <div class="stat-icon">
        <i class="fas fa-euro-sign"></i>
      </div>
      <div class="stat-content">
        <div class="stat-number">{formatFunding(animatedStats.totalFunding)}</div>
        <div class="stat-label">Fonds Levés</div>
        <div class="stat-description">Par nos startups</div>
      </div>
    </div>

    <div class="stat-card" class:animate={visible} style="--delay: 0.4s">
      <div class="stat-icon">
        <i class="fas fa-chart-line"></i>
      </div>
      <div class="stat-content">
        <div class="stat-number">{animatedStats.successRate}%</div>
        <div class="stat-label">Taux de Réussite</div>
        <div class="stat-description">Après 2 ans</div>
      </div>
    </div>

    <div class="stat-card" class:animate={visible} style="--delay: 0.6s">
      <div class="stat-icon">
        <i class="fas fa-users"></i>
      </div>
      <div class="stat-content">
        <div class="stat-number">{animatedStats.jobsCreated}+</div>
        <div class="stat-label">Emplois Créés</div>
        <div class="stat-description">Direct et indirect</div>
      </div>
    </div>
  </div>

  <div class="stats-bg">
    <div class="floating-shape shape-1"></div>
    <div class="floating-shape shape-2"></div>
    <div class="floating-shape shape-3"></div>
  </div>
</section>

<style>
  .stats {
    padding: 6rem 2rem;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    position: relative;
    overflow: hidden;
  }

  .stats-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    position: relative;
    z-index: 2;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    text-align: center;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid rgba(241, 133, 133, 0.1);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    position: relative;
    overflow: hidden;
    opacity: 0;
    transform: translateY(50px);
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--primary-gradient);
    transform: scaleX(0);
    transition: transform 0.6s ease;
  }

  .stat-card.animate {
    opacity: 1;
    transform: translateY(0);
    transition-delay: var(--delay, 0s);
  }

  .stat-card.animate::before {
    transform: scaleX(1);
    transition-delay: calc(var(--delay, 0s) + 0.3s);
  }

  .stat-card:hover {
    transform: translateY(-15px) scale(1.02);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  }

  .stat-icon {
    width: 80px;
    height: 80px;
    background: var(--primary-gradient);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    box-shadow: 0 10px 30px rgba(241, 133, 133, 0.3);
    transition: all 0.3s ease;
  }

  .stat-card:hover .stat-icon {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 15px 40px rgba(241, 133, 133, 0.4);
  }

  .stat-icon i {
    font-size: 2rem;
    color: white;
  }

  .stat-content {
    position: relative;
    z-index: 1;
  }

  .stat-number {
    font-size: 3.2rem;
    font-weight: 800;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'Montserrat', sans-serif;
    margin-bottom: 0.5rem;
    line-height: 1;
  }

  .stat-label {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--black);
    margin-bottom: 0.5rem;
    font-family: 'Montserrat', sans-serif;
  }

  .stat-description {
    font-size: 0.9rem;
    color: var(--gray);
    font-weight: 400;
    opacity: 0.8;
  }

  .stats-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
  }

  .floating-shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.03;
    animation: float 6s ease-in-out infinite;
  }

  .shape-1 {
    width: 200px;
    height: 200px;
    background: var(--coral);
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }

  .shape-2 {
    width: 150px;
    height: 150px;
    background: var(--deep-purple);
    top: 60%;
    right: 15%;
    animation-delay: 2s;
  }

  .shape-3 {
    width: 100px;
    height: 100px;
    background: var(--light-purple);
    bottom: 20%;
    left: 20%;
    animation-delay: 4s;
  }

  @keyframes float {
    0%, 100% { 
      transform: translateY(0px) rotate(0deg); 
    }
    33% { 
      transform: translateY(-20px) rotate(120deg); 
    }
    66% { 
      transform: translateY(-10px) rotate(240deg); 
    }
  }

  @media (max-width: 1024px) {
    .stats-container {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      padding: 2rem 1.5rem;
    }

    .stat-number {
      font-size: 2.8rem;
    }
  }

  @media (max-width: 768px) {
    .stats {
      padding: 4rem 1rem;
    }

    .stats-container {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      padding: 1.5rem 1rem;
    }

    .stat-icon {
      width: 70px;
      height: 70px;
      margin-bottom: 1rem;
    }

    .stat-icon i {
      font-size: 1.8rem;
    }

    .stat-number {
      font-size: 2.4rem;
    }

    .stat-label {
      font-size: 1.1rem;
    }
  }

  @media (max-width: 480px) {
    .stats-container {
      grid-template-columns: 1fr;
      max-width: 320px;
    }

    .stat-number {
      font-size: 2.2rem;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
    }

    .stat-icon i {
      font-size: 1.5rem;
    }
  }
</style>
