# Decisioni tecniche

Ogni decisione ha: cosa abbiamo scelto, perché e cosa abbiamo scartato.
Se una decisione cambia, non si cancella: si aggiunge una nuova voce che la sostituisce.

---

### D1 – Un solo linguaggio: TypeScript
*2026-11-09 · confermata da Mohamed*

**Scelta:** TypeScript per sito, gestionale e API.
**Perché:** si impara un linguaggio solo. I tipi (per esempio "com'è fatto un viaggio") si scrivono una volta e si usano ovunque, e TypeScript segnala molti errori prima di eseguire il codice.
**Scartate:** Python/Django o Go per l'API, che avrebbero significato due linguaggi e tipi duplicati.

### D2 – Monorepo con pnpm e Turborepo
*2026-11-09*

**Scelta:** un solo repository (`waintogo`) con tutte le app in `apps/` e il codice condiviso in `packages/`.
**Perché:** una modifica che tocca API e gestionale finisce in una sola pull request. pnpm installa le dipendenze una volta e le condivide, mentre Turborepo lancia build e controlli su tutte le app insieme e non rifà quello che non è cambiato.
**Scartate:** un repo per app, che avrebbe reso più difficile tenere allineati i tipi condivisi.

### D3 – Sito pubblico con Next.js
*2026-11-09*

**Scelta:** Next.js con rendering sul server e `output: "standalone"`.
**Perché:** le pagine dei viaggi devono essere trovate su Google, e con l'SSR il motore di ricerca riceve l'HTML già completo. L'output standalone produce un server minimo, quindi l'immagine Docker resta piccola.

### D4 – Gestionale con React + Vite servito da nginx, separato dal sito
*2026-11-09*

**Scelta:** il gestionale è un'app React a parte, compilata in file statici e servita da nginx.
**Perché:** non ha bisogno di SEO (sta dietro il login). Una volta compilato occupa circa 5 MB di RAM con nginx, il valore più basso possibile, cosa importante perché il cluster è gratuito.
**Scartata:** mettere il gestionale dentro Next.js sotto `/admin`. Sarebbe un container in meno, ma il processo Node del sito diventerebbe più pesante e un problema del gestionale potrebbe far cadere anche il sito pubblico.

### D5 – API con Fastify
*2026-11-09*

**Scelta:** Fastify.
**Perché:** è leggero e veloce, ha una buona integrazione con TypeScript e valida i dati in ingresso.
**Scartate:** NestJS, più pesante e con molti concetti da imparare all'inizio. Express è più vecchio e ha un supporto a TypeScript meno curato.

### D6 – Database PostgreSQL con Drizzle ORM
*2026-11-09 · Drizzle arriva nella tappa 2*

**Scelta:** PostgreSQL, con Drizzle per descrivere le tabelle in TypeScript e generare le migrazioni.
**Perché:** Postgres è affidabile e gratuito, e nel cluster lo gestisce CloudNativePG con i backup su Object Storage. Con Drizzle le query restano vicine all'SQL vero, così si impara anche l'SQL.

### D7 – Container leggeri, multi-architettura e senza root
*2026-11-09*

**Scelta:** Dockerfile in due fasi (compilazione e immagine finale), immagini base `node:22-alpine` e `nginx-unprivileged`, processi che non girano come root.
**Perché:** le immagini restano piccole, funzionano sia sul PC (amd64) sia su OCI (arm64), e se qualcuno sfruttasse un bug avrebbe meno permessi.

### D8 – Pagamenti manuali, niente Stripe per ora
*2026-11-09 · decisa da Mohamed*

**Scelta:** pagamenti con bonifico o Revolut. Chi si iscrive riceve i dati per email, l'organizzatore registra a mano i pagamenti ricevuti nel gestionale, e lo stato (da pagare, acconto, saldato) viene calcolato.
**Perché:** si parte senza costi né burocrazia. I pagamenti online si potranno aggiungere più avanti senza cambiare il modello dati.

### D9 – Regole di validità scritte una volta sola, con Zod
*2026-11-09 · tappa 2*

**Scelta:** le regole di un viaggio valido stanno in `packages/shared`, scritte con Zod. Le usano sia l'API sia il gestionale.
**Perché:** il gestionale mostra gli errori subito, accanto al campo, senza aspettare il server. L'API rifiuta comunque i dati sbagliati, anche se arrivano da altrove: non ci si fida mai di quello che arriva dal browser. Le regole sono identiche nei due posti perché sono lo stesso codice. Zod genera anche i tipi TypeScript, quindi non vanno riscritti.

### D10 – Le migrazioni si applicano all'avvio dell'API
*2026-11-09 · tappa 2*

**Scelta:** quando parte, l'API applica le migrazioni mancanti (`applicaMigrazioni` in `packages/db`).
**Perché:** è il modo più semplice con una sola copia dell'API: non serve un passo separato e il database è sempre allineato al codice.
**Quando cambiarla:** se un giorno gireranno più copie dell'API, partirebbero tutte insieme provando a migrare. A quel punto si sposta il passo in un Job di Kubernetes che gira prima del deploy.

### D11 – Lo slug di un viaggio non cambia
*2026-11-09 · tappa 2*

**Scelta:** l'indirizzo del viaggio (`/viaggi/islanda-agosto-2027`) si genera alla creazione e resta fisso anche se si cambia il titolo.
**Perché:** i link condivisi su WhatsApp o sui social continuano a funzionare, e Google non perde la pagina.

### D12 – API con "sostituisci tutto" (PUT) per i viaggi
*2026-11-09 · tappa 2*

**Scelta:** per modificare un viaggio, il gestionale manda il viaggio intero, itinerario compreso (`PUT /viaggi/:id`), e l'API lo sostituisce in una transazione.
**Perché:** il modulo ha già tutti i dati, quindi è più semplice e senza casi strani di "modifiche parziali".
**Scartata:** `PATCH` con i soli campi cambiati, più efficiente ma con più logica da scrivere e da testare. Nella spiegazione della tappa avevo indicato PATCH: ho cambiato idea scrivendo il codice per questo motivo.

### D13 – Navigazione del gestionale con React Router
*2026-11-09 · tappa 2*

**Scelta:** React Router in modalità semplice (`<BrowserRouter>` + `<Routes>`), con dati caricati dentro le pagine.
**Perché:** è lo standard per le app React, e ogni pagina ha il suo indirizzo, quindi si può aggiornare o condividere. nginx rimanda ogni indirizzo a `index.html` (vedi `nginx.conf`) e poi è React Router a scegliere la pagina.
