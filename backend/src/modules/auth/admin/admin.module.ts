import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserRepository } from '../repositories/user.repository';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, UserRepository, JwtAuthGuard, RolesGuard],
  exports: [AdminService],
})
export class AdminModule {}