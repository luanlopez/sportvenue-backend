import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { getVerificationTemplate } from './templates/verification.template';
import { getReservationNotificationTemplate } from './templates/reservation-notification.template';
import { getReservationStatusTemplate } from './templates/reservation-status.template';
import { getReservationCancellationTemplate } from './templates/reservation-cancellation.template';
import { getPaymentNotificationTemplate } from './templates/payment-notification.template';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../../../schema/payment.schema';
import { getPasswordResetCodeTemplate } from './templates/password-reset.template';
import { getPasswordResetConfirmationTemplate } from './templates/password-reset.template';
import { emailStyles } from './templates/styles';

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
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              ${emailStyles}
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Olá, ${firstName}! 👋</h1>
              </div>
              
              <div class="content">
                <div class="message">
                  Seu pagamento foi confirmado com sucesso!
                </div>
                
                <div class="details">
                  <strong>Valor:</strong> R$ ${(amount / 100).toFixed(2)}
                </div>

                <p class="note">
                  Obrigado por usar o SportMap!
                </p>
              </div>

              <div class="footer">
                <p>Este é um e-mail automático, por favor não responda.</p>
                <p>© ${new Date().getFullYear()} SportMap. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  }

  async sendPaymentFailureNotification(
    email: string,
    firstName: string,
    amount: number,
    status: PaymentStatus,
  ) {
    const statusMessage =
      status === PaymentStatus.EXPIRED ? 'venceu' : 'foi cancelado';

    await this.resend.emails.send({
      from: 'SportMap <noreply@sportmap.com.br>',
      to: email,
      subject: `Pagamento ${status === PaymentStatus.EXPIRED ? 'Vencido' : 'Cancelado'} - SportMap`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              ${emailStyles}
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Olá, ${firstName}! 👋</h1>
              </div>
              
              <div class="content">
                <div class="message">
                  Seu pagamento ${statusMessage}.
                </div>
                
                <div class="details">
                  <strong>Valor:</strong> R$ ${(amount / 100).toFixed(2)}
                </div>

                <div class="warning">
                  <strong>Atenção:</strong> Por favor, entre em contato conosco para regularizar sua situação.
                </div>
              </div>

              <div class="footer">
                <p>Este é um e-mail automático, por favor não responda.</p>
                <p>© ${new Date().getFullYear()} SportMap. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  }

  async sendPasswordResetCode(
    email: string,
    name: string,
    code: string,
  ): Promise<void> {
    await this.resend.emails.send({
      from: 'SportMap <noreply@sportmap.com.br>',
      to: email,
      subject: 'Redefinição de Senha - SportMap',
      html: getPasswordResetCodeTemplate(name, code),
    });
  }

  async sendPasswordResetConfirmation(
    email: string,
    name: string,
  ): Promise<void> {
    await this.resend.emails.send({
      from: 'SportMap <noreply@sportmap.com.br>',
      to: email,
      subject: 'Senha Alterada com Sucesso - SportMap',
      html: getPasswordResetConfirmationTemplate(name),
    });
  }
}
