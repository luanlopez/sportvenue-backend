import { emailStyles } from './styles';

export const weekDayTranslations = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
} as const;

export const getReservationNotificationTemplate = (
  ownerName: string,
  courtName: string,
  dayOfWeek: string,
  time: string,
  userName: string,
  userPhone: string,
) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Reserva - SportVenue</title>
    <style>${emailStyles}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">SportVenue</div>
      </div>
      <div class="content">
        <h2>Nova Reserva Pendente!</h2>
        <p class="message">
          Olá ${ownerName},<br>
          Você recebeu uma nova solicitação de reserva para sua quadra "${courtName}".
        </p>
        <div class="reservation-details">
          <p><strong>Data:</strong> ${weekDayTranslations[dayOfWeek.toLowerCase() as keyof typeof weekDayTranslations]}</p>
          <p><strong>Horário:</strong> ${time}</p>
          <p><strong>Cliente:</strong> ${userName}</p>
          <p><strong>Telefone:</strong> ${userPhone}</p>
        </div>
        <p class="message">
          Por favor, acesse sua conta para aprovar ou rejeitar esta reserva.
        </p>
        <div class="button-container">
          <a href="${process.env.FRONTEND_URL}/bookings" 
             class="button" 
             style="background-color: #00CCFF; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 136, 255, 0.2);">
            <!--[if mso]>
            <i style="letter-spacing: 25px; mso-font-width: -100%; mso-text-raise: 30pt;">&nbsp;</i>
            <![endif]-->
            <span style="mso-text-raise: 15pt;">Gerenciar Reservas</span>
            <!--[if mso]>
            <i style="letter-spacing: 25px; mso-font-width: -100%;">&nbsp;</i>
            <![endif]-->
          </a>
        </div>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} SportVenue. Todos os direitos reservados.</p>
        <p>Este é um email automático, por favor não responda.</p>
      </div>
    </div>
  </body>
</html>
`;
