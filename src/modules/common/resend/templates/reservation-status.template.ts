import { emailStyles } from './styles';

const weekDayTranslations = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
} as const;

export const getReservationStatusTemplate = (
  userName: string,
  courtName: string,
  dayOfWeek: string,
  time: string,
  status: 'approved' | 'rejected',
) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atualização da Reserva - SportMap</title>
    <style>${emailStyles}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">SportMap</div>
      </div>
      <div class="content">
        <h2>Sua Reserva foi ${status === 'approved' ? 'Aprovada!' : 'Rejeitada'}</h2>
        <p class="message">
          Olá ${userName},<br>
          Sua reserva para a quadra "${courtName}" foi ${status === 'approved' ? 'aprovada' : 'rejeitada'}.
        </p>
        <div class="reservation-details">
          <p><strong>Data:</strong> ${weekDayTranslations[dayOfWeek.toLowerCase() as keyof typeof weekDayTranslations]}</p>
          <p><strong>Horário:</strong> ${time}</p>
        </div>
        ${
          status === 'approved'
            ? `
        <p class="message">
          Agradecemos a preferência e esperamos você no horário agendado!
        </p>
        `
            : `
        <p class="message">
          Infelizmente sua reserva não pôde ser aceita. Por favor, tente outro horário ou entre em contato conosco.
        </p>
        `
        }
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} SportMap. Todos os direitos reservados.</p>
        <p>Este é um email automático, por favor não responda.</p>
      </div>
    </div>
  </body>
</html>
`;
