<script>
  import { onMount } from 'svelte';
  import { projects, sectors } from '$lib/stores/projects.js';
  import ProjectCard from '$lib/components/ProjectCard.svelte';

  let searchQuery = '';
  let selectedSector = 'all';
  let gridContainer;
  let visible = false;

  let showDetails = false;
  let selectedProject = null;

  $: projectList = $projects ?? [];
  $: sectorList = $sectors ?? [];

  $: filteredProjects = projectList.filter((project) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      project.title.toLowerCase().includes(q) ||
      project.description.toLowerCase().includes(q) ||
      (project.tags || []).some((t) => t.toLowerCase().includes(q));

    const matchesSector = selectedSector === 'all' || project.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  onMount(() => {
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
    return () => observer.disconnect();
  });

  function clearFilters() {
    searchQuery = '';
    selectedSector = 'all';
  }

  function openDetails(project) {
    selectedProject = project;
    showDetails = true;
    document.documentElement.style.overflow = 'hidden';
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
</script>

<svelte:window on:keydown={(e) => e.key === 'Escape' && showDetails && closeDetails()} />

<section class="projects" id="projects" bind:this={gridContainer}>
  <div class="container">
    <!-- En-tête -->
    <div class="section-header" class:animate={visible}>
      <div class="eyebrow">Portfolio</div>
      <h2 class="section-title">Nos Startups à Succès</h2>
      <p class="section-subtitle">
        Découvrez les projets innovants qui façonnent l'avenir, soutenus par notre écosystème d'excellence
        et notre expertise reconnue.
      </p>
    </div>

    <div class="filters" class:animate={visible} role="search">
      <div class="search">
        <i class="fas fa-search" aria-hidden="true"></i>
        <input
          class="search-input"
          type="text"
          placeholder="Rechercher un projet, une techno, un tag…"
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
          {#each sectorList as s}
            <option value={s.name}>{s.name}</option>
          {/each}
        </select>
      </div>

      <button class="btn-reset" type="button" on:click={clearFilters} aria-label="Réinitialiser les filtres">
        Réinitialiser
      </button>

      <div class="meta" aria-live="polite">
        <span class="count">{filteredProjects.length}</span> projet{filteredProjects.length > 1 ? 's' : ''}
      </div>
    </div>

    {#if filteredProjects.length}
      <div class="grid" class:animate={visible}>
        {#each filteredProjects as project (project.id)}
          <ProjectCard
            {project}
            on:click={handleProjectClick}
            on:viewDetails={handleViewDetails}
          />
        {/each}
      </div>
    {:else}
      <div class="empty-state" class:animate={visible}>
        <i class="fas fa-search" aria-hidden="true"></i>
        <h3>Aucun projet trouvé</h3>
        <p>Essaye un autre mot-clé ou réinitialise les filtres.</p>
        <button class="btn-secondary" type="button" on:click={clearFilters}>Réinitialiser les filtres</button>
      </div>
    {/if}
  </div>

  <!-- Décor -->
  <div class="bg">
    <div class="blob b1"></div>
    <div class="blob b2"></div>
    <div class="grid-overlay"></div>
  </div>

  {#if showDetails && selectedProject}
    <div class="modal-backdrop" on:click={closeDetails} role="dialog" aria-modal="true">
      <div class="modal" on:click|stopPropagation>
        <button class="modal-close" on:click={closeDetails} aria-label="Fermer">
          <i class="fas fa-times"></i>
        </button>

        <div class="modal-header" style="--header-bg: {selectedProject.gradient}">
          <div class="modal-badges">
            <span class="badge left">{selectedProject.status}</span>
            <span class="badge right">{selectedProject.badge}</span>
          </div>
          <i class={selectedProject.icon} aria-hidden="true"></i>
        </div>

        <div class="modal-body">
          <div class="modal-title-row">
            <h3 class="modal-title">{selectedProject.title}</h3>
            <div class="modal-year">{selectedProject.year}</div>
          </div>

          <p class="modal-desc">{selectedProject.description}</p>

          <div class="modal-meta">
            <div class="meta-item">
              <i class="fas fa-shield-alt"></i>
              <span>Statut</span>
              <strong>{selectedProject.status}</strong>
            </div>
            <div class="meta-item">
              <i class="fas fa-tags"></i>
              <span>Secteur</span>
              <strong>{selectedProject.sector}</strong>
            </div>
            <div class="meta-item">
              <i class="fas fa-coins"></i>
              <span>Financement</span>
              <strong>{selectedProject.funding}</strong>
            </div>
            <div class="meta-item">
              <i class="fas fa-user-tie"></i>
              <span>Fondateurs</span>
              <strong>{selectedProject.founders.join(', ')}</strong>
            </div>
          </div>

          <div class="modal-tags">
            {(selectedProject.tags || []).map(t => t).map(tag => (
              // juste pour l'IDE: ce bloc sera remplacé à l'exécution
              tag
            ))}
            {#each selectedProject.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" type="button" on:click={closeDetails}>
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
  .container { max-width: 1400px; margin: 0 auto; }

  .section-header { text-align: center; margin-bottom: 2rem; opacity: 0; transform: translateY(20px); transition: all 0.6s ease; }
  .section-header.animate { opacity: 1; transform: none; }
  .eyebrow { display: inline-block; font-weight: 700; font-size: 0.85rem; letter-spacing: .12em; text-transform: uppercase; background: var(--light-gradient); color: var(--deep-purple); padding: 6px 12px; border-radius: 999px; margin-bottom: .75rem; }
  .section-title { font-size: clamp(1.8rem, 3.2vw, 2.6rem); font-weight: 800; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: .5rem; }
  .section-subtitle { color: var(--gray); max-width: 850px; margin: 0.25rem auto 0; }

  .filters { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; background: rgba(255, 255, 255, 0.75); border: 1px solid rgba(241, 133, 133, 0.15); backdrop-filter: blur(12px); box-shadow: var(--shadow-md); border-radius: 18px; padding: 0.9rem; margin: 2rem 0 2.2rem; opacity: 0; transform: translateY(14px); transition: all 0.5s ease; }
  .filters.animate { opacity: 1; transform: none; }
  .search { position: relative; flex: 1 1 360px; min-width: 250px; }
  .search i { position: absolute; top: 50%; left: 12px; transform: translateY(-50%); color: var(--gray); pointer-events: none; }
  .search-input { width: 100%; padding: 12px 44px 12px 36px; border: 1px solid rgba(241,133,133,.25); background: var(--light-gray); border-radius: 14px; outline: none; transition: box-shadow var(--transition-normal), border-color var(--transition-normal); }
  .search-input:focus { box-shadow: 0 0 0 4px rgba(241,133,133,.15); border-color: var(--coral); }
  .clear-search { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); border:none; background:transparent; padding:8px; border-radius:10px; cursor:pointer; }
  .clear-search:hover { background: rgba(241,133,133,.12); }
  .divider { width: 1px; height: 34px; background: rgba(0,0,0,.06); }
  .select-wrapper { display:flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid rgba(241,133,133,.25); background: rgba(255,255,255,.65); border-radius:12px; }
  .select-wrapper select { border:none; background:transparent; outline:none; font-weight:600; color:var(--black); cursor:pointer; }
  .btn-reset { background: var(--primary-gradient); color:#fff; border:none; padding:10px 16px; border-radius:999px; font-weight:700; box-shadow: var(--shadow-sm); cursor:pointer; transition: transform var(--transition-fast), box-shadow var(--transition-normal); }
  .btn-reset:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  .meta { margin-left:auto; font-weight:600; color:var(--gray); display:flex; align-items:center; gap:.35rem; }
  .count { color: var(--deep-purple); font-weight: 800; }

  .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; opacity:0; transform: translateY(16px); transition: all .6s ease; }
  .grid.animate { opacity:1; transform:none; }

  .empty-state { text-align:center; background: rgba(255,255,255,.8); border:1px solid rgba(241,133,133,.15); border-radius:20px; padding:3rem 1.5rem; box-shadow: var(--shadow-md); opacity:0; transform: translateY(10px); transition: all .4s ease; }
  .empty-state.animate { opacity:1; transform:none; }
  .empty-state i { font-size:2rem; color:var(--coral); margin-bottom:.75rem; display:block; }

  .bg { position:absolute; inset:0; pointer-events:none; z-index:0; }
  .blob { position:absolute; filter: blur(50px); opacity:.15; border-radius:50%; }
  .b1 { width:320px; height:320px; background: var(--coral); top:-60px; right:-80px; }
  .b2 { width:260px; height:260px; background: var(--deep-purple); bottom:-60px; left:-60px; opacity:.12; }
  .grid-overlay { position:absolute; inset:0; background-image: linear-gradient(rgba(0,0,0,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px); background-size: 32px 32px; mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent); }

  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(3px); display:flex; align-items:center; justify-content:center; padding:1rem; z-index: 1050; animation: fadeIn .15s ease both; }
  .modal { width: min(900px, 96vw); background:#fff; border-radius:24px; overflow:hidden; box-shadow: 0 25px 80px rgba(0,0,0,.25); transform: translateY(10px); animation: popIn .25s ease both; border: 1px solid rgba(241,133,133,.15); }
  .modal-header { position:relative; height: 220px; background: var(--header-bg, var(--primary-gradient)); display:flex; align-items:center; justify-content:center; }
  .modal-header i { font-size: 64px; color:#fff; opacity:.95; filter: drop-shadow(0 10px 25px rgba(0,0,0,.25)); }
  .modal-badges .badge { position:absolute; top:16px; background: rgba(255,255,255,.92); backdrop-filter: blur(10px); padding:8px 14px; border-radius:999px; font-weight:700; font-size:.85rem; }
  .modal-badges .left { left:16px; color: var(--coral); }
  .modal-badges .right { right:16px; color: var(--deep-purple); }

  .modal-close { position:absolute; right:14px; top:14px; border:none; background: rgba(255,255,255,.9); width:40px; height:40px; border-radius:999px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .modal-close i { color: var(--black); }

  .modal-body { padding: 1.75rem; }
  .modal-title-row { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:.5rem; }
  .modal-title { font-size: 1.6rem; font-weight: 800; font-family: 'Montserrat', sans-serif; }
  .modal-year { background: var(--accent-gradient); color: var(--deep-purple); padding: 4px 10px; border-radius: 10px; font-weight:700; white-space:nowrap; }

  .modal-desc { color: var(--gray); margin: .5rem 0 1rem; }

  .modal-meta { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin: 1rem 0 1.25rem; }
  .meta-item { background: var(--light-gray); border:1px solid rgba(241,133,133,.12); border-radius: 14px; padding: .9rem .95rem; display:grid; grid-template-columns: 24px 1fr; grid-template-rows: auto auto; column-gap:.6rem; row-gap:.15rem; align-items:center; }
  .meta-item i { grid-row: span 2; color: var(--coral); }
  .meta-item span { font-size:.82rem; color: var(--gray); }
  .meta-item strong { font-size:.95rem; color: var(--black); }

  .modal-tags { display:flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.25rem; }
  .tag { background: var(--light-gradient); color: var(--deep-purple); padding: 6px 12px; border-radius: 16px; font-size: .82rem; font-weight: 600; }

  .modal-actions { display:flex; justify-content:flex-end; gap:.5rem; }

  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes popIn { from { opacity:0; transform: translateY(12px) scale(.98) } to { opacity:1; transform: translateY(0) scale(1) } }

  @media (max-width: 900px) {
    .filters { gap: .75rem; }
    .divider { display:none; }
    .meta { width:100%; justify-content:flex-end; }
    .modal-header { height: 180px; }
  }

.modal-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(3px);
  z-index: 2000;
}

.modal {
  width: min(820px, 92vw);
  max-height: 80vh;
  overflow: hidden;
  background: #fff;
  border-radius: 22px;
  border: 1px solid rgba(241,133,133,.15);
  box-shadow: 0 25px 80px rgba(0,0,0,.25);
  display: flex;
  flex-direction: column;
}

.modal-header { height: 160px; }
.modal-body   { padding: 1.25rem 1.5rem; overflow: auto; }

@media (max-width: 900px) {
  .modal { width: min(720px, 94vw); max-height: 86vh; }
  .modal-header { height: 140px; }
}

</style>

