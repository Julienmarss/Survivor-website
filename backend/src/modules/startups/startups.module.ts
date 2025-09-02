import { Module } from '@nestjs/common';
import { StartupsService } from './startups.service';
import { StartupsController } from './startups.controller';
import { JebApiModule } from '../jeb-api/jeb-api.module';

@Module({
  imports: [JebApiModule], // Importer le module JEB API
  controllers: [StartupsController],
  providers: [StartupsService],
})
export class StartupsModule {}