import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { getConnectionToken } from '@nestjs/mongoose';

describe('AppController', () => {
  let appController: AppController;
  let mongoConnection: { readyState: number };

  beforeEach(async () => {
    mongoConnection = {
      readyState: 1,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: mongoConnection,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return healthy status when MongoDB is connected', async () => {
      const result = await appController.healthCheck();

      expect(result).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        services: {
          api: 'healthy',
          database: 'connected',
        },
      });

      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    it('should return error status when MongoDB is disconnected', async () => {
      mongoConnection.readyState = 0;

      const result = await appController.healthCheck();

      expect(result).toEqual({
        status: 'ERROR',
        timestamp: expect.any(String),
        services: {
          api: 'healthy',
          database: 'disconnected',
        },
        error: 'MongoDB connection is not ready',
      });
    });

    it('should return error status when MongoDB is connecting', async () => {
      mongoConnection.readyState = 2;

      const result = await appController.healthCheck();

      expect(result).toEqual({
        status: 'ERROR',
        timestamp: expect.any(String),
        services: {
          api: 'healthy',
          database: 'disconnected',
        },
        error: 'MongoDB connection is not ready',
      });
    });

    it('should return error status when MongoDB is disconnecting', async () => {
      mongoConnection.readyState = 3;

      const result = await appController.healthCheck();

      expect(result).toEqual({
        status: 'ERROR',
        timestamp: expect.any(String),
        services: {
          api: 'healthy',
          database: 'disconnected',
        },
        error: 'MongoDB connection is not ready',
      });
    });

    it('should handle unexpected MongoDB states', async () => {
      mongoConnection.readyState = 99;

      const result = await appController.healthCheck();

      expect(result).toEqual({
        status: 'ERROR',
        timestamp: expect.any(String),
        services: {
          api: 'healthy',
          database: 'disconnected',
        },
        error: 'MongoDB connection is not ready',
      });
    });
  });
});
