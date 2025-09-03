import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StartupsService } from './startups.service';
import { StartupsController } from './startups.controller';
import { JebApiModule } from '../jeb-api/jeb-api.module';
import { Startup } from './entities/startup.entity';
import { Founder } from './entities/founder.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Startup, Founder]),
    JebApiModule,
  ],
  controllers: [StartupsController],
  providers: [StartupsService],
  exports: [StartupsService],
})
export class StartupsModule {}