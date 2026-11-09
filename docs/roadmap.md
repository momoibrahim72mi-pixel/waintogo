# Roadmap dell'MVP

| # | Tappa | Stato |
|---|---|---|
| 1 | Scheletro del monorepo, Docker, avvio in locale, CI | ✅ PR #1 |
| 2 | Database (Drizzle) e API dei viaggi, gestionale per creare e pubblicare viaggi | ⏳ prossima |
| 3 | Sito pubblico: elenco viaggi e pagina del viaggio | |
| 4 | Registrazione, login e iscrizione a un viaggio | |
| 5 | Email di conferma con i dati per bonifico/Revolut, registrazione manuale dei pagamenti nel gestionale | |
| 6 | Conti nel gestionale: incassi, spese e margine per viaggio | |

Dopo l'MVP: immagini su Object Storage, costruzione delle immagini ARM64 in CI e invio al registry OCI, eventuali pagamenti online.

## Tappa 1 – cosa è stato fatto

- Monorepo pnpm + Turborepo con tre app TypeScript: `sito`, `gestionale`, `api`.
- Un endpoint `/health` sull'API e sul sito, che Kubernetes userà per sapere se i container sono vivi. Sul gestionale c'è `/healthz` in nginx.
- Il gestionale chiama l'API e mostra se risponde, per provare che le due parti si parlano.
- Un Dockerfile per ogni app, in due fasi e senza root, e `docker-compose.yml` con Postgres 17.
- Una CI su GitHub Actions che controlla i tipi e compila tutto a ogni push e PR.
- Verifica: le tre immagini costruite e avviate insieme a Postgres, tutte rispondono.
