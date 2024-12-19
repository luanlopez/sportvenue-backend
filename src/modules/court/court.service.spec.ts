import { Test, TestingModule } from '@nestjs/testing';
import { CourtService } from './court.service';
import { getModelToken } from '@nestjs/mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import { ImageKitService } from '../common/imagekit/imagekit.service';

describe('CourtService', () => {
  let service: CourtService;
  let courtModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtService,
        {
          provide: getModelToken('Court'),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ImageKitService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CourtService>(CourtService);
    courtModel = module.get(getModelToken('Court'));
  });

  describe('getCourtByID', () => {
    it('should throw an error if court is not found', async () => {
      const courtId = '1';
      courtModel.findById.mockResolvedValue(null);

      await expect(service.getCourtByID(courtId)).rejects.toThrow(
        new InternalServerErrorException(
          'Failed to get court with image details',
        ),
      );
    });
  });
});
