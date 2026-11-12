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
| **sito** | `apps/sito` | Il sito pubblico: una home in una pagina (prossimo viaggio, cosa facciamo, viaggi passati, chi siamo, FAQ, contatti), la pagina del viaggio e la richiesta di iscrizione. Le pagine sono generate sul server (SSR), così i motori di ricerca le leggono complete. | 3000 |
| **gestionale** | `apps/gestionale` | L'app per gli organizzatori: cruscotto, viaggi e partenze, iscritti, pagamenti. È una "single page app": dopo la compilazione è solo HTML/JS/CSS servito da nginx. | 8080 |
| **api** | `apps/api` | Il backend. È l'unica parte che parla con il database, e sia il sito sia il gestionale passano da lei. | 3001 |
| **db** | – | PostgreSQL. In locale gira con docker compose, nel cluster con CloudNativePG. | 5432 |

### Il codice condiviso (`packages/`)

| Pacchetto | Cosa contiene | Chi lo usa |
|---|---|---|
| `@waintogo/shared` | Regole di validità (Zod), tipi, conversioni euro ↔ centesimi, etichette degli stati | API, sito e gestionale |
| `@waintogo/db` | Schema delle tabelle, migrazioni, connessione | solo l'API |

Solo l'API importa `@waintogo/db`: gli altri non possono toccare il database nemmeno per sbaglio.

### Le API

**Rotte pubbliche**, usate solo dal server del sito (D19). Mostrano solo viaggi pubblicati e partenze future non annullate:

| Metodo e indirizzo | Cosa fa |
|---|---|
| `GET /pubblico/viaggi` | Viaggi pubblicati con le partenze prenotabili e il prezzo "da" (la home ne usa il più vicino come "prossimo viaggio") |
| `GET /pubblico/viaggi-passati` | Viaggi già fatti, dal più recente: titolo, destinazione, foto, date. Niente prezzi né iscritti |
| `GET /pubblico/viaggi/:slug` | La scheda completa di un viaggio, con itinerario e partenze |
| `POST /pubblico/iscrizioni` | Richiesta di iscrizione dal sito; risponde con codice, stato e istruzioni di pagamento |

**Rotte del gestionale** (ancora senza login, vedi tappa 4):

| Metodo e indirizzo | Cosa fa |
|---|---|
| `GET /health` | Controllo di salute |
| `GET /cruscotto` | Prossime partenze e cose da fare |
| `GET /viaggi` | Elenco dei viaggi, con le loro partenze |
| `GET /viaggi/:id` | Un viaggio con itinerario e partenze |
| `POST /viaggi` | Crea un viaggio (come bozza) |
| `PUT /viaggi/:id` | Sostituisce i dati di un viaggio |
| `POST /viaggi/:id/pubblica` | Pubblica, solo se il viaggio è completo |
| `POST /viaggi/:id/ritira` | Riporta un viaggio pubblicato in bozza |
| `DELETE /viaggi/:id` | Elimina, solo le bozze senza partenze |
| `POST /viaggi/:id/partenze` | Aggiunge una partenza |
| `GET /partenze/:id` | Una partenza con iscritti e pagamenti |
| `PUT /partenze/:id` | Modifica una partenza (i posti non possono scendere sotto gli occupati) |
| `POST /partenze/:id/annulla`, `/riattiva` | Annulla o riattiva una partenza |
| `DELETE /partenze/:id` | Elimina, solo se non ha iscrizioni né spese |
| `POST /partenze/:id/iscrizioni` | Aggiunge un iscritto a mano |
| `POST /iscrizioni/:id/stato` | Cambia stato: conferma, lista d'attesa, annulla, ripristina |
| `POST /iscrizioni/:id/pagamenti` | Registra un pagamento ricevuto |
| `DELETE /pagamenti/:id` | Elimina un pagamento registrato per sbaglio |
| `GET /spese` | Tutte le spese; `?partenza=<id>` quelle di una partenza, `?partenza=generali` quelle senza partenza |
| `POST /spese` | Registra una spesa |
| `PUT /spese/:id` | Modifica una spesa (anche per segnarla pagata) |
| `DELETE /spese/:id` | Elimina una spesa registrata per sbaglio |
| `GET /conti?anno=2026` | Saldo, da pagare e da incassare, entrate e uscite mese per mese, margine di ogni partenza dell'anno |

Le rotte che cambiano una partenza, i suoi iscritti o i pagamenti rispondono con la partenza aggiornata: così il gestionale ridisegna la pagina senza una seconda richiesta.

Le risposte di errore hanno sempre `errore` (il messaggio), più `campi` per i dati non validi (400) o `problemi` per le operazioni non permesse (409).

Dentro l'API il codice è diviso in tre livelli:
- `server.ts` legge la configurazione, migra il database e avvia;
- `app.ts` costruisce l'app con le rotte (i test la usano senza avviare il server);
- per ogni argomento (`viaggi/`, `partenze/`, `iscrizioni/`, `pubblico/`, `cruscotto/`) c'è un `rotte.ts` che riceve le richieste e controlla i dati, e un `archivio.ts` che legge e scrive nel database. `partenze/calcoli.ts` calcola posti liberi e "garantita".

### Perché l'API è separata

Mettere la logica in un solo posto significa che le regole (per esempio "non si possono superare i posti disponibili") sono scritte una volta sola, e sito e gestionale non possono contraddirsi.

### Le due interfacce del gestionale

Il gestionale è **una sola app** con due interfacce, scelte in base all'indirizzo (vedi `apps/gestionale/src/App.tsx`):

```
admin.waintogo.it/            → versione completa (computer)   src/pagine/, src/componenti/
admin.waintogo.it/webapp/...  → webapp per telefono            src/webapp/
```

Entrambe usano lo stesso `src/api.ts`, le stesse regole di `@waintogo/shared` e gli stessi componenti per gli stati (`src/componenti/Stato.tsx`). Cambia solo come sono disegnate le pagine.

La webapp è una **PWA** (Progressive Web App): un sito che il telefono può installare come un'app. I file che servono sono in `apps/gestionale/public/`:

| File | A cosa serve |
|---|---|
| `webapp.webmanifest` | Nome, colori, icone e indirizzo di partenza (`/webapp`) dell'app installata |
| `icone/` | Icone per Android (192 e 512 px, più una "maskable" che Android ritaglia a cerchio o goccia) e per iPhone (`apple-touch-icon.png`) |
| `webapp-sw.js` | Il service worker: salva i file dell'app per aprirla subito anche con poca rete. Non salva mai le risposte di `/api` (D23) |

`index.html` collega il manifest **solo** sugli indirizzi `/webapp`, così la versione completa non propone di installarsi. nginx manda `index.html` e il service worker con `Cache-Control: no-cache`, per far arrivare subito ogni versione nuova, mentre i file in `/assets/` (che hanno un codice diverso nel nome a ogni versione) si tengono in memoria per un anno.

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

Misurata in locale, a riposo, con il concept v1 e i dati di esempio:

| Container | RAM |
|---|---|
| gestionale | ~6 MB |
| api | ~75 MB |
| sito | ~55 MB |
| postgres | ~40 MB |

Il cluster gratuito ha 24 GB, quindi c'è molto margine. Il gestionale è separato dal sito anche per questo motivo (vedi [decisioni.md](decisioni.md), D4).
