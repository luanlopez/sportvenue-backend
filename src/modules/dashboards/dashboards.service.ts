import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { ErrorCodes } from 'src/common/errors/error-codes';
import { ApiMessages } from 'src/common/messages/api-messages';
import { Billing } from 'src/schema/billing.schema';
import { Reservation } from 'src/schema/reservation.schema';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectModel('Billing') private readonly billingModel: Model<Billing>,
    @InjectModel('Reservation')
    private readonly reservationModel: Model<Reservation>,
  ) {}

  /**
   * Obtém as quadras mais alugadas com base no status
   *
   * @param status Status da quadra
   * @returns Lista de quadras mais alugadas
   */
  async getMostRentedCourts(status?: string) {
    try {
      const match: any = {};
      if (status) {
        match.status = status;
      } else {
        match.status = { $in: ['PAGO_PRESENCIALMENTE', 'PAGO_SPORTMAP'] };
      }

      return this.billingModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$courtId',
            totalRentals: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $lookup: {
            from: 'courts',
            localField: '_id',
            foreignField: '_id',
            as: 'court',
          },
        },
        { $unwind: '$court' },
        { $sort: { totalRentals: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            court: 1,
            totalRentals: 1,
            totalAmount: 1,
          },
        },
      ]);
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Dashboard.Failed.title,
        ApiMessages.Dashboard.Failed.message,
        ErrorCodes.DASHBOARD_GET_FAILED,
        400,
      );
    }
  }

  /**
   * Obtém o número de reservas ativas por proprietário
   *
   * @param ownerId ID do proprietário
   * @returns Número de reservas ativas
   */
  async getActiveReservationsCountByOwner(ownerId: string) {
    try {
      return this.reservationModel.countDocuments({
        ownerId,
        status: 'approved',
      });
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Dashboard.Failed.title,
        ApiMessages.Dashboard.Failed.message,
        ErrorCodes.DASHBOARD_GET_FAILED,
        400,
      );
    }
  }

  /**
   * Obtém o número de reservas ativas por quadra
   *
   * @param ownerId ID do proprietário
   * @returns Número de reservas ativas por quadra
   */
  async getActiveReservationsCountByCourt(ownerId: string) {
    try {
      const reservations = await this.reservationModel.aggregate([
        {
          $match: { ownerId: new Types.ObjectId(ownerId), status: 'approved' },
        },
        {
          $group: {
            _id: '$courtId',
            activeReservations: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'courts',
            localField: '_id',
            foreignField: '_id',
            as: 'court',
          },
        },
        { $unwind: '$court' },
        {
          $project: {
            _id: 0,
            court: 1,
            activeReservations: 1,
          },
        },
      ]);

      return reservations;
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Dashboard.Failed.title,
        ApiMessages.Dashboard.Failed.message,
        ErrorCodes.DASHBOARD_GET_FAILED,
        400,
      );
    }
  }
}
