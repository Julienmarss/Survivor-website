<script>
  import { onMount } from 'svelte';

  let currentYear = new Date().getFullYear();
  let newsletterEmail = '';
  let subscribed = false;

  function handleNewsletterSubmit(e) {
    e.preventDefault();
    if (newsletterEmail) {
      subscribed = true;
      setTimeout(() => {
        subscribed = false;
        newsletterEmail = '';
      }, 3000);
    }
  }

  function scrollToSection(href) {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const socialLinks = [
    { icon: 'fab fa-linkedin', href: '#', label: 'LinkedIn' },
    { icon: 'fab fa-twitter', href: '#', label: 'Twitter' },
    { icon: 'fab fa-instagram', href: '#', label: 'Instagram' },
    { icon: 'fab fa-youtube', href: '#', label: 'YouTube' }
  ];

  const quickLinks = [
    { label: 'Accueil', href: '#home' },
    { label: 'Projets', href: '#projects' },
    { label: 'Actualités', href: '#news' },
    { label: 'Événements', href: '#events' },
    { label: 'À propos', href: '#about' }
  ];

  const services = [
    { label: 'Incubation', href: '#' },
    { label: 'Financement', href: '#' },
    { label: 'Mentorat', href: '#' },
    { label: 'Networking', href: '#' },
    { label: 'Formation', href: '#' }
  ];
</script>

<footer class="footer">
  <div class="footer-container">
    <div class="footer-main">
      <!-- Informations sur JEB -->
      <div class="footer-section">
        <div class="footer-logo">
          <div class="logo-icon">
            <i class="fas fa-rocket"></i>
          </div>
          <span class="logo-text">JEB Incubator</span>
        </div>
        <p class="footer-description">
          Transformer les idées visionnaires en entreprises prospères depuis 2018. 
          Rejoignez notre écosystème d'innovation et façonnez l'avenir avec nous.
        </p>
        <div class="social-links">
          {#each socialLinks as social}
            <a 
              href={social.href} 
              class="social-link"
              aria-label={social.label}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class={social.icon}></i>
            </a>
          {/each}
        </div>
      </div>

      <div class="footer-section">
        <h3>Navigation</h3>
        <ul class="footer-links">
          {#each quickLinks as link}
            <li>
              <a href={link.href} on:click|preventDefault={() => scrollToSection(link.href)}>
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <div class="footer-section">
        <h3>Services</h3>
        <ul class="footer-links">
          {#each services as service}
            <li>
              <a href={service.href}>
                {service.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <div class="footer-section">
        <h3>Restons en Contact</h3>
        <div class="contact-info">
          <div class="contact-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>123 Innovation Boulevard, Paris 75001</span>
          </div>
          <div class="contact-item">
            <i class="fas fa-phone"></i>
            <span>+33 1 23 45 67 89</span>
          </div>
          <div class="contact-item">
            <i class="fas fa-envelope"></i>
            <span>contact@jeb-incubator.com</span>
          </div>
        </div>

        <div class="newsletter">
          <h4>Newsletter</h4>
          <p>Recevez nos dernières actualités et opportunités</p>
          <form on:submit={handleNewsletterSubmit} class="newsletter-form">
            <div class="input-group">
              <input 
                type="email" 
                placeholder="Votre email"
                bind:value={newsletterEmail}
                required
                class="newsletter-input"
              />
              <button type="submit" class="newsletter-btn" disabled={subscribed}>
                {#if subscribed}
                  <i class="fas fa-check"></i>
                {:else}
                  <i class="fas fa-paper-plane"></i>
                {/if}
              </button>
            </div>
          </form>
          {#if subscribed}
            <p class="success-message">Merci pour votre inscription ! 🎉</p>
          {/if}
        </div>
      </div>
    </div>

    <div class="footer-stats">
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
      <div class="stat">
        <span class="stat-number">500+</span>
        <span class="stat-label">Emplois</span>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-bottom-content">
        <p>&copy; {currentYear} JEB Incubator. Tous droits réservés.</p>
        <div class="legal-links">
          <a href="#">Politique de confidentialité</a>
          <span>•</span>
          <a href="#">Mentions légales</a>
          <span>•</span>
          <a href="#">CGU</a>
        </div>
      </div>
      <div class="footer-badge">
        <span>Made with</span>
        <i class="fas fa-heart"></i>
        <span>in Paris</span>
      </div>
    </div>
  </div>

  <div class="footer-shapes">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
  </div>
</footer>

<style>
  .footer {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    color: white;
    position: relative;
    overflow: hidden;
  }

  .footer-container {
    max-width: 1400px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  .footer-main {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
    gap: 3rem;
    padding: 4rem 2rem 2rem;
  }

  .footer-section h3 {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
  }

  .footer-logo {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .logo-icon {
    width: 45px;
    height: 45px;
    background: var(--primary-gradient);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    box-shadow: 0 8px 25px rgba(241, 133, 133, 0.3);
  }

  .logo-icon i {
    color: white;
    font-size: 22px;
  }

  .logo-text {
    font-family: 'Montserrat', sans-serif;
    font-weight: 800;
    font-size: 1.6rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .footer-description {
    color: #ccc;
    line-height: 1.6;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }

  .social-links {
    display: flex;
    gap: 1rem;
  }

  .social-link {
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ccc;
    text-decoration: none;
    transition: all 0.3s ease;
    border: 1px solid rgba(241, 133, 133, 0.2);
  }

  .social-link:hover {
    background: var(--primary-gradient);
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(241, 133, 133, 0.3);
  }

  .footer-links {
    list-style: none;
    padding: 0;
  }

  .footer-links li {
    margin-bottom: 0.8rem;
  }

  .footer-links a {
    color: #ccc;
    text-decoration: none;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    position: relative;
    padding-left: 0;
  }

  .footer-links a:hover {
    color: var(--coral);
    padding-left: 10px;
  }

  .footer-links a::before {
    content: '→';
    position: absolute;
    left: -15px;
    opacity: 0;
    transition: all 0.3s ease;
  }

  .footer-links a:hover::before {
    opacity: 1;
    left: -10px;
  }

  .contact-info {
    margin-bottom: 2rem;
  }

  .contact-item {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    color: #ccc;
    font-size: 0.9rem;
  }

  .contact-item i {
    color: var(--coral);
    width: 20px;
    margin-right: 12px;
    font-size: 1rem;
  }

  .newsletter h4 {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    color: white;
    font-family: 'Montserrat', sans-serif;
  }

  .newsletter p {
    color: #ccc;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .newsletter-form {
    margin-bottom: 1rem;
  }

  .input-group {
    display: flex;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 25px;
    overflow: hidden;
    border: 1px solid rgba(241, 133, 133, 0.2);
  }

  .newsletter-input {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: white;
    font-size: 0.9rem;
    outline: none;
  }

  .newsletter-input::placeholder {
    color: #999;
  }

  .newsletter-btn {
    background: var(--primary-gradient);
    border: none;
    padding: 12px 16px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 50px;
  }

  .newsletter-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }

  .newsletter-btn:disabled {
    background: #4caf50;
    cursor: not-allowed;
  }

  .success-message {
    color: #4caf50;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    font-weight: 500;
  }

  .footer-stats {
    display: flex;
    justify-content: space-around;
    padding: 2rem;
    margin: 0 2rem;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    border: 1px solid rgba(241, 133, 133, 0.1);
  }

  .stat {
    text-align: center;
  }

  .stat-number {
    display: block;
    font-size: 1.8rem;
    font-weight: 800;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'Montserrat', sans-serif;
    margin-bottom: 0.2rem;
  }

  .stat-label {
    color: #ccc;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .footer-bottom-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-bottom p {
    color: #999;
    font-size: 0.85rem;
    margin: 0;
  }

  .legal-links {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .legal-links a {
    color: #ccc;
    text-decoration: none;
    font-size: 0.8rem;
    transition: color 0.3s ease;
  }

  .legal-links a:hover {
    color: var(--coral);
  }

  .legal-links span {
    color: #666;
    font-size: 0.8rem;
  }

  .footer-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #999;
    font-size: 0.85rem;
  }

  .footer-badge i {
    color: #e74c3c;
    animation: heartbeat 1.5s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .footer-shapes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
  }

  .shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.03;
  }

  .shape-1 {
    width: 400px;
    height: 400px;
    background: var(--coral);
    top: -200px;
    right: -200px;
    animation: rotate 30s linear infinite;
  }

  .shape-2 {
    width: 300px;
    height: 300px;
    background: var(--deep-purple);
    bottom: -150px;
    left: -150px;
    animation: rotate 25s linear infinite reverse;
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 1024px) {
    .footer-main {
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .footer-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
  }

  @media (max-width: 768px) {
    .footer-main {
      grid-template-columns: 1fr;
      gap: 2rem;
      padding: 3rem 1rem 2rem;
    }

    .footer-stats {
      flex-direction: column;
      gap: 1rem;
      margin: 0 1rem;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .stat-number {
      font-size: 1.5rem;
      margin-bottom: 0;
    }

    .footer-bottom {
      flex-direction: column;
      text-align: center;
      padding: 2rem 1rem;
    }

    .legal-links {
      justify-content: center;
      flex-wrap: wrap;
    }

    .social-links {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .footer-main {
      padding: 2rem 1rem;
    }

    .logo-text {
      font-size: 1.4rem;
    }

    .footer-section h3 {
      font-size: 1.1rem;
    }

    .stat-number {
      font-size: 1.3rem;
    }

    .input-group {
      flex-direction: column;
      border-radius: 15px;
    }

    .newsletter-input {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .newsletter-btn {
      border-radius: 0 0 15px 15px;
    }
  }
</style>
