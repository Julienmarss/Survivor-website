import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JebApiService } from '../jeb-api/jeb-api.service';
import { Startup } from './entities/startup.entity';
import { Founder } from './entities/founder.entity';

@Injectable()
export class StartupsService {
  private readonly logger = new Logger(StartupsService.name);

  constructor(
    @InjectRepository(Startup)
    private readonly startupRepository: Repository<Startup>,
    @InjectRepository(Founder)
    private readonly founderRepository: Repository<Founder>,
    private readonly jebApiService: JebApiService,
  ) {}

  async findAll(page = 1, limit = 20, sector?: string, search?: string) {
    const query = this.startupRepository
      .createQueryBuilder('startup')
      .leftJoinAndSelect('startup.founders', 'founders')
      .orderBy('startup.created_at', 'DESC');

    if (sector && sector !== 'all') {
      query.andWhere('startup.sector = :sector', { sector });
    }

    if (search) {
      query.andWhere(
        '(startup.name ILIKE :search OR startup.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(id: number) {
    return this.startupRepository.findOne({
      where: { id },
      relations: ['founders'],
    });
  }

  async getSectors() {
    const sectors = await this.startupRepository
      .createQueryBuilder('startup')
      .select('startup.sector', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('startup.sector')
      .getRawMany();

    return sectors.map(sector => ({
      name: sector.name,
      count: parseInt(sector.count),
    }));
  }

  async getStats() {
    const [totalProjects, totalFunding] = await Promise.all([
      this.startupRepository.count(),
      Promise.resolve(50000000),
    ]);

    return {
      totalProjects,
      totalFunding,
      successRate: 85, // Simulé
      jobsCreated: 500, // Simulé
    };
  }

  async syncWithJebApi() {
    this.logger.log('Starting sync with JEB API...');

    try {
      const jebStartups = await this.jebApiService.getAllStartups(0, 1000);
      
      let created = 0;
      let updated = 0;

      for (const jebStartup of jebStartups) {
        const fullStartup = await this.jebApiService.getStartupById(jebStartup.id);
        
        let startup = await this.startupRepository.findOne({
          where: { id: fullStartup.id },
          relations: ['founders'],
        });

        if (startup) {
          Object.assign(startup, {
            name: fullStartup.name,
            legal_status: fullStartup.legal_status,
            address: fullStartup.address,
            email: fullStartup.email,
            phone: fullStartup.phone,
            created_at: new Date(fullStartup.created_at),
            description: fullStartup.description,
            website_url: fullStartup.website_url,
            social_media_url: fullStartup.social_media_url,
            project_status: fullStartup.project_status,
            needs: fullStartup.needs,
            sector: fullStartup.sector,
            maturity: fullStartup.maturity,
          });
          
          await this.startupRepository.save(startup);
          updated++;
        } else {
          startup = this.startupRepository.create({
            id: fullStartup.id,
            name: fullStartup.name,
            legal_status: fullStartup.legal_status,
            address: fullStartup.address,
            email: fullStartup.email,
            phone: fullStartup.phone,
            created_at: new Date(fullStartup.created_at),
            description: fullStartup.description,
            website_url: fullStartup.website_url,
            social_media_url: fullStartup.social_media_url,
            project_status: fullStartup.project_status,
            needs: fullStartup.needs,
            sector: fullStartup.sector,
            maturity: fullStartup.maturity,
          });
          
          await this.startupRepository.save(startup);
          created++;
        }

        if (fullStartup.founders && fullStartup.founders.length > 0) {
          await this.founderRepository.delete({ startup_id: startup.id });
          const founders = fullStartup.founders.map(founderData => 
            this.founderRepository.create({
              id: founderData.id,
              name: founderData.name,
              startup_id: startup.id,
            })
          );
          
          await this.founderRepository.save(founders);
        }
      }

      this.logger.log(`Sync completed: ${created} created, ${updated} updated`);
      
      return {
        success: true,
        message: `Synchronisation terminée: ${created} créées, ${updated} mises à jour`,
        created,
        updated,
        total: jebStartups.length,
      };
    } catch (error) {
      this.logger.error('Sync failed:', error);
      throw error;
    }
  }
}