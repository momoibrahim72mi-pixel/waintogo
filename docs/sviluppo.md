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
`.env.example` invece è su git e mostra quali variabili servono.

## Due modi di avviare il progetto

### 1. Tutto in container (come in produzione)

```bash
docker compose up --build
```

| Indirizzo | Cosa trovi |
|---|---|
| http://localhost:3000 | Sito pubblico |
| http://localhost:8080 | Gestionale (deve mostrare "Stato API: ok") |
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

## Comandi

| Comando | Cosa fa |
|---|---|
| `pnpm dev` | Avvia tutte le app in modalità sviluppo |
| `pnpm build` | Compila tutte le app |
| `pnpm typecheck` | Controlla gli errori di TypeScript senza compilare |
| `pnpm --filter @waintogo/api dev` | Avvia una sola app (qui l'API) |
| `docker build -f apps/api/Dockerfile .` | Costruisce l'immagine di una app (dalla radice del repo) |

## Struttura dei file

```
waintogo/
├── apps/
│   ├── api/            src/server.ts è il punto di ingresso
│   ├── sito/           app/ contiene le pagine (ogni cartella = un indirizzo)
│   └── gestionale/     src/ contiene i componenti React, nginx.conf la config del server
├── packages/           codice condiviso (dalla tappa 2)
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
- **Il gestionale mostra "Stato API: non raggiungibile"**: l'API non è partita. Guarda i log con `docker compose logs api`.
