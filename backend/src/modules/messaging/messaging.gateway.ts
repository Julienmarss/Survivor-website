import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { MessagingService } from './messaging.service';

@WebSocketGateway({
    namespace: '/api/messaging',
    cors: {
        origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
        credentials: true,
    },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private readonly service: MessagingService) {}

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers['authorization']?.toString().replace('Bearer ', '');
            if (!token) throw new Error('Missing token');
            const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
            (client as any).user = { id: payload.sub || payload.id, name: payload.name, email: payload.email };
        } catch (e) {
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
    }

    @SubscribeMessage('join_conversation')
    async onJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
        client.join(data.conversationId);
    }

    @SubscribeMessage('mark_as_read')
    async onMarkRead(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
        const user = (client as any).user;
        if (!user) return;
        await this.service.markRead(user.id, data.conversationId);
        this.server.to(data.conversationId).emit('messages_read', {
            conversationId: data.conversationId,
            userId: user.id,
            readAt: new Date().toISOString(),
        });
    }

    @SubscribeMessage('user_typing')
    async onTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
        const user = (client as any).user;
        if (!user) return;
        this.server.to(data.conversationId).emit('user_typing', {
            conversationId: data.conversationId,
            userId: user.id,
            userName: user.name || user.email,
        });
    }

    @SubscribeMessage('user_stopped_typing')
    async onStopTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
        const user = (client as any).user;
        if (!user) return;
        this.server.to(data.conversationId).emit('user_stopped_typing', {
            conversationId: data.conversationId,
            userId: user.id,
        });
    }

    emitNewMessage(message: any) {
        this.server.to(message.conversationId).emit('new_message', message);
    }
}