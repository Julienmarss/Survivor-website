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

  async createUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
  }): Promise<IUser> {
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
      const userDoc: Omit<IUser, 'id'> = {
        uid: authUser.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || UserRole.VISITOR,
        isEmailVerified: false,
        createdAt: now,
        updatedAt: now,
      };

        await this.db.collection(this.usersCollection).doc(authUser.uid).set(userDoc);
        const user = { ...userDoc, id: authUser.uid } as IUser;

      this.logger.log(`Created user: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
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
      const data = {
        ...updateData,
        updatedAt: new Date()
      };

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

  async getAllUsers(limit: number = 20, pageToken?: string): Promise<{
    users: IUser[];
    nextPageToken?: string;
  }> {
    try {
      let query = this.db.collection(this.usersCollection)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (pageToken) {
        query = query.startAfter(pageToken);
      }

      const snapshot = await query.get();
      const users: IUser[] = [];

      snapshot.forEach(doc => {
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
}
