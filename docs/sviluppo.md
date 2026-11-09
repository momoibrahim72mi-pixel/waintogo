# Sviluppo in locale

## Cosa serve sul computer

- **Node.js 22** (la versione è scritta in `.nvmrc`)
- **pnpm**: si attiva con `corepack enable`, che è già incluso in Node
- **Docker Desktop** (o Docker Engine) per i container e per Postgres

## Primo avvio

```bash
git clone https://github.com/momoibrahim72mi-pixel/waintogo.git
cd waintogo
cp .env.example .env      # poi cambia la password in .env
```

`.env` contiene le password e **non va mai messo su git**, infatti è in `.gitignore`.
Dentro c'è anche `DATABASE_URL`, l'indirizzo del database usato dall'API quando la avvii con `pnpm dev`.
`.env.example` invece è su git e mostra quali variabili servono.

## Due modi di avviare il progetto

### 1. Tutto in container (come in produzione)

```bash
docker compose up --build
```

| Indirizzo | Cosa trovi |
|---|---|
| http://localhost:3000 | Sito pubblico |
| http://localhost:8080 | Gestionale (elenco viaggi, crea e pubblica) |
| http://localhost:3001/health | API |

Si ferma tutto con `Ctrl+C`, oppure con `docker compose down`.
I dati del database restano nel volume `dbdata`. Per cancellarli c'è `docker compose down -v`.

### 2. Modalità sviluppo (ricarica automatica)

```bash
pnpm install
docker compose up db -d   # solo il database, in background
pnpm dev                  # sito, gestionale e API con ricarica automatica
```

Quando salvi un file, l'app si aggiorna da sola. Il gestionale in sviluppo è su http://localhost:5173.
Al primo avvio l'API crea da sola le tabelle (applica le migrazioni).

## Test

```bash
docker compose up db -d   # i test dell'API hanno bisogno di Postgres
pnpm test
```

I test dell'API usano un database **separato**, `waintogo_test`, creato in automatico: i dati che usi in sviluppo non vengono toccati. I test sono in `apps/api/test/` e `packages/shared/src/*.test.ts`.

## Comandi

| Comando | Cosa fa |
|---|---|
| `pnpm dev` | Avvia tutte le app in modalità sviluppo |
| `pnpm build` | Compila tutte le app |
| `pnpm typecheck` | Controlla gli errori di TypeScript senza compilare |
| `pnpm --filter @waintogo/api dev` | Avvia una sola app (qui l'API) |
| `pnpm test` | Esegue tutti i test |
| `pnpm --filter @waintogo/db genera-migrazione --name <nome>` | Crea una migrazione dopo aver cambiato lo schema (vedi [modello-dati.md](modello-dati.md)) |
| `docker build -f apps/api/Dockerfile .` | Costruisce l'immagine di una app (dalla radice del repo) |

## Struttura dei file

```
waintogo/
├── apps/
│   ├── api/            src/server.ts avvia, src/viaggi/ contiene rotte e accesso ai dati, test/ i test
│   ├── sito/           app/ contiene le pagine (ogni cartella = un indirizzo)
│   └── gestionale/     src/pagine/ le pagine, src/api.ts le chiamate all'API, nginx.conf il server
├── packages/
│   ├── shared/         regole di validità e tipi, usati da API e gestionale
│   └── db/             schema delle tabelle (src/schema.ts) e migrazioni (drizzle/)
├── docs/               questa documentazione
├── .github/workflows/  la CI di GitHub Actions
├── docker-compose.yml  tutto lo stack in locale
├── package.json        script comuni e strumenti (turbo, typescript)
├── pnpm-workspace.yaml dice a pnpm dove sono le app
├── turbo.json          dice a Turborepo come lanciare build/dev/typecheck
└── tsconfig.base.json  impostazioni TypeScript comuni a tutte le app
```

## Problemi frequenti

- **`port is already allocated`**: un altro programma usa la porta. Fermalo, oppure cambia la porta a sinistra in `docker-compose.yml` (per esempio `"3002:3001"`).
- **Il gestionale dice "Non riesco a contattare l'API"**: l'API non è partita. Guarda i log con `docker compose logs api`.
- **I test dell'API falliscono con `ECONNREFUSED`**: Postgres non è acceso. Avvialo con `docker compose up db -d`.
- **`Cannot find module '@waintogo/shared'`**: i pacchetti condivisi non sono compilati. Lancia `pnpm build` una volta (con `pnpm dev` e `pnpm test` succede da solo).
