import { Injectable } from '@nestjs/common';
import { FirebaseConfigService } from '../../../config/firebase.config';
import { Message } from '../interfaces';
import { v4 as uuid } from 'uuid';

@Injectable()
export class MessagesRepository {
    private db: FirebaseFirestore.Firestore;

    constructor(private readonly firebase: FirebaseConfigService) {
        this.db = this.firebase.getFirestore();
    }

    private col(convId: string) {
        return this.db.collection('conversations').doc(convId).collection('messages');
    }

    async create(convId: string, msg: Omit<Message, 'id'>): Promise<Message> {
        const id = uuid();
        const payload: Message = { ...msg, id };
        await this.col(convId).doc(id).set(payload);
        return payload;
    }

    async list(convId: string, limit = 50, offset = 0): Promise<Message[]> {
        const qs = await this.col(convId)
            .orderBy('createdAt', 'asc')
            .get();

        const all = qs.docs.map(d => d.data() as Message);
        return all.slice(offset, offset + limit);
    }

    async find(convId: string, msgId: string): Promise<Message | null> {
        const snap = await this.col(convId).doc(msgId).get();
        return snap.exists ? (snap.data() as Message) : null;
    }

    async update(convId: string, msgId: string, partial: Partial<Message>): Promise<void> {
        await this.col(convId).doc(msgId).update(partial);
    }

    async delete(convId: string, msgId: string): Promise<void> {
        await this.col(convId).doc(msgId).delete();
    }

    async markRead(convId: string, userId: string): Promise<void> {
        const snapshot = await this.col(convId).get();
        const batch = this.db.batch();
        
        snapshot.docs.forEach(doc => {
            const message = doc.data() as Message;
            const readBy = message.readBy || [];
            const alreadyRead = readBy.some(r => r.userId === userId);
            
            if (!alreadyRead) {
                const updatedReadBy = [...readBy, { userId, readAt: new Date().toISOString() }];
                batch.update(doc.ref, { readBy: updatedReadBy });
            }
        });
        
        await batch.commit();
    }

    async findConversationIdByMessageId(messageId: string): Promise<string | null> {
        const conversationsSnapshot = await this.db.collection('conversations').get();
        
        for (const convDoc of conversationsSnapshot.docs) {
            const messageSnapshot = await this.col(convDoc.id).doc(messageId).get();
            if (messageSnapshot.exists) {
                return convDoc.id;
            }
        }
        
        return null;
    }
}
