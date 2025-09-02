<script>
  import { createEventDispatcher } from 'svelte';

  export let project;

  const dispatch = createEventDispatcher();

  function handleCardClick() {
    dispatch('click', project);
  }

  function handleProjectLink(e) {
    e.stopPropagation();
    dispatch('viewDetails', project);
  }
</script>

<div 
  class="project-card" 
  on:click={handleCardClick}
  on:keydown={(e) => e.key === 'Enter' && handleCardClick()}
  role="button"
  tabindex="0"
>
  <div class="project-image" style="background: {project.gradient}">
    <i class={project.icon}></i>
    <div class="project-badge">{project.badge}</div>
    <div class="project-status">{project.status}</div>
  </div>
  
  <div class="project-content">
    <div class="project-header">
      <h3 class="project-title">{project.title}</h3>
      <div class="project-year">{project.year}</div>
    </div>
    
    <p class="project-description">{project.description}</p>
    
    <div class="project-founders">
      <i class="fas fa-user-tie"></i>
      <span>{project.founders.join(', ')}</span>
    </div>
    
    <div class="project-tags">
      {#each project.tags as tag}
        <span class="project-tag">{tag}</span>
      {/each}
    </div>
    
    <div class="project-footer">
      <div class="project-funding">
        <i class="fas fa-coins"></i>
        <span>{project.funding}</span>
      </div>
      <button 
        class="project-link"
        on:click={handleProjectLink}
      >
        En savoir plus
        <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  </div>
  
  <div class="project-overlay">
    <div class="overlay-content">
      <i class="fas fa-eye"></i>
      <span>Voir les détails</span>
    </div>
  </div>
</div>

<style>
  .project-card {
    background: white;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid rgba(241, 133, 133, 0.1);
    cursor: pointer;
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .project-card:hover {
    transform: translateY(-15px) scale(1.02);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
    border-color: rgba(241, 133, 133, 0.3);
  }

  .project-card:hover .project-overlay {
    opacity: 1;
    visibility: visible;
  }

  .project-image {
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .project-image::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    transition: background 0.3s ease;
  }

  .project-card:hover .project-image::before {
    background: rgba(0, 0, 0, 0.2);
  }

  .project-image i {
    font-size: 4rem;
    color: white;
    opacity: 0.9;
    z-index: 2;
    position: relative;
    transition: all 0.3s ease;
  }

  .project-card:hover .project-image i {
    transform: scale(1.1);
    opacity: 1;
  }

  .project-badge {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--deep-purple);
    z-index: 3;
    transition: all 0.3s ease;
  }

  .project-status {
    position: absolute;
    top: 15px;
    left: 15px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--coral);
    z-index: 3;
  }

  .project-content {
    padding: 2rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .project-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--black);
    font-family: 'Montserrat', sans-serif;
    line-height: 1.3;
  }

  .project-year {
    background: var(--accent-gradient);
    color: var(--deep-purple);
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .project-description {
    color: var(--gray);
    font-size: 0.95rem;
    line-height: 1.5;
    flex-grow: 1;
  }

  .project-founders {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--gray);
    font-size: 0.85rem;
    margin: 0.5rem 0;
  }

  .project-founders i {
    color: var(--coral);
    font-size: 0.9rem;
  }

  .project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0;
  }

  .project-tag {
    background: var(--light-gradient);
    color: var(--deep-purple);
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .project-tag:hover {
    background: var(--accent-gradient);
    transform: translateY(-1px);
  }

  .project-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid rgba(241, 133, 133, 0.1);
  }

  .project-funding {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--deep-purple);
    font-size: 0.95rem;
  }

  .project-funding i {
    color: var(--coral);
  }

  .project-link {
    background: none;
    border: none;
    color: var(--coral);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
  }

  .project-link:hover {
    color: var(--deep-purple);
    background: rgba(241, 133, 133, 0.1);
    transform: translateX(5px);
  }

  .project-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(241, 133, 133, 0.95);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 10;
  }

  .overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: white;
    text-align: center;
  }

  .overlay-content i {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .overlay-content span {
    font-size: 1.1rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .project-image {
      height: 180px;
    }

    .project-image i {
      font-size: 3rem;
    }

    .project-content {
      padding: 1.5rem;
    }

    .project-title {
      font-size: 1.2rem;
    }

    .project-description {
      font-size: 0.9rem;
    }

    .project-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .project-link {
      align-self: flex-end;
    }
  }

  @media (max-width: 480px) {
    .project-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .project-year {
      align-self: flex-start;
    }

    .project-tags {
      gap: 0.3rem;
    }

    .project-tag {
      font-size: 0.75rem;
      padding: 4px 8px;
    }
  }

  .project-card:focus {
    outline: 2px solid var(--coral);
    outline-offset: 4px;
  }

  .project-link:focus {
    outline: 2px solid var(--coral);
    outline-offset: 2px;
  }
</style>
