<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let visible = false;

  function revealFallback() {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.fade-in'));
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        el.classList.add('visible');
      }
    });
  }

  onMount(() => {
    visible = true;

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              obs.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          rootMargin: '0px 0px -100px 0px',
          threshold: 0.15
        }
      );

      const elements = document.querySelectorAll<HTMLElement>('.fade-in');
      elements.forEach(el => obs.observe(el));

      return () => {
        obs.disconnect();
      };
    } else {
      revealFallback();
      window.addEventListener('scroll', revealFallback);
      return () => window.removeEventListener('scroll', revealFallback);
    }
  });
</script>

<svelte:head>
  <title>À propos - JEB Incubator</title>
  <meta
    name="description"
    content="JEB Incubator - Meeting breakthrough ideas with global capital. We fast-track early-stage startups through funding, expertise, and international networks."
  />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
  <Header />

  <main class="max-w-7xl mx-auto">
    <!-- Hero Section -->
    <section class="px-6 py-20 text-center">
      <div class="max-w-4xl mx-auto">
        <h1
          class="text-5xl md:text-7xl font-bold text-gray-900 font-['Montserrat'] mb-8 leading-tight"
          class:animate-fade-in-up={visible}
          class:opacity-0={!visible}
        >
          <span class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] bg-clip-text text-transparent">
            JEB Incubator
          </span>
        </h1>

        <p
          class="text-xl md:text-2xl text-gray-700 font-['Open_Sans'] leading-relaxed"
          class:animate-fade-in-up-delay-1={visible}
          class:opacity-0={!visible}
        >
          Meeting breakthrough ideas with
          <span class="font-semibold text-[#c174f2]">global capital</span>. We fast-track early-stage
          startups by providing funding, expertise, and an unparalleled international network.
        </p>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="px-6 py-16">
      <div class="max-w-6xl mx-auto">
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 fade-in">
          <div class="text-center mb-12">
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 font-['Montserrat'] mb-6">
              Notre Mission
            </h2>
            <div class="w-24 h-1 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] mx-auto rounded-full"></div>
          </div>

          <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
              <p class="text-lg text-gray-700 font-['Open_Sans'] leading-relaxed">
                Cultiver un écosystème vibrant où les entrepreneurs prospèrent. Grâce à un mentorat
                pratique, des partenariats stratégiques et des investissements de pré-amorçage jusqu'à
                <span class="font-bold text-[#c174f2]">£200k</span>, nous transformons les visions
                audacieuses en entreprises évolutives.
              </p>

              <div class="grid grid-cols-2 gap-6 mt-8">
                <div class="text-center p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
                  <div class="text-3xl font-bold text-[#c174f2] font-['Montserrat']">£200k</div>
                  <div class="text-sm text-gray-600 font-['Open_Sans']">Investissement max</div>
                </div>
                <div class="text-center p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
                  <div class="text-3xl font-bold text-[#c174f2] font-['Montserrat']">100%</div>
                  <div class="text-sm text-gray-600 font-['Open_Sans']">Accompagnement</div>
                </div>
              </div>
            </div>

            <div class="relative">
              <div class="bg-gradient-to-br from-[#c174f2] to-[#cb90f1] rounded-3xl p-8 text-white shadow-2xl">
                <h3 class="text-2xl font-bold font-['Montserrat'] mb-4">Innovation Hub</h3>
                <p class="font-['Open_Sans'] opacity-90">
                  Un environnement conçu pour transformer les idées révolutionnaires en succès
                  commerciaux durables.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- What We Offer Section -->
    <section class="px-6 py-16">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16 fade-in">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 font-['Montserrat'] mb-6">
            Ce que nous offrons
          </h2>
          <p class="text-xl text-gray-700 font-['Open_Sans'] max-w-3xl mx-auto">
            De la validation produit à l'expansion marché, JEB fournit les ressources critiques dont
            les fondateurs ont besoin à chaque étape du parcours.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 fade-in">
            <h3 class="text-2xl font-bold text-gray-900 font-['Montserrat'] mb-4 text-center">Financement</h3>
            <p class="text-gray-700 font-['Open_Sans'] text-center leading-relaxed">
              Investissements de pré-amorçage jusqu'à £200k pour accélérer votre croissance et valider votre modèle économique.
            </p>
          </div>

          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 fade-in">
            <h3 class="text-2xl font-bold text-gray-900 font-['Montserrat'] mb-4 text-center">Expertise</h3>
            <p class="text-gray-700 font-['Open_Sans'] text-center leading-relaxed">
              Mentorat de haut niveau avec des experts sectoriels et des entrepreneurs expérimentés pour guider votre stratégie.
            </p>
          </div>

          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 fade-in">
            <h3 class="text-2xl font-bold text-gray-900 font-['Montserrat'] mb-4 text-center">Réseau</h3>
            <p class="text-gray-700 font-['Open_Sans'] text-center leading-relaxed">
              Accès à notre réseau international d'investisseurs, partenaires et clients potentiels dans le monde entier.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Global Reach Section -->
    <section class="px-6 py-16">
      <div class="max-w-6xl mx-auto">
        <div class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-3xl shadow-2xl p-8 md:p-12 text-white fade-in">
          <div class="text-center mb-12">
            <h2 class="text-4xl md:text-5xl font-bold font-['Montserrat'] mb-6">Portée Mondiale</h2>
            <p class="text-xl font-['Open_Sans'] opacity-90 max-w-3xl mx-auto">
              Basé à Londres avec des hubs à New York, Singapour et Berlin, nos anciens ont levé plus de £500M et créé 3000+ emplois dans le monde.
            </p>
          </div>

          <div class="grid md:grid-cols-4 gap-8 text-center">
            <div class="transform hover:scale-110 transition-transform duration-300">
              <h3 class="text-xl font-bold font-['Montserrat'] mb-2">Londres</h3>
              <p class="text-sm opacity-80 font-['Open_Sans']">Siège social</p>
            </div>
            <div class="transform hover:scale-110 transition-transform duration-300">
              <h3 class="text-xl font-bold font-['Montserrat'] mb-2">New York</h3>
              <p class="text-sm opacity-80 font-['Open_Sans']">Hub Amérique</p>
            </div>
            <div class="transform hover:scale-110 transition-transform duration-300">
              <h3 class="text-xl font-bold font-['Montserrat'] mb-2">Singapour</h3>
              <p class="text-sm opacity-80 font-['Open_Sans']">Hub Asie</p>
            </div>
            <div class="transform hover:scale-110 transition-transform duration-300">
              <h3 class="text-xl font-bold font-['Montserrat'] mb-2">Berlin</h3>
              <p class="text-sm opacity-80 font-['Open_Sans']">Hub Europe</p>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-8 mt-16 text-center">
            <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
              <div class="text-4xl font-bold font-['Montserrat'] mb-2">£500M+</div>
              <p class="text-sm opacity-80 font-['Open_Sans']">Levées de fonds des alumni</p>
            </div>
            <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
              <div class="text-4xl font-bold font-['Montserrat'] mb-2">3000+</div>
              <p class="text-sm opacity-80 font-['Open_Sans']">Emplois créés</p>
            </div>
            <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
              <div class="text-4xl font-bold font-['Montserrat'] mb-2">4</div>
              <p class="text-sm opacity-80 font-['Open_Sans']">Hubs internationaux</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Success Stories Section -->
    <section class="px-6 py-16">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16 fade-in">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 font-['Montserrat'] mb-6">Success Stories</h2>
          <p class="text-xl text-gray-700 font-['Open_Sans'] max-w-3xl mx-auto">
            Découvrez quelques-unes des startups révolutionnaires qui ont commencé leur parcours chez JEB Incubator.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 fade-in">
            <div class="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl mb-6"></div>
            <h3 class="text-xl font-bold text-gray-900 font-['Montserrat'] mb-3">TechFlow AI</h3>
            <p class="text-gray-700 font-['Open_Sans'] text-sm mb-4">IA révolutionnaire pour l'automatisation des processus métier. Levée de £15M en série A.</p>
            <div class="flex justify-between text-sm">
              <span class="text-[#c174f2] font-semibold">Série A</span>
              <span class="text-gray-500">2023</span>
            </div>
          </div>

          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 fade-in">
            <div class="w-full h-48 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl mb-6"></div>
            <h3 class="text-xl font-bold text-gray-900 font-['Montserrat'] mb-3">GreenTech Solutions</h3>
            <p class="text-gray-700 font-['Open_Sans'] text-sm mb-4">Solutions durables pour l'industrie. Expansion dans 12 pays et 500+ emplois créés.</p>
            <div class="flex justify-between text-sm">
              <span class="text-[#c174f2] font-semibold">Expansion</span>
              <span class="text-gray-500">2022</span>
            </div>
          </div>

          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 fade-in">
            <div class="w-full h-48 bg-gradient-to-br from-pink-400 to-red-500 rounded-xl mb-6"></div>
            <h3 class="text-xl font-bold text-gray-900 font-['Montserrat'] mb-3">HealthCore</h3>
            <p class="text-gray-700 font-['Open_Sans'] text-sm mb-4">Plateforme médicale connectée. Acquisition par un groupe pharmaceutique majeur.</p>
            <div class="flex justify-between text-sm">
              <span class="text-[#c174f2] font-semibold">Acquisition</span>
              <span class="text-gray-500">2024</span>
            </div>
          </div>
        </div>

        <!-- Team -->
        <div class="text-center mt-16 fade-in">
          <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-4xl mx-auto">
            <h3 class="text-3xl font-bold text-gray-900 font-['Montserrat'] mb-6">L'équipe</h3>

            <div class="grid md:grid-cols-3 gap-6">
              <div class="p-4">
                <div class="text-lg font-semibold">Elena Enka</div>
                <div class="text-sm text-gray-600">JEB Special Manager of your Joy</div>
              </div>

              <div class="p-4">
                <div class="text-lg font-semibold">Javier Barrera</div>
                <div class="text-sm text-gray-600">Head Project Manager at JEB Incubator</div>
              </div>

              <div class="p-4">
                <div class="text-lg font-semibold">Bylel</div>
                <div class="text-sm text-gray-600">Lead Developer<br/>Cross-Projects Unit – JEB</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  </main>

  <Footer />
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');

  .fade-in {
    opacity: 1;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-fade-in-up-delay-1 {
    animation: fadeInUp 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.25s both;
  }

  .hover\:scale-105:hover {
    transform: scale(1.05);
  }
  .hover\:scale-110:hover {
    transform: scale(1.10);
  }

  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
  }

  @media (max-width: 768px) {
    .text-5xl {
      font-size: 2.25rem;
    }
    .text-7xl {
      font-size: 3rem;
    }
  }
</style>
