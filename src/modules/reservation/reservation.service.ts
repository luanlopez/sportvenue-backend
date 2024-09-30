import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation } from 'src/schema/reservation.schema';
import { CreateReservationDTO } from './dtos/create-reservation.dto';
import { ResendService } from '../common/resend/resend.service';
import { ClerkService } from '../common/clerk/clerk.service';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel('Reservation')
    private readonly reservationModel: Model<Reservation>,
    private readonly resendService: ResendService,
    private readonly clerkService: ClerkService,
  ) {}

  async create(data: CreateReservationDTO): Promise<Reservation> {
    try {
      const createdReservationData = new this.reservationModel({
        ...data,
        status: 'requested',
      });

      const reservation = await createdReservationData.save();

      const userDetails = await this.clerkService.getUserDetails(data.ownerId);

      const emailData = {
        to: userDetails?.email_addresses[0]?.email_address,
        subject: 'Nova Reserva Solicitada',
        text: `Você recebeu uma nova solicitação de reserva. A reserva é para o horário ${data.reservedStartTime}.`,
        html: `
          <p>Você recebeu uma nova solicitação de reserva.</p>
          <p>A reserva é de <strong>${data.reservedStartTime}</strong>.</p>
          <p>Por favor, acesse o sistema para revisar e aprovar ou rejeitar a reserva.</p>
        `,
      };

      await this.resendService.sendEmail(
        emailData.to,
        emailData.subject,
        emailData.text,
        emailData.html,
      );

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
  ): Promise<Reservation> {
    try {
      const reservation = await this.reservationModel.findById(id);

      if (!reservation) {
        throw new InternalServerErrorException('Reservation not found');
      }

      reservation.status = status;
      await reservation.save();

      const userDetails = await this.clerkService.getUserDetails(
        reservation.userId,
      );
      const emailData = {
        to: userDetails?.email_addresses[0]?.email_address,
        subject: `Reserva ${status === 'approved' ? 'Aprovada' : 'Rejeitada'}`,
        text: `Sua reserva para ${reservation.reservedStartTime} foi ${status === 'approved' ? 'aprovada' : 'rejeitada'}.`,
        html: `
          <p>Sua reserva para <strong>${reservation.reservedStartTime}</strong> foi <strong>${status === 'approved' ? 'aprovada' : 'rejeitada'}</strong>.</p>
        `,
      };

      await this.resendService.sendEmail(
        emailData.to,
        emailData.subject,
        emailData.text,
        emailData.html,
      );

      return reservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error?.message,
        cause: error?.stack,
      });
    }
  }

  async findByOwnerWithPaginationAndStatus(
    ownerId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<{ data: Reservation[]; total: number }> {
    try {
      const query = { ownerId, ...(status && { status }) };

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
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<{ data: Reservation[]; total: number }> {
    try {
      const query = { userId, ...(status && { status }) };

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

  async cancellingReservaition(id: string): Promise<Reservation> {
    try {
      const reservation = await this.reservationModel.findById(id);

      if (!reservation) {
        throw new InternalServerErrorException('Reservation not found');
      }

      reservation.status = 'requested';
      await reservation.save();

      const ownerDetails = await this.clerkService.getUserDetails(
        reservation.userId,
      );

      const emailData = {
        to: ownerDetails?.email_addresses[0]?.email_address,
        subject: 'Solicitação de Cancelamento de Reserva Recebida',
        text: `O usuário ${reservation.userId} solicitou o cancelamento da reserva para o período de ${reservation.reservedStartTime}. Por favor, aprove ou rejeite a solicitação.`,
        html: `
          <p>O usuário <strong>${reservation.userId}</strong> solicitou o cancelamento da reserva.</p>
          <p>Data e hora da reserva: <strong>${reservation.reservedStartTime}</strong>.</p>
          <p>Por favor, acesse o sistema para <strong>aprovar ou rejeitar</strong> a solicitação de cancelamento.</p>
        `,
      };

      await this.resendService.sendEmail(
        emailData.to,
        emailData.subject,
        emailData.text,
        emailData.html,
      );

      return reservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error?.message,
        cause: error?.stack,
      });
    }
  }

  async approveCancellation(id: string): Promise<Reservation> {
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

      reservation.status = 'cancelled';
      await reservation.save();

      const userDetails = await this.clerkService.getUserDetails(
        reservation.userId,
      );

      const emailData = {
        to: userDetails?.email_addresses[0]?.email_address,
        subject: 'Cancelamento de Reserva Aprovado',
        text: `Sua solicitação de cancelamento para a reserva no período ${reservation.reservedStartTime} foi aprovada pelo proprietário.`,
        html: `
          <p>Sua solicitação de cancelamento para a reserva de <strong>${reservation.reservedStartTime}</strong> foi aprovada pelo proprietário.</p>
          <p>Se precisar de mais informações, entre em contato com o proprietário.</p>
        `,
      };

      await this.resendService.sendEmail(
        emailData.to,
        emailData.subject,
        emailData.text,
        emailData.html,
      );

      return reservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error?.message,
        cause: error?.stack,
      });
    }
  }
}
