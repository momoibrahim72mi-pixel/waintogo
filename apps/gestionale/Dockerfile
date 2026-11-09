# Immagine del gestionale. Si costruisce dalla radice del repo:
#   docker build -f apps/gestionale/Dockerfile .
# Il gestionale, una volta compilato, è solo HTML + JS + CSS: basta nginx per servirlo.

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @waintogo/gestionale...
RUN pnpm --filter @waintogo/gestionale build

# Versione di nginx che non gira come root (ascolta sulla porta 8080).
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY apps/gestionale/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/gestionale/dist /usr/share/nginx/html
EXPOSE 8080
