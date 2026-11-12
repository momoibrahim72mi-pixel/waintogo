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
| http://localhost:3000 | Sito pubblico (home, catalogo, pagina del viaggio, iscrizione) |
| http://localhost:8080 | Gestionale (cruscotto, viaggi, partenze, iscritti e pagamenti) |
| http://localhost:3001/health | API |

Si ferma tutto con `Ctrl+C`, oppure con `docker compose down`.
I dati del database restano nel volume `dbdata`. Per cancellarli c'è `docker compose down -v`.

### 2. Modalità sviluppo (ricarica automatica)

```bash
pnpm install
docker compose up db -d   # solo il database, in background
pnpm dev                  # sito, gestionale e API con ricarica automatica
```

Quando salvi un file, l'app si aggiorna da sola. Il sito è su http://localhost:3000, il gestionale in sviluppo su http://localhost:5173.
Al primo avvio l'API crea da sola le tabelle (applica le migrazioni).

## Dati di esempio

Con il database vuoto sito e gestionale non mostrano niente. Per riempirlo:

```bash
pnpm --filter @waintogo/api esempi
```

Crea 4 viaggi pubblicati (Islanda, Marocco, Giappone, Algarve) con le loro partenze, e 11 iscritti sulla prima partenza del Marocco, con pagamenti in stati diversi. Se nel database ci sono già dei viaggi non fa niente, quindi non può rovinare dati veri. Con docker compose lo stesso comando si lancia dentro il container dell'API:

```bash
docker compose exec api node dist/esempi.js
```

## Cosa provare

1. Sul **sito** apri un viaggio, scegli una partenza e premi "Chiedi il posto". Alla fine ricevi un codice come `WTG-7KQ3PA` e le istruzioni di pagamento.
2. Nel **gestionale**, sul cruscotto, la persona appare in "Richieste da confermare". Cliccala, apri "Pagamenti" e registra l'acconto: l'iscrizione diventa confermata da sola.
3. Riempi una partenza: chi chiede dopo finisce in lista d'attesa, e sul sito la partenza appare "Completa".

## Provare la webapp per telefono

La webapp è su `/webapp` del gestionale: http://localhost:8080/webapp con Docker, http://localhost:5173/webapp con `pnpm dev`.

- **Dal computer**: in Chrome apri gli strumenti per sviluppatori (`F12`) e premi l'icona del telefono ("Toggle device toolbar", `Ctrl+Shift+M`). Scegli un telefono, per esempio iPhone 13, e ricarica la pagina.
- **Installazione e funzionamento senza rete**: si provano solo con la versione compilata (Docker, oppure `pnpm --filter @waintogo/gestionale build` e poi `pnpm --filter @waintogo/gestionale exec vite preview`), perché in sviluppo il service worker è spento (D23). In Chrome, strumenti per sviluppatori → scheda **Application** → *Manifest* e *Service workers*.
- **Da un telefono vero**: il telefono deve raggiungere il server. Con il cluster su OCI basterà aprire l'indirizzo del gestionale e aggiungere `/webapp`, poi dal menu del browser "Aggiungi a schermata Home" (su iPhone da Safari, pulsante Condividi). L'installazione richiede HTTPS, che avremo con il dominio e cert-manager.

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
| `pnpm --filter @waintogo/api esempi` | Riempie il database di sviluppo con viaggi di esempio, se è vuoto |
| `docker build -f apps/api/Dockerfile .` | Costruisce l'immagine di una app (dalla radice del repo) |

## Struttura dei file

```
waintogo/
├── apps/
│   ├── api/            src/server.ts avvia; src/viaggi, partenze, iscrizioni, pubblico, cruscotto: rotte e accesso ai dati; test/ i test
│   ├── sito/           app/ le pagine (ogni cartella = un indirizzo), components/ i pezzi riusati, lib/ chiamate all'API e formati
│   └── gestionale/     src/pagine/ le pagine per computer, src/webapp/ la webapp per telefono, src/componenti/ i pezzi riusati,
│                       src/api.ts le chiamate all'API, public/ manifest, icone e service worker, nginx.conf il server
├── packages/
│   ├── shared/         regole di validità e tipi, usati da API, sito e gestionale
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
- **Il sito dice "Non riesco a caricare i viaggi"**: l'API non risponde all'indirizzo `API_URL` (in sviluppo `http://localhost:3001`). Controlla che sia accesa.
- **Il sito è vuoto**: non ci sono viaggi pubblicati. Pubblicane uno dal gestionale o lancia i dati di esempio.
