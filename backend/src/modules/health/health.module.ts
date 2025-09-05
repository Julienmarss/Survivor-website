import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { JebApiModule } from '../jeb-api/jeb-api.module';

@Module({
  imports: [JebApiModule],
  controllers: [HealthController],
})
export class HealthModule {}
