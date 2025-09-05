import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { JebApiModule } from './modules/jeb-api/jeb-api.module';
import { StartupsModule } from './modules/startups/startups.module';
import { AuthModule } from './modules/auth/auth.module';
import { AnalyticsModule } from './modules/analystics/analytics.module';
import { ExportModule } from './modules/export/export.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
    }),
    FirebaseModule,
    HttpModule,
    JebApiModule,
    StartupsModule,
    AuthModule,
    AnalyticsModule,
    ExportModule,
    DashboardModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}