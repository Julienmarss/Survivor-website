import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { IUser, UserRole } from '../interfaces/user.interface';
import { CreateUserDto, UpdateUserDto } from './dto/admin.dto';
import * as bcrypt from 'bcrypt';

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details: any;
  adminId?: string;
  adminEmail?: string;
  timestamp: Date;
}

interface UserStats {
  total: number;
  byRole: {
    admin: number;
    startup: number;
    investor: number;
    user: number;
  };
  newThisMonth: number;
  newThisWeek: number;
  activeThisMonth: number;
  emailVerified: number;
  topSectors: Array<{ sector: string; count: number }>;
  recentRegistrations: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: Date;
  }>;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly userRepository: UserRepository
  ) {}

  /**
   * Get all users with pagination and filters
   */
  async getAllUsersWithPagination(params: PaginationParams) {
    try {
      this.logger.log(`Getting users with params: ${JSON.stringify(params)}`);
      
      // Get all users first
      const allUsersResult = await this.userRepository.getAllUsers(1000);
      let filteredUsers = allUsersResult.users;

      // Apply search filter
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.email?.toLowerCase().includes(searchTerm) ||
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm) ||
          user.companyName?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply role filter
      if (params.role) {
        filteredUsers = filteredUsers.filter(user => user.role === params.role);
      }

      // Apply sorting
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      
      filteredUsers.sort((a, b) => {
        let aValue = a[sortBy as keyof IUser];
        let bValue = b[sortBy as keyof IUser];
        
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
      const total = filteredUsers.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      // Remove sensitive data
      const safeUsers = paginatedUsers.map(user => ({
        ...user,
        password: undefined
      }));

      return {
        users: safeUsers,
        page: params.page,
        limit: params.limit,
        total,
        totalPages
      };
    } catch (error) {
      this.logger.error('Error getting users with pagination:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const allUsers = await this.userRepository.getAllUsers(10000);
      const users = allUsers.users;

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: UserStats = {
        total: users.length,
        byRole: {
          admin: users.filter(u => u.role === UserRole.ADMIN).length,
          startup: users.filter(u => u.role === UserRole.STARTUP).length,
          investor: users.filter(u => u.role === UserRole.INVESTOR).length,
          user: users.filter(u => u.role === UserRole.USER).length
        },
        newThisMonth: users.filter(u => u.createdAt >= lastMonth).length,
        newThisWeek: users.filter(u => u.createdAt >= lastWeek).length,
        activeThisMonth: users.filter(u => u.lastLoginAt && u.lastLoginAt >= lastMonth).length,
        emailVerified: users.filter(u => u.isEmailVerified).length,
        topSectors: this.getTopSectors(users),
        recentRegistrations: users
          .filter(u => u.createdAt >= lastWeek)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
          .map(u => ({
            id: u.id!,
            email: u.email,
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            role: u.role,
            createdAt: u.createdAt
          }))
      };

      return stats;
    } catch (error) {
      this.logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findById(id);
      if (user) {
        return { ...user, password: undefined };
      }
      return null;
    } catch (error) {
      this.logger.error(`Error getting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new user (admin only)
   */
  async createUser(createUserDto: CreateUserDto, adminId: string) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Prepare user data
      const userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role,
        isEmailVerified: false,
        ...this.filterDataByRole(createUserDto, createUserDto.role)
      };

      // Create user
      const user = await this.userRepository.createUser(userData);

      // Log activity
      await this.logActivity(user.id!, 'user_created_by_admin', {
        email: user.email,
        role: user.role
      }, adminId);

      return {
        user: { ...user, password: undefined }
      };
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto, adminId: string) {
    try {
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Check email uniqueness if email is being changed
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(updateUserDto.email);
        if (emailExists) {
          throw new ConflictException('Email already in use');
        }
      }

      // Filter update data by user role
      const filteredData = this.filterDataByRole(updateUserDto, existingUser.role);
      
      // Update user
      const updatedUser = await this.userRepository.updateUser(id, filteredData);

      // Log activity
      await this.logActivity(id, 'user_updated_by_admin', {
        changes: Object.keys(filteredData),
        originalRole: existingUser.role
      }, adminId);

      return { ...updatedUser, password: undefined };
    } catch (error) {
      this.logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, newRole: UserRole, adminId: string, reason?: string) {
    try {
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      const oldRole = existingUser.role;
      const updatedUser = await this.userRepository.updateUser(id, { role: newRole });

      // Log activity
      await this.logActivity(id, 'role_changed_by_admin', {
        oldRole,
        newRole,
        reason
      }, adminId);

      return { ...updatedUser, password: undefined };
    } catch (error) {
      this.logger.error(`Error updating user role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reset user password
   */
  async resetUserPassword(id: string, newPassword: string, adminId: string) {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.updateUser(id, { password: hashedPassword });

      // Log activity
      await this.logActivity(id, 'password_reset_by_admin', {
        userEmail: user.email
      }, adminId);

      this.logger.log(`Password reset for user ${id} by admin ${adminId}`);
    } catch (error) {
      this.logger.error(`Error resetting password for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id: string, adminId: string, reason?: string) {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // For now, we'll use a custom field to track active status
      const currentStatus = (user as any).isActive !== false; // Default to true if not set
      const newStatus = !currentStatus;

      const updatedUser = await this.userRepository.updateUser(id, { 
        isActive: newStatus 
      } as any);

      // Log activity
      await this.logActivity(id, 'status_toggled_by_admin', {
        oldStatus: currentStatus ? 'active' : 'inactive',
        newStatus: newStatus ? 'active' : 'inactive',
        reason
      }, adminId);

      return { ...updatedUser, password: undefined };
    } catch (error) {
      this.logger.error(`Error toggling user status ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string, adminId: string) {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Log activity before deletion
      await this.logActivity(id, 'user_deleted_by_admin', {
        userEmail: user.email,
        userRole: user.role
      }, adminId);

      await this.userRepository.deleteUser(id);
      
      this.logger.log(`User ${id} deleted by admin ${adminId}`);
    } catch (error) {
      this.logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(id: string, params: { page: number; limit: number }) {
    try {
      // This is a placeholder - you'll need to implement activity logging in your system
      // For now, return mock data structure
      const activities: UserActivity[] = [
        {
          id: '1',
          userId: id,
          action: 'user_login',
          details: { ip: '192.168.1.1' },
          timestamp: new Date()
        }
      ];

      const total = activities.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const paginatedActivities = activities.slice(startIndex, startIndex + params.limit);

      return {
        activities: paginatedActivities,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error(`Error getting user activity ${id}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to user
   */
  async sendNotificationToUser(
    userId: string, 
    notification: { subject: string; message: string; type?: string }, 
    adminId: string
  ) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Here you would implement your notification system
      // For now, just log the activity
      await this.logActivity(userId, 'notification_sent_by_admin', {
        subject: notification.subject,
        type: notification.type || 'general'
      }, adminId);

      this.logger.log(`Notification sent to user ${userId} by admin ${adminId}`);
    } catch (error) {
      this.logger.error(`Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Perform bulk actions
   */
  async performBulkAction(
    userIds: string[], 
    action: 'delete' | 'role_change' | 'activate' | 'deactivate',
    adminId: string,
    params?: any
  ) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const userId of userIds) {
        try {
          switch (action) {
            case 'delete':
              await this.deleteUser(userId, adminId);
              break;
            case 'role_change':
              if (!params?.role) throw new BadRequestException('Role is required for role change');
              await this.updateUserRole(userId, params.role, adminId, params.reason);
              break;
            case 'activate':
            case 'deactivate':
              await this.toggleUserStatus(userId, adminId, params?.reason);
              break;
          }
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`User ${userId}: ${error.message}`);
        }
      }

      // Log bulk activity
      await this.logActivity('bulk', 'bulk_action_performed', {
        action,
        userCount: userIds.length,
        results
      }, adminId);

      return results;
    } catch (error) {
      this.logger.error('Error performing bulk action:', error);
      throw error;
    }
  }

  /**
   * Export users to CSV
   */
  async exportUsersToCSV(filters: { role?: UserRole; search?: string }) {
    try {
      const allUsers = await this.userRepository.getAllUsers(10000);
      let users = allUsers.users;

      // Apply filters
      if (filters.role) {
        users = users.filter(user => user.role === filters.role);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter(user => 
          user.email?.toLowerCase().includes(searchTerm) ||
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm) ||
          user.companyName?.toLowerCase().includes(searchTerm)
        );
      }

      // Generate CSV headers
      const headers = [
        'ID', 'Email', 'First Name', 'Last Name', 'Role', 'Company Name', 
        'Sector', 'Phone', 'Created At', 'Last Login', 'Email Verified'
      ];

      // Generate CSV rows
      const rows = users.map(user => [
        user.id || '',
        user.email || '',
        user.firstName || '',
        user.lastName || '',
        user.role || '',
        user.companyName || '',
        user.sector || '',
        user.phone || '',
        user.createdAt ? user.createdAt.toISOString() : '',
        user.lastLoginAt ? user.lastLoginAt.toISOString() : '',
        user.isEmailVerified ? 'Yes' : 'No'
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      this.logger.error('Error exporting users to CSV:', error);
      throw error;
    }
  }

  /**
   * Helper: Filter data by user role
   */
  private filterDataByRole(data: any, role: UserRole): any {
    const baseFields = ['firstName', 'lastName', 'email', 'phone'];
    
    switch (role) {
      case UserRole.STARTUP:
        return this.pickFields(data, [
          ...baseFields, 
          'companyName', 'sector', 'description', 'maturity', 
          'projectStatus', 'needs', 'websiteUrl', 'linkedinUrl',
          'teamSize', 'foundingDate', 'legalStatus', 'address'
        ]);
      
      case UserRole.INVESTOR:
        return this.pickFields(data, [
          ...baseFields,
          'investorType', 'investmentRange', 'preferredSectors',
          'preferredStages', 'portfolioSize', 'investmentExperience',
          'investmentCriteria', 'geographicalPreferences', 'linkedinUrl'
        ]);
      
      case UserRole.USER:
        return this.pickFields(data, [
          ...baseFields,
          'age', 'gender', 'school', 'level', 'field'
        ]);
      
      case UserRole.ADMIN:
        return this.pickFields(data, baseFields);
      
      default:
        return this.pickFields(data, baseFields);
    }
  }

  /**
   * Helper: Pick specific fields from object
   */
  private pickFields(obj: any, fields: string[]): any {
    const result: any = {};
    fields.forEach(field => {
      if (obj[field] !== undefined) {
        result[field] = obj[field];
      }
    });
    return result;
  }

  /**
   * Helper: Get top sectors from users
   */
  private getTopSectors(users: IUser[]): Array<{ sector: string; count: number }> {
    const sectorCounts: Record<string, number> = {};
    
    users.forEach(user => {
      if (user.sector) {
        sectorCounts[user.sector] = (sectorCounts[user.sector] || 0) + 1;
      }
    });

    return Object.entries(sectorCounts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Helper: Log activity (placeholder - implement according to your needs)
   */
  private async logActivity(
    userId: string, 
    action: string, 
    details: any, 
    adminId?: string
  ) {
    // This is a placeholder for activity logging
    // You might want to implement this with a separate table/collection
    this.logger.log(`Activity logged: ${action} for user ${userId} by admin ${adminId}`, {
      userId,
      action,
      details,
      adminId,
      timestamp: new Date()
    });
  }
}