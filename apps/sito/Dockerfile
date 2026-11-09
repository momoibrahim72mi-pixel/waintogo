# Immagine del sito pubblico (Next.js). Si costruisce dalla radice del repo:
#   docker build -f apps/sito/Dockerfile .

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @waintogo/sito...
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @waintogo/sito build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# Grazie a output: "standalone", Next ha già preparato un server minimo con le sue dipendenze.
COPY --from=build /repo/apps/sito/.next/standalone ./
# I file statici (CSS, JS del browser) vanno copiati a parte, accanto al server.
COPY --from=build /repo/apps/sito/.next/static ./apps/sito/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/sito/server.js"]
