#edit it
#this dockerfile for both frontend and backend build

# Stage: Frontend build
FROM node:20-alpine AS frontend-build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# Stage: Frontend serve
FROM nginx:alpine AS frontend-serve

COPY --from=frontend-build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
