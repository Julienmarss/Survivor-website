import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminStartupController } from './admin-startup.controller';
import { AdminStartupService } from './admin-startup.service';
import { StartupRepository } from '../repositories/startups.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JebApiModule } from '../../jeb-api/jeb-api.module';

@Module({
  imports: [
    ConfigModule,
    JebApiModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '24h' },
      }),
    }),
  ],
  controllers: [AdminStartupController],
  providers: [
    AdminStartupService, 
    StartupRepository, 
    JwtAuthGuard, 
    RolesGuard
  ],
  exports: [AdminStartupService],
})
export class AdminStartupModule {}