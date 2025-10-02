FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

CMD ["sh", "-c", "npm run db:push && npm run db:seed && npm run dev"]
