import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { AnalyticsModule } from '../analystics/analytics.module';
import { StartupsModule } from '../startups/startups.module';

@Module({
  imports: [AnalyticsModule, StartupsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}