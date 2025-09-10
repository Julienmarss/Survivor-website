<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/ErrorMessage.svelte';
  import { writable } from 'svelte/store';
  
  // Imports FullCalendar
  import { Calendar } from '@fullcalendar/core';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import interactionPlugin from '@fullcalendar/interaction';

  // Interface Frontend (ce que reçoit le frontend du backend)
  interface EventFromBackend {
    firebaseId: string;
    name: string;
    description?: string;
    event_type: string;
    location: string;
    dates: string;
    target_audience?: string;
    imageUrl?: string;
    featured?: boolean;
  }

  // Interface pour le formulaire
  interface EventForm {
    id: string;
    name: string;
    description: string;
    event_type: string;
    location: string;
    dates: string;
    target_audience: string;
    imageUrl: string;
    featured: boolean;
  }

  const eventsList = writable<EventFromBackend[]>([]);
  const loading = writable(false);
  const error = writable<string | null>(null);

  let form: EventForm = {
    id: '',
    name: '',
    description: '',
    event_type: '',
    location: '',
    dates: '',
    target_audience: '',
    imageUrl: '',
    featured: false
  };
  let editing = false;

  // Variables pour le calendrier
  let calendarEl: HTMLElement;
  let calendar: Calendar | null = null;
  let showCalendar = false;

  const API_BASE = import.meta.env.PUBLIC_APIURL ?? 'http://localhost:3000';
  const API_URL = `${API_BASE}/api/events`;

  // Fonction pour convertir les événements en format FullCalendar
  function convertEventsForCalendar(events: EventFromBackend[]) {
    return events.map(event => ({
      id: event.firebaseId,
      title: event.name,
      start: event.dates,
      description: event.description,
      extendedProps: {
        event_type: event.event_type,
        location: event.location,
        target_audience: event.target_audience,
        imageUrl: event.imageUrl,
        featured: event.featured,
        originalEvent: event
      },
      backgroundColor: event.featured ? '#c174f2' : '#3b82f6',
      borderColor: event.featured ? '#a855f7' : '#2563eb',
      textColor: '#ffffff'
    }));
  }

  // Initialiser le calendrier
  function initCalendar(events: EventFromBackend[]) {
    if (!calendarEl || calendar) return;

    calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      locale: 'fr',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      buttonText: {
        today: "Aujourd'hui",
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour'
      },
      events: convertEventsForCalendar(events),
      selectable: true,
      selectMirror: true,
      height: 'auto',
      eventClick: function(info) {
        const originalEvent = info.event.extendedProps.originalEvent;
        editEvent(originalEvent);
      },
      select: function(info) {
        // Pré-remplir le formulaire avec la date sélectionnée
        form.dates = info.startStr;
        // Scroll vers le formulaire
        document.querySelector('section')?.scrollIntoView({ behavior: 'smooth' });
      },
      eventMouseEnter: function(info) {
        // Créer un tooltip personnalisé
        const tooltip = document.createElement('div');
        tooltip.className = 'calendar-tooltip';
        tooltip.innerHTML = `
          <div class="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs">
            <h4 class="font-bold text-sm mb-1">${info.event.title}</h4>
            <p class="text-xs mb-1"><strong>Type:</strong> ${info.event.extendedProps.event_type}</p>
            <p class="text-xs mb-1"><strong>Lieu:</strong> ${info.event.extendedProps.location}</p>
            ${info.event.extendedProps.description ? `<p class="text-xs">${info.event.extendedProps.description}</p>` : ''}
          </div>
        `;
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '9999';
        tooltip.style.pointerEvents = 'none';
        document.body.appendChild(tooltip);

        const updateTooltipPosition = (e: MouseEvent) => {
          tooltip.style.left = e.pageX + 10 + 'px';
          tooltip.style.top = e.pageY + 10 + 'px';
        };

        info.el.addEventListener('mousemove', updateTooltipPosition);
        info.el.addEventListener('mouseleave', () => {
          document.body.removeChild(tooltip);
        });
      }
    });

    calendar.render();
  }

  // Mettre à jour les événements du calendrier
  function updateCalendarEvents(events: EventFromBackend[]) {
    if (calendar) {
      calendar.removeAllEvents();
      calendar.addEventSource(convertEventsForCalendar(events));
    }
  }

  async function fetchEvents() {
    loading.set(true);
    error.set(null);
    
    try {
      console.log(`🔄 Fetching from: ${API_URL}`);
      const res = await fetch(API_URL);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Data received from backend:', data);
      eventsList.set(data);
      
      // Mettre à jour le calendrier
      if (showCalendar) {
        updateCalendarEvents(data);
      }
      
      console.log('Successfully fetched events');
    } catch (err: any) {
      console.error('Fetch error:', err);
      error.set(`Impossible de récupérer les events: ${err.message}`);
    } finally {
      loading.set(false);
    }
  }

  async function saveEvent() {
    loading.set(true);
    error.set(null);
    
    try {
      // Validation côté frontend
      if (!form.name.trim()) {
        throw new Error('Le nom est obligatoire');
      }
      if (!form.event_type.trim()) {
        throw new Error('Le type d\'événement est obligatoire');
      }
      if (!form.location.trim()) {
        throw new Error('La localisation est obligatoire');
      }
      if (!form.dates.trim()) {
        throw new Error('Les dates sont obligatoires');
      }

      // Mapping vers le format backend
      const backendData = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        event_type: form.event_type.trim(),
        location: form.location.trim(),
        dates: form.dates.trim(),
        target_audience: form.target_audience?.trim() || '',
        imageUrl: form.imageUrl?.trim() || undefined,
        featured: form.featured || false
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
      
      await fetchEvents();
      resetForm();
    } catch (err: any) {
      console.error('Save error:', err);
      error.set(err.message);
    } finally {
      loading.set(false);
    }
  }

  function editEvent(event: EventFromBackend) {
    console.log('Editing event:', event);
    
    form = {
      id: event.firebaseId,
      name: event.name || '',
      description: event.description || '',
      event_type: event.event_type || '',
      location: event.location || '',
      dates: event.dates ? event.dates.split('T')[0] : '',
      target_audience: event.target_audience || '',
      imageUrl: event.imageUrl || '',
      featured: event.featured || false
    };
    editing = true;
    
    // Scroll vers le formulaire
    document.querySelector('section')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function deleteEvent(firebaseId: string) {
    console.log('Deleting event with ID:', firebaseId);
    
    if (!firebaseId || firebaseId === 'undefined') {
      error.set('ID de l\'event invalide');
      return;
    }
    
    if (!confirm('Voulez-vous vraiment supprimer cet événement ?')) return;
    
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
      await fetchEvents();
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
      name: '',
      description: '',
      event_type: '',
      location: '',
      dates: '',
      target_audience: '',
      imageUrl: '',
      featured: false
    };
    editing = false;
  }

  function formatDate(isoDate: string | undefined): string {
    if (!isoDate) return 'Non défini';
    return new Date(isoDate).toLocaleDateString('fr-FR');
  }

  function isUpcoming(eventDate: string | undefined): boolean {
    if (!eventDate) return false;
    return new Date(eventDate) >= new Date();
  }

  function toggleCalendar() {
    showCalendar = !showCalendar;
    
    if (showCalendar) {
      // Délai pour laisser le DOM se mettre à jour
      setTimeout(() => {
        initCalendar($eventsList);
      }, 100);
    } else if (calendar) {
      calendar.destroy();
      calendar = null;
    }
  }

  // Réactiver le calendrier quand les événements changent
  $: if (showCalendar && calendar && $eventsList) {
    updateCalendarEvents($eventsList);
  }

  onMount(() => {
    console.log('🔧 API_BASE:', API_BASE);
    console.log('🔧 API_URL:', API_URL);
    fetchEvents();
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
  <Header />

  <main class="max-w-7xl mx-auto p-6 space-y-12">
    <h1 class="text-4xl font-bold text-gray-900 font-['Montserrat']">Admin Events</h1>

    {#if $error}
      <ErrorMessage message={$error} onRetry={fetchEvents} />
    {/if}

    {#if $loading}
      <div class="flex justify-center">
        <LoadingSpinner />
      </div>
    {/if}

    <!-- Toggle Calendrier -->
    <section class="bg-white p-4 rounded-lg shadow-md">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold font-['Montserrat']">Vue Calendrier</h2>
        <button
          on:click={toggleCalendar}
          class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-4 py-2 rounded font-semibold hover:scale-105 transform transition-transform duration-300"
        >
          {showCalendar ? 'Masquer' : 'Afficher'} le calendrier
        </button>
      </div>
      
      {#if showCalendar}
        <div class="mt-4">
          <div bind:this={calendarEl} class="calendar-container"></div>
          <div class="mt-2 text-sm text-gray-600">
            <p><span class="inline-block w-3 h-3 bg-blue-500 rounded mr-1"></span> Événements normaux</p>
            <p><span class="inline-block w-3 h-3 bg-purple-500 rounded mr-1"></span> Événements en vedette</p>
            <p class="mt-1"><strong>Astuce:</strong> Cliquez sur un événement pour le modifier, ou sélectionnez une date pour créer un nouvel événement.</p>
          </div>
        </div>
      {/if}
    </section>

    <!-- Formulaire -->
    <section class="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 class="text-2xl font-bold font-['Montserrat']">{editing ? 'Modifier' : 'Créer'} un événement</h2>
      
      {#if editing}
        <div class="bg-blue-50 p-3 rounded border border-blue-200">
          <p class="text-blue-800"><strong>Mode édition:</strong> ID = {form.id}</p>
        </div>
      {/if}
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
          type="text" 
          placeholder="Nom de l'événement*" 
          bind:value={form.name} 
          class="p-2 border rounded focus:border-purple-500 focus:outline-none"
          required 
        />
        <input 
          type="text" 
          placeholder="Type d'événement*" 
          bind:value={form.event_type} 
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
          type="datetime-local" 
          placeholder="Date et heure*" 
          bind:value={form.dates} 
          class="p-2 border rounded focus:border-purple-500 focus:outline-none"
          required 
        />
        <input 
          type="text" 
          placeholder="Public cible" 
          bind:value={form.target_audience} 
          class="p-2 border rounded focus:border-purple-500 focus:outline-none" 
        />
        <input 
          type="url" 
          placeholder="Image URL" 
          bind:value={form.imageUrl} 
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
          on:click={saveEvent} 
          class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-6 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform transition-transform duration-300"
          disabled={$loading || !form.name.trim() || !form.event_type.trim() || !form.location.trim() || !form.dates.trim()}
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

    <!-- Liste des Events -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold font-['Montserrat']">
          Événements existants ({$eventsList.length})
        </h2>
        <button 
          on:click={fetchEvents}
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold transition-colors duration-300"
          disabled={$loading}
        >
          Actualiser
        </button>
      </div>
      
      {#if $eventsList.length === 0 && !$loading}
        <div class="bg-gray-50 p-8 rounded-lg text-center">
          <p class="text-gray-500">Aucun événement trouvé</p>
          <p class="text-sm text-gray-400 mt-2">URL testée: {API_URL}</p>
        </div>
      {/if}

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each $eventsList as event}
          <div class="bg-white rounded-lg shadow-md p-4 space-y-2 hover:shadow-lg transition-shadow duration-300 {isUpcoming(event.dates) ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'}">
            <!-- Debug info -->
            <div class="text-xs text-gray-400 font-mono">
              ID: {event.firebaseId || 'undefined'}
            </div>
            
            <div class="flex items-start justify-between">
              <h3 class="text-xl font-bold font-['Montserrat'] flex-1">{event.name}</h3>
              {#if isUpcoming(event.dates)}
                <span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs ml-2">
                  À venir
                </span>
              {:else}
                <span class="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs ml-2">
                  Passé
                </span>
              {/if}
            </div>
            
            {#if event.description}
              <p class="text-gray-700 font-['Open_Sans'] line-clamp-3">{event.description}</p>
            {/if}
            
            {#if event.imageUrl}
              <img 
                src={event.imageUrl} 
                alt={event.name} 
                class="w-full h-48 object-cover rounded"
                loading="lazy"
                on:error={(e) => e.target.style.display = 'none'}
              />
            {/if}
            
            <div class="text-gray-500 text-sm space-y-1">
              <p><strong>Type:</strong> {event.event_type}</p>
              <p><strong>Lieu:</strong> {event.location}</p>
              {#if event.dates}
                <p><strong>Date:</strong> {formatDate(event.dates)}</p>
              {/if}
              {#if event.target_audience}
                <p><strong>Public:</strong> {event.target_audience}</p>
              {/if}
              {#if event.featured}
                <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  En vedette
                </span>
              {/if}
            </div>
            
            <div class="flex gap-2 mt-4">
              <button
                on:click={() => editEvent(event)}
                class="bg-gradient-to-r from-[#c174f2] to-[#cb90f1] text-white px-3 py-1 rounded font-semibold hover:scale-105 transform transition-transform duration-300"
                disabled={$loading}
              >
                Modifier
              </button>
              <button
                on:click={() => deleteEvent(event.firebaseId)}
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

  /* Styles pour FullCalendar */
  :global(.calendar-container .fc) {
    font-family: 'Open Sans', sans-serif;
  }

  :global(.calendar-container .fc-header-toolbar h2) {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
  }

  :global(.calendar-container .fc-button) {
    background: linear-gradient(to right, #c174f2, #cb90f1);
    border: none;
    font-weight: 600;
  }

  :global(.calendar-container .fc-button:hover) {
    background: linear-gradient(to right, #a855f7, #c174f2);
    transform: scale(1.05);
  }

  :global(.calendar-container .fc-event) {
    border-radius: 6px;
    padding: 2px 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  :global(.calendar-container .fc-event:hover) {
    transform: scale(1.02);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  :global(.calendar-tooltip) {
    z-index: 9999;
  }

  /* Responsive calendar */
  @media (max-width: 768px) {
    :global(.calendar-container .fc-header-toolbar) {
      flex-direction: column;
      gap: 10px;
    }
    
    :global(.calendar-container .fc-toolbar-chunk) {
      display: flex;
      justify-content: center;
    }
  }
</style>