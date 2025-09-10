import { Injectable } from '@nestjs/common';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Conversation } from './interfaces';

@Injectable()
export class MessagingService {
    constructor(
        private readonly convs: ConversationsRepository,
        private readonly msgs: MessagesRepository,
    ) {}

    async createConversation(userId: string, dto: CreateConversationDto & { userName?: string }) {
        const participants = [
            { userId, userName: dto.userName },
            ...dto.participantIds.map((id) => ({ userId: id })),
        ];
        const conv = await this.convs.create({
            type: dto.type,
            name: dto.name || null,
            participants,
            participantIds: [userId, ...dto.participantIds],
        });
        return conv;
    }

    async listConversations(userId: string) {
        return this.convs.listForUser(userId);
    }

    async getConversation(userId: string, id: string) {
        const conv = await this.convs.findById(id) as Conversation | null;
        if (!conv) {
            throw new Error('Conversation not found');
        }
        // Check if user is a participant
        const isParticipant = conv.participants?.some((p) => p.userId === userId) || 
                             (conv as any).participantIds?.includes(userId);
        if (!isParticipant) {
            throw new Error('Not allowed');
        }
        return conv;
    }

    async listMessages(userId: string, convId: string, limit = 50, offset = 0) {
        return this.msgs.list(convId, limit, offset);
    }

    async sendMessage(userId: string, senderName: string, convId: string, dto: SendMessageDto) {
        return this.msgs.create(convId, {
            conversationId: convId,
            senderId: userId,
            senderName,
            content: dto.content,
            messageType: dto.messageType,
            createdAt: new Date().toISOString(),
            readBy: [{ userId, readAt: new Date().toISOString() }],
        });
    }

    async markRead(userId: string, convId: string) {
        return this.msgs.markRead(convId, userId);
    }

    async editMessage(userId: string, messageId: string, dto: UpdateMessageDto) {
        const convId = await this.msgs.findConversationIdByMessageId(messageId);
        if (!convId) {
            throw new Error('Message not found');
        }
        return this.msgs.update(convId, messageId, dto);
    }

    async deleteMessage(userId: string, messageId: string) {
        const convId = await this.msgs.findConversationIdByMessageId(messageId);
        if (!convId) {
            throw new Error('Message not found');
        }
        return this.msgs.delete(convId, messageId);
    }
}