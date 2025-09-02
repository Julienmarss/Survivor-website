// backend/src/modules/startups/startups.controller.ts
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

  @Get('debug')
  @ApiOperation({ summary: 'Debug - Get raw data from JEB API with detailed logging' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of startups to return' })
  async debugRawData(@Query('limit') limit = 5) {
    try {
      console.log('\n🔍 === DEBUG MODE - ANALYSE DES DONNÉES JEB ===');
      const result = await this.startupsService.debugRawData(+limit);
      return ApiResponse.success('Debug data retrieved successfully', result);
    } catch (error) {
      console.error('❌ Erreur debug:', error.message);
      return ApiResponse.error('Failed to retrieve debug data');
    }
  }

  @Get('structure')
  @ApiOperation({ summary: 'Analyze data structure from JEB API' })
  async analyzeStructure() {
    try {
      const analysis = await this.startupsService.analyzeDataStructure();
      return ApiResponse.success('Data structure analyzed', analysis);
    } catch (error) {
      return ApiResponse.error('Failed to analyze data structure');
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

  @Get(':id/debug')
  @ApiOperation({ summary: 'Debug - Get detailed startup data by ID' })
  async debugStartup(@Param('id') id: string) {
    try {
      console.log(`\n🔍 === DEBUG STARTUP ${id} ===`);
      const startup = await this.startupsService.debugStartupById(+id);
      return ApiResponse.success('Debug startup data retrieved', startup);
    } catch (error) {
      console.error('❌ Erreur debug startup:', error.message);
      return ApiResponse.error('Failed to retrieve debug startup data');
    }
  }
}