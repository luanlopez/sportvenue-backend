FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app .

RUN npm install

ENV NODE_ENV=production

# OpenTelemetry
ENV OTEL_SERVICE_NAME=sportvenue-backend
ENV OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production,service.namespace=development,service.version=1.0.0,service.instance.id=sportvenue-backend-01
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc

# Grafana Cloud OpenTelemetry
ENV GRAFANA_CLOUD_INSTANCE_ID=1157269
ENV GRAFANA_CLOUD_API_KEY=glc_eyJvIjoiMTMzNjAxMiIsIm4iOiJzdGFjay0xMTU3MjY5LWludGVncmF0aW9uLXNwb3J0bWFwLWJhY2tlbmQiLCJrIjoiVDhxUTgxRThjNm85TE5GajFVbTMzVzBRIiwibSI6eyJyIjoicHJvZC1zYS1lYXN0LTEifX0=
ENV GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-sa-east-1.grafana.net/otlp

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
