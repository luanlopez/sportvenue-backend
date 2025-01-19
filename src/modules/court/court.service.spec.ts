import { Test, TestingModule } from '@nestjs/testing';
import { CourtService } from './court.service';
import { getModelToken } from '@nestjs/mongoose';
import { ImageKitService } from '../common/imagekit/imagekit.service';
import { ApiMessages } from 'src/common/messages/api-messages';
import { ErrorCodes } from 'src/common/errors/error-codes';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

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
        {
          provide: SubscriptionsService,
          useValue: {
            validateSubscriptionPlan: jest.fn(),
          },
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
        new CustomApiError(
          ApiMessages.Generic.InternalError.title,
          ApiMessages.Generic.InternalError.message,
          ErrorCodes.INTERNAL_SERVER_ERROR,
          500,
        ),
      );
    });
  });
});
