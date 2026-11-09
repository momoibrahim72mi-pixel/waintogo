# Architettura

## Le parti del sistema

```
                    Internet
                       │
              ┌────────┴─────────┐
              │  Ingress (HTTPS)  │   instrada in base all'indirizzo
              └──┬────────────┬──┘
                 │            │
   waintogo.it   │            │  admin.waintogo.it
                 ▼            ▼
          ┌──────────┐  ┌──────────────┐
          │   sito   │  │  gestionale  │  nginx: file statici + /api → api
          │ Next.js  │  │ React (Vite) │
          └────┬─────┘  └──────┬───────┘
               │   HTTP        │  HTTP
               ▼               ▼
              ┌─────────────────┐
              │       api       │  Fastify
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              └─────────────────┘
```

I nomi di dominio sono esempi: il dominio vero lo sceglie Mohamed.

| Parte | Cartella | Cosa fa | Porta |
|---|---|---|---|
| **sito** | `apps/sito` | Il sito pubblico: elenco viaggi, pagina del viaggio, iscrizione. Le pagine sono generate sul server (SSR), così i motori di ricerca le leggono complete. | 3000 |
| **gestionale** | `apps/gestionale` | L'app per gli organizzatori: viaggi, iscritti, pagamenti, spese. È una "single page app": dopo la compilazione è solo HTML/JS/CSS servito da nginx. | 8080 |
| **api** | `apps/api` | Il backend. È l'unica parte che parla con il database, e sia il sito sia il gestionale passano da lei. | 3001 |
| **db** | – | PostgreSQL. In locale gira con docker compose, nel cluster con CloudNativePG. | 5432 |

### Perché l'API è separata

Mettere la logica in un solo posto significa che le regole (per esempio "non si possono superare i posti disponibili") sono scritte una volta sola, e sito e gestionale non possono contraddirsi.

### Come il gestionale raggiunge l'API

Il gestionale chiama sempre indirizzi relativi come `/api/health`.
- **In sviluppo** (`pnpm dev`) il server di Vite gira queste chiamate a `http://localhost:3001` (vedi `apps/gestionale/vite.config.ts`).
- **Nei container** nginx gira `/api/...` al servizio `api` sulla porta 3001 (vedi `apps/gestionale/nginx.conf`). Il nome `api` funziona sia in docker compose sia in Kubernetes, dove sarà il nome del Service.

Così il codice del gestionale è identico in ogni ambiente.

## Dove gira

L'infrastruttura la costruisce Mohamed (thread infrastruttura). In sintesi:

- **Kubernetes su Oracle Cloud (OKE)** con nodi ARM Ampere A1 del piano gratuito.
- Ogni app è un **container** separato. Le immagini base (node, nginx, postgres) esistono sia per amd64 sia per arm64.
- **GitHub Actions** costruisce e verifica il codice. Più avanti costruirà anche le immagini e le pubblicherà nel registry di OCI.
- **Argo CD** applica al cluster quello che c'è nel repo dei manifest (GitOps).

## Memoria usata

Misurata in locale, a riposo, con la tappa 1:

| Container | RAM |
|---|---|
| gestionale | ~5 MB |
| api | ~20 MB |
| sito | ~35 MB |
| postgres | ~30 MB |

Il cluster gratuito ha 24 GB, quindi c'è molto margine. Il gestionale è separato dal sito anche per questo motivo (vedi [decisioni.md](decisioni.md), D4).
