// backend/src/modules/news/news.module.ts
import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsRepository } from './repositories/news.repository';
import { NewsSyncService } from './news-sync.service';
import { AuthModule } from '../auth/auth.module';
import { JebApiModule } from '../jeb-api/jeb-api.module';

@Module({
  imports: [AuthModule, JebApiModule],
  controllers: [NewsController],
  providers: [
    NewsService, 
    NewsRepository, 
    NewsSyncService, // Service de synchronisation
  ],
  exports: [NewsService, NewsRepository, NewsSyncService],
})
export class NewsModule {}