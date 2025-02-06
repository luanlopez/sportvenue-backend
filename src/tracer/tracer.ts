import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
  }),
  traceExporter: new OTLPTraceExporter({
    url:
      process.env.NODE_ENV === 'production'
        ? 'https://otlp-gateway-prod-sa-east-1.grafana.net/otlp'
        : process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers:
      process.env.NODE_ENV === 'production'
        ? {
            'x-scope-orgid': process.env.GRAFANA_CLOUD_INSTANCE_ID,
            Authorization: `Basic ${Buffer.from(
              `${process.env.GRAFANA_CLOUD_INSTANCE_ID}:${process.env.GRAFANA_CLOUD_API_KEY}`,
            ).toString('base64')}`,
          }
        : undefined,
  }),
  instrumentations: [
    getNodeAutoInstrumentations(),
    new WinstonInstrumentation(),
  ],
});

console.log('OpenTelemetry SDK configuration:', {
  serviceName: process.env.OTEL_SERVICE_NAME,
  endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  resourceAttributes: process.env.OTEL_RESOURCE_ATTRIBUTES,
  protocol: process.env.OTEL_EXPORTER_OTLP_PROTOCOL,
});

sdk.start();
console.log('Tracing initialized');

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
