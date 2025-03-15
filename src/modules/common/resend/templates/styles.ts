export const emailStyles = `
  :root {
    --primary: #FEC341;
    --secondary: #FEF7DF;
    --text-dark: #333333;
    --text-light: #666666;
  }

  body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background-color: #f8f9fa;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
  .header {
    text-align: center;
    padding: 20px 0;
    border-bottom: 2px solid var(--secondary);
  }
  .logo {
    color: var(--primary);
    font-size: 28px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .content {
    padding: 30px 20px;
    text-align: center;
  }
  .verification-code, .reservation-details {
    font-size: 32px;
    font-weight: bold;
    color: var(--primary);
    letter-spacing: 5px;
    margin: 20px 0;
    padding: 15px;
    background-color: var(--secondary);
    border-radius: 5px;
    display: inline-block;
  }
  .reservation-details {
    font-size: 16px;
    letter-spacing: normal;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }
  .message {
    color: var(--text-dark);
    margin: 20px 0;
  }
  .footer {
    text-align: center;
    padding-top: 20px;
    border-top: 2px solid var(--secondary);
    color: var(--text-light);
    font-size: 14px;
  }
  .warning {
    color: var(--text-light);
    font-size: 12px;
    margin-top: 20px;
  }
  h2 {
    color: var(--primary);
    margin-bottom: 20px;
  }
  .button-container {
    text-align: center;
    padding: 30px 0;
  }
  .button {
    background-color: var(--primary);
    color: var(--text-dark) !important;
    padding: 15px 30px;
    border-radius: 8px;
    text-decoration: none;
    display: inline-block;
    font-weight: 600;
    font-size: 16px;
    box-shadow: 0 2px 4px rgba(254, 195, 65, 0.2);
    mso-padding-alt: 0;
    text-underline-color: var(--primary);
    border-collapse: separate;
  }
  .button:hover {
    background-color: #fdb922;
    transform: translateY(-2px);
  }
`;
