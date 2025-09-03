import { Injectable, Logger } from '@nestjs/common';
import { FirebaseConfigService } from '../../../config/firebase.config';
import { IStartup, IFounder, IPaginationResult, ISectorCount } from '../interfaces/startup.interface';

@Injectable()
export class StartupRepository {
  private readonly logger = new Logger(StartupRepository.name);
  private readonly startupsCollection = 'startups';
  private readonly foundersCollection = 'founders';

  constructor(private firebaseConfig: FirebaseConfigService) {}

  private get db() {
    return this.firebaseConfig.getFirestore();
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    sector?: string,
    search?: string
  ): Promise<IPaginationResult<IStartup>> {
    try {
      this.logger.log(`Finding startups - page: ${page}, limit: ${limit}, sector: ${sector}, search: ${search}`);
      
      let query = this.db.collection(this.startupsCollection)
        .orderBy('created_at', 'desc');

      if (sector && sector !== 'all') {
        query = query.where('sector', '==', sector) as any;
      }

      const snapshot = await query.get();
      let startups: IStartup[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as IStartup;
        data.id = doc.id;
        if (data.created_at && typeof data.created_at === 'object') {
          data.created_at = (data.created_at as any).toDate();
        }
        if (data.db_created_at && typeof data.db_created_at === 'object') {
          data.db_created_at = (data.db_created_at as any).toDate();
        }
        if (data.db_updated_at && typeof data.db_updated_at === 'object') {
          data.db_updated_at = (data.db_updated_at as any).toDate();
        }
        startups.push(data);
      });

      if (search) {
        const searchLower = search.toLowerCase();
        startups = startups.filter(startup => 
          startup.name.toLowerCase().includes(searchLower) ||
          startup.description?.toLowerCase().includes(searchLower) ||
          startup.sector.toLowerCase().includes(searchLower)
        );
      }

      const total = startups.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedStartups = startups.slice(offset, offset + limit);

      for (const startup of paginatedStartups) {
        startup.founders = await this.getFoundersByStartup(startup.id!);
      }

      this.logger.log(`Found ${paginatedStartups.length} startups out of ${total} total`);

      return {
        data: paginatedStartups,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      this.logger.error('Error finding startups:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<IStartup | null> {
    try {
      const doc = await this.db.collection(this.startupsCollection).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const startup = doc.data() as IStartup;
      startup.id = doc.id;
      
      if (startup.created_at && typeof startup.created_at === 'object') {
        startup.created_at = (startup.created_at as any).toDate();
      }
      if (startup.db_created_at && typeof startup.db_created_at === 'object') {
        startup.db_created_at = (startup.db_created_at as any).toDate();
      }
      if (startup.db_updated_at && typeof startup.db_updated_at === 'object') {
        startup.db_updated_at = (startup.db_updated_at as any).toDate();
      }

      startup.founders = await this.getFoundersByStartup(id);
      return startup;
    } catch (error) {
      this.logger.error(`Error finding startup ${id}:`, error);
      throw error;
    }
  }

  async findByJebId(jebId: number): Promise<IStartup | null> {
    try {
      const snapshot = await this.db.collection(this.startupsCollection)
        .where('jeb_id', '==', jebId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const startup = doc.data() as IStartup;
      startup.id = doc.id;
      
      if (startup.created_at && typeof startup.created_at === 'object') {
        startup.created_at = (startup.created_at as any).toDate();
      }
      if (startup.db_created_at && typeof startup.db_created_at === 'object') {
        startup.db_created_at = (startup.db_created_at as any).toDate();
      }
      if (startup.db_updated_at && typeof startup.db_updated_at === 'object') {
        startup.db_updated_at = (startup.db_updated_at as any).toDate();
      }

      startup.founders = await this.getFoundersByStartup(startup.id);
      return startup;
    } catch (error) {
      this.logger.error(`Error finding startup by JEB ID ${jebId}:`, error);
      throw error;
    }
  }

  async create(startupData: Omit<IStartup, 'id' | 'db_created_at' | 'db_updated_at'>): Promise<IStartup> {
    try {
      const now = new Date();
      const data: Omit<IStartup, 'id'> = {
        ...startupData,
        db_created_at: now,
        db_updated_at: now
      };

      const docRef = await this.db.collection(this.startupsCollection).add(data);
      const startup = { ...data, id: docRef.id } as IStartup;

      return startup;
    } catch (error) {
      this.logger.error('Error creating startup:', error);
      throw error;
    }
  }

  async update(id: string, updateData: Partial<IStartup>): Promise<IStartup> {
    try {
      const data = {
        ...updateData,
        db_updated_at: new Date()
      };

      await this.db.collection(this.startupsCollection).doc(id).update(data);
      
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error(`Startup ${id} not found after update`);
      }
      
      return updated;
    } catch (error) {
      this.logger.error(`Error updating startup ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.deleteFoundersByStartup(id);
      await this.db.collection(this.startupsCollection).doc(id).delete();
    } catch (error) {
      this.logger.error(`Error deleting startup ${id}:`, error);
      throw error;
    }
  }

  async getSectors(): Promise<ISectorCount[]> {
    try {
      const snapshot = await this.db.collection(this.startupsCollection).get();
      const sectorCounts: Record<string, number> = {};

      snapshot.forEach(doc => {
        const data = doc.data() as IStartup;
        if (data.sector) {
          sectorCounts[data.sector] = (sectorCounts[data.sector] || 0) + 1;
        }
      });

      return Object.entries(sectorCounts).map(([name, count]) => ({
        name,
        count
      }));
    } catch (error) {
      this.logger.error('Error getting sectors:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const snapshot = await this.db.collection(this.startupsCollection).get();
      return snapshot.size;
    } catch (error) {
      this.logger.error('Error counting startups:', error);
      throw error;
    }
  }

  async getFoundersByStartup(startupId: string): Promise<IFounder[]> {
    try {
      const snapshot = await this.db.collection(this.foundersCollection)
        .where('startup_id', '==', startupId)
        .get();

      const founders: IFounder[] = [];
      snapshot.forEach(doc => {
        const founder = doc.data() as IFounder;
        founder.id = doc.id;
        founders.push(founder);
      });

      return founders;
    } catch (error) {
      this.logger.error(`Error getting founders for startup ${startupId}:`, error);
      return [];
    }
  }

  async createFounder(founderData: Omit<IFounder, 'id'>): Promise<IFounder> {
    try {
      const docRef = await this.db.collection(this.foundersCollection).add(founderData);
      const founder = { ...founderData, id: docRef.id };
      
      this.logger.log(`Created founder: ${founder.name} (${docRef.id})`);
      return founder;
    } catch (error) {
      this.logger.error('Error creating founder:', error);
      throw error;
    }
  }

  async deleteFoundersByStartup(startupId: string): Promise<void> {
    try {
      const snapshot = await this.db.collection(this.foundersCollection)
        .where('startup_id', '==', startupId)
        .get();

      if (snapshot.empty) {
        return;
      }

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      this.logger.log(`Deleted ${snapshot.docs.length} founders for startup ${startupId}`);
    } catch (error) {
      this.logger.error(`Error deleting founders for startup ${startupId}:`, error);
      throw error;
    }
  }

  async deleteFoundersByJebStartupId(jebStartupId: number): Promise<void> {
    try {
      const snapshot = await this.db.collection(this.foundersCollection)
        .where('jeb_startup_id', '==', jebStartupId)
        .get();

      if (snapshot.empty) {
        return;
      }

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      this.logger.log(`Deleted ${snapshot.docs.length} founders for JEB startup ${jebStartupId}`);
    } catch (error) {
      this.logger.error(`Error deleting founders for JEB startup ${jebStartupId}:`, error);
      throw error;
    }
  }
}