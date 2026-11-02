# Stage: Frontend build
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage: Backend build
FROM node:22-alpine AS backend-build

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate && npm run build

# Drop files the runtime never loads: the QR reader uses only the pdf.js legacy build and its
# WASM decoders, and on Alpine only the musl build of @napi-rs/canvas.
RUN rm -rf node_modules/pdfjs-dist/build node_modules/pdfjs-dist/web node_modules/pdfjs-dist/types \
      node_modules/pdfjs-dist/image_decoders node_modules/pdfjs-dist/legacy/web \
      node_modules/pdfjs-dist/legacy/image_decoders node_modules/@napi-rs/canvas-linux-x64-gnu \
  && find node_modules/pdfjs-dist -name '*.map' -delete

# Stage: Application runtime
FROM node:22-alpine

WORKDIR /app/backend

ENV NODE_ENV=production
EXPOSE 3000

# Set ownership while copying: a later `chown -R` would store every file a second time.
COPY --chown=node:node --from=backend-build /app/backend/package*.json ./
COPY --chown=node:node --from=backend-build /app/backend/node_modules ./node_modules
COPY --chown=node:node --from=backend-build /app/backend/dist ./dist
COPY --chown=node:node --from=backend-build /app/backend/prisma ./prisma
# Jenkins runs TypeScript E2E tests against the application source with ts-jest.
COPY --chown=node:node --from=backend-build /app/backend/test ./test
COPY --chown=node:node --from=backend-build /app/backend/src ./src
COPY --chown=node:node --from=backend-build /app/backend/tsconfig.json ./tsconfig.json
COPY --chown=node:node --from=frontend-build /app/frontend/dist /app/frontend/dist

RUN mkdir -p /app/backend/uploads && chown node:node /app /app/backend /app/backend/uploads /app/frontend

USER node
CMD ["sh", "-c", "npm run prisma:migrate:deploy && npm run start:prod"]
