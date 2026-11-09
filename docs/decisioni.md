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
