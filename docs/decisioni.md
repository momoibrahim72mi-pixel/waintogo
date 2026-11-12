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

### D14 – Il viaggio è la scheda, le date sono "partenze"
*2026-11-11 · concept v1*

**Scelta:** un viaggio (titolo, itinerario, incluso...) può avere più **partenze**, ognuna con data, prezzo, acconto, posti, minimo di partecipanti e coordinatore. Sostituisce l'idea della tappa 2, dove date e prezzo stavano nel viaggio.
**Perché:** è come funzionano WeRoad e Sivola. Lo stesso viaggio parte più volte all'anno, magari con prezzi diversi in alta stagione, e così non si copia la scheda per ogni data. Anche lo slug ora non contiene più il mese (`/viaggi/islanda-on-the-road`), perché il viaggio non ha più una data sua.
**Scartata:** tenere un viaggio per ogni data. È più semplice all'inizio, ma con 10 date si avrebbero 10 schede da tenere allineate a mano.

### D15 – Il posto è tenuto dal momento della richiesta
*2026-11-11 · concept v1*

**Scelta:** quando qualcuno chiede di iscriversi, l'iscrizione nasce come `richiesta` e **occupa già un posto**. Se la partenza è piena, nasce in `lista_attesa`.
**Perché:** chi riceve le istruzioni di pagamento deve essere sicuro che il posto ci sia quando fa il bonifico. Se una richiesta non viene pagata, l'organizzatore la annulla e il posto si libera (il cruscotto le mostra in "Richieste da confermare").
**Scartata:** occupare il posto solo al pagamento. Si rischierebbe che due persone paghino per l'ultimo posto.

### D16 – L'ultimo posto: blocco della riga della partenza
*2026-11-11 · concept v1*

**Scelta:** per creare un'iscrizione (o riattivarne una) l'API apre una transazione e legge la partenza con `SELECT ... FOR UPDATE`, poi conta i posti e inserisce.
**Perché:** se due persone premono "Invia" nello stesso istante per l'ultimo posto, senza blocco entrambe vedrebbero "1 posto libero" ed entrambe entrerebbero. `FOR UPDATE` fa aspettare la seconda finché la prima non ha finito: la seconda vede 0 posti e va in lista d'attesa. C'è un test apposta in `apps/api/test/prenotazioni.test.ts`.
**Scartata:** salvare un contatore di posti nella partenza. Andrebbe tenuto allineato a ogni cambio di stato, ed è facile che sbagli; contare le iscrizioni è sempre giusto.

### D17 – Chi si iscrive non crea un account
*2026-11-11 · concept v1*

**Scelta:** per iscriversi basta un modulo (nome, cognome, email, telefono, consenso privacy). La persona riceve un **codice di prenotazione** (`WTG-7KQ3PA`) da usare come causale del bonifico. Il login ci sarà solo per gli organizzatori (tappa 4).
**Perché:** per un viaggio di gruppo, chiedere un account prima della prenotazione fa perdere persone, e un account serve a poco se si viaggia una o due volte all'anno. Con meno dati personali salvati c'è anche meno da proteggere (GDPR).
**Più avanti:** un'area personale con un link via email ("magic link"), senza password, se servirà.

### D18 – Il primo pagamento conferma l'iscrizione
*2026-11-11 · concept v1*

**Scelta:** quando l'organizzatore registra il primo pagamento di una `richiesta`, questa diventa `confermata` da sola. Lo stato del pagamento (da pagare, acconto versato, saldato) non è salvato ma calcolato dalla somma dei pagamenti.
**Perché:** "ha pagato l'acconto" è proprio ciò che vuol dire "confermato": un clic in meno e nessun rischio di dimenticarlo. Lo stato del pagamento calcolato non può essere in disaccordo con i pagamenti.
**Nota:** si può comunque confermare a mano senza pagamento (per esempio un amico che paga in contanti alla partenza).

### D19 – Il sito parla con l'API solo dal server
*2026-11-11 · concept v1*

**Scelta:** le pagine del sito chiamano le rotte `/pubblico/*` dell'API **dal server Next.js** (Server Components per leggere, una Server Action per la richiesta di iscrizione). Il browser di chi visita non chiama mai l'API direttamente.
**Perché:** l'API non deve essere raggiungibile da Internet attraverso il sito, e le pagine arrivano già complete (buone per Google). Le rotte `/pubblico/*` restituiscono solo i dati che si possono mostrare: niente iscritti, niente viaggi in bozza, niente partenze passate o annullate. Il modulo di iscrizione funziona anche con JavaScript disattivato.
**Scartata:** chiamare l'API dal browser. Servirebbe esporla e gestire il CORS.

### D20 – Dati di esempio con un comando
*2026-11-11 · concept v1*

