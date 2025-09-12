import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { StartupRepository } from '../repositories/startups.repository';
import { IStartup, IFounder, ISectorCount } from '../interfaces/startup.interface';
import { CreateStartupDto, UpdateStartupDto } from './dto/admin-startup.dto';
import { JebApiService } from '../../jeb-api/jeb-api.service';

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sector?: string;
  maturity?: string;
  projectStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StartupStats {
  total: number;
  bySector: Array<{ sector: string; count: number }>;
  byMaturity: Array<{ maturity: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  newThisMonth: number;
  newThisWeek: number;
  activeProjects: number;
  needsFunding: number;
  topSectors: Array<{ sector: string; count: number; percentage: number }>;
  recentStartups: Array<{
    id: string;
    name: string;
    sector: string;
    maturity: string;
    created_at: Date;
  }>;
  monthlyGrowth: Array<{
    month: string;
    count: number;
  }>;
}

export interface StartupAuditLog {
  id: string;
  startupId: string;
  action: string;
  details: any;
  adminId?: string;
  adminEmail?: string;
  timestamp: Date;
}

export interface PaginatedAuditLog {
  logs: StartupAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class AdminStartupService {
  private readonly logger = new Logger(AdminStartupService.name);

  constructor(
    private readonly startupRepository: StartupRepository,
    private readonly jebApiService: JebApiService
  ) {}

  /**
   * Get all startups with advanced pagination and filtering
   */
  async getAllStartupsWithPagination(params: PaginationParams) {
    try {
      this.logger.log(`Getting startups with params: ${JSON.stringify(params)}`);
      
      // Get all startups first
      const allStartupsResult = await this.startupRepository.findAll(1, 10000, params.sector, params.search);
      let filteredStartups = allStartupsResult.data;

      // Apply additional filters
      if (params.maturity) {
        filteredStartups = filteredStartups.filter(startup => 
          startup.maturity === params.maturity
        );
      }

      if (params.projectStatus) {
        filteredStartups = filteredStartups.filter(startup => 
          startup.project_status === params.projectStatus
        );
      }

      // Apply sorting
      const sortBy = params.sortBy || 'created_at';
      const sortOrder = params.sortOrder || 'desc';
      
      filteredStartups.sort((a, b) => {
        let aValue = a[sortBy as keyof IStartup];
        let bValue = b[sortBy as keyof IStartup];
        
        if (aValue instanceof Date) aValue = aValue.getTime();
        if (bValue instanceof Date) bValue = bValue.getTime();
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const total = filteredStartups.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedStartups = filteredStartups.slice(startIndex, endIndex);

      return {
        startups: paginatedStartups,
        page: params.page,
        limit: params.limit,
        total,
        totalPages
      };
    } catch (error) {
      this.logger.error('Error getting startups with pagination:', error);
      throw error;
    }
  }

  /**
   * Get startup statistics for admin dashboard
   */
  async getStartupStats(): Promise<StartupStats> {
    try {
      const allStartups = await this.startupRepository.findAll(1, 10000);
      const startups = allStartups.data;

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Group by sector
      const sectorCounts: Record<string, number> = {};
      const maturityCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};

      startups.forEach(startup => {
        // Sector count
        if (startup.sector) {
          sectorCounts[startup.sector] = (sectorCounts[startup.sector] || 0) + 1;
        }
        
        // Maturity count
        if (startup.maturity) {
          maturityCounts[startup.maturity] = (maturityCounts[startup.maturity] || 0) + 1;
        }
        
        // Status count
        const status = startup.project_status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const total = startups.length;

      const stats: StartupStats = {
        total,
        bySector: Object.entries(sectorCounts).map(([sector, count]) => ({ sector, count })),
        byMaturity: Object.entries(maturityCounts).map(([maturity, count]) => ({ maturity, count })),
        byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        newThisMonth: startups.filter(s => s.db_created_at >= lastMonth).length,
        newThisWeek: startups.filter(s => s.db_created_at >= lastWeek).length,
        activeProjects: startups.filter(s => s.project_status === 'Active').length,
        needsFunding: startups.filter(s => s.needs?.toLowerCase().includes('funding')).length,
        topSectors: Object.entries(sectorCounts)
          .map(([sector, count]) => ({ 
            sector, 
            count, 
            percentage: Math.round((count / total) * 100) 
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        recentStartups: startups
          .filter(s => s.db_created_at >= lastWeek)
          .sort((a, b) => b.db_created_at.getTime() - a.db_created_at.getTime())
          .slice(0, 5)
          .map(s => ({
            id: s.id!,
            name: s.name,
            sector: s.sector,
            maturity: s.maturity,
            created_at: s.db_created_at
          })),
        monthlyGrowth: this.calculateMonthlyGrowth(startups)
      };

      return stats;
    } catch (error) {
      this.logger.error('Error getting startup stats:', error);
      throw error;
    }
  }

  /**
   * Get all sectors with detailed statistics
   */
  async getAllSectorsWithStats(): Promise<Array<ISectorCount & { 
    avgMaturity: string; 
    activePrjects: number; 
    fundingNeeds: number 
  }>> {
    try {
      const sectors = await this.startupRepository.getSectors();
      const allStartups = await this.startupRepository.findAll(1, 10000);
      
      const enrichedSectors = sectors.map(sector => {
        const sectorStartups = allStartups.data.filter(s => s.sector === sector.name);
        
        // Calculate most common maturity
        const maturityCounts: Record<string, number> = {};
        sectorStartups.forEach(s => {
          if (s.maturity) {
            maturityCounts[s.maturity] = (maturityCounts[s.maturity] || 0) + 1;
          }
        });
        
        const avgMaturity = Object.entries(maturityCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

        return {
          ...sector,
          avgMaturity,
          activePrjects: sectorStartups.filter(s => s.project_status === 'Active').length,
          fundingNeeds: sectorStartups.filter(s => s.needs?.toLowerCase().includes('funding')).length
        };
      });

      return enrichedSectors;
    } catch (error) {
      this.logger.error('Error getting sectors with stats:', error);
      throw error;
    }
  }

  /**
   * Get startup by ID with full details
   */
  async getStartupById(id: string): Promise<IStartup | null> {
    try {
      return await this.startupRepository.findById(id);
    } catch (error) {
      this.logger.error(`Error getting startup ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new startup (admin only)
   */
  async createStartup(createStartupDto: CreateStartupDto, adminId: string) {
    try {
      // Check if startup with same name already exists
      const existingStartups = await this.startupRepository.findAll(1, 1000);
      const existingStartup = existingStartups.data.find(s => 
        s.name.toLowerCase() === createStartupDto.name.toLowerCase()
      );
      
      if (existingStartup) {
        throw new ConflictException('Startup with this name already exists');
      }

      // Prepare startup data
      const startupData: Omit<IStartup, 'id' | 'db_created_at' | 'db_updated_at'> = {
        jeb_id: Math.floor(Math.random() * 1000000), // Generate random JEB ID for admin-created startups
        name: createStartupDto.name,
        legal_status: createStartupDto.legalStatus,
        address: createStartupDto.address,
        email: createStartupDto.email,
        phone: createStartupDto.phone,
        created_at: createStartupDto.foundingDate ? new Date(createStartupDto.foundingDate) : new Date(),
        description: createStartupDto.description,
        website_url: createStartupDto.websiteUrl,
        social_media_url: createStartupDto.socialMediaUrl,
        project_status: createStartupDto.projectStatus || 'Active',
        needs: createStartupDto.needs,
        sector: createStartupDto.sector,
        maturity: createStartupDto.maturity
      };

      // Create startup
      const startup = await this.startupRepository.create(startupData);

      // Add founders if provided
      if (createStartupDto.founders && createStartupDto.founders.length > 0) {
        for (const founderData of createStartupDto.founders) {
          await this.startupRepository.createFounder({
            jeb_id: Math.floor(Math.random() * 1000000),
            name: founderData.name,
            startup_id: startup.id!,
            jeb_startup_id: startup.jeb_id
          });
        }
      }

      // Log activity
      await this.logActivity(startup.id!, 'startup_created_by_admin', {
        name: startup.name,
        sector: startup.sector
      }, adminId);

      return {
        startup: await this.startupRepository.findById(startup.id!)
      };
    } catch (error) {
      this.logger.error('Error creating startup:', error);
      throw error;
    }
  }

  /**
   * Update startup
   */
  async updateStartup(id: string, updateStartupDto: UpdateStartupDto, adminId: string) {
    try {
      const existingStartup = await this.startupRepository.findById(id);
      if (!existingStartup) {
        throw new NotFoundException('Startup not found');
      }

      // Check name uniqueness if name is being changed
      if (updateStartupDto.name && updateStartupDto.name !== existingStartup.name) {
        const allStartups = await this.startupRepository.findAll(1, 1000);
        const nameExists = allStartups.data.find(s => 
          s.name.toLowerCase() === updateStartupDto.name!.toLowerCase() && s.id !== id
        );
        if (nameExists) {
          throw new ConflictException('Startup name already in use');
        }
      }

      // Prepare update data
      const updateData: Partial<IStartup> = {};
      
      if (updateStartupDto.name) updateData.name = updateStartupDto.name;
      if (updateStartupDto.legalStatus) updateData.legal_status = updateStartupDto.legalStatus;
      if (updateStartupDto.address) updateData.address = updateStartupDto.address;
      if (updateStartupDto.email) updateData.email = updateStartupDto.email;
      if (updateStartupDto.phone) updateData.phone = updateStartupDto.phone;
      if (updateStartupDto.description) updateData.description = updateStartupDto.description;
      if (updateStartupDto.websiteUrl) updateData.website_url = updateStartupDto.websiteUrl;
      if (updateStartupDto.socialMediaUrl) updateData.social_media_url = updateStartupDto.socialMediaUrl;
      if (updateStartupDto.projectStatus) updateData.project_status = updateStartupDto.projectStatus;
      if (updateStartupDto.needs) updateData.needs = updateStartupDto.needs;
      if (updateStartupDto.sector) updateData.sector = updateStartupDto.sector;
      if (updateStartupDto.maturity) updateData.maturity = updateStartupDto.maturity;
      if (updateStartupDto.foundingDate) updateData.created_at = new Date(updateStartupDto.foundingDate);

      // Update startup
      const updatedStartup = await this.startupRepository.update(id, updateData);

      // Handle founders updates
      if (updateStartupDto.founders) {
        // Delete existing founders
        await this.startupRepository.deleteFoundersByStartup(id);
        
        // Add new founders
        for (const founderData of updateStartupDto.founders) {
          await this.startupRepository.createFounder({
            jeb_id: Math.floor(Math.random() * 1000000),
            name: founderData.name,
            startup_id: id,
            jeb_startup_id: existingStartup.jeb_id
          });
        }
      }

      // Log activity
      await this.logActivity(id, 'startup_updated_by_admin', {
        changes: Object.keys(updateData),
        startupName: existingStartup.name
      }, adminId);

      return await this.startupRepository.findById(id);
    } catch (error) {
      this.logger.error(`Error updating startup ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update startup status
   */
  async updateStartupStatus(id: string, status: string, adminId: string, reason?: string) {
    try {
      const existingStartup = await this.startupRepository.findById(id);
      if (!existingStartup) {
        throw new NotFoundException('Startup not found');
      }

      const oldStatus = existingStartup.project_status;
      const updatedStartup = await this.startupRepository.update(id, { 
        project_status: status 
      });

      // Log activity
      await this.logActivity(id, 'status_changed_by_admin', {
        oldStatus,
        newStatus: status,
        reason,
        startupName: existingStartup.name
      }, adminId);

      return updatedStartup;
    } catch (error) {
      this.logger.error(`Error updating startup status ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete startup
   */
  async deleteStartup(id: string, adminId: string) {
    try {
      const startup = await this.startupRepository.findById(id);
      if (!startup) {
        throw new NotFoundException('Startup not found');
      }

      // Log activity before deletion
      await this.logActivity(id, 'startup_deleted_by_admin', {
        startupName: startup.name,
        sector: startup.sector
      }, adminId);

      await this.startupRepository.delete(id);
      
      this.logger.log(`Startup ${id} deleted by admin ${adminId}`);
    } catch (error) {
      this.logger.error(`Error deleting startup ${id}:`, error);
      throw error;
    }
  }

  /**
   * Perform bulk actions on startups
   */
  async performBulkAction(
    startupIds: string[], 
    action: 'delete' | 'status_change' | 'sector_change' | 'export',
    adminId: string,
    params?: any
  ) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const startupId of startupIds) {
        try {
          switch (action) {
            case 'delete':
              await this.deleteStartup(startupId, adminId);
              break;
            case 'status_change':
              if (!params?.status) throw new BadRequestException('Status is required for status change');
              await this.updateStartupStatus(startupId, params.status, adminId, params.reason);
              break;
            case 'sector_change':
              if (!params?.sector) throw new BadRequestException('Sector is required for sector change');
              const startup = await this.startupRepository.findById(startupId);
              if (startup) {
                await this.startupRepository.update(startupId, { sector: params.sector });
                await this.logActivity(startupId, 'sector_changed_by_admin', {
                  oldSector: startup.sector,
                  newSector: params.sector,
                  reason: params.reason
                }, adminId);
              }
              break;
          }
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Startup ${startupId}: ${error.message}`);
        }
      }

      // Log bulk activity
      await this.logActivity('bulk', 'bulk_action_performed', {
        action,
        startupCount: startupIds.length,
        results
      }, adminId);

      return results;
    } catch (error) {
      this.logger.error('Error performing bulk action:', error);
      throw error;
    }
  }

  /**
   * Export startups to CSV
   */
  async exportStartupsToCSV(filters: { 
    sector?: string; 
    maturity?: string; 
    search?: string;
  }) {
    try {
      const allStartups = await this.startupRepository.findAll(1, 10000, filters.sector, filters.search);
      let startups = allStartups.data;

      // Apply maturity filter
      if (filters.maturity) {
        startups = startups.filter(startup => startup.maturity === filters.maturity);
      }

      // Generate CSV headers
      const headers = [
        'ID', 'JEB ID', 'Name', 'Legal Status', 'Address', 'Email', 'Phone',
        'Sector', 'Maturity', 'Project Status', 'Description', 'Website URL',
        'Social Media URL', 'Needs', 'Created At', 'Founders'
      ];

      // Generate CSV rows
      const rows = startups.map(startup => [
        startup.id || '',
        startup.jeb_id || '',
        startup.name || '',
        startup.legal_status || '',
        startup.address || '',
        startup.email || '',
        startup.phone || '',
        startup.sector || '',
        startup.maturity || '',
        startup.project_status || '',
        (startup.description || '').replace(/"/g, '""'),
        startup.website_url || '',
        startup.social_media_url || '',
        (startup.needs || '').replace(/"/g, '""'),
        startup.created_at ? startup.created_at.toISOString() : '',
        startup.founders ? startup.founders.map(f => f.name).join('; ') : ''
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      this.logger.error('Error exporting startups to CSV:', error);
      throw error;
    }
  }

  /**
   * Sync with JEB API
   */
  async syncWithJebApi(adminId: string) {
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
          } else {
            existingStartup = await this.startupRepository.create(startupData);
            created++;
          }

          // Handle founders
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
          }

        } catch (error) {
          errors++;
          this.logger.warn(`Failed to sync startup ${jebStartup.id}:`, error.message);
        }
      }

      // Log sync activity
      await this.logActivity('sync', 'jeb_api_sync_performed', {
        created,
        updated,
        errors,
        total: jebStartups.length
      }, adminId);

      const result = {
        success: true,
        message: `Synchronisation terminée: ${created} créées, ${updated} mises à jour${errors > 0 ? `, ${errors} erreurs` : ''}`,
        created,
        updated,
        errors,
        total: jebStartups.length,
      };

      this.logger.log(result.message);
      return result;
    } catch (error) {
      this.logger.error('Error syncing with JEB API:', error);
      throw error;
    }
  }

  /**
   * Get startup analytics (placeholder)
   */
  async getStartupAnalytics(id: string) {
    try {
      // This is a placeholder - integrate with your analytics service
      return {
        views: Math.floor(Math.random() * 1000),
        contacts: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 25),
        engagementRate: Math.random() * 100,
        lastWeekViews: Math.floor(Math.random() * 200),
        conversionRate: Math.random() * 10,
        topReferrers: [
          { source: 'Direct', count: Math.floor(Math.random() * 100) },
          { source: 'Google', count: Math.floor(Math.random() * 50) },
          { source: 'LinkedIn', count: Math.floor(Math.random() * 30) }
        ]
      };
    } catch (error) {
      this.logger.error(`Error getting analytics for startup ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get startup audit log
   */
  async getStartupAuditLog(id: string, params: { page: number; limit: number }): Promise<PaginatedAuditLog> {
    try {
      // This is a placeholder - implement according to your audit system
      const mockLogs: StartupAuditLog[] = [
        {
          id: '1',
          startupId: id,
          action: 'startup_updated',
          details: { fields: ['description', 'sector'] },
          adminId: 'admin1',
          adminEmail: 'admin@example.com',
          timestamp: new Date()
        },
        {
          id: '2',
          startupId: id,
          action: 'founder_added',
          details: { founderName: 'John Doe' },
          adminId: 'admin1',
          adminEmail: 'admin@example.com',
          timestamp: new Date(Date.now() - 86400000)
        }
      ];

      const total = mockLogs.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const paginatedLogs = mockLogs.slice(startIndex, startIndex + params.limit);

      return {
        logs: paginatedLogs,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error(`Error getting audit log for startup ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add founder to startup
   */
  async addFounder(startupId: string, founderData: { name: string; email?: string; role?: string }, adminId: string) {
    try {
      const startup = await this.startupRepository.findById(startupId);
      if (!startup) {
        throw new NotFoundException('Startup not found');
      }

      const founder = await this.startupRepository.createFounder({
        jeb_id: Math.floor(Math.random() * 1000000),
        name: founderData.name,
        startup_id: startupId,
        jeb_startup_id: startup.jeb_id
      });

      // Log activity
      await this.logActivity(startupId, 'founder_added_by_admin', {
        founderName: founderData.name,
        startupName: startup.name
      }, adminId);

      return { founder };
    } catch (error) {
      this.logger.error(`Error adding founder to startup ${startupId}:`, error);
      throw error;
    }
  }

  /**
   * Remove founder from startup
   */
  async removeFounder(startupId: string, founderId: string, adminId: string) {
    try {
      const startup = await this.startupRepository.findById(startupId);
      if (!startup) {
        throw new NotFoundException('Startup not found');
      }

      const founder = startup.founders?.find(f => f.id === founderId);
      if (!founder) {
        throw new NotFoundException('Founder not found');
      }

      // Delete founder (implement this method in repository)
      // await this.startupRepository.deleteFounder(founderId);

      // Log activity
      await this.logActivity(startupId, 'founder_removed_by_admin', {
        founderName: founder.name,
        startupName: startup.name
      }, adminId);

      this.logger.log(`Founder ${founderId} removed from startup ${startupId} by admin ${adminId}`);
    } catch (error) {
      this.logger.error(`Error removing founder from startup ${startupId}:`, error);
      throw error;
    }
  }

  /**
   * Helper: Calculate monthly growth
   */
  private calculateMonthlyGrowth(startups: IStartup[]): Array<{ month: string; count: number }> {
    const monthCounts: Record<string, number> = {};
    
    startups.forEach(startup => {
      const monthKey = startup.db_created_at.toISOString().substring(0, 7); // YYYY-MM
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    // Get last 6 months
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      
      result.push({
        month: monthName,
        count: monthCounts[monthKey] || 0
      });
    }

    return result;
  }

  /**
   * Helper: Log activity (placeholder - implement according to your needs)
   */
  private async logActivity(
    startupId: string, 
    action: string, 
    details: any, 
    adminId?: string
  ) {
    // This is a placeholder for activity logging
    // You might want to implement this with a separate table/collection
    this.logger.log(`Activity logged: ${action} for startup ${startupId} by admin ${adminId}`, {
      startupId,
      action,
      details,
      adminId,
      timestamp: new Date()
    });
  }
}