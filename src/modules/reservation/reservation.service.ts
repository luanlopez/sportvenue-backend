import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation } from 'src/schema/reservation.schema';
import { CreateReservationDTO } from './dtos/create-reservation.dto';
import { CourtService } from '../court/court.service';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel('Reservation')
    private readonly reservationModel: Model<Reservation>,
    private readonly courtService: CourtService,
  ) {}

  async create(
    user: UserInterface,
    data: CreateReservationDTO,
  ): Promise<Partial<Reservation>> {
    try {
      const createdReservationData = new this.reservationModel({
        ...data,
        userId: user?.id,
        status: 'requested',
      });

      const reservation = await createdReservationData.save();

      return reservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error?.message,
        cause: error?.stack,
      });
    }
  }

  async updateReservationStatus(
    id: string,
    status: 'requested' | 'approved' | 'rejected' | 'cancelled',
  ): Promise<Partial<Reservation>> {
    try {
      const reservation = await this.reservationModel.findById(id);

      if (!reservation) {
        throw new InternalServerErrorException('Reservation not found');
      }

      if (status === 'approved' && reservation?.status === 'cancelled') {
        throw new InternalServerErrorException(
          'It is not possible to approve a reservation that has already been cancelled, please do it again',
        );
      }

      reservation.status = status;
      await reservation.save();

      if (status === 'approved' || status === 'requested') {
        await this.courtService.removeAvailableHour(
          reservation?.courtId,
          reservation?.reservedStartTime,
        );
      }

      if (status === 'cancelled' || status === 'rejected') {
        await this.courtService.restoreAvailableHour(
          reservation?.courtId,
          reservation?.reservedStartTime,
        );
      }

      return reservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error?.message,
        cause: error?.stack,
      });
    }
  }

  async findByOwnerWithPaginationAndStatus(
    user: UserInterface,
    { page = 1, limit = 10, status },
  ): Promise<{ data: Partial<Reservation>[]; total: number }> {
    try {
      const query = { ownerId: user?.id, ...(status && { status }) };

      const [data, total] = await Promise.all([
        this.reservationModel
          .find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate({
            path: 'courtId',
            select:
              '_id address neighborhood city number owner_id name availableHours images status createdAt updatedAt',
          })
          .exec(),
        this.reservationModel.countDocuments(query).exec(),
      ]);

      return { data, total };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to fetch reservations',
        cause: error?.message,
      });
    }
  }

  async findByUserWithPaginationAndStatus(
    user: UserInterface,
    { page = 1, limit = 10, status },
  ): Promise<{ data: Partial<Reservation>[]; total: number }> {
    try {
      const query = { userId: user?.id, ...(status && { status }) };

      const [data, total] = await Promise.all([
        this.reservationModel
          .find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('courtId')
          .exec(),
        this.reservationModel.countDocuments(query).exec(),
      ]);

      return { data, total };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to fetch reservations',
        cause: error?.message,
      });
    }
  }

  async cancellingReservaition(id: string): Promise<Partial<Reservation>> {
    try {
      const reservation = await this.reservationModel.findById(id);

      if (!reservation) {
        throw new InternalServerErrorException('Reservation not found');
      }

      reservation.status = 'requested';
      await reservation.save();

      return reservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error?.message,
        cause: error?.stack,
      });
    }
  }

  async approveCancellation(id: string): Promise<Partial<Reservation>> {
    try {
      const reservation = await this.reservationModel.findById(id);

      if (!reservation) {
        throw new InternalServerErrorException('Reservation not found');
      }

      if (reservation.status !== 'requested') {
        throw new InternalServerErrorException(
          'Cancellation request not found or already processed',
        );
      }

      await this.courtService.restoreAvailableHour(
        reservation?.courtId,
        reservation?.reservedStartTime,
      );

      reservation.status = 'cancelled';
      await reservation.save();

      return reservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error?.message,
        cause: error?.stack,
      });
    }
  }
}
