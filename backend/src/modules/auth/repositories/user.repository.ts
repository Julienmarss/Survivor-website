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

      const now = new Date();
      const id = this.db.collection(this.usersCollection).doc().id;

      const userDoc = {
        id,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isEmailVerified: false,
        createdAt: now,
        updatedAt: now,
        ...this.filterUndefined(userData),
      };

      await this.db.collection(this.usersCollection).doc(id).set(userDoc);

      this.logger.log(`Created user: ${userData.email}`);
      return { ...userDoc, password: undefined } as IUser;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  private filterUndefined(obj: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
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
        const pageDoc = await this.db.collection(this.usersCollection).doc(pageToken).get();
        if (pageDoc.exists) {
          query = query.startAfter(pageDoc);
        }
      }

      const snapshot = await query.get();
      const users: IUser[] = [];

      snapshot.forEach(doc => {
        const user = this.mapDocumentToUser(doc);
        users.push({ ...user, password: undefined });
      });

      const result: { users: IUser[]; nextPageToken?: string } = { users };
      
      if (!snapshot.empty && snapshot.docs.length === limit) {
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
        const pageDoc = await this.db.collection(this.usersCollection).doc(pageToken).get();
        if (pageDoc.exists) {
          query = query.startAfter(pageDoc);
        }
      }

      const snapshot = await query.get();
      const users: IUser[] = [];

      snapshot.forEach(doc => {
        const user = this.mapDocumentToUser(doc);
        users.push({ ...user, password: undefined });
      });

      const result: { users: IUser[]; nextPageToken?: string } = { users };
      
      if (!snapshot.empty && snapshot.docs.length === limit) {
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
        const pageDoc = await this.db.collection(this.usersCollection).doc(pageToken).get();
        if (pageDoc.exists) {
          query = query.startAfter(pageDoc);
        }
      }

      const snapshot = await query.get();
      const users: IUser[] = [];

      snapshot.forEach(doc => {
        const user = this.mapDocumentToUser(doc);
        users.push({ ...user, password: undefined });
      });

      const result: { users: IUser[]; nextPageToken?: string } = { users };
      
      if (!snapshot.empty && snapshot.docs.length === limit) {
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
        try {
          await this.auth.deleteUser(user.uid);
        } catch (firebaseError) {
          this.logger.warn(`Could not delete Firebase Auth user ${user.uid}:`, firebaseError);
        }
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

  async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser> {
  try {
    this.logger.log(`Updating user: ${userId}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateData, null, 2)}`);
    
    // Nettoyer les données avant la mise à jour
    const cleanData = this.filterUndefined({
      ...updateData,
      updatedAt: new Date()
    });

    // Supprimer les champs sensibles qui ne doivent pas être mis à jour ici
    const { id, uid, createdAt, ...safeUpdateData } = cleanData;

    this.logger.debug(`Safe update data: ${JSON.stringify(safeUpdateData, null, 2)}`);

    // Effectuer la mise à jour
    await this.db.collection(this.usersCollection).doc(userId).update(safeUpdateData);
    
    // Récupérer l'utilisateur mis à jour
    const updated = await this.findById(userId);
    if (!updated) {
      throw new Error(`User ${userId} not found after update`);
    }
    
    this.logger.log(`Successfully updated user: ${updated.email}`);
    return updated;
  } catch (error) {
    this.logger.error(`Error updating user ${userId}:`, error);
    
    // Gérer les erreurs spécifiques de Firestore
    if (error.code === 'not-found') {
      throw new Error(`User ${userId} not found`);
    }
    
    if (error.code === 'permission-denied') {
      throw new Error(`Permission denied to update user ${userId}`);
    }
    
    throw error;
  }
}

// Ajouter une méthode pour valider les données avant mise à jour
private validateUpdateData(data: Partial<IUser>): void {
  // Validation de l'email si présent
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }
  }

  // Validation du rôle si présent
  if (data.role) {
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(data.role)) {
      throw new Error('Invalid user role');
    }
  }

  // Validation des URLs si présentes
  const urlFields = ['websiteUrl', 'website', 'website_url', 'linkedinUrl', 'linkedin', 'socialMediaUrl', 'social_media_url'];
  urlFields.forEach(field => {
    if (data[field] && typeof data[field] === 'string') {
      try {
        new URL(data[field]);
      } catch {
        // Si ce n'est pas une URL valide, essayer d'ajouter https://
        if (!data[field].startsWith('http')) {
          data[field] = `https://${data[field]}`;
          try {
            new URL(data[field]);
          } catch {
            throw new Error(`Invalid URL format for ${field}`);
          }
        } else {
          throw new Error(`Invalid URL format for ${field}`);
        }
      }
    }
  });
}

// Méthode pour fusionner les données existantes avec les nouvelles
async updateUserSafely(userId: string, updateData: Partial<IUser>): Promise<IUser> {
  try {
    // Récupérer l'utilisateur existant
    const existingUser = await this.findById(userId);
    if (!existingUser) {
      throw new Error(`User ${userId} not found`);
    }

    // Valider les nouvelles données
    this.validateUpdateData(updateData);

    // Fusionner avec les données existantes de manière intelligente
    const mergedData = this.mergeUserData(existingUser, updateData);

    // Effectuer la mise à jour
    return await this.updateUser(userId, mergedData);
  } catch (error) {
    this.logger.error(`Error in safe user update for ${userId}:`, error);
    throw error;
  }
}

// Méthode pour fusionner intelligemment les données
private mergeUserData(existingUser: IUser, updateData: Partial<IUser>): Partial<IUser> {
  const merged = { ...updateData };

  // Gérer les arrays de manière spéciale
  if (updateData.preferredSectors && Array.isArray(updateData.preferredSectors)) {
    merged.preferredSectors = updateData.preferredSectors.filter(s => s && s.trim());
  }

  if (updateData.interests && Array.isArray(updateData.interests)) {
    merged.interests = updateData.interests.filter(i => i && i.trim());
  }

  if (updateData.preferredStages && Array.isArray(updateData.preferredStages)) {
    merged.preferredStages = updateData.preferredStages.filter(s => s && s.trim());
  }

  if (updateData.geographicalPreferences && Array.isArray(updateData.geographicalPreferences)) {
    merged.geographicalPreferences = updateData.geographicalPreferences.filter(g => g && g.trim());
  }

  // Nettoyer les chaînes vides
  Object.keys(merged).forEach(key => {
    if (typeof merged[key] === 'string' && merged[key].trim() === '') {
      merged[key] = null;
    }
  });

  return merged;
}

// Méthode pour mettre à jour uniquement certains champs
async updateUserFields(userId: string, fields: string[], data: any): Promise<IUser> {
  try {
    const filteredData: any = {};
    
    fields.forEach(field => {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      throw new Error('No valid fields to update');
    }

    return await this.updateUser(userId, filteredData);
  } catch (error) {
    this.logger.error(`Error updating specific fields for user ${userId}:`, error);
    throw error;
  }
}
}