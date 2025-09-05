<!-- +page.svelte -->
<script>
  import { onMount } from "svelte";
  
  let stats = {
    startups: 0,
    investors: 0,
    partners: 0,
    news: 0,
    events: 0,
    users: 0,
    totalViews: 0,
    monthlyViews: 0,
    engagementRate: 0
  };
  
  let kpiData = null;
  let loading = true;
  let error = null;

  // URL de votre nouveau backend
  const API_BASE = "http://localhost:3000/api";

  onMount(async () => {
    try {
      loading = true;
      
      // 1. Récupérer les KPI depuis votre nouveau backend
      const dashboardResponse = await fetch(`${API_BASE}/analytics/dashboard`);
      const dashboardData = await dashboardResponse.json();
      
      if (dashboardData.success) {
        kpiData = dashboardData.data;
        
        // Mettre à jour les stats avec les vraies données
        stats.startups = kpiData.totalStartups;
        stats.totalViews = kpiData.totalViews;
        stats.monthlyViews = kpiData.monthlyViews;
        stats.engagementRate = kpiData.engagementRate;
        stats.investors = kpiData.investorInteractions;
      }

      // 2. Récupérer les stats complètes
      try {
        const statsResponse = await fetch(`${API_BASE}/startups/stats`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
          stats.partners = statsData.data.jobsCreated || 0;
          stats.news = Math.floor(stats.startups * 0.8); // Simulé
          stats.events = Math.floor(stats.startups * 0.3); // Simulé
        }
      } catch (statsError) {
        console.warn("Erreur stats:", statsError);
      }

      // 3. Simuler quelques données manquantes
      stats.users = Math.floor(stats.startups * 4.2); // Simulé
      
    } catch (err) {
      console.error("Erreur API:", err);
      error = "Impossible de charger les données. Vérifiez que le backend est démarré sur localhost:3000";
    } finally {
      loading = false;
    }
  });


  // Fonctions d'export pour les investisseurs
  async function exportHighlights() {
    try {
      loading = true;
      const response = await fetch(`${API_BASE}/export/investor-highlights`);
      const result = await response.json();
      
      if (result.success) {
        // Créer et télécharger le fichier JSON
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
          type: 'application/json' 
        });
        downloadFile(blob, `investor-highlights-${new Date().toISOString().split('T')[0]}.json`);
        alert('Highlights exportés avec succès !');
      } else {
        alert('Erreur lors de l\'export: ' + result.message);
      }
    } catch (err) {
      alert('Erreur lors de l\'export: ' + err.message);
    } finally {
      loading = false;
    }
  }

  async function exportInvestorReport() {
    try {
      loading = true;
      const response = await fetch(`${API_BASE}/export/investor-report`);
      const result = await response.json();
      
      if (result.success) {
        // Créer et télécharger le fichier JSON
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
          type: 'application/json' 
        });
        downloadFile(blob, `investor-report-${new Date().toISOString().split('T')[0]}.json`);
        alert(`Rapport exporté avec succès ! ${result.data.startups.length} startups incluses.`);
      } else {
        alert('Erreur lors de l\'export: ' + result.message);
      }
    } catch (err) {
      alert('Erreur lors de l\'export: ' + err.message);
    } finally {
      loading = false;
    }
  }

  async function exportCSV() {
    try {
      loading = true;
      const response = await fetch(`${API_BASE}/export/investor-report/csv`);
      
      if (response.ok) {
        const blob = await response.blob();
        downloadFile(blob, `investor-report-${new Date().toISOString().split('T')[0]}.csv`);
        alert('Rapport CSV exporté avec succès !');
      } else {
        alert('Erreur lors de l\'export CSV');
      }
    } catch (err) {
      alert('Erreur lors de l\'export CSV: ' + err.message);
    } finally {
      loading = false;
    }
  }

  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }
</script>

