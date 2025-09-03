import { Module } from '@nestjs/common';
import { StartupsService } from './startups.service';
import { StartupsController } from './startups.controller';
import { StartupRepository } from './repositories/startups.repository';
import { JebApiModule } from '../jeb-api/jeb-api.module';

@Module({
  imports: [JebApiModule],
  controllers: [StartupsController],
  providers: [StartupsService, StartupRepository],
  exports: [StartupsService, StartupRepository],
})
export class StartupsModule {}
