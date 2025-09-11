<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/ErrorMessage.svelte';
  import { writable } from 'svelte/store';

  // Interface Frontend 
  interface NewsFromBackend {
    firebaseId: string;
    title: string;
    description?: string;
    category: string;
    location: string;
    imageUrl?: string;
    featured?: boolean;
    news_date?: string;
    startup_id?: number;
  }

  // Interface pour le formulaire
  interface NewsForm {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    imageUrl: string;
    featured: boolean;
    publishedAt: string;
    startupId: string;
  }

  const newsList = writable<NewsFromBackend[]>([]);
  const loading = writable(false);
  const error = writable<string | null>(null);

  let form: NewsForm = {
    id: '',
    title: '',
    description: '',
    category: '',
    location: '',
    imageUrl: '',
    featured: false,
    publishedAt: '',
    startupId: ''
  };
  let editing = false;

  const API_BASE = import.meta.env.PUBLIC_APIURL ?? 'http://localhost:3000';
  const API_URL = `${API_BASE}/api/news`;

  async function fetchNews() {
    loading.set(true);
    error.set(null);
    
    try {
      console.log(`Fetching from: ${API_URL}`);
      const res = await fetch(API_URL);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Data received from backend:', data);
      newsList.set(data);
      console.log('Successfully fetched news');
    } catch (err: any) {
      console.error('Fetch error:', err);
      error.set(`Impossible de récupérer les news: ${err.message}`);
    } finally {
      loading.set(false);
    }
  }

  async function saveNews() {
    loading.set(true);
    error.set(null);
    
    try {
      // Validation côté frontend
      if (!form.title.trim()) {
        throw new Error('Le titre est obligatoire');
      }
      if (!form.category.trim()) {
        throw new Error('La catégorie est obligatoire');
      }
      if (!form.location.trim()) {
        throw new Error('La localisation est obligatoire');
      }

      // Mapping vers le format backend
      const backendData = {
        title: form.title.trim(),
        description: form.description?.trim() || '',
        category: form.category.trim(),
        location: form.location.trim(),
        imageUrl: form.imageUrl?.trim() || undefined,
        featured: form.featured || false,
        publishedAt: form.publishedAt || new Date().toISOString(),
        startupId: form.startupId?.trim() || undefined
      };

      console.log('Sending to backend:', backendData);

      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `${API_URL}/${form.id}` : API_URL;
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(backendData)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Erreur ${res.status}`;
        } catch {
          errorMessage = `Erreur ${res.status}: ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      console.log('Save success:', result);
      
      await fetchNews();
      resetForm();
    } catch (err: any) {
      console.error('Save error:', err);
      error.set(err.message);
    } finally {
      loading.set(false);
    }
  }

  function editNews(news: NewsFromBackend) {
    console.log('Editing news:', news);
    
    form = {
      id: news.firebaseId,
      title: news.title || '',
      description: news.description || '',
      category: news.category || '',
      location: news.location || '',
      imageUrl: news.imageUrl || '',
      featured: news.featured || false,
      publishedAt: news.news_date ? news.news_date.split('T')[0] : '',
      startupId: news.startup_id ? news.startup_id.toString() : ''
    };
    editing = true;
  }

  async function deleteNews(firebaseId: string) {
    console.log('Deleting news with ID:', firebaseId);
    
    if (!firebaseId || firebaseId === 'undefined') {
      error.set('ID de la news invalide');
      return;
    }
    
    if (!confirm('Voulez-vous vraiment supprimer cette news ?')) return;
    
    loading.set(true);
    error.set(null);
    
    try {
      const res = await fetch(`${API_URL}/${firebaseId}`, { 
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Erreur ${res.status}`;
        } catch {
          errorMessage = `Erreur ${res.status}: ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      
      console.log('Delete success');
      await fetchNews();
    } catch (err: any) {
      console.error('Delete error:', err);
      error.set(err.message);
    } finally {
      loading.set(false);
    }
  }

  function resetForm() {
    form = {
      id: '',
      title: '',
      description: '',
      category: '',
      location: '',
      imageUrl: '',
      featured: false,
      publishedAt: '',
      startupId: ''
    };
    editing = false;
  }

  function formatDate(isoDate: string | undefined): string {
    if (!isoDate) return 'Non défini';
    return new Date(isoDate).toLocaleDateString('fr-FR');
  }

  onMount(() => {
    console.log('API_BASE:', API_BASE);
    console.log('API_URL:', API_URL);
    fetchNews();
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
  <Header />

  <main class="max-w-7xl mx-auto p-6 space-y-12">
    <h1 class="text-4xl font-bold text-gray-900 font-['Montserrat']">Admin News</h1>

    {#if $error}
      <ErrorMessage message={$error} onRetry={fetchNews} />
    {/if}

    {#if $loading}
      <div class="flex justify-center">
        <LoadingSpinner />
      </div>
    {/if}

    <!-- Formulaire -->
    <section class="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 class="text-2xl font-bold font-['Montserrat']">{editing ? 'Modifier' : 'Créer'} une news</h2>
      
      {#if editing}
        <div class="bg-blue-50 p-3 rounded border border-blue-200">
          <p class="text-blue-800"><strong>Mode édition:</strong> ID = {form.id}</p>
        </div>
      {/if}
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
          type="text" 
          placeholder="Titre*" 
          bind:value={form.title} 
          class="p-2 border rounded focus:border-purple-500 focus:outline-none"
          required 
        />
        <input 
          type="text" 
          placeholder="Catégorie*" 
          bind:value={form.category} 
          class="p-2 border rounded focus:border-purple-500 focus:outline-none"
          required 
        />
        <input 
          type="text" 
          placeholder="Lieu*" 
          bind:value={form.location} 
          class="p-2 border rounded focus:border-purple-500 focus:outline-none"
          required 
        />
        <input 
          type="url" 
          placeholder="Image URL" 
          bind:value={form.imageUrl} 
          class="p-2 border rounded focus:border-purple-500 focus:outline-none" 
        />
        <input 
          type="text" 
          placeholder="Startup ID (optionnel)" 
          bind:value={form.startupId} 
          class="p-2 border rounded focus:border-purple-500 focus:outline-none" 
        />
        <input 
          type="date" 
          placeholder="Publié le" 
          bind:value={form.publishedAt} 
          class="p-2 border rounded focus:border-purple-500 focus:outline-none" 
        />
      </div>
      <textarea 
        placeholder="Description" 
        bind:value={form.description} 
        class="w-full p-2 border rounded h-24 focus:border-purple-500 focus:outline-none"
      ></textarea>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" bind:checked={form.featured} class="rounded" />
        <span class="text-gray-700">En Vedette</span>
      </label>
      <div class="flex gap-4">
        <button 
          on:click={saveNews} 
          class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform transition-transform duration-300"
          disabled={$loading || !form.title.trim() || !form.category.trim() || !form.location.trim()}
        >
          {$loading ? 'Loading' : (editing ? 'Modifier' : 'Créer')}
        </button>
        <button 
          on:click={resetForm} 
          class="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded font-semibold transition-colors duration-300"
          disabled={$loading}
        >
          Annuler
        </button>
      </div>
    </section>

    <!-- Liste des News -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold font-['Montserrat']">
          News existantes ({$newsList.length})
        </h2>
        <button 
          on:click={fetchNews}
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold transition-colors duration-300"
          disabled={$loading}
        >
          Actualiser
        </button>
      </div>
      
      {#if $newsList.length === 0 && !$loading}
        <div class="bg-gray-50 p-8 rounded-lg text-center">
          <p class="text-gray-500">Aucune news trouvée</p>
          <p class="text-sm text-gray-400 mt-2">URL testée: {API_URL}</p>
        </div>
      {/if}

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each $newsList as news}
          <div class="bg-white rounded-lg shadow-md p-4 space-y-2 hover:shadow-lg transition-shadow duration-300">
            <!-- Debug info -->
            <div class="text-xs text-gray-400 font-mono">
              ID: {news.firebaseId || 'undefined'}
            </div>
            
            <h3 class="text-xl font-bold font-['Montserrat']">{news.title}</h3>
            {#if news.description}
              <p class="text-gray-700 font-['Open_Sans'] line-clamp-3">{news.description}</p>
            {/if}
            
            {#if news.imageUrl}
              <img 
                src={news.imageUrl} 
                alt={news.title} 
                class="w-full h-48 object-cover rounded"
                loading="lazy"
                on:error={(e) => e.target.style.display = 'none'}
              />
            {/if}
            
            <div class="text-gray-500 text-sm space-y-1">
              <p><strong>Catégorie:</strong> {news.category}</p>
              <p><strong>Lieu:</strong> {news.location}</p>
              {#if news.news_date}
                <p><strong>Publié:</strong> {formatDate(news.news_date)}</p>
              {/if}
              {#if news.startup_id}
                <p><strong>Startup:</strong> #{news.startup_id}</p>
              {/if}
              {#if news.featured}
                <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  En vedette
                </span>
              {/if}
            </div>
            
            <div class="flex gap-2 mt-4">
              <button
                on:click={() => editNews(news)}
                class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-3 py-1 rounded font-semibold hover:scale-105 transform transition-transform duration-300"
                disabled={$loading}
              >
                Modifier
              </button>
              <button
                on:click={() => deleteNews(news.firebaseId)}
                class="bg-gradient-to-r from-[#f18585] to-[#f49c9c] text-white px-3 py-1 rounded font-semibold hover:scale-105 transform transition-transform duration-300"
                disabled={$loading}
              >
                Supprimer
              </button>
            </div>
          </div>
        {/each}
      </div>
    </section>
  </main>

  <Footer />
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>