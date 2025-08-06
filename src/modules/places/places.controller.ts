import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PlacesService, PlaceSearchResult } from './places.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { NearbySearchDto } from './dtos/nearby-search.dto';
import { TextSearchDto } from './dtos/text-search.dto';

@ApiTags('Places')
@Controller('places')
export class PlacesController {
  constructor(
    private readonly placesService: PlacesService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Search for nearby places using coordinates',
    description:
      'Search for gyms and sports facilities near a specific location',
  })
  @ApiQuery({
    name: 'lat',
    type: Number,
    description: 'Latitude coordinate',
    example: -23.5505,
  })
  @ApiQuery({
    name: 'lng',
    type: Number,
    description: 'Longitude coordinate',
    example: -46.6333,
  })
  @ApiQuery({
    name: 'radius',
    type: Number,
    description: 'Search radius in meters (default: 5000)',
    required: false,
    example: 5000,
  })
  @ApiQuery({
    name: 'type',
    type: String,
    description: 'Type of place to search (default: gym)',
    required: false,
    example: 'gym',
  })
  @ApiQuery({
    name: 'keyword',
    type: String,
    description: 'Additional keyword for search (default: quadra)',
    required: false,
    example: 'quadra',
  })
  @ApiResponse({
    status: 200,
    description: 'List of nearby places found',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          place_id: { type: 'string' },
          name: { type: 'string' },
          formatted_address: { type: 'string' },
          geometry: {
            type: 'object',
            properties: {
              location: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                },
              },
            },
          },
          rating: { type: 'number' },
          user_ratings_total: { type: 'number' },
          types: { type: 'array', items: { type: 'string' } },
          vicinity: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters or API error',
  })
  async searchNearby(
    @Query() query: NearbySearchDto,
    @User() user: UserInterface,
  ): Promise<PlaceSearchResult[]> {
    const { lat, lng, radius, type, keyword } = query;

    if (!lat || !lng) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    if (lat < -90 || lat > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }

    if (lng < -180 || lng > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }

    await this.lokiLogger.info('Nearby search request', {
      endpoint: '/places/nearby',
      method: 'GET',
      userId: user.id,
      query: JSON.stringify(query),
    });

    try {
      const results = await this.placesService.searchNearby({
        lat,
        lng,
        radius,
        type,
        keyword,
      });

      await this.lokiLogger.info('Nearby search completed', {
        endpoint: '/places/nearby',
        method: 'GET',
        userId: user.id,
        resultsCount: results.length,
      });

      return results;
    } catch (error) {
      await this.lokiLogger.error('Nearby search failed', error, {
        endpoint: '/places/nearby',
        method: 'GET',
        userId: user.id,
      });
      throw error;
    }
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Search for places using text query',
    description: 'Search for gyms and sports facilities using text description',
  })
  @ApiQuery({
    name: 'query',
    type: String,
    description: 'Text query to search for places',
    example: 'quadra de futebol São Paulo',
  })
  @ApiQuery({
    name: 'type',
    type: String,
    description: 'Type of place to search (default: gym)',
    required: false,
    example: 'gym',
  })
  @ApiResponse({
    status: 200,
    description: 'List of places matching the search query',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          place_id: { type: 'string' },
          name: { type: 'string' },
          formatted_address: { type: 'string' },
          geometry: {
            type: 'object',
            properties: {
              location: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                },
              },
            },
          },
          rating: { type: 'number' },
          user_ratings_total: { type: 'number' },
          types: { type: 'array', items: { type: 'string' } },
          vicinity: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters or API error',
  })
  async textSearch(
    @Query() query: TextSearchDto,
    @User() user: UserInterface,
  ): Promise<PlaceSearchResult[]> {
    const { query: searchQuery, type } = query;

    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    await this.lokiLogger.info('Text search request', {
      endpoint: '/places/search',
      method: 'GET',
      userId: user.id,
      query: JSON.stringify(query),
    });

    try {
      const results = await this.placesService.textSearch({
        query: searchQuery,
        type,
      });

      await this.lokiLogger.info('Text search completed', {
        endpoint: '/places/search',
        method: 'GET',
        userId: user.id,
        resultsCount: results.length,
      });

      return results;
    } catch (error) {
      await this.lokiLogger.error('Text search failed', error, {
        endpoint: '/places/search',
        method: 'GET',
        userId: user.id,
      });
      throw error;
    }
  }

  @Get('details/:placeId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get detailed information about a specific place',
    description:
      'Retrieve detailed information about a place using its Google Places ID',
  })
  @ApiParam({
    name: 'placeId',
    type: String,
    description: 'Google Places place_id',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed place information',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid place ID or API error',
  })
  async getPlaceDetails(
    @Param('placeId') placeId: string,
    @User() user: UserInterface,
  ): Promise<any> {
    if (!placeId || placeId.trim().length === 0) {
      throw new BadRequestException('Place ID is required');
    }

    await this.lokiLogger.info('Place details request', {
      endpoint: '/places/details',
      method: 'GET',
      userId: user.id,
      placeId,
    });

    try {
      const details = await this.placesService.getPlaceDetails(placeId);

      await this.lokiLogger.info('Place details retrieved', {
        endpoint: '/places/details',
        method: 'GET',
        userId: user.id,
        placeId,
      });

      return details;
    } catch (error) {
      await this.lokiLogger.error('Place details failed', error, {
        endpoint: '/places/details',
        method: 'GET',
        userId: user.id,
        placeId,
      });
      throw error;
    }
  }
}
