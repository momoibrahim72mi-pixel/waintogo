# Immagine dell'API. Si costruisce dalla radice del repo:
#   docker build -f apps/api/Dockerfile .
# È "multi-stage": la prima fase compila, la seconda contiene solo ciò che serve per girare.
# node:22-alpine esiste sia per amd64 (il tuo PC) sia per arm64 (i nodi Ampere di OCI).

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
# Installa solo le dipendenze dell'API (e dei pacchetti interni che usa), poi compila.
RUN pnpm install --frozen-lockfile --filter @waintogo/api...
RUN pnpm --filter @waintogo/api build
# "deploy" copia l'API in /out con le sole dipendenze di produzione.
RUN pnpm --filter @waintogo/api deploy --legacy --prod /out

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY --from=build /out .
# Non giriamo come root: se qualcuno buca l'app, ha meno permessi.
USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]
