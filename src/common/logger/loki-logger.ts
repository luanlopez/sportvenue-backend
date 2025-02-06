import axios from 'axios';

const SERVICE_NAME = 'sportmap-backend';

interface LokiLogLabels {
  Language: string;
  source: string;
  service: typeof SERVICE_NAME;
  endpoint?: string;
  method?: string;
  userId?: string;
  courtId?: string;
  params?: any;
  courtData?: any;
  totalCourts?: number;
  returnedCourts?: number;
  [key: string]: any;
}

interface LokiLogEntry {
  streams: {
    stream: LokiLogLabels;
    values: [string, string][];
  }[];
}

class LokiLogger {
  private readonly host: string;
  private readonly token: string;
  private readonly user: string;

  constructor() {
    this.host = 'https://logs-prod-024.grafana.net/loki/api/v1/push';
    this.token = process.env.GRAFANA_LOKI_TOKEN;
    this.user = process.env.GRAFANA_LOKI_USER;

    if (!this.token || !this.user) {
      console.error('Loki credentials not found in environment variables');
    }
  }

  private formatTimestamp(): string {
    return (Math.floor(Date.now() / 1000) * 1000000000).toString();
  }

  private async sendToLoki(
    message: string,
    labels: Partial<LokiLogLabels> = {},
  ) {
    const payload: LokiLogEntry = {
      streams: [
        {
          stream: {
            Language: 'NodeJS',
            source: 'Code',
            service: SERVICE_NAME,
            ...labels,
          },
          values: [[this.formatTimestamp(), message]],
        },
      ],
    };

    try {
      await axios.post(this.host, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${this.user}:${this.token}`).toString('base64')}`,
        },
      });
    } catch (error) {
      console.error('Failed to send logs to Loki:', error);
    }
  }

  async info(message: string, labels: Partial<LokiLogLabels> = {}) {
    await this.sendToLoki(`[INFO] ${message}`, labels);
  }

  async error(
    message: string,
    error?: Error,
    labels: Partial<LokiLogLabels> = {},
  ) {
    const errorMessage = error
      ? `[ERROR] ${message} - Error: ${error.message}\nStack: ${error.stack}`
      : `[ERROR] ${message}`;
    await this.sendToLoki(errorMessage, labels);
  }

  async debug(message: string, labels: Partial<LokiLogLabels> = {}) {
    if (process.env.NODE_ENV !== 'production') {
      await this.sendToLoki(`[DEBUG] ${message}`, labels);
    }
  }
}

export const lokiLogger = new LokiLogger();
