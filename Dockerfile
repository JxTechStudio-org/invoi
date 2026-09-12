# Stage: Frontend build
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage: Backend build
FROM node:22-alpine AS backend-build

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate && npm run build

# Stage: Application runtime
FROM node:22-alpine

WORKDIR /app/backend

ENV NODE_ENV=production
EXPOSE 3000

COPY --from=backend-build /app/backend/package*.json ./
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
# Jenkins runs TypeScript E2E tests against the application source with ts-jest.
COPY --from=backend-build /app/backend/test ./test
COPY --from=backend-build /app/backend/src ./src
COPY --from=backend-build /app/backend/tsconfig.json ./tsconfig.json
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

RUN mkdir -p /app/backend/uploads && chown -R node:node /app

USER node
CMD ["sh", "-c", "npm run prisma:migrate:deploy && npm run start:prod"]
