import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const getHeaders = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      Authorization:
        'Basic MTE1NzI2OTpnbGNfZXlKdklqb2lNVE16TmpBeE1pSXNJbTRpT2lKemRHRmpheTB4TVRVM01qWTVMVzkwYkhBdGQzSnBkR1V0YzNCdmNuUnRZWEF0WW1GamEyVnVaQzF3Y205a2RXTjBhVzl1SWl3aWF5STZJalUyUlVKUmNXRTBUbkZ5Y1RFME1EVkNOMUprTWpOVlJ5SXNJbTBpT25zaWNpSTZJbkJ5YjJRdGMyRXRaV0Z6ZEMweEluMTk',
    };
  }
  return undefined;
};

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
  }),
  traceExporter: new OTLPTraceExporter({
    url:
      process.env.NODE_ENV === 'production'
        ? 'https://otlp-gateway-prod-sa-east-1.grafana.net/otlp'
        : process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: getHeaders(),
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
