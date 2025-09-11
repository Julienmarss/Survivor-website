import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsRepository } from './repositories/events.repository';
import { EventsSyncService } from './events-sync.service';
import { AuthModule } from '../auth/auth.module';
import { JebApiModule } from '../jeb-api/jeb-api.module';

@Module({
  imports: [AuthModule, JebApiModule],
  controllers: [EventsController],
  providers: [
    EventsService, 
    EventsRepository, 
    EventsSyncService,
  ],
  exports: [EventsService, EventsRepository, EventsSyncService],
})
export class EventsModule {}