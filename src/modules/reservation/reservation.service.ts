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
        text: `Você recebeu uma nova solicitação de reserva. A reserva é para o horário ${data.reservedTimeStart}.`,
        html: `
          <p>Você recebeu uma nova solicitação de reserva.</p>
          <p>A reserva é de <strong>${data.reservedTimeStart}</strong>.</p>
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
}
