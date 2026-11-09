# waintogo

Sito per viaggi di gruppo e gestionale per gli organizzatori.

## Com'è fatto il progetto

È un **monorepo**: un solo repository che contiene più applicazioni.
Lo gestiamo con **pnpm** (installa le dipendenze, condividendole tra le app)
e **Turborepo** (lancia build e controlli su tutte le app, in parallelo e con cache).

```
apps/
  sito/         Sito pubblico (Next.js). Pagine generate sul server, buone per Google.
  gestionale/   App per gli organizzatori (React + Vite). Diventa file statici serviti da nginx.
  api/          Backend (Fastify). Parla con il database PostgreSQL.
packages/       Codice condiviso tra le app (arriva nella tappa 2: schema del database e tipi).
docker-compose.yml   Avvia tutto in locale, database compreso.
```

Ogni app ha il suo `Dockerfile` e diventa un container separato.
Tutte le immagini base (node, nginx, postgres) esistono anche per ARM64,
quindi girano sui nodi Ampere di Oracle Cloud.

### Quanta memoria usano

Misurato in locale, a riposo:

| Container   | RAM     |
|-------------|---------|
| gestionale  | ~5 MB   |
| api         | ~20 MB  |
| sito        | ~35 MB  |
| postgres    | ~30 MB  |

Il gestionale è separato dal sito proprio per questo: una volta compilato è
solo HTML e JavaScript, e nginx lo serve con pochissima memoria.

## Avviare in locale

### Con Docker (il modo più semplice)

```bash
cp .env.example .env        # poi cambia la password
docker compose up --build
```

- Sito pubblico: http://localhost:3000
- Gestionale: http://localhost:8080 (mostra "Stato API: ok" se l'API risponde)
- API: http://localhost:3001/health

### Senza Docker (per sviluppare, con ricarica automatica)

Serve Node.js 22 e pnpm (`corepack enable` lo attiva).

```bash
pnpm install
pnpm dev
```

## Comandi utili

| Comando          | Cosa fa                                 |
|------------------|-----------------------------------------|
| `pnpm dev`       | Avvia tutte le app in modalità sviluppo |
| `pnpm build`     | Compila tutte le app                    |
| `pnpm typecheck` | Controlla gli errori di TypeScript      |

## Documentazione

Tutta la documentazione, in italiano, è nella cartella [`docs/`](docs/README.md): architettura, decisioni tecniche, sviluppo, modello dati, roadmap e procedure.
