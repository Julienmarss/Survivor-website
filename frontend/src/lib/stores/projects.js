import { writable } from 'svelte/store';


//Fichier à supprimer quand on aura fait les requêtes côté back-end
export const projects = writable([
  {
    id: 1,
    title: "NeuroTech Solutions",
    description: "Révolutionner les interfaces cerveau-machine pour améliorer la qualité de vie des patients neurologiques.",
    badge: "IA",
    icon: "fas fa-brain",
    funding: "€2.5M levés",
    tags: ["Intelligence Artificielle", "Santé", "Innovation"],
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    status: "Série A",
    founders: ["Dr. Sarah Chen", "Marc Dubois"],
    sector: "HealthTech",
    year: 2023
  },
  {
    id: 2,
    title: "EcoFlow Energy",
    description: "Solutions énergétiques durables pour les entreprises, réduisant leur empreinte carbone de 60%.",
    badge: "GreenTech",
    icon: "fas fa-leaf",
    funding: "€1.8M levés",
    tags: ["Énergie Verte", "Durabilité", "B2B"],
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    status: "Seed",
    founders: ["Emma Larsson", "Pierre Martin"],
    sector: "CleanTech",
    year: 2024
  },
  {
    id: 3,
    title: "PayFlow Pro",
    description: "Plateforme de paiement nouvelle génération pour les PME, simplifiant les transactions internationales.",
    badge: "FinTech",
    icon: "fas fa-mobile-alt",
    funding: "€4.2M levés",
    tags: ["Finance", "Blockchain", "PME"],
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    status: "Série A",
    founders: ["Alex Thompson", "Marie Rousseau"],
    sector: "FinTech",
    year: 2023
  },
  {
    id: 4,
    title: "LearnSmart AI",
    description: "Personnalisation de l'apprentissage grâce à l'IA, adaptée aux besoins de chaque étudiant.",
    badge: "EdTech",
    icon: "fas fa-graduation-cap",
    funding: "€3.1M levés",
    tags: ["Éducation", "IA", "Personnalisation"],
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    status: "Série A",
    founders: ["Dr. James Wilson", "Sophie Durand"],
    sector: "EdTech",
    year: 2023
  },
  {
    id: 5,
    title: "MediConnect",
    description: "Plateforme de télémédecine connectant patients et professionnels de santé en temps réel.",
    badge: "HealthTech",
    icon: "fas fa-heartbeat",
    funding: "€2.9M levés",
    tags: ["Télémédecine", "Santé Digitale", "B2C"],
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    status: "Seed",
    founders: ["Dr. Lisa Garcia", "Thomas Bernard"],
    sector: "HealthTech",
    year: 2024
  },
  {
    id: 6,
    title: "AutoMate Logistics",
    description: "Robots autonomes pour l'optimisation des chaînes logistiques et la livraison last-mile.",
    badge: "Robotique",
    icon: "fas fa-robot",
    funding: "€5.5M levés",
    tags: ["Robotique", "Logistique", "Automatisation"],
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    status: "Série B",
    founders: ["Dr. Chen Wei", "Antoine Moreau"],
    sector: "Robotics",
    year: 2022
  },
  {
    id: 7,
    title: "CyberShield Pro",
    description: "Solutions de cybersécurité avancées utilisant l'IA pour détecter les menaces en temps réel.",
    badge: "CyberSec",
    icon: "fas fa-shield-alt",
    funding: "€3.8M levés",
    tags: ["Cybersécurité", "IA", "Enterprise"],
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    status: "Série A",
    founders: ["Maria Santos", "David Kim"],
    sector: "CyberSecurity",
    year: 2023
  },
  {
    id: 8,
    title: "AgroTech Vision",
    description: "Agriculture intelligente avec drones et capteurs IoT pour optimiser les rendements.",
    badge: "AgriTech",
    icon: "fas fa-seedling",
    funding: "€2.2M levés",
    tags: ["Agriculture", "IoT", "Drones"],
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    status: "Seed",
    founders: ["Jean Dupont", "Fatima Al-Zahra"],
    sector: "AgriTech",
    year: 2024
  }
]);

export const projectStats = writable({
  totalProjects: 150,
  totalFunding: 50000000,
  successRate: 85,
  jobsCreated: 500
});

export const sectors = writable([
  { name: "HealthTech", count: 25, color: "#fa709a" },
  { name: "FinTech", count: 22, color: "#f5576c" },
  { name: "EdTech", count: 18, color: "#4facfe" },
  { name: "CleanTech", count: 15, color: "#38ef7d" },
  { name: "Robotics", count: 12, color: "#fed6e3" },
  { name: "CyberSecurity", count: 10, color: "#764ba2" },
  { name: "AgriTech", count: 8, color: "#fcb69f" }
]);

export function getProjectById(id) {
  return projects.subscribe(projectList => {
    return projectList.find(project => project.id === id);
  });
}

export function getProjectsBySector(sector) {
  return projects.subscribe(projectList => {
    return projectList.filter(project => project.sector === sector);
  });
}

export function searchProjects(query) {
  return projects.subscribe(projectList => {
    return projectList.filter(project => 
      project.title.toLowerCase().includes(query.toLowerCase()) ||
      project.description.toLowerCase().includes(query.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  });
}
