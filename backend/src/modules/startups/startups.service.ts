// backend/src/modules/startups/startups.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JebApiService } from '../jeb-api/jeb-api.service';

@Injectable()
export class StartupsService {
  private readonly logger = new Logger(StartupsService.name);

  constructor(private readonly jebApiService: JebApiService) {}

  async findAll(skip = 0, limit = 20) {
    this.logger.log(`Getting startups list (skip: ${skip}, limit: ${limit})`);
    
    const startups = await this.jebApiService.getAllStartups(skip, limit);
    
    return {
      data: startups,
      total: startups.length,
      skip,
      limit,
    };
  }

  async findById(id: number) {
    this.logger.log(`Getting startup ${id}`);
    return this.jebApiService.getStartupById(id);
  }

  // 🔍 FONCTION DEBUG - Analyse détaillée des données
  async debugRawData(limit = 5) {
    console.log(`\n📊 Récupération de ${limit} startups pour analyse...`);
    
    const startups = await this.jebApiService.getAllStartups(0, limit);
    
    console.log(`\n✅ ${startups.length} startups récupérées`);
    console.log('\n' + '='.repeat(80));
    
    startups.forEach((startup, index) => {
      console.log(`\n🚀 STARTUP ${index + 1}/${startups.length}:`);
      console.log('📋 DONNÉES BRUTES:');
      console.log(JSON.stringify(startup, null, 2));
      
      console.log('\n📊 ANALYSE DES CHAMPS:');
      const fields = Object.keys(startup);
      fields.forEach(field => {
        const value = startup[field];
        const type = Array.isArray(value) ? 'array' : typeof value;
        const content = Array.isArray(value) 
          ? `[${value.length} éléments]` 
          : type === 'object' && value !== null 
            ? '{objet}' 
            : String(value).length > 50 
              ? String(value).substring(0, 50) + '...' 
              : String(value);
        
        console.log(`  • ${field}: (${type}) ${content}`);
      });
      
      console.log('\n💰 INFOS FINANCEMENT:');
      this.analyzeFundingInfo(startup);
      
      console.log('\n👥 INFOS ÉQUIPE:');
      this.analyzeTeamInfo(startup);
      
      console.log('\n🏷️ INFOS SECTEUR/TAGS:');
      this.analyzeSectorInfo(startup);
      
      console.log('\n' + '-'.repeat(60));
    });

    return {
      totalAnalyzed: startups.length,
      dataStructure: this.extractDataStructure(startups),
      rawData: startups
    };
  }

  // 🔍 Analyse d'une startup spécifique
  async debugStartupById(id: number) {
    console.log(`\n🎯 Analyse détaillée de la startup ID: ${id}`);
    
    const startup = await this.jebApiService.getStartupById(id);
    
    console.log('\n📋 DONNÉES COMPLÈTES:');
    console.log(JSON.stringify(startup, null, 2));
    
    console.log('\n🔍 MAPPING RECOMMANDÉ:');
    this.suggestMapping(startup);
    
    return {
      id,
      rawData: startup,
      mappingAnalysis: this.generateMappingAnalysis(startup)
    };
  }

  // 📊 Analyse de la structure générale des données
  async analyzeDataStructure() {
    console.log('\n📊 === ANALYSE DE STRUCTURE ===');
    
    const startups = await this.jebApiService.getAllStartups(0, 10);
    const structure = this.extractDataStructure(startups);
    
    console.log('\n📋 STRUCTURE DÉTECTÉE:');
    Object.keys(structure).forEach(field => {
      const info = structure[field];
      console.log(`\n• ${field}:`);
      console.log(`  - Type(s): ${info.types.join(', ')}`);
      console.log(`  - Présent dans: ${info.frequency}/${startups.length} startups`);
      console.log(`  - Exemples: ${info.examples.slice(0, 3).join(' | ')}`);
    });

    return structure;
  }

  // 🔧 FONCTIONS D'ANALYSE PRIVÉES

  private analyzeFundingInfo(startup: any) {
    const fundingFields = [
      'funding', 'investment', 'raised', 'capital', 'money', 'funds',
      'round', 'series', 'valuation', 'revenue', 'turnover'
    ];
    
    const foundFunding = [];
    fundingFields.forEach(field => {
      if (startup[field] !== undefined) {
        foundFunding.push(`${field}: ${startup[field]}`);
      }
    });
    
    if (foundFunding.length > 0) {
      console.log(`  ✅ Champs financiers trouvés:`);
      foundFunding.forEach(f => console.log(`    • ${f}`));
    } else {
      console.log(`  ❌ Aucun champ financier évident détecté`);
    }
    
    // Chercher dans les objets imbriqués
    Object.keys(startup).forEach(key => {
      if (typeof startup[key] === 'object' && startup[key] !== null) {
        const nestedFunding = fundingFields.filter(field => 
          startup[key][field] !== undefined
        );
        if (nestedFunding.length > 0) {
          console.log(`  🔍 Dans ${key}:`);
          nestedFunding.forEach(field => 
            console.log(`    • ${field}: ${startup[key][field]}`)
          );
        }
      }
    });
  }

