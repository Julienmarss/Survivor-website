import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { JebApiModule } from './modules/jeb-api/jeb-api.module';
import { StartupsModule } from './modules/startups/startups.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
    JebApiModule,
    StartupsModule, // NOUVEAU MODULE
  ],
  controllers: [AppController],
})
export class AppModule {}