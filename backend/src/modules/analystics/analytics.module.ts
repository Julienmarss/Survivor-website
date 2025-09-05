import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsService } from './analystics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { StartupsModule } from '../startups/startups.module';

@Module({
  imports: [
    forwardRef(() => StartupsModule)
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}
