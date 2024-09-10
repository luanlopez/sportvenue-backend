import { Test, TestingModule } from '@nestjs/testing';
import { CourtService } from './court.service';
import { AppwriteService } from '../common/appwrite/appwrite.service';
import { Model } from 'mongoose';
import { Court } from 'src/schema/court.schema';
import { getModelToken } from '@nestjs/mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateCourtDTO } from './dtos/create-court.dto';

const mockCreateCourtDTO: CreateCourtDTO = {
  name: 'Court Name',
  address: 'Court Address',
  availableHours: [],
  owner_id: 'some_id',
  reason: '',
};

const mockFile: Express.Multer.File = {
  fieldname: 'images',
  originalname: 'image.svg',
  encoding: '7bit',
  mimetype: 'image/svg+xml',
  size: 1024,
  stream: {} as any,
  destination: '',
  filename: 'image.svg',
  path: '',
  buffer: Buffer.from(''),
};

const mockImageDetails = { $id: 'fileId', name: 'image.svg' };

describe('CourtService', () => {
  let service: CourtService;
  let appwriteService: AppwriteService;
  let courtModel: Model<Court>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtService,
        {
          provide: getModelToken('Court'),
          useValue: {
            create: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: AppwriteService,
          useValue: {
            uploadFiles: jest.fn().mockResolvedValue([{ $id: 'fileId' }]),
            getFileDetails: jest.fn().mockResolvedValue(mockImageDetails),
          },
        },
      ],
    }).compile();

    service = module.get<CourtService>(CourtService);
    appwriteService = module.get<AppwriteService>(AppwriteService);
    courtModel = module.get<Model<Court>>(getModelToken('Court'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a court', async () => {
      jest
        .spyOn(courtModel, 'create')
        .mockResolvedValue(mockCreateCourtDTO as any);
      await expect(service.create(mockCreateCourtDTO)).resolves.toEqual(
        mockCreateCourtDTO,
      );
    });

    it('should throw InternalServerErrorException on failure', async () => {
      jest.spyOn(courtModel, 'create').mockRejectedValue(new Error('Error'));
      await expect(service.create(mockCreateCourtDTO)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('uploadImages', () => {
    it('should upload images successfully', async () => {
      const courtId = '1';
      jest.spyOn(courtModel, 'findByIdAndUpdate').mockResolvedValue({});
      await expect(
        service.uploadImages(courtId, [mockFile]),
      ).resolves.not.toThrow();
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const courtId = '1';
      jest
        .spyOn(appwriteService, 'uploadFiles')
        .mockRejectedValue(new Error('Error'));
      await expect(service.uploadImages(courtId, [mockFile])).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getCourtWithImageDetails', () => {
    it('should return court with image details', async () => {
      const courtId = '1';
      const court = {
        _id: '1',
        name: 'Court Name',
        address: 'Court Address',
        images: ['fileId'],
      };

      // Atualize para o espião correto
      jest.spyOn(courtModel, 'findById').mockResolvedValue(court as any);

      const imageDetails = { $id: 'fileId', name: 'image.svg' };
      jest
        .spyOn(appwriteService, 'getFileDetails')
        .mockResolvedValue(imageDetails);

      const result = await service.getCourtWithImageDetails(courtId);
      expect(result).toEqual({
        _id: '1',
        name: 'Court Name',
        address: 'Court Address',
        images: [imageDetails],
      });

      it('should throw InternalServerErrorException on failure', async () => {
        const courtId = '1';

        jest
          .spyOn(courtModel, 'findById')
          .mockRejectedValue(new Error('Error'));

        await expect(service.getCourtWithImageDetails(courtId)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });

    it('should throw InternalServerErrorException on failure', async () => {
      jest.spyOn(courtModel, 'findById').mockRejectedValue(new Error('Error'));
      await expect(service.getCourtWithImageDetails('1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
