import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JebApiService } from './jeb-api.service';

@Module({
  imports: [HttpModule],
  providers: [JebApiService],
  exports: [JebApiService],
})
export class JebApiModule {}