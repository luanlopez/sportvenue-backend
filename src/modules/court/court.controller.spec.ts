import { Test, TestingModule } from '@nestjs/testing';
import { CourtController } from './court.controller';
import { CourtService } from './court.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateCourtDTO } from './dtos/create-court.dto';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { GetCourtDTO } from './dtos/get-court.dto';
import { Court } from 'src/schema/court.schema';
import { GetCourtsResponseDTO } from './dtos/list-courts.dto';
import { BadRequestException } from '@nestjs/common';
import { CourtAmenities } from './enums/court-amenities.enum';
import { CourtCategories } from './enums/court-categories.enum';

describe('CourtController', () => {
  let courtController: CourtController;
  let courtService: CourtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourtController],
      providers: [
        {
          provide: CourtService,
          useValue: {
            create: jest.fn(),
            uploadImages: jest.fn(),
            getCourtByID: jest.fn(),
            getCourtsWithPagination: jest.fn(),
            getCourtsByOwnerWithPagination: jest.fn(),
            updateCourt: jest.fn(),
            deleteCourt: jest.fn(),
            deactivateCourt: jest.fn(),
            activateCourt: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    courtController = module.get<CourtController>(CourtController);
    courtService = module.get<CourtService>(CourtService);
  });

  it('should be defined', () => {
    expect(courtController).toBeDefined();
    expect(courtService).toBeDefined();
  });

  describe('create', () => {
    it('should call courtService.create with correct parameters', async () => {
      const courtCreated: Partial<Court> = {
        _id: '66e9dd3eba8209611a170971',
        address: '123 Main Street',
        name: 'Central Court',
        weeklySchedule: {
          monday: ['08:00', '09:00'],
          tuesday: ['08:00', '09:00'],
        },
        images: ['https://example.com/image.png'],
        createdAt: new Date('2024-09-17T19:49:18.518Z'),
        updatedAt: new Date('2024-09-17T19:49:18.518Z'),
        status: true,
        reason: 'Opening a new court in the city center',
        neighborhood: 'Downtown',
        city: 'New York',
        number: '45A',
        amenities: [CourtAmenities.WIFI, CourtAmenities.PARKING],
        categories: [CourtCategories.FUTSAL, CourtCategories.BASKETBALL],
        pricePerHour: 100,
        description: 'A great court in downtown',
      };

      const createCourtDTO: CreateCourtDTO = {
        address: '123 Main Street',
        neighborhood: 'Downtown',
        city: 'New York',
        number: '45A',
        name: 'Central Court',
        reason: 'Opening a new court in the city center',
        description: 'A great court in downtown',
        price_per_hour: 100,
        amenities: [CourtAmenities.WIFI, CourtAmenities.PARKING],
        categories: [CourtCategories.FUTSAL, CourtCategories.BASKETBALL],
        images: ['https://example.com/image.png'],
        weeklySchedule: {
          monday: ['08:00', '09:00'],
          tuesday: ['08:00', '09:00'],
        },
        postalCode: '06850-000',
        state: 'SP',
      };

      const user: UserInterface = {
        id: 'owner123',
        email: 'example@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'HOUSE_OWNER',
      };

      jest.spyOn(courtService, 'create').mockResolvedValue(courtCreated);

      const result = await courtController.create(createCourtDTO, user);
      expect(courtService.create).toHaveBeenCalledWith(user, createCourtDTO);
      expect(result).toEqual(courtCreated);
    });
  });

  describe('uploadImages', () => {
    it('should throw BadRequestException if no files are provided', async () => {
      await expect(courtController.uploadImages('1', [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call courtService.uploadImages with correct parameters', async () => {
      const files = [
        { filename: 'image1.jpg' },
        { filename: 'image2.jpg' },
      ] as any;

      jest.spyOn(courtService, 'uploadImages').mockResolvedValueOnce(undefined);

      const result = await courtController.uploadImages('1', files);

      expect(courtService.uploadImages).toHaveBeenCalledWith('1', files);
      expect(result).toEqual({ message: 'Images uploaded successfully' });
    });
  });

  describe('getCourtByID', () => {
    it('should return court details', async () => {
      const courtId = '66e9dd3eba8209611a170971';
      const courtDetails: GetCourtDTO = {
        _id: '66e9dd3eba8209611a170971',
        address: 'R. Xingu',
        neighborhood: 'Crispim',
        city: 'Itapecerica da Serra - SP',
        number: '130/262',
        owner_id: 'user_2lX2f8JuZMKeTlKjBQ4oia4JItX',
        name: 'Campo do Imperial',
        weeklySchedule: {
          monday: ['08:00 AM - 10:00 AM', '02:00 PM - 04:00 PM'],
          tuesday: ['08:00 AM - 10:00 AM', '02:00 PM - 04:00 PM'],
          wednesday: ['08:00 AM - 10:00 AM', '02:00 PM - 04:00 PM'],
          thursday: ['08:00 AM - 10:00 AM', '02:00 PM - 04:00 PM'],
          friday: ['08:00 AM - 10:00 AM', '02:00 PM - 04:00 PM'],
          saturday: ['08:00 AM - 10:00 AM', '02:00 PM - 04:00 PM'],
          sunday: ['08:00 AM - 10:00 AM', '02:00 PM - 04:00 PM'],
        },
        description: 'Description',
        pricePerHour: 100,
        amenities: [CourtAmenities.WIFI, CourtAmenities.PARKING],
        categories: [CourtCategories.FUTSAL, CourtCategories.BASKETBALL],
        images: [
          'https://ik.imagekit.io/pqxf1vesz/uploads/qa_evidencia_fk_202_4hiQZCfb1A.png',
        ],
        status: true,
        createdAt: '2024-09-17T19:49:18.518Z',
        updatedAt: '2024-09-17T19:49:18.518Z',
        __v: 0,
        user: {
          name: 'Luan Lopes',
          email: 'luanlopesdasilva165@gmail.com',
          phone: '11999999999',
        },
      };

      jest
        .spyOn(courtService, 'getCourtByID')
        .mockResolvedValueOnce(courtDetails);

      const result = await courtController.getCourtByID(courtId);

      expect(courtService.getCourtByID).toHaveBeenCalledWith(courtId);

      expect(result).toEqual(courtDetails);
    });
  });

  describe('getAllCourts', () => {
    it('should return paginated list of courts', async () => {
      const query = {
        page: 1,
        limit: 10,
        name: 'Central',
        sport: CourtCategories.FUTSAL,
      };

      const paginatedResult: GetCourtsResponseDTO = {
        data: [],
        total: 0,
      };

      jest
        .spyOn(courtService, 'getCourtsWithPagination')
        .mockResolvedValueOnce(paginatedResult);

      const result = await courtController.getAllCourts(
        query.page,
        query.limit,
        query.name,
        query.sport,
      );

      expect(courtService.getCourtsWithPagination).toHaveBeenCalledWith(
        query.page,
        query.limit,
        query.name,
        query.sport,
      );

      expect(result).toEqual(paginatedResult);
    });
  });

  describe('updateCourt', () => {
    it('should call courtService.updateCourt with correct parameters', async () => {
      const courtId = '1';
      const updateCourtDTO: CreateCourtDTO = {
        address: '123 Main Street',
        neighborhood: 'Downtown',
        city: 'New York',
        number: '45A',
        name: 'Updated Court',
        reason: 'Updating court details',
        description: 'Updated description',
        price_per_hour: 150,
        amenities: [CourtAmenities.WIFI, CourtAmenities.PARKING],
        categories: [CourtCategories.FUTSAL, CourtCategories.BASKETBALL],
        images: ['https://example.com/image.png'],
        weeklySchedule: {
          monday: ['08:00', '09:00'],
          tuesday: ['08:00', '09:00'],
        },
        postalCode: '06850-000',
        state: 'SP',
      };

      jest.spyOn(courtService, 'updateCourt').mockResolvedValueOnce(undefined);

      await courtController.updateCourt(courtId, updateCourtDTO);

      expect(courtService.updateCourt).toHaveBeenCalledWith(
        courtId,
        updateCourtDTO,
      );
    });
  });

  describe('deleteCourt', () => {
    it('should call courtService.deleteCourt with correct parameter', async () => {
      const courtId = '1';

      jest.spyOn(courtService, 'deleteCourt').mockResolvedValueOnce(undefined);

      const result = await courtController.deleteCourt(courtId);

      expect(courtService.deleteCourt).toHaveBeenCalledWith(courtId);
      expect(result).toEqual({ message: 'Court deleted successfully' });
    });
  });

  describe('inactivateCourt', () => {
    it('should call courtService.deactivateCourt with correct parameter', async () => {
      const courtId = '1';
      const courtInactivated: Partial<Court> = {
        _id: '66e9dd3eba8209611a170971',
        address: '123 Main Street',
        name: 'Central Court',
        images: ['https://example.com/image.png'],
        createdAt: new Date('2024-09-17T19:49:18.518Z'),
        updatedAt: new Date('2024-09-17T19:49:18.518Z'),
        status: false,
        reason: 'Opening a new court in the city center',
        neighborhood: 'Downtown',
        city: 'New York',
        number: '45A',
      };

      jest
        .spyOn(courtService, 'deactivateCourt')
        .mockResolvedValueOnce(courtInactivated);

      const result = await courtController.inactivateCourt(courtId);

      expect(courtService.deactivateCourt).toHaveBeenCalledWith(courtId);
      expect(result).toEqual(courtInactivated);
    });
  });

  describe('activateCourt', () => {
    it('should call courtService.activateCourt with correct parameter', async () => {
      const courtId = '1';
      const courtActivated: Partial<Court> = {
        _id: '66e9dd3eba8209611a170971',
        address: '123 Main Street',
        name: 'Central Court',
        images: ['https://example.com/image.png'],
        createdAt: new Date('2024-09-17T19:49:18.518Z'),
        updatedAt: new Date('2024-09-17T19:49:18.518Z'),
        status: true,
        reason: 'Opening a new court in the city center',
        neighborhood: 'Downtown',
        city: 'New York',
        number: '45A',
      };

      jest
        .spyOn(courtService, 'activateCourt')
        .mockResolvedValueOnce(courtActivated);

      const result = await courtController.activateCourt(courtId);

      expect(courtService.activateCourt).toHaveBeenCalledWith(courtId);
      expect(result).toEqual(courtActivated);
    });
  });
});
