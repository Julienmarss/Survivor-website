import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JebApiService {
  private readonly logger = new Logger(JebApiService.name);
  private readonly baseUrl: string;
  private readonly groupToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('JEB_API_URL');
    this.groupToken = this.configService.get('JEB_GROUP_TOKEN');
  }

  private getHeaders() {
    return {
      'X-Group-Authorization': this.groupToken,
      'Content-Type': 'application/json',
    };
  }

  async getAllStartups(skip = 0, limit = 100) {
    try {
      this.logger.log(`Fetching startups from JEB API (skip: ${skip}, limit: ${limit})`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/startups`, {
          headers: this.getHeaders(),
          params: { skip, limit },
        }),
      );

      this.logger.log(`Successfully fetched ${response.data.length} startups from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch startups from JEB API', error.response?.data || error.message);
      throw new HttpException('Unable to fetch startups from JEB API', 502);
    }
  }

  async getStartupById(id: number) {
    try {
      this.logger.log(`Fetching startup ${id} from JEB API`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/startups/${id}`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`Successfully fetched startup ${id} from JEB API`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch startup ${id} from JEB API`, error.response?.data || error.message);
      throw new HttpException(`Unable to fetch startup ${id}`, 502);
    }
  }

  async testConnection() {
    try {
      await this.getAllStartups(0, 1);
      return { success: true, message: 'JEB API connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
