import { weekDayTranslations } from './reservation-notification.template';
import { emailStyles } from './styles';

export const getReservationCancellationTemplate = (
  userName: string,
  courtName: string,
  dayOfWeek: string,
  time: string,
  ownerName: string,
  reason?: string,
) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cancelamento de Reserva - SportVenue</title>
    <style>${emailStyles}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">SportVenue</div>
      </div>
      <div class="content">
        <h2>Solicitação de Cancelamento de Reserva</h2>
        <p class="message">
          Olá ${userName},<br>
          O proprietário ${ownerName} solicitou o cancelamento da sua reserva na quadra "${courtName}".
        </p>
        <div class="reservation-details">
          <p><strong>Data:</strong> ${weekDayTranslations[dayOfWeek.toLowerCase() as keyof typeof weekDayTranslations]}</p>
          <p><strong>Horário:</strong> ${time}</p>
          ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
        </div>
        <p class="message">
          Pedimos desculpas pelo inconveniente. O valor será estornado em até 5 dias úteis.
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} SportVenue. Todos os direitos reservados.</p>
        <p>Este é um email automático, por favor não responda.</p>
      </div>
    </div>
  </body>
</html>
`;
