// backend/src/modules/auth/repositories/user.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { FirebaseConfigService } from '../../../config/firebase.config';
import { IUser, UserRole } from '../interfaces/user.interface';
import * as admin from 'firebase-admin';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  private readonly usersCollection = 'users';

  constructor(private firebaseConfig: FirebaseConfigService) {}

  private get db() {
    return this.firebaseConfig.getFirestore();
  }

  private get auth() {
    return this.firebaseConfig.getAuth();
  }

  async createUser(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    try {
      this.logger.log(`Creating user: ${userData.email}`);
      
      const authUser = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : userData.firstName,
        emailVerified: false,
      });

      const now = new Date();
      
      // Construct base user document
      const baseUserDoc = {
        uid: authUser.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isEmailVerified: false,
        createdAt: now,
        updatedAt: now,
      };

      // Add role-specific fields only if they exist
      let roleSpecificFields = {};

      if (userData.role === UserRole.USER) {
        roleSpecificFields = this.filterUndefined({
          age: userData.age,
          gender: userData.gender,
        });
      } else if (userData.role === UserRole.STARTUP) {
        roleSpecificFields = this.filterUndefined({
          companyName: userData.companyName,
          legalStatus: userData.legalStatus,
          address: userData.address,
          phone: userData.phone,
          websiteUrl: userData.websiteUrl,
          socialMediaUrl: userData.socialMediaUrl,
          description: userData.description,
          sector: userData.sector,
          maturity: userData.maturity,
          projectStatus: userData.projectStatus,
          needs: userData.needs,
          foundingDate: userData.foundingDate,
          teamSize: userData.teamSize,
        });
      } else if (userData.role === UserRole.INVESTOR) {
        roleSpecificFields = this.filterUndefined({
          investorType: userData.investorType,
          investmentRange: userData.investmentRange,
          preferredSectors: userData.preferredSectors,
          preferredStages: userData.preferredStages,
          portfolioSize: userData.portfolioSize,
          investmentExperience: userData.investmentExperience,
          linkedinUrl: userData.linkedinUrl,
          companyWebsite: userData.companyWebsite,
          investmentCriteria: userData.investmentCriteria,
          geographicalPreferences: userData.geographicalPreferences,
        });
      }

      // Combine base and role-specific fields
      const userDoc = { ...baseUserDoc, ...roleSpecificFields };

      await this.db.collection(this.usersCollection).doc(authUser.uid).set(userDoc);
      const user = { ...userDoc, id: authUser.uid } as IUser;

      this.logger.log(`Created user: ${user.email} with role: ${user.role}`);
      return user;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Filter out undefined values from an object
   */
  private filterUndefined(obj: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          // For nested objects, recursively filter
          const nestedFiltered = this.filterUndefined(value);
          if (Object.keys(nestedFiltered).length > 0) {
            filtered[key] = nestedFiltered;
          }
        } else {
          filtered[key] = value;
        }
      }
    }
    
    return filtered;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const snapshot = await this.db.collection(this.usersCollection)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const user = this.mapDocumentToUser(doc);
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }

  async findByUid(uid: string): Promise<IUser | null> {
    try {
      const snapshot = await this.db.collection(this.usersCollection)
        .where('uid', '==', uid)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const user = this.mapDocumentToUser(doc);
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by UID ${uid}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<IUser | null> {
    try {
      const doc = await this.db.collection(this.usersCollection).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const user = this.mapDocumentToUser(doc);
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by ID ${id}:`, error);
      throw error;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.db.collection(this.usersCollection).doc(userId).update({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
      
      this.logger.log(`Updated last login for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error updating last login for user ${userId}:`, error);
      throw error;
    }
  }

  async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser> {
    try {
      const data = this.filterUndefined({
        ...updateData,
        updatedAt: new Date()
      });

      await this.db.collection(this.usersCollection).doc(userId).update(data);
      
      const updated = await this.findById(userId);
      if (!updated) {
        throw new Error(`User ${userId} not found after update`);
      }
      
      this.logger.log(`Updated user: ${updated.email}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.auth.verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      this.logger.error('Error verifying token:', error);
      throw error;
    }
  }

  async getAllUsers(limit: number = 20, pageToken?: string, role?: UserRole): Promise<{
    users: IUser[];
    nextPageToken?: string;
  }> {
    try {
      let query = this.db.collection(this.usersCollection)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (role) {
        query = query.where('role', '==', role) as any;
      }

      if (pageToken) {
        query = query.startAfter(pageToken);
      }

      const snapshot = await query.get();
      const users: IUser[] = [];

      snapshot.forEach(doc => {
        const user = this.mapDocumentToUser(doc);
        users.push(user);
      });

      const result: { users: IUser[]; nextPageToken?: string } = { users };
      
      if (!snapshot.empty) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        result.nextPageToken = lastDoc.id;
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async getStartupProfiles(limit: number = 20, pageToken?: string, sector?: string): Promise<{
    users: IUser[];
    nextPageToken?: string;
  }> {
    try {
      let query = this.db.collection(this.usersCollection)
        .where('role', '==', UserRole.STARTUP)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (sector) {
        query = query.where('sector', '==', sector) as any;
      }

      if (pageToken) {
        query = query.startAfter(pageToken);
      }

      const snapshot = await query.get();
      const users: IUser[] = [];

      snapshot.forEach(doc => {
        const user = this.mapDocumentToUser(doc);
        users.push(user);
      });

      const result: { users: IUser[]; nextPageToken?: string } = { users };
      
      if (!snapshot.empty) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        result.nextPageToken = lastDoc.id;
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting startup profiles:', error);
      throw error;
    }
  }

  async getInvestorProfiles(limit: number = 20, pageToken?: string, investorType?: string): Promise<{
    users: IUser[];
    nextPageToken?: string;
  }> {
    try {
      let query = this.db.collection(this.usersCollection)
        .where('role', '==', UserRole.INVESTOR)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (investorType) {
        query = query.where('investorType', '==', investorType) as any;
      }

      if (pageToken) {
        query = query.startAfter(pageToken);
      }

      const snapshot = await query.get();
      const users: IUser[] = [];

      snapshot.forEach(doc => {
        const user = this.mapDocumentToUser(doc);
        users.push(user);
      });

      const result: { users: IUser[]; nextPageToken?: string } = { users };
      
      if (!snapshot.empty) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        result.nextPageToken = lastDoc.id;
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting investor profiles:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.findById(userId);
      
      if (user && user.uid) {
        await this.auth.deleteUser(user.uid);
      }
      
      await this.db.collection(this.usersCollection).doc(userId).delete();
      
      this.logger.log(`Deleted user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  private mapDocumentToUser(doc: any): IUser {
    const user = doc.data() as IUser;
    user.id = doc.id;

    // Convertir les timestamps Firestore en Date
    if (user.createdAt && typeof user.createdAt === 'object') {
      user.createdAt = (user.createdAt as any).toDate();
    }
    if (user.updatedAt && typeof user.updatedAt === 'object') {
      user.updatedAt = (user.updatedAt as any).toDate();
    }
    if (user.lastLoginAt && typeof user.lastLoginAt === 'object') {
      user.lastLoginAt = (user.lastLoginAt as any).toDate();
    }
    if (user.foundingDate && typeof user.foundingDate === 'object') {
      user.foundingDate = (user.foundingDate as any).toDate();
    }

    return user;
  }
}