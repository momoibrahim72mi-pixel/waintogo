# Roadmap dell'MVP

| # | Tappa | Stato |
|---|---|---|
| 1 | Scheletro del monorepo, Docker, avvio in locale, CI | ✅ PR #1 |
| 2 | Database (Drizzle) e API dei viaggi, gestionale per creare e pubblicare viaggi | ✅ PR #2 |
| 3 | Sito pubblico: elenco viaggi e pagina del viaggio | ⏳ prossima |
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

## Tappa 2 – cosa è stato fatto

- **`packages/db`**: tabelle `viaggi` e `tappe_itinerario` con Drizzle, la prima migrazione (`drizzle/0000_viaggi.sql`) e le funzioni per collegarsi e migrare.
- **`packages/shared`**: le regole di un viaggio valido (Zod), la regola "cosa manca per pubblicare" e le conversioni euro ↔ centesimi.
- **API**: sette rotte per i viaggi (elenco, dettaglio, crea, modifica, pubblica, ritira, elimina), con errori chiari campo per campo.
- **Gestionale**: elenco dei viaggi, modulo con itinerario, pulsanti Pubblica, Riporta in bozza ed Elimina. Il pulsante Pubblica dice cosa manca.
- **Test**: 6 sulle regole condivise e 9 sulle API, su un Postgres vero (`waintogo_test`). La CI ora accende un Postgres e li esegue a ogni PR.
- **Verifica**: flusso completo nel browser (crea, errori, completa, pubblica) e nei container, con le migrazioni applicate all'avvio.

> ⚠️ Il gestionale **non ha ancora il login** (arriva nella tappa 4): non va messo online prima di allora.
