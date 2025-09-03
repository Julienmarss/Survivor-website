import { Controller, Get, Post, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseDoc, ApiQuery } from '@nestjs/swagger';
import { StartupsService } from './startups.service';
import { ApiResponse } from '../../common/dto/response.dto';
import { StartupResponseDto, StartupsListResponseDto } from './dto/startup-response.dto';

@ApiTags('Startups')
@Controller('startups')
export class StartupsController {
  constructor(private readonly startupsService: StartupsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all startups with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sector', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponseDoc({ status: 200, type: StartupsListResponseDto })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sector') sector?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.startupsService.findAll(+page, +limit, sector, search);
    return ApiResponse.success('Startups retrieved successfully', result);
  }

  @Get('sectors')
  @ApiOperation({ summary: 'Get all sectors with counts' })
  async getSectors() {
    const sectors = await this.startupsService.getSectors();
    return ApiResponse.success('Sectors retrieved successfully', sectors);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get startup statistics' })
  async getStats() {
    const stats = await this.startupsService.getStats();
    return ApiResponse.success('Stats retrieved successfully', stats);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Synchronize with JEB API' })
  async syncWithJebApi() {
    const result = await this.startupsService.syncWithJebApi();
    return ApiResponse.success(result.message, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get startup by ID' })
  @ApiResponseDoc({ status: 200, type: StartupResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const startup = await this.startupsService.findById(id);
    if (!startup) {
      return ApiResponse.error('Startup not found');
    }
    return ApiResponse.success('Startup retrieved successfully', startup);
  }
}