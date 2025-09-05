import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { AnalyticsModule } from '../analystics/analytics.module';
import { StartupsModule } from '../startups/startups.module';

@Module({
  imports: [AnalyticsModule, StartupsModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
