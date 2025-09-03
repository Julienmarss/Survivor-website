import { Injectable, Logger } from '@nestjs/common';
import { JebApiService } from '../jeb-api/jeb-api.service';
import { StartupRepository } from './repositories/startups.repository';
import { IStartup, IPaginationResult, ISectorCount, IStats } from './interfaces/startup.interface';

@Injectable()
export class StartupsService {
  private readonly logger = new Logger(StartupsService.name);

  constructor(
    private readonly startupRepository: StartupRepository,
    private readonly jebApiService: JebApiService,
  ) {}

  async findAll(page = 1, limit = 20, sector?: string, search?: string): Promise<IPaginationResult<IStartup>> {
    try {
      const result = await this.startupRepository.findAll(page, limit, sector, search);
      this.logger.log(`Retrieved ${result.data.length} startups out of ${result.total} total`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch startups:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<IStartup | null> {
    try {
      const startup = await this.startupRepository.findById(id);
      if (startup) {
        this.logger.log(`Found startup: ${startup.name}`);
      }
      return startup;
    } catch (error) {
      this.logger.error(`Failed to fetch startup ${id}:`, error);
      throw error;
    }
  }

  async getSectors(): Promise<ISectorCount[]> {
    try {
      const sectors = await this.startupRepository.getSectors();
      this.logger.log(`Found ${sectors.length} sectors`);
      return sectors;
    } catch (error) {
      this.logger.error('Failed to fetch sectors:', error);
      throw error;
    }
  }

  async getStats(): Promise<IStats> {
    try {
      const totalProjects = await this.startupRepository.count();
      
      const stats: IStats = {
        totalProjects,
        totalFunding: 50000000, // Simulé
        successRate: 85,
        jobsCreated: 500,
      };
      
      this.logger.log(`Statistics: ${totalProjects} projects total`);
      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch stats:', error);
      return {
        totalProjects: 0,
        totalFunding: 0,
        successRate: 0,
        jobsCreated: 0,
      };
    }
  }

  async syncWithJebApi(): Promise<{
    success: boolean;
    message: string;
    created: number;
    updated: number;
    total: number;
  }> {
    try {
      const jebStartups = await this.jebApiService.getAllStartups(0, 1000);
      this.logger.log(`Fetched ${jebStartups.length} startups from JEB API`);
      
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const jebStartup of jebStartups) {
        try {
          const fullStartup = await this.jebApiService.getStartupById(jebStartup.id);
          let existingStartup = await this.startupRepository.findByJebId(fullStartup.id);

          const startupData: Omit<IStartup, 'id' | 'db_created_at' | 'db_updated_at'> = {
            jeb_id: fullStartup.id,
            name: fullStartup.name,
            legal_status: fullStartup.legal_status,
            address: fullStartup.address,
            email: fullStartup.email,
            phone: fullStartup.phone,
            created_at: new Date(fullStartup.created_at),
            description: fullStartup.description || '',
            website_url: fullStartup.website_url,
            social_media_url: fullStartup.social_media_url,
            project_status: fullStartup.project_status,
            needs: fullStartup.needs,
            sector: fullStartup.sector,
            maturity: fullStartup.maturity,
          };

          if (existingStartup) {
            await this.startupRepository.update(existingStartup.id!, startupData);
            updated++;
            this.logger.log(`Updated: ${startupData.name}`);
          } else {
            existingStartup = await this.startupRepository.create(startupData);
            created++;
            this.logger.log(`Created: ${startupData.name}`);
          }

          if (fullStartup.founders && fullStartup.founders.length > 0) {
            await this.startupRepository.deleteFoundersByJebStartupId(fullStartup.id);
            
            for (const founderData of fullStartup.founders) {
              await this.startupRepository.createFounder({
                jeb_id: founderData.id,
                name: founderData.name,
                startup_id: existingStartup.id!,
                jeb_startup_id: fullStartup.id,
              });
            }
            
            this.logger.log(`Synced ${fullStartup.founders.length} founders for ${startupData.name}`);
          }

        } catch (error) {
          errors++;
          this.logger.warn(`Failed to sync startup ${jebStartup.id}:`, error.message);
        }
      }

      const result = {
        success: true,
        message: `Synchronisation terminée: ${created} créées, ${updated} mises à jour${errors > 0 ? `, ${errors} erreurs` : ''}`,
        created,
        updated,
        total: jebStartups.length,
      };

      this.logger.log(result.message);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
