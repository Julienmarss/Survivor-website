<script>
  import { onMount } from 'svelte';

  let scrolled = false;
  let mobileMenuOpen = false;

  const navItems = [
    { label: 'Accueil', href: '#home' },
    { label: 'Projets', href: '#projects' },
    { label: 'Actualités', href: '#news' },
    { label: 'Événements', href: '#events' },
    { label: 'Contact', href: '#contact' }
  ];

  onMount(() => {
    const handleScroll = () => {
      scrolled = window.scrollY > 100;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function scrollToSection(href) {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    mobileMenuOpen = false;
  }
</script>

<nav class="navbar" class:scrolled>
  <div class="nav-container">
    <a href="#" class="logo" on:click|preventDefault={() => scrollToSection('#home')}>
      <div class="logo-icon">
        <i class="fas fa-rocket"></i>
      </div>
      <span class="logo-text">JEB</span>
    </a>
    
    <ul class="nav-links" class:mobile-open={mobileMenuOpen}>
      {#each navItems as item}
        <li>
          <a href={item.href} on:click|preventDefault={() => scrollToSection(item.href)}>
            {item.label}
          </a>
        </li>
      {/each}
      <li>
        <a href="#login" class="cta-button" on:click|preventDefault={() => scrollToSection('#login')}>
          Connexion
        </a>
      </li>
    </ul>

    <button class="mobile-menu-btn" on:click={toggleMobileMenu}>
      <i class="fas {mobileMenuOpen ? 'fa-times' : 'fa-bars'}"></i>
    </button>
  </div>
</nav>

<style>
  .navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    z-index: 1000;
    transition: all 0.3s ease;
    border-bottom: 1px solid rgba(241, 133, 133, 0.1);
  }

  .navbar.scrolled {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .nav-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
  }

  .logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: var(--black);
    transition: transform 0.3s ease;
  }

  .logo:hover {
    transform: scale(1.05);
  }

  .logo-icon {
    width: 50px;
    height: 50px;
    background: var(--primary-gradient);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    box-shadow: 0 8px 25px rgba(241, 133, 133, 0.3);
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
  }

  .logo-icon i {
    color: white;
    font-size: 24px;
  }

  .logo-text {
    font-family: 'Montserrat', sans-serif;
    font-weight: 800;
    font-size: 1.8rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
    align-items: center;
    transition: all 0.3s ease;
  }

  .nav-links a {
    text-decoration: none;
    color: var(--black);
    font-weight: 500;
    transition: all 0.3s ease;
    position: relative;
    padding: 0.5rem 0;
  }

  .nav-links a:not(.cta-button)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--primary-gradient);
    transition: width 0.3s ease;
  }

  .nav-links a:not(.cta-button):hover::after {
    width: 100%;
  }

  .cta-button {
    background: var(--primary-gradient);
    color: white !important;
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: 600;
    box-shadow: 0 8px 25px rgba(241, 133, 133, 0.3);
    transform: translateY(0);
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(241, 133, 133, 0.4);
  }

  .mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--black);
    padding: 10px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .mobile-menu-btn:hover {
    background: rgba(241, 133, 133, 0.1);
  }

  @media (max-width: 768px) {
    .nav-links {
      position: fixed;
      top: 80px;
      left: 0;
      width: 100%;
      height: calc(100vh - 80px);
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(20px);
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      padding: 2rem;
      gap: 1.5rem;
      transform: translateX(-100%);
      opacity: 0;
    }

    .nav-links.mobile-open {
      transform: translateX(0);
      opacity: 1;
    }

    .mobile-menu-btn {
      display: block;
    }

    .nav-container {
      padding: 1rem;
    }

    .logo-text {
      font-size: 1.5rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      margin-right: 8px;
    }
  }

  @media (max-width: 480px) {
    .logo-text {
      font-size: 1.3rem;
    }

    .logo-icon {
      width: 35px;
      height: 35px;
    }

    .logo-icon i {
      font-size: 18px;
    }
  }
</style>
