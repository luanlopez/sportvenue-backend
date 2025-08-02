import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation } from 'src/schema/reservation.schema';
import { CreateReservationDTO } from './dtos/create-reservation.dto';
import { CourtService } from '../court/court.service';
import { ResendService } from '../common/resend/resend.service';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { ApiMessages } from 'src/common/messages/api-messages';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { ErrorCodes } from 'src/common/errors/error-codes';
import { BillingService } from '../billing/billing.service';
import { BillingType } from '../billing/dtos/create-billing.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from 'src/schema/notification.schema';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel('Reservation')
    private readonly reservationModel: Model<Reservation>,
    private readonly courtService: CourtService,
    private readonly resendService: ResendService,
    private readonly billingService: BillingService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    user: UserInterface,
    data: CreateReservationDTO,
  ): Promise<Partial<Reservation>> {
    try {
      const court = await this.courtService.getCourtByID(data.courtId);

      const createdReservationData = new this.reservationModel({
        ...data,
        userId: user?.id,
        status: 'requested',
      });

      const reservation = await createdReservationData.save();

      await this.courtService.removeAvailableHour(
        reservation?.courtId,
        reservation?.dayOfWeek,
        reservation?.reservedStartTime,
      );

      await this.resendService.sendReservationNotification(
        court.user.email,
        court.user.name.split(' ')[0],
        court.name,
        data.dayOfWeek,
        data.reservedStartTime,
        {
          name: `${user.firstName} ${user.lastName}`,
          phone: court.user.phone,
        },
      );

      await this.notificationService.createNotification({
        userId: court.owner_id,
        title: 'Nova Solicitação de Reserva',
        message: `Você recebeu uma nova solicitação de reserva para a quadra "${court.name}" no dia ${data.dayOfWeek} às ${data.reservedStartTime} por ${user.firstName} ${user.lastName}.`,
        type: NotificationType.RESERVATION_REQUEST,
        relatedEntityId: reservation._id.toString(),
        relatedEntityType: 'reservation',
        metadata: {
          courtName: court.name,
          courtId: court._id.toString(),
          dayOfWeek: data.dayOfWeek,
          time: data.reservedStartTime,
          userName: `${user.firstName} ${user.lastName}`,
          userId: user.id,
        },
      });

      return reservation;
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Generic.InternalError.title,
        ApiMessages.Generic.InternalError.message,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }

  async updateReservationStatus(
    id: string,
    status: 'requested' | 'approved' | 'rejected' | 'cancelled',
  ): Promise<Partial<Reservation>> {
    try {
      const reservation = await this.reservationModel
        .findById(id)
        .populate('userId')
        .populate('courtId');

      if (!reservation) {
        throw new CustomApiError(
          ApiMessages.Reservation.NotFound.title,
          ApiMessages.Reservation.NotFound.message,
          ErrorCodes.RESERVATION_NOT_FOUND,
          404,
        );
      }

      if (status === 'approved' && reservation?.status === 'cancelled') {
        throw new CustomApiError(
          ApiMessages.Reservation.CancelRequestInvalid.title,
          ApiMessages.Reservation.CancelRequestInvalid.message,
          ErrorCodes.INVALID_RESERVATION_STATUS,
          400,
        );
      }

      reservation.status = status;
      await reservation.save();

      const court: any = reservation.courtId;
      const user: any = reservation.userId;

      if (status === 'approved' || status === 'rejected') {
        await this.resendService.sendReservationStatusNotification(
          user.email,
          `${user.firstName} ${user.lastName}`,
          court.name,
          reservation.dayOfWeek,
          reservation.reservedStartTime,
          status,
        );

        await this.notificationService.createNotification({
          userId: user._id.toString(),
          title: `Reserva ${status === 'approved' ? 'Aprovada' : 'Rejeitada'}`,
          message: `Sua reserva para a quadra "${court.name}" no dia ${reservation.dayOfWeek} às ${reservation.reservedStartTime} foi ${status === 'approved' ? 'aprovada' : 'rejeitada'}.`,
          type:
            status === 'approved'
              ? NotificationType.RESERVATION_APPROVED
              : NotificationType.RESERVATION_REJECTED,
          relatedEntityId: reservation._id.toString(),
          relatedEntityType: 'reservation',
          metadata: {
            courtName: court.name,
            courtId: court._id.toString(),
            dayOfWeek: reservation.dayOfWeek,
            time: reservation.reservedStartTime,
            status: status,
          },
        });
      }

      if (status === 'approved') {
        const getCourt = await this.courtService.getCourtByID(
          court._id.toString(),
        );

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);

        await this.billingService.createBilling({
          amount: getCourt.pricePerHour,
          billingType: BillingType.PRESENCIAL,
          courtId: court._id.toString(),
          ownerId: court.ownerId.toString(),
          reservationId: reservation._id.toString(),
          userId: user._id.toString(),
          dueDate: dueDate,
          nextPaidAt: nextDay,
          lastPaidAt: null,
        });
      }

      if (status === 'approved' || status === 'requested') {
        await this.courtService.removeAvailableHour(
          reservation?.courtId,
          reservation?.dayOfWeek,
          reservation?.reservedStartTime,
        );
      }

      if (status === 'cancelled' || status === 'rejected') {
        await this.courtService.restoreAvailableHour(
          reservation?.courtId,
          reservation?.dayOfWeek,
          reservation?.reservedStartTime,
        );
      }

      return reservation;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new CustomApiError(
        ApiMessages.Generic.InternalError.title,
        ApiMessages.Generic.InternalError.message,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
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
          .populate('courtId')
          .populate('userId')
          .exec(),
        this.reservationModel.countDocuments(query).exec(),
      ]);

      return { data, total };
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Generic.InternalError.title,
        ApiMessages.Generic.InternalError.message,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
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
          .populate('userId')
          .exec(),
        this.reservationModel.countDocuments(query).exec(),
      ]);

      return { data, total };
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Generic.InternalError.title,
        ApiMessages.Generic.InternalError.message,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }

  async cancellingReservaition(
    id: string,
    reason?: string,
  ): Promise<Partial<Reservation>> {
    try {
      const reservation = await this.reservationModel
        .findById(id)
        .populate('userId')
        .populate('courtId')
        .populate('ownerId');

      if (!reservation) {
        throw new CustomApiError(
          ApiMessages.Reservation.NotFound.title,
          ApiMessages.Reservation.NotFound.message,
          ErrorCodes.RESERVATION_NOT_FOUND,
          404,
        );
      }

      reservation.status = 'cancelled';
      await reservation.save();

      await this.courtService.restoreAvailableHour(
        reservation?.courtId,
        reservation?.dayOfWeek,
        reservation?.reservedStartTime,
      );

      const user: any = reservation.userId;
      const court: any = reservation.courtId;
      const owner: any = reservation.ownerId;

      await this.resendService.sendReservationCancellationNotification(
        user.email,
        `${user.firstName} ${user.lastName}`,
        court.name,
        reservation.dayOfWeek,
        reservation.reservedStartTime,
        `${owner.firstName} ${owner.lastName}`,
        reason,
      );

      return reservation;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new CustomApiError(
        ApiMessages.Generic.InternalError.title,
        ApiMessages.Generic.InternalError.message,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }

  async approveCancellation(id: string): Promise<Partial<Reservation>> {
    try {
      const reservation = await this.reservationModel.findById(id);

      if (!reservation) {
        throw new CustomApiError(
          ApiMessages.Reservation.NotFound.title,
          ApiMessages.Reservation.NotFound.message,
          ErrorCodes.RESERVATION_NOT_FOUND,
          404,
        );
      }

      if (reservation.status !== 'requested') {
        throw new CustomApiError(
          ApiMessages.Reservation.CancelRequestInvalid.title,
          ApiMessages.Reservation.CancelRequestInvalid.message,
          ErrorCodes.RESERVATION_CANCEL_REQUEST_INVALID,
          400,
        );
      }

      await this.courtService.restoreAvailableHour(
        reservation?.courtId,
        reservation?.dayOfWeek,
        reservation?.reservedStartTime,
      );

      reservation.status = 'cancelled';
      await reservation.save();

      return reservation;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new CustomApiError(
        ApiMessages.Generic.InternalError.title,
        ApiMessages.Generic.InternalError.message,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }
}
