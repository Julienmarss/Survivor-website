<script>
  import { onMount } from 'svelte';
  import { projects, sectors, loading, error, startupsActions } from '$lib/stores/projects.js';
  import ProjectCard from '$lib/components/ProjectCard.svelte';

  // Filtres & state UI
  let searchQuery = '';
  let selectedSector = 'all';
  let gridContainer;
  let visible = false;
  let showDetails = false;
  let selectedProject = null;
  let dialogEl; // focus sur la modale

  // Pagination
  let currentPage = 1;
  let totalPages = 1;
  let total = 0;
  const limit = 12;

  // États dérivés des stores
  $: projectList = $projects ?? [];
  $: sectorList = $sectors ?? [];
  $: isLoading = $loading;
  $: errorMessage = $error;

  // États locaux
  let syncing = false;        // état du bouton "Synchroniser"
  let autoSyncedOnce = false; // évite la boucle de seed
  let mounted = false;        // pour éviter un fetch au premier render via le watcher de filtres
  let lastSearch = '';
  let lastSector = 'all';

  // Normalisation des données pour la modal (anti-casse)
  function normalizeProject(p) {
    if (!p) return null;
    const founders = Array.isArray(p.founders)
      ? p.founders.map(f => (typeof f === 'string' ? f : f?.name)).filter(Boolean)
      : [];

    const createdYear =
      p.year ??
      (p.created_at ? new Date(p.created_at).getFullYear() : '');

    return {
      id: p.id,
      title: p.title ?? p.name ?? 'Projet',
      description: p.description ?? 'Aucune description fournie.',
      status: p.status ?? p.project_status ?? '—',
      sector: p.sector ?? '—',
      maturity: p.maturity ?? '—',
      foundersNames: founders.length ? founders.join(', ') : '—',
      needs: p.needs ?? '',
      email: p.email ?? '—',
      website: p.website ?? p.website_url ?? '',
      social: p.social ?? p.social_media_url ?? '',
      gradient: p.gradient ?? 'linear-gradient(135deg, var(--coral), #f7a8a8)',
      icon: p.icon ?? 'fas fa-rocket',
      year: createdYear,
      tags: Array.isArray(p.tags) ? p.tags : [],
      funding: p.funding ?? 'Non spécifié' // déjà formaté côté store
    };
  }

  $: view = selectedProject ? normalizeProject(selectedProject) : null;

  onMount(async () => {
    // 1) Load initial + seed auto si vide
    await loadData({ ensureSeed: true });

    // 2) Animation d’apparition
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            visible = true;
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    if (gridContainer) observer.observe(gridContainer);

    mounted = true; // active le watcher de filtres
    return () => observer.disconnect();
  });

  async function loadData({ ensureSeed = false } = {}) {
    try {
      const params = {
        page: Math.max(1, Math.min(currentPage, totalPages || 1)),
        limit,
        ...(selectedSector !== 'all' && { sector: selectedSector }),
        ...(searchQuery.trim() && { search: searchQuery.trim() })
      };

      const response = await startupsActions.fetchAll(params);
      totalPages = response?.totalPages ?? 1;
      total = response?.total ?? 0;

      // Auto-seed JEB si aucune donnée locale
      if (ensureSeed && total === 0 && !autoSyncedOnce) {
        autoSyncedOnce = true;
        try {
          syncing = true;
          await startupsActions.syncWithJeb();
          // Recharger après seed
          const r2 = await startupsActions.fetchAll(params);
          totalPages = r2?.totalPages ?? 1;
          total = r2?.total ?? 0;
          // Recharger aussi les secteurs
          await startupsActions.fetchSectors();
        } catch (e) {
          console.error('Auto-sync failed:', e);
        } finally {
          syncing = false;
        }
      }

      // Charger les secteurs si pas encore fait
      if (!sectorList?.length) {
        await startupsActions.fetchSectors();
      }

      return response;
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }

  // Watcher des filtres (sans doublon initial)
  $: if (
    mounted &&
    (searchQuery !== lastSearch || selectedSector !== lastSector)
  ) {
    lastSearch = searchQuery;
    lastSector = selectedSector;
    currentPage = 1;
    debounceSearch();
  }

  let searchTimeout;
  function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadData();
    }, 300);
  }

  function clearFilters() {
    searchQuery = '';
    selectedSector = 'all';
    // le watcher déclenchera loadData()
  }

  async function handlePageChange(page) {
    const next = Math.max(1, Math.min(page, totalPages));
    if (next === currentPage) return;
    currentPage = next;
    await loadData();
    if (gridContainer) {
      gridContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function openDetails(project) {
    selectedProject = project;
    showDetails = true;
    document.documentElement.style.overflow = 'hidden';

    // focus accessible sur la modale
    queueMicrotask(() => {
      dialogEl?.focus?.();
    });
  }

  function closeDetails() {
    showDetails = false;
    selectedProject = null;
    document.documentElement.style.overflow = '';
  }

  function handleProjectClick(e) {
    openDetails(e.detail);
  }

  function handleViewDetails(e) {
    openDetails(e.detail);
  }

  // a11y : fermer via clavier sur le backdrop
  function backdropKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeDetails();
    }
  }

  async function handleSync() {
    try {
      syncing = true;
      await startupsActions.syncWithJeb();
      await loadData();
      await startupsActions.fetchSectors();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      syncing = false;
    }
  }
