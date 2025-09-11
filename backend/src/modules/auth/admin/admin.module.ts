import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserRepository } from '../repositories/user.repository';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [
    // Importer ConfigModule pour accéder aux variables d'environnement
    ConfigModule,
    // Importer JwtModule avec la configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '24h' },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [
    AdminService, 
    UserRepository, 
    JwtAuthGuard, 
    RolesGuard
  ],
  exports: [AdminService],
})
export class AdminModule {}