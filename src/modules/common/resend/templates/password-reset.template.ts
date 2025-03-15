import { emailStyles } from './styles';

export const getPasswordResetCodeTemplate = (name: string, code: string) => `
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
        <h1>Olá, ${name}! 👋</h1>
      </div>
      
      <div class="content">
        <div class="message">
          Você solicitou a redefinição de sua senha na SportMap.
        </div>
        
        <div class="verification-code">
          ${code}
        </div>

        <p class="note">
          Este código expira em 1 hora. Se você não solicitou a redefinição de senha, ignore este email.
        </p>
        
        <div class="warning">
          <strong>Atenção:</strong> Nunca compartilhe este código com ninguém.
        </div>
      </div>

      <div class="footer">
        <p>Este é um e-mail automático, por favor não responda.</p>
        <p>© ${new Date().getFullYear()} SportMap. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
</html>
`;

export const getPasswordResetConfirmationTemplate = (name: string) => `
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
        <h1>Olá, ${name}! 👋</h1>
      </div>
      
      <div class="content">
        <div class="message">
          Sua senha foi alterada com sucesso!
        </div>
        
        <p class="note">
          Você já pode fazer login na plataforma com sua nova senha.
        </p>
        
        <div class="warning">
          <strong>Atenção:</strong> Se você não realizou esta alteração, entre em contato conosco imediatamente.
        </div>
      </div>

      <div class="footer">
        <p>Este é um e-mail automático, por favor não responda.</p>
        <p>© ${new Date().getFullYear()} SportMap. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
</html>
`;