  private analyzeTeamInfo(startup: any) {
    const teamFields = [
      'founder', 'founders', 'team', 'ceo', 'cofounder', 'cofounders',
      'creator', 'owner', 'director', 'manager', 'employees'
    ];
    
    const foundTeam = [];
    teamFields.forEach(field => {
      if (startup[field] !== undefined) {
        const value = Array.isArray(startup[field]) 
          ? `[${startup[field].length} éléments]`
          : startup[field];
        foundTeam.push(`${field}: ${value}`);
      }
    });
    
    if (foundTeam.length > 0) {
      console.log(`  ✅ Infos équipe trouvées:`);
      foundTeam.forEach(f => console.log(`    • ${f}`));
    } else {
      console.log(`  ❌ Aucune info équipe évidente détectée`);
    }
  }

  private analyzeSectorInfo(startup: any) {
    const sectorFields = [
      'sector', 'category', 'industry', 'domain', 'field', 'vertical',
      'tags', 'keywords', 'technologies', 'skills', 'specialties'
    ];
    
    const foundSector = [];
    sectorFields.forEach(field => {
      if (startup[field] !== undefined) {
        const value = Array.isArray(startup[field]) 
          ? startup[field].join(', ')
          : startup[field];
        foundSector.push(`${field}: ${value}`);
      }
    });
    
    if (foundSector.length > 0) {
      console.log(`  ✅ Infos secteur/tags trouvées:`);
      foundSector.forEach(f => console.log(`    • ${f}`));
    } else {
      console.log(`  ❌ Aucune info secteur évidente détectée`);
    }
  }

  private extractDataStructure(startups: any[]) {
    const structure = {};
    
    startups.forEach(startup => {
      Object.keys(startup).forEach(key => {
        if (!structure[key]) {
          structure[key] = {
            types: new Set(),
            frequency: 0,
            examples: new Set()
          };
        }
        
        structure[key].frequency++;
        const value = startup[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        structure[key].types.add(type);
        
        if (value !== null && value !== undefined) {
          const example = Array.isArray(value) 
            ? `[${value.length}]` 
            : String(value).length > 30 
              ? String(value).substring(0, 30) + '...'
              : String(value);
          structure[key].examples.add(example);
        }
      });
    });
    
    // Convertir les Sets en Arrays pour la sérialisation
    Object.keys(structure).forEach(key => {
      structure[key].types = Array.from(structure[key].types);
      structure[key].examples = Array.from(structure[key].examples);
    });
    
    return structure;
  }

  private suggestMapping(startup: any) {
    const suggestions = [];
    
    // Suggestions pour le nom
    if (startup.name) suggestions.push(`title: startup.name // "${startup.name}"`);
    else if (startup.title) suggestions.push(`title: startup.title // "${startup.title}"`);
    else suggestions.push(`title: "Nom non trouvé"`);
    
    // Suggestions pour la description
    if (startup.description) suggestions.push(`description: startup.description`);
    else if (startup.summary) suggestions.push(`description: startup.summary`);
    else suggestions.push(`description: "Description non disponible"`);
    
    // Suggestions pour le secteur
    if (startup.sector) suggestions.push(`sector: startup.sector // "${startup.sector}"`);
    else if (startup.category) suggestions.push(`sector: startup.category // "${startup.category}"`);
    
    // Suggestions pour le financement
    if (startup.funding) suggestions.push(`funding: startup.funding // "${startup.funding}"`);
    else if (startup.investment) suggestions.push(`funding: startup.investment // "${startup.investment}"`);
    else suggestions.push(`funding: "Non spécifié"`);
    
    console.log('\n💡 MAPPING SUGGÉRÉ:');
    suggestions.forEach(s => console.log(`  ${s}`));
  }

  private generateMappingAnalysis(startup: any) {
    return {
      name: this.findBestField(startup, ['name', 'title', 'company_name']),
      description: this.findBestField(startup, ['description', 'summary', 'pitch']),
      sector: this.findBestField(startup, ['sector', 'category', 'industry']),
      funding: this.findBestField(startup, ['funding', 'investment', 'raised']),
      founders: this.findBestField(startup, ['founders', 'founder', 'team']),
      logo: this.findBestField(startup, ['logo', 'image', 'avatar', 'picture']),
      website: this.findBestField(startup, ['website', 'url', 'link', 'homepage']),
      tags: this.findBestField(startup, ['tags', 'keywords', 'technologies']),
      status: this.findBestField(startup, ['status', 'stage', 'phase']),
      foundedYear: this.findBestField(startup, ['founded', 'created', 'year'])
    };
  }

  private findBestField(obj: any, candidates: string[]) {
    for (const candidate of candidates) {
      if (obj[candidate] !== undefined && obj[candidate] !== null) {
        return {
          field: candidate,
          value: obj[candidate],
          type: typeof obj[candidate]
        };
      }
    }
    return { field: null, value: null, type: null };
  }
}