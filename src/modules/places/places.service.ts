import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';
import axios from 'axios';

export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  vicinity?: string;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export interface NearbySearchParams {
  lat: number;
  lng: number;
  radius?: number;
  type?: string;
  keyword?: string;
}

export interface TextSearchParams {
  query: string;
  type?: string;
}

@Injectable()
export class PlacesService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(
    private readonly configService: ConfigService,
    private readonly lokiLogger: LokiLoggerService,
  ) {
    this.apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');

    if (!this.apiKey) {
      this.lokiLogger.error(
        'GOOGLE_PLACES_API_KEY not configured in environment',
      );
      throw new Error('Google Places API key is required');
    }
  }

  /**
   * Search for nearby places using coordinates
   * @param params Search parameters including lat, lng, radius, type, and keyword
   * @returns Array of nearby places
   */
  async searchNearby(params: NearbySearchParams): Promise<PlaceSearchResult[]> {
    const {
      lat,
      lng,
      radius = 5000,
      type = 'gym',
      keyword = 'quadra',
    } = params;

    try {
      await this.lokiLogger.info('Searching nearby places', {
        lat,
        lng,
        radius,
        type,
        keyword,
      });

      const url = `${this.baseUrl}/nearbysearch/json`;
      const response = await axios.get(url, {
        params: {
          location: `${lat},${lng}`,
          radius,
          type,
          keyword,
          key: this.apiKey,
        },
      });

      if (
        response.data.status !== 'OK' &&
        response.data.status !== 'ZERO_RESULTS'
      ) {
        throw new BadRequestException(
          `Google Places API error: ${response.data.status}`,
        );
      }

      await this.lokiLogger.info('Nearby search completed successfully', {
        resultsCount: response.data.results?.length || 0,
        status: response.data.status,
      });

      return response.data.results || [];
    } catch (error) {
      await this.lokiLogger.error('Failed to search nearby places', error, {
        params: JSON.stringify(params),
      });
      throw error;
    }
  }

  /**
   * Search for places using text query
   * @param params Search parameters including query and type
   * @returns Array of places matching the text search
   */
  async textSearch(params: TextSearchParams): Promise<PlaceSearchResult[]> {
    const { query, type = 'gym' } = params;

    try {
      await this.lokiLogger.info('Performing text search for places', {
        query,
        type,
      });

      const url = `${this.baseUrl}/textsearch/json`;
      const response = await axios.get(url, {
        params: {
          query: encodeURIComponent(query),
          type,
          key: this.apiKey,
        },
      });

      if (
        response.data.status !== 'OK' &&
        response.data.status !== 'ZERO_RESULTS'
      ) {
        throw new BadRequestException(
          `Google Places API error: ${response.data.status}`,
        );
      }

      await this.lokiLogger.info('Text search completed successfully', {
        resultsCount: response.data.results?.length || 0,
        status: response.data.status,
      });

      return response.data.results || [];
    } catch (error) {
      await this.lokiLogger.error('Failed to perform text search', error, {
        params: JSON.stringify(params),
      });
      throw error;
    }
  }

  /**
   * Get place details by place_id
   * @param placeId The Google Places place_id
   * @returns Detailed information about the place
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      await this.lokiLogger.info('Getting place details', {
        placeId,
      });

      const url = `${this.baseUrl}/details/json`;
      const response = await axios.get(url, {
        params: {
          place_id: placeId,
          fields:
            'place_id,name,formatted_address,geometry,rating,user_ratings_total,types,vicinity,photos,formatted_phone_number,website,opening_hours,price_level',
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new BadRequestException(
          `Google Places API error: ${response.data.status}`,
        );
      }

      await this.lokiLogger.info('Place details retrieved successfully', {
        placeId,
      });

      return response.data.result;
    } catch (error) {
      await this.lokiLogger.error('Failed to get place details', error, {
        placeId,
      });
      throw error;
    }
  }
}
