import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { getVerificationTemplate } from './templates/verification.template';
import { getReservationNotificationTemplate } from './templates/reservation-notification.template';
import { getReservationStatusTemplate } from './templates/reservation-status.template';
import { getReservationCancellationTemplate } from './templates/reservation-cancellation.template';

@Injectable()
export class ResendService {
  private resend: Resend;
  private readonly fromEmail = process.env.RESEND_FROM_EMAIL;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(to: string, subject: string, name: string, code: string) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html: getVerificationTemplate(name, code),
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendReservationNotification(
    to: string,
    ownerName: string,
    courtName: string,
    dayOfWeek: string,
    time: string,
    user: {
      name: string;
      phone: string;
    },
  ) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Nova Solicitação de Reserva - SportVenue',
        html: getReservationNotificationTemplate(
          ownerName,
          courtName,
          dayOfWeek,
          time,
          user.name,
          user.phone,
        ),
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendReservationStatusNotification(
    to: string,
    userName: string,
    courtName: string,
    dayOfWeek: string,
    time: string,
    status: 'approved' | 'rejected',
  ) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Reserva ${status === 'approved' ? 'Aprovada' : 'Rejeitada'} - SportVenue`,
        html: getReservationStatusTemplate(
          userName,
          courtName,
          dayOfWeek,
          time,
          status,
        ),
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendReservationCancellationNotification(
    to: string,
    userName: string,
    courtName: string,
    dayOfWeek: string,
    time: string,
    ownerName: string,
    reason?: string,
  ) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Cancelamento de Reserva - SportVenue',
        html: getReservationCancellationTemplate(
          userName,
          courtName,
          dayOfWeek,
          time,
          ownerName,
          reason,
        ),
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
