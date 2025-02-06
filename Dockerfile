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
ENV GRAFANA_LOKI_TOKEN=${GRAFANA_LOKI_TOKEN}
ENV GRAFANA_LOKI_USER=${GRAFANA_LOKI_USER}

CMD ["npm", "run", "start:prod"]
