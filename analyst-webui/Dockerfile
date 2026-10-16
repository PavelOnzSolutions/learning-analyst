# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_WS_URL=/ws
ARG VITE_BRAND="Pavel Onz"
ARG VITE_PROD=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_BRAND=$VITE_BRAND \
    VITE_PROD=$VITE_PROD

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
