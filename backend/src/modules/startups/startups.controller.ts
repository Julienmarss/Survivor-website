import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseDoc, ApiQuery } from '@nestjs/swagger';
import { StartupsService } from './startups.service';
import { ApiResponse } from '../../common/dto/response.dto';

@ApiTags('Startups')
@Controller('startups')
export class StartupsController {
  constructor(private readonly startupsService: StartupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all startups' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of startups to skip' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of startups to return' })
  @ApiResponseDoc({ status: 200, description: 'List of startups retrieved successfully' })
  async findAll(
    @Query('skip') skip = 0,
    @Query('limit') limit = 20,
  ) {
    try {
      const result = await this.startupsService.findAll(+skip, +limit);
      return ApiResponse.success('Startups retrieved successfully', result);
    } catch (error) {
      return ApiResponse.error('Failed to retrieve startups');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get startup by ID' })
  @ApiResponseDoc({ status: 200, description: 'Startup retrieved successfully' })
  @ApiResponseDoc({ status: 404, description: 'Startup not found' })
  async findOne(@Param('id') id: string) {
    try {
      const startup = await this.startupsService.findById(+id);
      return ApiResponse.success('Startup retrieved successfully', startup);
    } catch (error) {
      return ApiResponse.error('Failed to retrieve startup');
    }
  }
}