import { Injectable } from '@nestjs/common';
import { FirebaseConfigService } from '../../../config/firebase.config';

@Injectable()
export class ConversationsRepository {
    private db: FirebaseFirestore.Firestore;

    constructor(private readonly firebase: FirebaseConfigService) {
        this.db = this.firebase.getFirestore();
    }

    private col() {
        return this.db.collection('conversations');
    }

    async create(data: any) {
        const docRef = this.col().doc();
        await docRef.set({
            ...data,
            id: docRef.id,
            createdAt: this.firebase.getServerTimestamp(),
            updatedAt: this.firebase.getServerTimestamp(),
        });
        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    }

    async findById(id: string) {
        const snap = await this.col().doc(id).get();
        return snap.exists ? { id: snap.id, ...snap.data() } : null;
    }

    async listForUser(userId: string) {
        if (!userId) {
            throw new Error('userId is required for listForUser');
        }

        const snapshot = await this.col()
            .where('participantIds', 'array-contains', userId)
            .get();

        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
}