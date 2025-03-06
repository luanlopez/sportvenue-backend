import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { getVerificationTemplate } from './templates/verification.template';
import { getReservationNotificationTemplate } from './templates/reservation-notification.template';
import { getReservationStatusTemplate } from './templates/reservation-status.template';
import { getReservationCancellationTemplate } from './templates/reservation-cancellation.template';
import { getPaymentNotificationTemplate } from './templates/payment-notification.template';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../../../schema/payment.schema';

@Injectable()
export class ResendService {
  private resend: Resend;
  private readonly fromEmail = process.env.RESEND_FROM_EMAIL;
  private readonly logger = new Logger(ResendService.name);

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
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
        subject: 'Nova Solicitação de Reserva - SportMap',
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
        subject: `Reserva ${status === 'approved' ? 'Aprovada' : 'Rejeitada'} - SportMap`,
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
        subject: 'Cancelamento de Reserva - SportMap',
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

  async sendPaymentNotification(
    email: string,
    name: string,
    amount: number,
    dueDate: Date,
    boletoUrl: string,
  ) {
    try {
      await this.resend.emails.send({
        from: 'SportMap <noreply@sportmap.com.br>',
        to: email,
        subject: 'Novo Boleto Gerado - SportMap',
        html: getPaymentNotificationTemplate(name, amount, dueDate, boletoUrl),
      });
    } catch (error) {
      this.logger.error(
        'Erro ao enviar email de notificação de pagamento:',
        error,
      );
    }
  }

  async sendPaymentConfirmation(
    email: string,
    firstName: string,
    amount: number,
  ) {
    await this.resend.emails.send({
      from: 'SportMap <noreply@sportmap.com.br>',
      to: email,
      subject: 'Pagamento Confirmado - SportMap',
      html: `
        <h1>Olá ${firstName}!</h1>
        <p>Seu pagamento de R$ ${amount.toFixed(2)} foi confirmado com sucesso.</p>
        <p>Obrigado por usar o SportMap!</p>
      `,
    });
  }

  async sendPaymentFailureNotification(
    email: string,
    firstName: string,
    amount: number,
    status: PaymentStatus,
  ) {
    const statusMessage = status === PaymentStatus.EXPIRED
      ? 'venceu'
      : 'foi cancelado';

    await this.resend.emails.send({
      from: 'SportMap <noreply@sportmap.com.br>',
      to: email,
      subject: `Pagamento ${status === PaymentStatus.EXPIRED ? 'Vencido' : 'Cancelado'} - SportMap`,
      html: `
        <h1>Olá ${firstName}!</h1>
        <p>Seu pagamento de R$ ${amount.toFixed(2)} ${statusMessage}.</p>
        <p>Por favor, entre em contato conosco para regularizar sua situação.</p>
      `,
    });
  }
}
