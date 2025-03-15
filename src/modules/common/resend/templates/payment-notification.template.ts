import { emailStyles } from './styles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const customStyles = `
  body {
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
    font-family: Arial, sans-serif;
  }

  .container {
    max-width: 600px;
    margin: 20px auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .header {
    background-color: #FEC341;
    padding: 30px;
    text-align: center;
  }

  .header h1 {
    margin: 0;
    color: #333333;
    font-size: 24px;
    font-weight: bold;
  }

  .content {
    padding: 30px;
    background-color: #FEF7DF;
  }

  .message {
    text-align: center;
    font-size: 18px;
    color: #333333;
    margin-bottom: 30px;
  }

  .details {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    border: 1px solid rgba(254, 195, 65, 0.3);
  }

  .details p {
    margin: 10px 0;
    color: #333333;
    font-size: 16px;
  }

  .amount {
    font-size: 28px;
    color: #333333;
    font-weight: bold;
    margin: 10px 0;
  }

  .action {
    text-align: center;
    margin: 30px 0;
  }

  .button {
    display: inline-block;
    background-color: #FEC341;
    color: #333333;
    text-decoration: none;
    padding: 15px 30px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 16px;
    transition: all 0.3s ease;
  }

  .button:hover {
    background-color: #fdb922;
    transform: translateY(-2px);
  }

  .note {
    text-align: center;
    color: #666666;
    font-size: 14px;
    margin: 20px 0;
  }

  .warning {
    background-color: rgba(254, 195, 65, 0.1);
    border-left: 4px solid #FEC341;
    padding: 15px;
    color: #333333;
    border-radius: 4px;
    margin: 20px 0;
  }

  .footer {
    background-color: #ffffff;
    padding: 20px;
    text-align: center;
    border-top: 1px solid #eeeeee;
  }

  .footer p {
    color: #666666;
    font-size: 14px;
    margin: 5px 0;
  }
`;

export const getPaymentNotificationTemplate = (
  name: string,
  amount: number,
  dueDate: Date,
  boletoUrl: string,
) => {
  const formattedAmount = (amount / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      ${emailStyles}
      ${customStyles}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Olá, ${name}! 👋</h1>
      </div>
      
      <div class="content">
        <div class="message">
          Um novo boleto foi gerado para sua assinatura na SportMap.
        </div>
        
        <div class="details">
          <p><strong>Valor:</strong></p>
          <div class="amount">${formattedAmount}</div>
          <p><strong>Vencimento:</strong></p>
          <p>${format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>

        <div class="action">
          <a href="${boletoUrl}" class="button" target="_blank">
            Visualizar Boleto
          </a>
        </div>

        <p class="note">
          Para sua comodidade, você também pode acessar o boleto através da plataforma.
        </p>
        
        <div class="warning">
          <strong>Atenção:</strong> O não pagamento pode resultar na suspensão do serviço.
        </div>
      </div>

      <div class="footer">
        <p>Este é um e-mail automático, por favor não responda.</p>
        <p>© ${new Date().getFullYear()} SportMap. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
</html>`;
};
