import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
    constructor(
        private readonly service: MessagingService,
        private readonly gateway: MessagingGateway
    ) {}

    @Post('conversations')
    createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
        return this.service.createConversation(req.user.sub, {
            ...dto,
            userName: req.user.firstName || req.user.email,
        });
    }

    @Get('conversations')
    listConversations(@Req() req: any) {
        return this.service.listConversations(req.user.sub);
    }

    @Get('conversations/:id')
    getConversation(@Req() req: any, @Param('id') id: string) {
        return this.service.getConversation(req.user.sub, id);
    }

    @Get('conversations/:id/messages')
    listMessages(
        @Req() req: any,
        @Param('id') convId: string,
        @Query('limit') limit = '50',
        @Query('offset') offset = '0',
    ) {
        return this.service.listMessages(req.user.sub, convId, Number(limit), Number(offset));
    }

    @Post('conversations/:id/messages')
    async sendMessage(
        @Req() req: any,
        @Param('id') convId: string,
        @Body() dto: SendMessageDto,
    ) {
        const newMessage = await this.service.sendMessage(
            req.user.sub,
            req.user.firstName || req.user.email,
            convId,
            dto,
        );
        
        this.gateway.emitNewMessage(newMessage);
        
        return newMessage;
    }

    @Post('conversations/:id/messages/attachment')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    }))
    async sendAttachment(
        @Req() req: any,
        @Param('id') convId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new Error('Aucun fichier fourni');
        }

        const messageType: 'image' | 'file' = file.mimetype.startsWith('image/') ? 'image' : 'file';
        const fileUrl = `http://localhost:3000/uploads/${file.filename}`;
        
        const messageData = {
            content: fileUrl,
            messageType,
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            fileUrl: fileUrl,
        } as any;

        const newMessage = await this.service.sendMessage(
            req.user.sub,
            req.user.firstName || req.user.email,
            convId,
            messageData,
        );
        
        this.gateway.emitNewMessage(newMessage);
        
        return newMessage;
    }

    @Post('conversations/:id/mark-read')
    async markRead(@Req() req: any, @Param('id') convId: string) {
        await this.service.markRead(req.user.sub, convId);
        return { status: 'ok' };
    }

    @Put('messages/:id')
    updateMessage(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateMessageDto) {
        return this.service.editMessage(req.user.sub, id, dto);
    }

    @Delete('messages/:id')
    async deleteMessage(@Req() req: any, @Param('id') id: string) {
        await this.service.deleteMessage(req.user.sub, id);
        return { status: 'ok' };
    }

    @Get('users')
    async listUsers(@Req() req: any) {
        const convs = await this.service.listConversations(req.user.sub);
        const map = new Map<string, { id: string; name?: string; email?: string }>();
        convs.forEach((c: any) =>
            c.participants.forEach((p: any) => map.set(p.userId, { id: p.userId, name: p.userName })),
        );
        map.set(req.user.sub, { id: req.user.sub, name: req.user.firstName || req.user.email });
        return Array.from(map.values());
    }

    @Get('users/search')
    async searchUsers(@Req() req: any, @Query('q') q = '') {
        const users = (await this.listUsers(req)) as any[];
        const term = q.toLowerCase();
        return users.filter(
            (u) => (u.name || '').toLowerCase().includes(term) || (u.id || '').toLowerCase().includes(term),
        );
    }

}