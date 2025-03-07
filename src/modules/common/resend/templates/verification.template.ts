import { emailStyles } from './styles';

export const getVerificationTemplate = (name: string, code: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificação SportMap</title>
    <style>${emailStyles}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">SportMap</div>
      </div>
      <div class="content">
        <h2>Olá, ${name}!</h2>
        <p class="message">
          Bem-vindo ao SportMap! Para completar seu cadastro, 
          use o código de verificação abaixo:
        </p>
        <div class="verification-code">
          ${code}
        </div>
        <p class="message">
          Este código é válido por 30 minutos.
        </p>
        <p class="warning">
          Por questões de segurança, não compartilhe este código com ninguém.
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} SportMap. Todos os direitos reservados.</p>
        <p>Este é um email automático, por favor não responda.</p>
      </div>
    </div>
  </body>
</html>
`;
