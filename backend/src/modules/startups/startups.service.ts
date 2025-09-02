import { Injectable, Logger } from '@nestjs/common';
import { JebApiService } from '../jeb-api/jeb-api.service';

@Injectable()
export class StartupsService {
  private readonly logger = new Logger(StartupsService.name);

  constructor(private readonly jebApiService: JebApiService) {}

  async findAll(skip = 0, limit = 20) {
    this.logger.log(`Getting startups list (skip: ${skip}, limit: ${limit})`);
    
    // Pour l'instant, on récupère directement depuis JEB API
    // Plus tard on ajoutera une BDD locale
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
}