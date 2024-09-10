import { Test, TestingModule } from '@nestjs/testing';
import { CourtController } from './court.controller';
import { CourtService } from './court.service';
import { CreateCourtDTO } from './dtos/create-court.dto';
import { CourtWithImagesDTO } from './dtos/get-court.dto';
import { BadRequestException } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourtSchema } from '../../schema/court.schema';
import { AppwriteService } from '../common/appwrite/appwrite.service';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mockCourtService = {
  create: jest.fn(),
  uploadImages: jest.fn(),
  getCourtWithImageDetails: jest.fn(),
  getCourtsWithPagination: jest.fn(),
  updateCourt: jest.fn(),
  deleteCourt: jest.fn(),
  deactivateCourt: jest.fn(),
  activateCourt: jest.fn(),
};

describe('CourtController', () => {
  let controller: CourtController;
  let service: CourtService;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([{ name: 'Court', schema: CourtSchema }]),
      ],
      controllers: [CourtController],
      providers: [
        {
          provide: CourtService,
          useValue: mockCourtService,
        },
        {
          provide: AppwriteService,
          useValue: {
            uploadFiles: jest.fn().mockResolvedValue([]),
            getFileDetails: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<CourtController>(CourtController);
    service = module.get<CourtService>(CourtService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a court', async () => {
      const createCourtDTO: CreateCourtDTO = {
        name: 'Court Name',
        address: 'Court Address',
        owner_id: 'owner_id',
        availableHours: [],
      };
      jest.spyOn(service, 'create').mockResolvedValue(createCourtDTO as any);

      await expect(controller.create(createCourtDTO)).resolves.toEqual(
        createCourtDTO,
      );
    });
  });

  describe('uploadImages', () => {
    it('should upload images successfully', async () => {
      const files: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'image.svg',
          encoding: '7bit',
          mimetype: 'image/svg+xml',
          size: 1024,
          stream: null as any,
          destination: '',
          filename: 'image.svg',
          path: '',
          buffer: Buffer.from(''),
        } as any,
      ];

      jest.spyOn(service, 'uploadImages').mockResolvedValue(undefined);

      await expect(controller.uploadImages('1', files)).resolves.toEqual({
        message: 'Images uploaded successfully',
      });
    });

    it('should throw BadRequestException if no files are provided', async () => {
      await expect(controller.uploadImages('1', [])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCourtWithImageDetails', () => {
    it('should return court with image details', async () => {
      const courtId = '1';
      const result: CourtWithImagesDTO = {
        _id: courtId,
        name: 'Court Name',
        address: 'Court Address',
        images: [],
      };
      jest.spyOn(service, 'getCourtWithImageDetails').mockResolvedValue(result);

      await expect(
        controller.getCourtWithImageDetails(courtId),
      ).resolves.toEqual(result);
    });
  });

  describe('getAllCourts', () => {
    it('should return all courts with pagination and filters', async () => {
      const result = { data: [], total: 0 };
      jest.spyOn(service, 'getCourtsWithPagination').mockResolvedValue(result);

      await expect(controller.getAllCourts(1, 10)).resolves.toEqual(result);
    });
  });

  describe('updateCourt', () => {
    it('should update a court', async () => {
      const courtId = '1';
      const updateCourtDTO: CreateCourtDTO = {
        name: 'Updated Court Name',
        address: 'Updated Court Address',
        owner_id: 'owner_id',
        availableHours: [],
      };
      jest
        .spyOn(service, 'updateCourt')
        .mockResolvedValue(updateCourtDTO as any);

      await expect(
        controller.updateCourt(courtId, updateCourtDTO),
      ).resolves.toEqual(updateCourtDTO);
    });
  });

  describe('deleteCourt', () => {
    it('should delete a court', async () => {
      const courtId = '1';
      jest.spyOn(service, 'deleteCourt').mockResolvedValue(undefined);

      await expect(controller.deleteCourt(courtId)).resolves.toEqual({
        message: 'Court deleted successfully',
      });
    });
  });

  describe('inactivateCourt', () => {
    it('should inactivate a court', async () => {
      const courtId = '1';
      jest
        .spyOn(service, 'deactivateCourt')
        .mockResolvedValue({ _id: courtId, isActive: false } as any);

      await expect(controller.inactivateCourt(courtId)).resolves.toEqual({
        _id: courtId,
        isActive: false,
      });
    });
  });

  describe('activateCourt', () => {
    it('should activate a court', async () => {
      const courtId = '1';
      jest
        .spyOn(service, 'activateCourt')
        .mockResolvedValue({ _id: courtId, isActive: true } as any);

      await expect(controller.activateCourt(courtId)).resolves.toEqual({
        _id: courtId,
        isActive: true,
      });
    });
  });
});
