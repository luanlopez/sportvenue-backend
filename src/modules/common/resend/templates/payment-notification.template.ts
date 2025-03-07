import { emailStyles } from './styles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const getPaymentNotificationTemplate = (
  name: string,
  amount: number,
  dueDate: Date,
  boletoUrl: string,
) => `
<!DOCTYPE html>
<html>
  <head>
    <style>${emailStyles}</style>
  </head>
  <body>
    <div class="container">
      <h1>Olá, ${name}!</h1>
      
      <p>Um novo boleto foi gerado para sua assinatura na SportMap.</p>
      
      <div class="details">
        <p><strong>Valor:</strong> R$ ${amount.toFixed(2)}</p>
        <p><strong>Vencimento:</strong> ${format(
          dueDate,
          "dd 'de' MMMM 'de' yyyy",
          {
            locale: ptBR,
          },
        )}</p>
      </div>

      <div class="action">
        <a href="${boletoUrl}" class="button" target="_blank">
          Visualizar Boleto
        </a>
      </div>

      <p class="note">
        Para sua comodidade, você também pode acessar o boleto através da plataforma.
      </p>
      
      <p class="warning">
        Atenção: O não pagamento pode resultar na suspensão do serviço.
      </p>
    </div>
  </body>
</html>
`;