**Scelta:** `pnpm --filter @waintogo/api esempi` crea 4 viaggi pubblicati (Islanda, Marocco, Giappone, Algarve) con partenze e alcuni iscritti, ma **solo se il database non ha ancora viaggi**: non cancella e non tocca mai niente di esistente.
**Perché:** per provare sito e gestionale serve qualcosa da vedere, e così chiunque ha gli stessi dati di partenza. I dati passano dall'API (`app.inject`), quindi rispettano le stesse regole dei dati veri. I testi e l'IBAN sono finti, scritti come "ESEMPIO".

### D21 – Esportazione CSV pensata per Excel in italiano
*2026-11-11 · concept v1*

**Scelta:** il CSV degli iscritti si crea nel browser, usa il **punto e virgola** come separatore, gli importi con la virgola (`890,00`) e inizia con un carattere invisibile chiamato "BOM".
**Perché:** l'Excel italiano si aspetta il punto e virgola (la virgola è il separatore dei decimali), e senza BOM mostra male le lettere accentate. Google Fogli e LibreOffice lo leggono comunque.

### D22 – La webapp per telefono è nella stessa app del gestionale, sotto /webapp
*2026-11-12 · richiesta di Mohamed*

**Scelta:** il gestionale ha due interfacce nella stessa app React: la versione completa per computer (`/`) e una webapp per telefono (`/webapp`), con pagine pensate per il pollice (barra in basso, schede, pulsanti grandi, contatti a un tocco).
**Perché:** Mohamed vuole una versione da usare come app sul telefono, raggiungibile aggiungendo `/webapp` all'indirizzo del gestionale. Tenerla nella stessa app vuol dire un solo container (pochi MB in più, costo zero), un solo login quando arriverà, e codice condiviso (chiamate all'API, regole, stati).
**Scartate:**
- *Una sola interfaccia "responsive"* che si adatta allo schermo: le tabelle del gestionale su un telefono restano scomode, e chi è in giro ha bisogno di altre cose (chiamare, registrare un bonifico) rispetto a chi è alla scrivania.
- *Un'app nativa* (Android/iOS): servirebbero gli store, un altro linguaggio o React Native, e la pubblicazione su App Store costa 99 $ all'anno.
- *Una terza app separata*: un container in più da costruire e pubblicare, per lo stesso risultato.

### D23 – PWA: il service worker salva i file, mai i dati
*2026-11-12*

**Scelta:** la webapp è installabile (manifest e icone) e ha un service worker che tiene in memoria **solo** i file dell'app (HTML, JS, CSS, icone). Le chiamate a `/api` vanno sempre al server.
**Perché:** l'app si apre subito e, senza rete, mostra "Non riesco a contattare il server" invece di una pagina bianca. Non salvare i dati evita due problemi: vedere iscritti o pagamenti vecchi credendoli aggiornati, e lasciare dati personali degli iscritti sul telefono (GDPR).
**Come si aggiorna:** a ogni versione nuova i file JS/CSS hanno nomi nuovi; la pagina si scarica sempre prima dalla rete. Se un giorno si cambia il modo di salvare, basta cambiare il nome `waintogo-webapp-v1` in `webapp-sw.js` e le vecchie copie vengono cancellate.
**In sviluppo** (`pnpm dev`) il service worker non si attiva, per non lavorare su file vecchi.

### D24 – Le spese in una tabella sola, i conti calcolati
*2026-11-12 · richiesta di Mohamed*

**Scelta:** una tabella `spese` per tutti i soldi che escono, con la partenza facoltativa (vuota = spesa generale). Le entrate restano i pagamenti degli iscritti. Saldo, mesi e margini **non si salvano**: si calcolano ogni volta da pagamenti e spese.
**Perché:** come per lo stato dei pagamenti (D18), un numero calcolato non può essere sbagliato o vecchio. Una sola tabella per costi di viaggio e spese generali tiene semplice la pagina Conti e il modulo.
**Saldo di cassa:** è "entrate registrate − spese pagate registrate". Corrisponde al conto in banca solo se si registra tutto; per ora non c'è un "saldo iniziale" (si potrà aggiungere come prima entrata, se servirà).
**Rimborsi:** sono spese di categoria `rimborso`, non pagamenti negativi: così il pagamento originale resta visibile e il conto torna con l'estratto conto della banca.
**Scartate:** una contabilità a partita doppia o un collegamento alla banca: troppo per un'agenzia che parte. Si potrà esportare tutto per il commercialista più avanti.

### D25 – Margine sui ricavi attesi, non solo sull'incassato
*2026-11-12*

**Scelta:** il margine di una partenza è "ricavi attesi − tutti i costi registrati", dove i ricavi attesi contano il prezzo intero per chi occupa un posto e quanto hanno già versato gli altri.
**Perché:** prima della partenza quasi nessuno ha saldato, quindi un margine sull'incassato sarebbe sempre negativo e non direbbe niente. Quello sui ricavi attesi risponde alla domanda vera: "questa partenza, così com'è, ci fa guadagnare?". L'incassato e i costi pagati sono mostrati accanto, per vedere anche la situazione di cassa.
