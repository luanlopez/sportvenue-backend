import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const SERVICE_NAME = 'sportmap-backend';

interface LokiLogLabels {
  Language: string;
  source: string;
  service: typeof SERVICE_NAME;
  traceId: string;
  endpoint?: string;
  method?: string;
  userId?: string;
  courtId?: string;
  params?: any;
  courtData?: any;
  totalCourts?: number;
  returnedCourts?: number;
  body?: any;
  [key: string]: any;
}

interface LokiLogEntry {
  streams: {
    stream: LokiLogLabels;
    values: [string, string][];
  }[];
}

@Injectable()
export class LokiLoggerService {
  private readonly host: string;
  private readonly token: string;
  private readonly user: string;
  private readonly isConfigured: boolean;
  private currentTraceId: string | null = null;

  constructor(private configService: ConfigService) {
    this.host = 'https://logs-prod-024.grafana.net/loki/api/v1/push';
    this.token = this.configService.get<string>('GRAFANA_LOKI_TOKEN') || '';
    this.user = this.configService.get<string>('GRAFANA_LOKI_USER') || '';
    this.isConfigured = Boolean(this.token && this.user);

    if (!this.isConfigured) {
      console.warn('LokiLogger: Missing credentials in environment variables');
    }
  }

  private formatTimestamp(): string {
    return (Math.floor(Date.now() / 1000) * 1000000000).toString();
  }

  private getTraceId(): string {
    if (!this.currentTraceId) {
      this.currentTraceId = uuidv4();
    }
    return this.currentTraceId;
  }

  startNewTrace(): string {
    this.currentTraceId = uuidv4();
    return this.currentTraceId;
  }

  setTraceId(traceId: string) {
    this.currentTraceId = traceId;
  }

  private async sendToLoki(
    message: string,
    labels: Partial<LokiLogLabels> = {},
  ) {
    if (!this.isConfigured) {
      return;
    }

    const payload: LokiLogEntry = {
      streams: [
        {
          stream: {
            Language: 'NodeJS',
            source: 'Code',
            service: SERVICE_NAME,
            traceId: this.getTraceId(),
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
