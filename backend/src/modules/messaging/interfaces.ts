export type ConversationType = 'direct' | 'group';

export interface ConversationParticipant {
    userId: string;
    userName?: string;
    lastReadAt?: string;
}

export interface Conversation {
    id: string;
    type: ConversationType;
    name?: string | null;
    participants: ConversationParticipant[];
    createdAt: string;
    updatedAt: string;
    lastMessage?: MessageSummary | null;
    lastMessageAt?: string | null;
}

export interface MessageSummary {
    id: string;
    senderId: string;
    senderName?: string;
    content: string;
    messageType: 'text' | 'image' | 'file';
    createdAt: string;
}

export interface Message extends MessageSummary {
    conversationId: string;
    updatedAt?: string;
    readBy?: { userId: string; readAt: string }[];
}