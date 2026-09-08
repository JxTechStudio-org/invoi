FROM node:22-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate && npm run build && mkdir -p /app/backend/uploads && chown -R node:node /app/backend

ENV NODE_ENV=production
EXPOSE 3000

USER node
CMD ["sh", "-c", "npm run prisma:migrate:deploy && npm run start:prod"]
