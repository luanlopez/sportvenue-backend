import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ResendService {
  private readonly resendApiKey: string;
  private readonly resendEndpoint: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.resendEndpoint = 'https://api.resend.com/emails';
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    try {
      const response = await axios.post(
        this.resendEndpoint,
        {
          from: 'luanlopesdasilva165@gmail.com',
          to,
          subject,
          text,
          html,
        },
        {
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status !== 200) {
        throw new InternalServerErrorException('Failed to send email.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw new InternalServerErrorException('Failed to send email.');
    }
  }
}