<style>
  .dashboard {
    background-color: #1a1a1a;
    color: #eee;
    min-height: 100vh;
    padding: 2rem;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .sync-button {
    background: linear-gradient(135deg, #E4BEF8, #C174F2);
    color: #1a1a1a;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.2s ease;
  }
  
  .sync-button:hover {
    transform: translateY(-2px);
  }
  
  .sync-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .card {
    background: linear-gradient(135deg, #2a2a2a, #333);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0px 8px 20px rgba(0,0,0,0.4);
    text-align: center;
    transition: transform 0.2s ease;
    border: 1px solid rgba(228, 190, 248, 0.1);
  }
  
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0px 10px 25px rgba(0,0,0,0.6);
    border-color: rgba(228, 190, 248, 0.3);
  }
  
  .card h2 {
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #E4BEF8, #F18585);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .card p {
    margin: 0;
    opacity: 0.8;
    font-size: 1.1rem;
  }
  
  .export-section {
    background: linear-gradient(135deg, #2a2a2a, #333);
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0px 8px 20px rgba(0,0,0,0.4);
    border: 1px solid rgba(228, 190, 248, 0.1);
  }

  .export-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .export-button {
    background: linear-gradient(135deg, #E4BEF8, #C174F2);
    color: #1a1a1a;
    border: none;
    padding: 1rem 2rem;
    border-radius: 0.8rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(228, 190, 248, 0.3);
  }

  .export-button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(228, 190, 248, 0.4);
  }

  .export-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .export-button.highlights {
    background: linear-gradient(135deg, #F18585, #F49C9C);
  }

  .export-button.report {
    background: linear-gradient(135deg, #E4BEF8, #D5A8F2);
  }

  .export-button.csv {
    background: linear-gradient(135deg, #81C784, #66BB6A);
  }
  
  h1 {
    margin: 0;
    color: #E4BEF8;
    font-size: 2.5rem;
  }
  
  h2 {
    color: #E4BEF8;
    margin-bottom: 1rem;
  }
  
  .loading {
    text-align: center;
    padding: 4rem;
    font-size: 1.2rem;
  }
  
  .error {
    background: rgba(241, 133, 133, 0.1);
    border: 1px solid #F18585;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 2rem;
    color: #F18585;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .kpi-card {
    background: rgba(228, 190, 248, 0.05);
    border: 1px solid rgba(228, 190, 248, 0.2);
    border-radius: 0.8rem;
    padding: 1.2rem;
    text-align: center;
  }
  
  .kpi-card .label {
    font-size: 0.9rem;
    opacity: 0.7;
    margin-bottom: 0.5rem;
  }
  
  .kpi-card .value {
    font-size: 1.8rem;
    font-weight: 600;
    color: #E4BEF8;
  }

  @media (max-width: 768px) {
    .export-buttons {
      flex-direction: column;
    }
    
    .export-button {
      width: 100%;
    }
    
    .header {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>

<div class="dashboard">
  <div class="header">
    <h1>JEB Incubator Dashboard</h1>
  </div>

  {#if error}
    <div class="error">
      <strong>Erreur:</strong> {error}
      <br><small>Assurez-vous que le backend est démarré avec <code>npm run start:dev</code></small>
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      Chargement des données...
    </div>
  {:else}
    <!-- KPI principaux -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="label">Taux d'engagement</div>
        <div class="value">{stats.engagementRate}%</div>
      </div>
      <div class="kpi-card">
        <div class="label">Vues totales</div>
        <div class="value">{formatNumber(stats.totalViews)}</div>
      </div>
      <div class="kpi-card">
        <div class="label">Vues mensuelles</div>
        <div class="value">{formatNumber(stats.monthlyViews)}</div>
      </div>
      {#if kpiData}
        <div class="kpi-card">
          <div class="label">Interactions investisseurs</div>
          <div class="value">{kpiData.investorInteractions}</div>
        </div>
      {/if}
    </div>

    <!-- Stats principales -->
    <div class="grid">
      <div class="card">
        <h2>{stats.startups}</h2>
        <p>Startups</p>
      </div>
      <div class="card">
        <h2>{stats.investors}</h2>
        <p>Investisseurs</p>
      </div>
      <div class="card">
        <h2>{stats.partners}</h2>
        <p>Emplois créés</p>
      </div>
      <div class="card">
        <h2>{stats.news}</h2>
        <p>News</p>
      </div>
      <div class="card">
        <h2>{stats.events}</h2>
        <p>Événements</p>
      </div>
      <div class="card">
        <h2>{stats.users}</h2>
        <p>Utilisateurs</p>
      </div>
    </div>

    <!-- Export pour investisseurs -->
    <div class="export-section">
      <h2>Rapports Investisseurs</h2>
      <div class="export-buttons">
        <button 
          class="export-button highlights" 
          on:click={exportHighlights}
          disabled={loading}
        >
          Export Highlights
        </button>
        <button 
          class="export-button report" 
          on:click={exportInvestorReport}
          disabled={loading}
        >
          Export Investor Report
        </button>
        <button 
          class="export-button csv" 
          on:click={exportCSV}
          disabled={loading}
        >
          Export CSV
        </button>
      </div>
    </div>
  {/if}
</div>