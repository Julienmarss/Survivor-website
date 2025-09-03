import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseConfigService {
  private readonly logger = new Logger(FirebaseConfigService.name);
  private firestore: admin.firestore.Firestore;
  private auth: admin.auth.Auth;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (admin.apps.length > 0) {
        this.logger.log('Firebase Admin already initialized');
        this.firestore = admin.firestore();
        this.auth = admin.auth();
        return;
      }

      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        throw new Error('Missing Firebase configuration in environment variables');
      }

      const serviceAccount = {
        type: 'service_account',
        project_id: projectId,
        private_key_id: this.configService.get<string>('FIREBASE_PRIVATE_KEY_ID'),
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: clientEmail,
        client_id: this.configService.get<string>('FIREBASE_CLIENT_ID'),
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: this.configService.get<string>('FIREBASE_CLIENT_CERT_URL'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: projectId,
      });

      this.firestore = admin.firestore();
      this.auth = admin.auth();
      
      this.firestore.settings({
        timestampsInSnapshots: true,
      });

      this.logger.log(`Firebase Admin initialized for project: ${projectId}`);
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error.message);
      throw error;
    }
  }

  getFirestore(): admin.firestore.Firestore {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }
    return this.firestore;
  }

  getAuth(): admin.auth.Auth {
    if (!this.auth) {
      throw new Error('Firebase Auth not initialized');
    }
    return this.auth;
  }

  async testConnection(): Promise<{ success: boolean; message: string; projectId?: string }> {
    try {
      const testDoc = this.firestore.collection('_connection_test').doc('test');
      await testDoc.set({ 
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        test: true 
      });
      
      const doc = await testDoc.get();
      await testDoc.delete();
      
      return { 
        success: true, 
        message: 'Firebase connection successful',
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID')
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Firebase connection failed: ${error.message}` 
      };
    }
  }

  getServerTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
  }

  createBatch() {
    return this.firestore.batch();
  }
}