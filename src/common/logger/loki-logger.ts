import axios from 'axios';

interface LokiLogEntry {
  streams: {
    stream: {
      Language: string;
      source: string;
    };
    values: [string, string][];
  }[];
}

class LokiLogger {
  private readonly host: string;
  private readonly token: string;

  constructor() {
    this.host = 'https://logs-prod-024.grafana.net/loki/api/v1/push';
    this.token =
      'glc_eyJvIjoiMTMzNjAxMiIsIm4iOiJzdGFjay0xMTU3MjY5LWludGVncmF0aW9uLXNwb3J0bWFwLWJhY2tlbmQtcHJvZHVjdGlvbi1sb2dzIiwiayI6IjMyNTRWeDQ2MllYdk5vempMOTM2dVVsRSIsIm0iOnsiciI6InByb2Qtc2EtZWFzdC0xIn19';
  }

  private formatTimestamp(): string {
    return (Math.floor(Date.now() / 1000) * 1000000000).toString();
  }

  private async sendToLoki(message: string) {
    const payload: LokiLogEntry = {
      streams: [
        {
          stream: {
            Language: 'NodeJS',
            source: 'Code',
          },
          values: [[this.formatTimestamp(), message]],
        },
      ],
    };

    try {
      await axios.post(this.host, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`1115068:${this.token}`).toString('base64')}`,
        },
      });
    } catch (error) {
      console.error('Failed to send logs to Loki:', error);
    }
  }

  async info(message: string) {
    await this.sendToLoki(message);
  }

  async error(message: string, error?: Error) {
    const errorMessage = error
      ? `${message} - Error: ${error.message}\nStack: ${error.stack}`
      : message;
    await this.sendToLoki(errorMessage);
  }
}

export const lokiLogger = new LokiLogger();
