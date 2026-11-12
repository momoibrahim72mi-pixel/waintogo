# Roadmap dell'MVP

| # | Tappa | Stato |
|---|---|---|
| 1 | Scheletro del monorepo, Docker, avvio in locale, CI | ✅ PR #1 |
| 2 | Database (Drizzle) e API dei viaggi, gestionale per creare e pubblicare viaggi | ✅ PR #2 |
| 3 | **Concept v1**: partenze, sito pubblico con catalogo e richiesta di iscrizione, gestionale con cruscotto, iscritti e pagamenti manuali | ✅ PR #3 |
| 3b | Webapp del gestionale per telefono, sotto `/webapp`, installabile | ✅ PR #4 |
| 4 | Login e ruoli nel gestionale (indispensabile prima di metterlo online) | ⏳ prossima |
| 5 | Email automatiche: conferma della richiesta con i dati per bonifico/Revolut, conferma pagamento, promemoria del saldo | |
| 6 | Conti nel gestionale: spese e margine per partenza | |

La lista completa delle idee per il gestionale, in ordine di utilità, è in [concept.md](concept.md).

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

## Tappa 3 (concept v1) – cosa è stato fatto

Il concept completo è in [concept.md](concept.md). In pratica:

- **Modello dati**: il viaggio è la scheda del catalogo; date, prezzi e posti stanno nelle **partenze** (un viaggio può partire più volte). Nuove tabelle `partenze`, `iscrizioni`, `pagamenti`. La migrazione `0001` sposta i viaggi esistenti nelle partenze senza perdere dati.
- **Sito pubblico** (Next.js): home, catalogo con filtri (stile, mese, durata, prezzo), pagina del viaggio (in breve, itinerario, incluso/non incluso, partenze con etichette "garantita", "ultimi posti", "completo"), richiesta di iscrizione con codice di prenotazione e istruzioni di pagamento, pagina "Come funziona" con le domande frequenti.
- **API**: rotte pubbliche `/pubblico/*` per il sito, rotte per partenze, iscrizioni, pagamenti e cruscotto. L'ultimo posto non può essere preso da due persone insieme (blocco `FOR UPDATE`, vedi D16).
- **Gestionale**: cruscotto con le cose da fare, viaggi con tutti i campi nuovi, partenze dentro ogni viaggio, pagina degli iscritti con pagamenti, iscrizione a mano ed esportazione CSV.
- **Dati di esempio**: `pnpm --filter @waintogo/api esempi` crea 4 viaggi e qualche iscritto (vedi [sviluppo.md](sviluppo.md)).
- **Test**: 11 sulle regole condivise, 22 sulle API (compreso il test dell'ultimo posto conteso). Prova completa nel browser di sito e gestionale, da computer e da telefono.

## Tappa 3b (webapp per telefono) – cosa è stato fatto

- Il gestionale ha ora due interfacce: la **versione completa** (`/`) e la **webapp per telefono** (`/webapp`). Stesso codice, stessa API, stessi dati (decisione D22).
- Schermate della webapp: **Oggi** (prossima partenza e cose da fare), **Partenze**, **iscritti di una partenza** con filtri, contatti (chiama, WhatsApp, email), registrazione veloce di un pagamento e cambio di stato.
- **Installabile** (PWA): manifest, icone e un service worker che salva solo i file dell'app, mai i dati (D23). Controllato con gli strumenti di Chrome: nessun errore di installabilità.
- Verifica: prova completa con Playwright su un iPhone simulato, anche senza rete, e immagine Docker con nginx.

> ⚠️ Il gestionale **non ha ancora il login** (arriva nella tappa 4): non va messo online prima di allora.
