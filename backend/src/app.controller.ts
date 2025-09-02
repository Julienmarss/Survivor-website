import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiResponse } from './common/dto/response.dto';

@ApiTags('API Info')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API information' })
  getRoot() {
    return ApiResponse.success('Welcome to JEB Incubator API! 🎯', {
      endpoints: {
        startups: '/api/startups',
        documentation: '/docs',
      }
    });
  }
}