</script>

<svelte:window on:keydown={(e) => e.key === 'Escape' && showDetails && closeDetails()} />

<section class="projects" id="projects" bind:this={gridContainer}>
  <div class="container">
    <!-- En-tête avec bouton de sync -->
    <div class="section-header" class:animate={visible}>
      <div class="eyebrow">Portfolio</div>
      <h2 class="section-title">Nos Startups à Succès</h2>
      <p class="section-subtitle">
        Découvrez les projets innovants qui façonnent l'avenir, soutenus par notre écosystème d'excellence
      </p>
      <button 
        class="btn-sync" 
        on:click={handleSync}
        disabled={isLoading || syncing}
        title="Synchroniser avec l'API JEB"
        aria-label="Synchroniser les données avec l'API JEB"
      >
        <i class="fas fa-sync-alt" class:spinning={isLoading || syncing} aria-hidden="true"></i>
        {syncing ? 'Synchronisation…' : 'Synchroniser'}
      </button>
    </div>

    <!-- Filtres -->
    <div class="filters" class:animate={visible} role="search">
      <div class="search">
        <i class="fas fa-search" aria-hidden="true"></i>
        <input
          class="search-input"
          type="text"
          placeholder="Rechercher un projet, une techno..."
          bind:value={searchQuery}
          aria-label="Recherche de projets"
        />
        {#if searchQuery}
          <button
            class="clear-search"
            type="button"
            aria-label="Effacer la recherche"
            on:click={clearFilters}
            title="Effacer"
          >
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        {/if}
      </div>

      <div class="divider" aria-hidden="true"></div>

      <div class="select-wrapper">
        <i class="fas fa-filter" aria-hidden="true"></i>
        <select bind:value={selectedSector} aria-label="Filtrer par secteur">
          <option value="all">Tous les secteurs</option>
          {#each sectorList as s (s.name)}
            <option value={s.name}>{s.name} ({s.count})</option>
          {/each}
        </select>
      </div>

      <button class="btn-reset" type="button" on:click={clearFilters} aria-label="Réinitialiser les filtres">
        Réinitialiser
      </button>

      <div class="meta" aria-live="polite">
        <span class="count">{total}</span> projet{total > 1 ? 's' : ''}
      </div>
    </div>

    <!-- État de chargement -->
    {#if isLoading && !errorMessage}
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
        <p>Chargement des projets...</p>
      </div>
    {/if}

    <!-- État d'erreur -->
    {#if errorMessage && !isLoading}
      <div class="error-state" role="alert">
        <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
        <h3>Erreur de chargement</h3>
        <p>{errorMessage}</p>
        <button class="btn-retry" on:click={() => loadData()}>Réessayer</button>
      </div>
    {/if}

    <!-- Grille des projets -->
    {#if projectList.length && !isLoading && !errorMessage}
      <div class="grid" class:animate={visible}>
        {#each projectList as project (project.id)}
          <ProjectCard
            {project}
            on:click={handleProjectClick}
            on:viewDetails={handleViewDetails}
          />
        {/each}
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="pagination" role="navigation" aria-label="Pagination">
          <button
            class="page-btn"
            disabled={currentPage === 1}
            on:click={() => handlePageChange(1)}
            aria-label="Première page"
            title="Première page"
          >
            <i class="fas fa-angle-double-left" aria-hidden="true"></i>
          </button>
          
          <button
            class="page-btn"
            disabled={currentPage === 1}
            on:click={() => handlePageChange(currentPage - 1)}
            aria-label="Page précédente"
            title="Page précédente"
          >
            <i class="fas fa-angle-left" aria-hidden="true"></i>
          </button>

          <span class="page-info" aria-live="polite">
            Page {currentPage} sur {Math.max(totalPages, 1)}
          </span>

          <button
            class="page-btn"
            disabled={currentPage === totalPages}
            on:click={() => handlePageChange(currentPage + 1)}
            aria-label="Page suivante"
            title="Page suivante"
          >
            <i class="fas fa-angle-right" aria-hidden="true"></i>
          </button>
          
          <button
            class="page-btn"
            disabled={currentPage === totalPages}
            on:click={() => handlePageChange(totalPages)}
            aria-label="Dernière page"
            title="Dernière page"
          >
            <i class="fas fa-angle-double-right" aria-hidden="true"></i>
          </button>
        </div>
      {/if}
    {:else if !isLoading && !errorMessage}
      <div class="empty-state" class:animate={visible}>
        <i class="fas fa-search" aria-hidden="true"></i>
        <h3>Aucun projet trouvé</h3>
        <p>Essayez un autre mot-clé ou réinitialisez les filtres.</p>
        <button class="btn-secondary" type="button" on:click={clearFilters}>
          Réinitialiser les filtres
        </button>
      </div>
    {/if}
  </div>

  <!-- Décor -->
  <div class="bg" aria-hidden="true">
    <div class="blob b1"></div>
    <div class="blob b2"></div>
    <div class="grid-overlay"></div>
  </div>

  <!-- Modal détails -->
  {#if showDetails && view}
    <!-- Backdrop: rôle bouton + clavier -->
    <div
      class="modal-backdrop"
      role="button"
      tabindex="0"
      aria-label="Fermer la fenêtre modale"
      on:click={closeDetails}
      on:keydown={backdropKeydown}
    >
      <!-- La vraie modale porte role="dialog" -->
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabindex="-1"
        on:click|stopPropagation
        bind:this={dialogEl}
      >
        <button class="modal-close" on:click={closeDetails} aria-label="Fermer">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>

        <div class="modal-header" style="background: {view.gradient}">
          <div class="modal-badges">
            <span class="badge left">{view.status}</span>
            <span class="badge right">{view.sector}</span>
          </div>
          <i class={view.icon} aria-hidden="true"></i>
        </div>

        <div class="modal-body">
          <div class="modal-title-row">
            <h3 class="modal-title" id="modal-title">{view.title}</h3>
            {#if view.year}<div class="modal-year">{view.year}</div>{/if}
          </div>

          <p class="modal-desc">{view.description}</p>

          <div class="modal-meta">
            <div class="meta-item">
              <i class="fas fa-shield-alt" aria-hidden="true"></i>
              <span>Statut</span>
              <strong>{view.status}</strong>
            </div>
            <div class="meta-item">
              <i class="fas fa-tags" aria-hidden="true"></i>
              <span>Secteur</span>
              <strong>{view.sector}</strong>
            </div>
            <div class="meta-item">
              <i class="fas fa-chart-line" aria-hidden="true"></i>
              <span>Maturité</span>
              <strong>{view.maturity}</strong>
            </div>
            <div class="meta-item">
              <i class="fas fa-user-tie" aria-hidden="true"></i>
              <span>Fondateurs</span>
              <strong>{view.foundersNames}</strong>
            </div>
            {#if view.needs}
              <div class="meta-item">
                <i class="fas fa-handshake" aria-hidden="true"></i>
                <span>Besoins</span>
                <strong>{view.needs}</strong>
              </div>
            {/if}
            <div class="meta-item">
              <i class="fas fa-envelope" aria-hidden="true"></i>
              <span>Contact</span>
              <strong>{view.email}</strong>
            </div>
            <div class="meta-item">
              <i class="fas fa-hand-holding-usd" aria-hidden="true"></i>
              <span>Levées</span>
              <strong>{view.funding}</strong>
            </div>
          </div>

          {#if view.tags.length}
            <div class="modal-tags">
              {#each view.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          {/if}

          <div class="modal-actions">
            {#if view.website}
              <a href={view.website} target="_blank" rel="noopener noreferrer" class="btn-primary">
                <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                Site web
              </a>
            {/if}
            {#if view.social}
              <a href={view.social} target="_blank" rel="noopener noreferrer" class="btn-secondary">
                <i class="fab fa-linkedin" aria-hidden="true"></i>
                LinkedIn
              </a>
            {/if}
            <button class="btn-ghost" type="button" on:click={closeDetails}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .projects {
    position: relative;
    padding: 5rem 1.5rem 6rem;
    background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
    overflow: hidden;
  }
  
  .container { 
    max-width: 1400px; 
    margin: 0 auto; 
  }

  .section-header { 
    text-align: center; 
    margin-bottom: 2rem; 
    opacity: 0; 
    transform: translateY(20px); 
    transition: all 0.6s ease; 
  }
  
  .section-header.animate { 
    opacity: 1; 
    transform: none; 
  }
  
  .eyebrow { 
    display: inline-block; 
    font-weight: 700; 
    font-size: 0.85rem; 
    letter-spacing: .12em; 
    text-transform: uppercase; 
    background: var(--light-gradient); 
    color: var(--deep-purple); 
    padding: 6px 12px; 
    border-radius: 999px; 
    margin-bottom: .75rem; 
  }
  
  .section-title { 
    font-size: clamp(1.8rem, 3.2vw, 2.6rem); 
    font-weight: 800; 
    background: var(--primary-gradient); 
    -webkit-background-clip: text; 
    -webkit-text-fill-color: transparent; 
    background-clip: text; 
    margin-bottom: .5rem; 
  }
  
  .section-subtitle { 
    color: var(--gray); 
    max-width: 850px; 
    margin: 0.25rem auto 0; 
  }

  .btn-sync {
    background: var(--primary-gradient);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 50px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 1rem auto 0;
  }

  .btn-sync:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(241, 133, 133, 0.3);
  }

  .btn-sync:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .filters { 
    display: flex; 
    align-items: center; 
    gap: 1rem; 
    flex-wrap: wrap; 
    background: rgba(255, 255, 255, 0.75); 
    border: 1px solid rgba(241, 133, 133, 0.15); 
    backdrop-filter: blur(12px); 
    box-shadow: var(--shadow-md); 
    border-radius: 18px; 
    padding: 0.9rem; 
    margin: 2rem 0 2.2rem; 
    opacity: 0; 
    transform: translateY(14px); 
    transition: all 0.5s ease; 
  }
  
  .filters.animate { 
    opacity: 1; 
    transform: none; 
  }
  
  .search { 
    position: relative; 
    flex: 1 1 360px; 
    min-width: 250px; 
  }
  
  .search i { 
    position: absolute; 
    top: 50%; 
    left: 12px; 
    transform: translateY(-50%); 
    color: var(--gray); 
    pointer-events: none; 
  }
  
  .search-input { 
    width: 100%; 
    padding: 12px 44px 12px 36px; 
    border: 1px solid rgba(241,133,133,.25); 
    background: var(--light-gray); 
    border-radius: 14px; 
    outline: none; 
    transition: box-shadow var(--transition-normal), border-color var(--transition-normal); 
  }
  
  .search-input:focus { 
    box-shadow: 0 0 0 4px rgba(241,133,133,.15); 
    border-color: var(--coral); 
  }
  
  .clear-search { 
    position: absolute; 
    right: 6px; 
    top: 50%; 
    transform: translateY(-50%); 
    border:none; 
    background:transparent; 
    padding:8px; 
    border-radius:10px; 
    cursor:pointer; 
  }
  
  .clear-search:hover { 
    background: rgba(241,133,133,.12); 
  }
  
  .divider { 
    width: 1px; 
    height: 34px; 
    background: rgba(0,0,0,.06); 
  }
  
  .select-wrapper { 
    display:flex; 
    align-items:center; 
    gap:8px; 
    padding:8px 12px; 
    border:1px solid rgba(241,133,133,.25); 
    background: rgba(255,255,255,.65); 
    border-radius:12px; 
  }
  
  .select-wrapper select { 
    border:none; 
    background:transparent; 
    outline:none; 
    font-weight:600; 
    color:var(--black); 
    cursor:pointer; 
  }
  
  .btn-reset { 
    background: var(--primary-gradient); 
    color:#fff; 
    border:none; 
    padding:10px 16px; 
    border-radius:999px; 
    font-weight:700; 
    box-shadow: var(--shadow-sm); 
    cursor:pointer; 
    transition: transform var(--transition-fast), box-shadow var(--transition-normal); 
  }
  
  .btn-reset:hover { 
    transform: translateY(-2px); 
    box-shadow: var(--shadow-lg); 
  }
  
  .meta { 
    margin-left:auto; 
    font-weight:600; 
    color:var(--gray); 
    display:flex; 
    align-items:center; 
    gap:.35rem; 
  }
  
  .count { 
    color: var(--deep-purple); 
    font-weight: 800; 
  }

  .loading-state, .error-state {
    text-align: center;
    padding: 3rem 1.5rem;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    margin: 2rem 0;
  }

  .loading-state i {
    font-size: 2rem;
    color: var(--coral);
    margin-bottom: 1rem;
  }

  .error-state i {
    font-size: 2rem;
    color: #e74c3c;
    margin-bottom: 1rem;
  }

  .btn-retry {
    background: var(--coral);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
  }

  .grid { 
    display:grid; 
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
    gap: 2rem; 
    opacity:0; 
    transform: translateY(16px); 
    transition: all .6s ease; 
  }
  
  .grid.animate { 
    opacity:1; 
    transform:none; 
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 3rem;
    padding: 2rem 0;
  }

  .page-btn {
    background: white;
    border: 1px solid rgba(241, 133, 133, 0.3);
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--coral);
  }

  .page-btn:hover:not(:disabled) {
    background: var(--coral);
    color: white;
    transform: translateY(-1px);
  }

  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-info {
    font-weight: 600;
    color: var(--deep-purple);
    padding: 0 1rem;
  }

  .empty-state { 
    text-align:center; 
    background: rgba(255,255,255,.8); 
    border:1px solid rgba(241,133,133,.15); 
    border-radius:20px; 
    padding:3rem 1.5rem; 
    box-shadow: var(--shadow-md); 
    opacity:0; 
    transform: translateY(10px); 
    transition: all .4s ease; 
  }
  
  .empty-state.animate { 
    opacity:1; 
    transform:none; 
  }
  
  .empty-state i { 
    font-size:2rem; 
    color:var(--coral); 
    margin-bottom:.75rem; 
    display:block; 
  }

  .bg { 
    position:absolute; 
    inset:0; 
    pointer-events:none; 
    z-index:0; 
  }
  
  .blob { 
    position:absolute; 
    filter: blur(50px); 
    opacity:.15; 
    border-radius:50%; 
  }
  
  .b1 { 
    width:320px; 
    height:320px; 
    background: var(--coral); 
    top:-60px; 
    right:-80px; 
  }
  
  .b2 { 
    width:260px; 
    height:260px; 
    background: var(--deep-purple); 
    bottom:-60px; 
    left:-60px; 
    opacity:.12; 
  }
  
  .grid-overlay { 
    position:absolute; 
    inset:0; 
    background-image: linear-gradient(rgba(0,0,0,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px); 
    background-size: 32px 32px; 
    mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent); 
  }

  .modal-backdrop { 
    position: fixed; 
    inset: 0; 
    background: rgba(0,0,0,.45); 
    backdrop-filter: blur(3px); 
    display:flex; 
    align-items:center; 
    justify-content:center; 
    padding:1rem; 
    z-index: 1050; 
    animation: fadeIn .15s ease both; 
  }
  
  .modal { 
    width: min(900px, 96vw); 
    background:#fff; 
    border-radius:24px; 
    overflow:hidden; 
    box-shadow: 0 25px 80px rgba(0,0,0,.25); 
    transform: translateY(10px); 
    animation: popIn .25s ease both; 
    border: 1px solid rgba(241,133,133,.15); 
    outline: none;
  }
  
  .modal-header { 
    position:relative; 
    height: 220px; 
    display:flex; 
    align-items:center; 
    justify-content:center; 
  }
  
  .modal-header i { 
    font-size: 64px; 
    color:#fff; 
    opacity:.95; 
    filter: drop-shadow(0 10px 25px rgba(0,0,0,.25)); 
  }
  
  .modal-badges .badge { 
    position:absolute; 
    top:16px; 
    background: rgba(255,255,255,.92); 
    backdrop-filter: blur(10px); 
    padding:8px 14px; 
    border-radius:999px; 
    font-weight:700; 
    font-size:.85rem; 
  }
  
  .modal-badges .left { 
    left:16px; 
    color: var(--coral); 
  }
  
  .modal-badges .right { 
    right:16px; 
    color: var(--deep-purple); 
  }

  .modal-close { 
    position:absolute; 
    right:14px; 
    top:14px; 
    border:none; 
    background: rgba(255,255,255,.9); 
    width:40px; 
    height:40px; 
    border-radius:999px; 
    cursor:pointer; 
    display:flex; 
    align-items:center; 
    justify-content:center; 
  }
  
  .modal-close i { 
    color: var(--black); 
  }

  .modal-body { 
    padding: 1.75rem; 
  }
  
  .modal-title-row { 
    display:flex; 
    justify-content:space-between; 
    align-items:flex-start; 
    gap:1rem; 
    margin-bottom:.5rem; 
  }
  
  .modal-title { 
    font-size: 1.6rem; 
    font-weight: 800; 
    font-family: 'Montserrat', sans-serif; 
  }
  
  .modal-year { 
    background: var(--accent-gradient); 
    color: var(--deep-purple); 
    padding: 4px 10px; 
    border-radius: 10px; 
    font-weight:700; 
    white-space:nowrap; 
  }

  .modal-desc { 
    color: var(--gray); 
    margin: .5rem 0 1rem; 
  }

  .modal-meta { 
    display:grid; 
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
    gap: 1rem; 
    margin: 1rem 0 1.25rem; 
  }
  
  .meta-item { 
    background: var(--light-gray); 
    border:1px solid rgba(241,133,133,.12); 
    border-radius: 14px; 
    padding: .9rem .95rem; 
    display:grid; 
    grid-template-columns: 24px 1fr; 
    grid-template-rows: auto auto; 
    column-gap:.6rem; 
    row-gap:.15rem; 
    align-items:center; 
  }
  
  .meta-item i { 
    grid-row: span 2; 
    color: var(--coral); 
  }
  
  .meta-item span { 
    font-size:.82rem; 
    color: var(--gray); 
  }
  
  .meta-item strong { 
    font-size:.95rem; 
    color: var(--black); 
  }

  .modal-tags { 
    display:flex; 
    flex-wrap: wrap; 
    gap: .5rem; 
    margin-bottom: 1.25rem; 
  }
  
  .tag { 
    background: var(--light-gradient); 
    color: var(--deep-purple); 
    padding: 6px 12px; 
    border-radius: 16px; 
    font-size: .82rem; 
    font-weight: 600; 
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }

  .modal-actions .btn-primary,
  .modal-actions .btn-secondary,
  .modal-actions .btn-ghost {
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: 600;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
  }

  .modal-actions .btn-primary {
    background: var(--primary-gradient);
    color: white;
  }

  .modal-actions .btn-secondary {
    background: transparent;
    color: var(--coral);
    border: 2px solid var(--coral);
  }

  .modal-actions .btn-ghost {
    background: var(--light-gray);
    color: var(--gray);
  }

  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes popIn { from { opacity:0; transform: translateY(12px) scale(.98) } to { opacity:1; transform: translateY(0) scale(1) } }

  @media (max-width: 900px) {
    .filters { gap: .75rem; }
    .divider { display:none; }
    .meta { width:100%; justify-content:flex-end; }
    .modal-header { height: 180px; }
    .modal-actions {
      flex-direction: column;
    }
    
    .modal-actions .btn-primary,
    .modal-actions .btn-secondary,
    .modal-actions .btn-ghost {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 768px) {
    .pagination {
      gap: 0.5rem;
    }
    
    .page-info {
      font-size: 0.9rem;
      padding: 0 0.5rem;
    }
  }
</style>
