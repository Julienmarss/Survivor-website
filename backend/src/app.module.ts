import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { JebApiModule } from './modules/jeb-api/jeb-api.module';
import { StartupsModule } from './modules/startups/startups.module';
import { AuthModule } from './modules/auth/auth.module';
import { Startup } from './modules/startups/entities/startup.entity';
import { Founder } from './modules/startups/entities/founder.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Startup, Founder],
      synchronize: true, // À mettre à false en production
      logging: false,
    }),
    HttpModule,
    JebApiModule,
    StartupsModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}