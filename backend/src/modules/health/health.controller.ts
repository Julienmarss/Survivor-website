import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FirebaseConfigService } from '../../config/firebase.config';
import { JebApiService } from '../jeb-api/jeb-api.service';
import { ApiResponse } from '../../common/dto/response.dto';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    private readonly firebaseConfig: FirebaseConfigService,
    private readonly jebApiService: JebApiService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async healthCheck() {
    try {
      const [firebaseStatus, jebApiStatus] = await Promise.all([
        this.firebaseConfig.testConnection(),
        this.jebApiService.testConnection()
      ]);

      const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          firebase: firebaseStatus,
          jebApi: jebApiStatus,
          api: { success: true, message: 'API operational' }
        },
        version: '1.0.0',
        uptime: process.uptime()
      };

      return ApiResponse.success('Health check completed', status);
    } catch (error) {
      return ApiResponse.error('Health check failed: ' + error.message);
    }
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with metrics' })
  async detailedHealthCheck() {
    try {
      const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          version: process.version,
          platform: process.platform
        },
        services: {
          firebase: await this.firebaseConfig.testConnection(),
          jebApi: await this.jebApiService.testConnection()
        }
      };

      return ApiResponse.success('Detailed health check completed', status);
    } catch (error) {
      return ApiResponse.error('Detailed health check failed: ' + error.message);
    }
  }
}
