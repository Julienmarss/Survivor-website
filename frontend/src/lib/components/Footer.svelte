<script>
  let email = '';

  function handleSubscribe() {
    if (email) {
      console.log('Email inscrit:', email);
      // Ici tu peux ajouter ta logique d'inscription
      email = '';
    }
  }
</script>

<footer class="bg-gray-900 text-white">
  <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

      <!-- Informations de l'entreprise -->
      <div class="lg:col-span-1">
        <div class="flex items-center space-x-2 mb-6">
          <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#f18585] rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xl font-['Montserrat']">J</span>
          </div>
          <div>
            <h3 class="text-xl font-bold font-['Montserrat']">JEB <span class="text-[#c174f2]">Incubateur</span></h3>
            <p class="text-sm text-gray-400 font-['Open_Sans']">Hub d'Innovation</p>
          </div>
        </div>
        <p class="text-gray-300 mb-6 font-['Open_Sans'] leading-relaxed">
          Nous accompagnons les entrepreneurs pour transformer leurs idées innovantes en entreprises prospères grâce au mentorat, au financement et aux partenariats stratégiques.
        </p>
        <div class="flex space-x-4">
          <!-- Icônes des réseaux sociaux -->
          <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#c174f2] transition-colors duration-300">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
          </a>
          <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#c174f2] transition-colors duration-300">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#c174f2] transition-colors duration-300">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.749.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.162-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-12.013C24.007 5.367 18.641.001.017 0z"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Liens rapides -->
      <div>
        <h4 class="text-lg font-semibold mb-6 font-['Montserrat']">Liens rapides</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">À propos</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Nos projets</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Success stories</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Actualités & événements</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Contact</a></li>
        </ul>
      </div>

      <!-- Pour les startups -->
      <div>
        <h4 class="text-lg font-semibold mb-6 font-['Montserrat']">Pour les startups</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Postuler maintenant</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Détails du programme</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Mentorat</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Ressources</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Réseau alumni</a></li>
        </ul>
      </div>

      <!-- Pour les investisseurs -->
      <div>
        <h4 class="text-lg font-semibold mb-6 font-['Montserrat']">Pour les investisseurs</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Opportunités d'investissement</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Due diligence</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Portefeuille</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Partenariat</a></li>
          <li><a href="#" class="text-gray-300 hover:text-[#c174f2] transition-colors duration-300 font-['Open_Sans']">Événements & pitch days</a></li>
        </ul>
      </div>
    </div>

    <!-- Inscription newsletter -->
    <div class="border-t border-gray-800 mt-12 pt-8">
      <div class="md:flex md:items-center md:justify-between">
        <div class="md:w-1/2">
          <h4 class="text-lg font-semibold mb-4 font-['Montserrat']">Restez informé</h4>
          <p class="text-gray-300 mb-4 font-['Open_Sans']">Recevez les dernières actualités de nos startups et des événements à venir.</p>
        </div>
        <div class="md:w-1/2 md:pl-8">
          <div class="flex flex-col sm:flex-row gap-3">
            <input
                    type="email"
                    bind:value={email}
                    placeholder="Entrez votre email"
                    class="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c174f2] focus:border-transparent font-['Open_Sans']"
            />
            <button
                    on:click={handleSubscribe}
                    class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 font-['Open_Sans']"
            >
              S'inscrire
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer bas de page -->
    <div class="border-t border-gray-800 mt-8 pt-8 md:flex md:items-center md:justify-between">
      <div class="text-gray-400 text-sm font-['Open_Sans']">
        <p>&copy; 2024 JEB Incubateur. Tous droits réservés.</p>
      </div>
      <div class="mt-4 md:mt-0">
        <div class="flex flex-wrap space-x-6">
          <a href="#" class="text-gray-400 hover:text-[#c174f2] text-sm transition-colors duration-300 font-['Open_Sans']">Politique de confidentialité</a>
          <a href="#" class="text-gray-400 hover:text-[#c174f2] text-sm transition-colors duration-300 font-['Open_Sans']">Conditions d'utilisation</a>
          <a href="#" class="text-gray-400 hover:text-[#c174f2] text-sm transition-colors duration-300 font-['Open_Sans']">Politique des cookies</a>
        </div>
      </div>
    </div>
  </div>
</footer>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>