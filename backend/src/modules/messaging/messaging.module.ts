import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { ConversationsRepository } from './repositories/conversations.repository';
import { MessagesRepository } from './repositories/messages.repository';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [FirebaseModule, AuthModule], 
    controllers: [MessagingController],
    providers: [MessagingService, MessagingGateway, ConversationsRepository, MessagesRepository],
    exports: [MessagingService],
})
export class MessagingModule {}