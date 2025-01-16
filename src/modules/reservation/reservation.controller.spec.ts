import { Test, TestingModule } from '@nestjs/testing';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Reservation } from 'src/schema/reservation.schema';
import { CreateReservationDTO } from './dtos/create-reservation.dto';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { InternalServerErrorException } from '@nestjs/common';
import { ReservationType } from './enums/reservation-type.enum';

describe('ReservationController', () => {
  let reservationController: ReservationController;
  let reservationService: ReservationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationController],
      providers: [
        {
          provide: ReservationService,
          useValue: {
            create: jest.fn(),
            updateReservationStatus: jest.fn(),
            findByOwnerWithPaginationAndStatus: jest.fn(),
            findByUserWithPaginationAndStatus: jest.fn(),
            approveCancellation: jest.fn(),
            cancellingReservaition: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    reservationController = module.get<ReservationController>(
      ReservationController,
    );
    reservationService = module.get<ReservationService>(ReservationService);
  });

  it('should be defined', () => {
    expect(reservationController).toBeDefined();
    expect(reservationService).toBeDefined();
  });

  describe('create', () => {
    it('should call courtService.create with correct parameters', async () => {
      const reservationCreated: Partial<Reservation> = {
        status: 'approved',
      };

      const mockCreateReservation: CreateReservationDTO = {
        ownerId: 'user_2lX2f8JuZMKeTlKjBQ4oia4JItX',
        courtId: 'court_1a2b3c4d5e6f7g8h9i0j',
        reservedStartTime: '2024-09-18T10:00:00Z',
        dayOfWeek: 'MONDAY',
        reservationType: ReservationType.SINGLE,
      };

      const user: UserInterface = {
        id: 'owner123',
        email: 'example@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'HOUSE_OWNER',
      };

      jest
        .spyOn(reservationService, 'create')
        .mockResolvedValue(reservationCreated);

      const result = await reservationController.create(
        mockCreateReservation,
        user,
      );
      expect(reservationService.create).toHaveBeenCalledWith(
        user,
        mockCreateReservation,
      );
      expect(result).toEqual(reservationCreated);
    });
  });

  describe('approve', () => {
    it('should approve a reservation', async () => {
      const reservation: Partial<Reservation> = {
        status: 'approved',
      };

      jest
        .spyOn(reservationService, 'updateReservationStatus')
        .mockResolvedValue(reservation);

      const result = await reservationController.approve('reservation123');
      expect(reservationService.updateReservationStatus).toHaveBeenCalledWith(
        'reservation123',
        'approved',
      );
      expect(result).toEqual(reservation);
    });

    it('should throw an error if approval fails', async () => {
      jest
        .spyOn(reservationService, 'updateReservationStatus')
        .mockRejectedValue(new Error('Approval failed'));

      try {
        await reservationController.approve('reservation123');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('reject', () => {
    it('should reject a reservation', async () => {
      const reservation: Partial<Reservation> = {
        status: 'approved',
      };

      jest
        .spyOn(reservationService, 'updateReservationStatus')
        .mockResolvedValue(reservation);

      const result = await reservationController.reject('reservation123');
      expect(reservationService.updateReservationStatus).toHaveBeenCalledWith(
        'reservation123',
        'rejected',
      );
      expect(result).toEqual(reservation);
    });

    it('should throw an error if rejection fails', async () => {
      jest
        .spyOn(reservationService, 'updateReservationStatus')
        .mockRejectedValue(new Error('Rejection failed'));

      try {
        await reservationController.reject('reservation123');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('findByOwnerWithPagination', () => {
    it('should return reservations for the owner', async () => {
      const user: UserInterface = {
        id: 'owner123',
        email: 'example@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'HOUSE_OWNER',
      };

      const reservations: Partial<Reservation>[] = [
        {
          status: 'approved',
        },
      ];

      const total = 1;
      jest
        .spyOn(reservationService, 'findByOwnerWithPaginationAndStatus')
        .mockResolvedValue({ data: reservations, total });

      const result = await reservationController.findByOwnerWithPagination(
        user,
        1,
        10,
        'approved',
      );
      expect(
        reservationService.findByOwnerWithPaginationAndStatus,
      ).toHaveBeenCalledWith(user, { page: 1, limit: 10, status: 'approved' });
      expect(result).toEqual({ data: reservations, total });
    });

    it('should throw an error if fetching reservations fails', async () => {
      const user: UserInterface = {
        id: 'owner123',
        email: 'example@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'HOUSE_OWNER',
      };

      jest
        .spyOn(reservationService, 'findByOwnerWithPaginationAndStatus')
        .mockRejectedValue(new Error('Fetch failed'));

      try {
        await reservationController.findByOwnerWithPagination(
          user,
          1,
          10,
          'approved',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('findByUserWithPagination', () => {
    it('should return reservations for the user', async () => {
      const user: UserInterface = {
        id: 'owner123',
        email: 'example@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'USER',
      };

      const reservations: Partial<Reservation>[] = [{ status: 'approved' }];
      const total = 1;
      jest
        .spyOn(reservationService, 'findByUserWithPaginationAndStatus')
        .mockResolvedValue({ data: reservations, total });

      const result = await reservationController.findByUserWithPagination(
        user,
        1,
        10,
        'approved',
      );
      expect(
        reservationService.findByUserWithPaginationAndStatus,
      ).toHaveBeenCalledWith(user, { page: 1, limit: 10, status: 'approved' });
      expect(result).toEqual({ data: reservations, total });
    });

    it('should throw an error if fetching user reservations fails', async () => {
      const user: UserInterface = {
        id: 'owner123',
        email: 'example@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'USER',
      };

      jest
        .spyOn(reservationService, 'findByUserWithPaginationAndStatus')
        .mockRejectedValue(new Error('Fetch failed'));

      try {
        await reservationController.findByUserWithPagination(
          user,
          1,
          10,
          'approved',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('approveCancellation', () => {
    it('should approve cancellation of a reservation', async () => {
      const reservation: Partial<Reservation> = {
        status: 'approved',
      };

      jest
        .spyOn(reservationService, 'approveCancellation')
        .mockResolvedValue(reservation);

      const result =
        await reservationController.approveCancellation('reservation123');
      expect(reservationService.approveCancellation).toHaveBeenCalledWith(
        'reservation123',
      );
      expect(result).toEqual(reservation);
    });
  });
});
