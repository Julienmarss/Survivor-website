<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Header from '../../lib/components/Header.svelte';
  import Footer from '../../lib/components/Footer.svelte';

  let selectedUserType = null;
  let visible = false;

  // Types d'utilisateurs avec leurs informations
  const userTypes = [
    {
      id: 'startup',
      title: 'Startup',
      description: 'Je souhaite développer mon entreprise et lever des fonds pour mes projets.',
      image: '/startup.png',
      route: '/register/startup'
    },
    {
      id: 'student',
      title: 'Étudiant',
      description: 'Je crée mon profil pour intégrer la communauté et accéder aux ressources.',
      image: '/student.png',
      route: '/register/student'
    },
    {
      id: 'investor',
      title: 'Investisseur',
      description: 'Je recherche des opportunités d\'investissement prometteuses dans l\'écosystème.',
      image: '/investor.png',
      route: '/register/investor'
    }
  ];

  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 100);
  });

  function selectUserType(userType) {
    selectedUserType = userType.id;
    // Animation de sélection
    setTimeout(() => {
      goto(userType.route);
    }, 300);
  }
</script>

<svelte:head>
  <title>Inscription - JEB Incubator</title>
  <meta name="description" content="Rejoignez la communauté JEB Incubator en tant qu'étudiant, investisseur ou startup">
</svelte:head>

<div class="min-h-screen bg-white">
  <Header />

  <!-- Section principale -->
  <section class="pt-32 pb-20 px-6 sm:px-8 lg:px-12">
    <div class="max-w-4xl mx-auto">
      
      <!-- En-tête -->
      <div class="text-center mb-16 transform transition-all duration-1000 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <h1 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 font-['Inter']">
          On ne se connaît pas encore ?
        </h1>
        <p class="text-lg text-gray-600 font-normal font-['Inter']">
          Sélectionnez le type de compte que vous souhaitez créer
        </p>
      </div>

      <!-- Cartes des types d'utilisateurs -->
      <div class="grid md:grid-cols-3 gap-6 mb-16">
        {#each userTypes as userType, index}
          <div 
            class="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gray-300 hover:shadow-lg cursor-pointer transform transition-all duration-300 {visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} {selectedUserType === userType.id ? 'border-blue-500 shadow-lg' : ''}"
            style="transition-delay: {(index + 1) * 150}ms;"
            on:click={() => selectUserType(userType)}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && selectUserType(userType)}
          >
            <!-- Illustration -->
            <div class="flex justify-center mb-8">
              <img 
                src={userType.image} 
                alt="{userType.title} illustration" 
                class="w-48 h-32 object-contain hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            <!-- Contenu -->
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-900 mb-4 font-['Inter']">
                {userType.title}
              </h3>
              <p class="text-gray-600 leading-relaxed font-['Inter']">
                {userType.description}
              </p>
            </div>

            <!-- Indicateur de sélection -->
            {#if selectedUserType === userType.id}
              <div class="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Lien de connexion -->
      <div class="text-center transform transition-all duration-1000 delay-600 {visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <p class="text-gray-500 font-['Inter']">
          Vous avez déjà un compte ? 
          <a href="/login" class="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300 underline">
            Je me connecte
          </a>
        </p>
      </div>
    </div>
  </section>

  <Footer />
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* Animation pour la sélection */
  .border-blue-500 {
    animation: pulse-border 2s infinite;
  }

  @keyframes pulse-border {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .grid.md\\:grid-cols-3 {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  /* Focus pour l'accessibilité */
  [role="button"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 4px;
  }

  /* Hover effects */
  [role="button"]:hover img {
    transform: scale(1.05);
    transition: transform 0.3s ease;
  }

  /* Styles pour les images */
  img {
    transition: all 0.3s ease;
  }

  /* Position relative pour l'indicateur de sélection */
  [role="button"] {
    position: relative;
  }
</style>