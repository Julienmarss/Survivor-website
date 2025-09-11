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
import { EventsModule } from './modules/events/events.module';
import { NewsModule } from './modules/news/news.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { AdminModule } from './modules/auth/admin/admin.module';

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
    AdminModule,
    AnalyticsModule,
    ExportModule,
    DashboardModule,
    HealthModule,
    NewsModule,
    EventsModule,
    MessagingModule
  ],
  controllers: [AppController],
})
export class AppModule {}