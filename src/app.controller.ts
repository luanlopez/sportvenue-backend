import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponse {
  @ApiProperty({ example: 'OK' })
  status: 'OK' | 'ERROR';

  @ApiProperty({ example: '2024-03-19T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({
    example: {
      api: 'healthy',
      database: 'connected',
    },
  })
  services: {
    api: string;
    database: string;
  };

  @ApiProperty({ example: 'MongoDB connection is not ready', required: false })
  error?: string;
}

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Get('healthz')
  @ApiOperation({ summary: 'Check API and MongoDB health status' })
  @ApiResponse({
    status: 200,
    description: 'Health check passed',
    type: HealthCheckResponse,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable - MongoDB connection failed',
  })
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const isMongoConnected = this.mongoConnection.readyState === 1;

      if (!isMongoConnected) {
        throw new Error('MongoDB connection is not ready');
      }

      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
          api: 'healthy',
          database: 'connected',
        },
      };
    } catch (error) {
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        services: {
          api: 'healthy',
          database: 'disconnected',
        },
        error: error.message,
      };
    }
  }
}
