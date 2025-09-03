import { Controller, Get, Post, Query, Param, HttpException, HttpStatus } from '@nestjs/common';
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
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sector', required: false, type: String, description: 'Filter by sector' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name and description' })
  @ApiResponseDoc({ status: 200, type: StartupsListResponseDto })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sector') sector?: string,
    @Query('search') search?: string,
  ) {
    try {
      const result = await this.startupsService.findAll(+page, +limit, sector, search);
      return ApiResponse.success('Startups retrieved successfully', result);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve startups: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sectors')
  @ApiOperation({ summary: 'Get all sectors with counts' })
  async getSectors() {
    try {
      const sectors = await this.startupsService.getSectors();
      return ApiResponse.success('Sectors retrieved successfully', sectors);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve sectors: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get startup statistics' })
  async getStats() {
    try {
      const stats = await this.startupsService.getStats();
      return ApiResponse.success('Stats retrieved successfully', stats);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve stats: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Synchronize with JEB API' })
  async syncWithJebApi() {
    try {
      const result = await this.startupsService.syncWithJebApi();
      return ApiResponse.success(result.message, result);
    } catch (error) {
      throw new HttpException(
        'Failed to sync with JEB API: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get startup by ID' })
  @ApiResponseDoc({ status: 200, type: StartupResponseDto })
  async findOne(@Param('id') id: string) {
    try {
      const startup = await this.startupsService.findById(id);
      
      if (!startup) {
        throw new HttpException('Startup not found', HttpStatus.NOT_FOUND);
      }
      
      return ApiResponse.success('Startup retrieved successfully', startup);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve startup: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
