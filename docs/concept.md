# Concept di Waintogo

> Versione 1 · 2026-11-09 · da rivedere insieme a Mohamed. È il punto di partenza: cambierà con l'uso.

## L'idea in una frase

**Viaggi di gruppo con un coordinatore, in piccoli gruppi di persone della stessa età, prenotabili in pochi passi e senza pagare online.**

## Da dove prendiamo spunto

Abbiamo guardato due siti italiani che fanno questo mestiere. Ne prendiamo le idee migliori, **senza copiarne testi, grafica o nomi**.

| | WeRoad | Sivola | Waintogo prende... |
|---|---|---|---|
| Tono | Community, "conosci nuovi amici", molto social | Più classico, catalogo chiaro, "tutto incluso" | Il calore della community e la chiarezza del catalogo |
| Gruppi | Piccoli, per fascia d'età | 18–40 anni, alcune partenze 35–50 | Fascia d'età indicata su ogni viaggio |
| Catalogo | Per mese, destinazione, stile, budget, durata, impegno fisico | Per zona, "mood", durata, fascia di prezzo, mese | Filtri per **stile**, **mese**, **durata** e **prezzo massimo** |
| Pagina viaggio | Panoramica, itinerario, incluso ed extra, recensioni, FAQ | Riquadro "In breve", itinerario, partenze e prezzi, comprende/non comprende, info utili | Un riquadro **"In breve"**, il **giorno per giorno**, **incluso / non incluso**, **partenze con posti e prezzo**, **info utili** |
| Partenze | Molte date per lo stesso viaggio | Ogni data con prezzo e coordinatore | **Un viaggio, tante partenze**: ognuna con le sue date, il suo prezzo, i suoi posti e il suo coordinatore |
| Prenotazione | Si prenota a 0 €, l'acconto si paga dopo la conferma | – | **Richiesta di iscrizione gratuita**, poi i dati per bonifico o Revolut |

## Il sito pubblico

### Pagine

> **Versione 2 · 2026-11-12, dopo il parere di Mohamed.** La prima versione sembrava "proprio un'agenzia viaggi": catalogo con filtri, ricerca, stili di viaggio. All'inizio partirà **un viaggio alla volta**, e il sito si guarda soprattutto **dal telefono**. Quindi niente catalogo: una pagina sola che racconta chi siamo e porta dritta al prossimo viaggio. Ispirazione per il tono: siti di "eventi" più che di agenzie (Mohamed ha indicato soloeventseg.com). Scelte spiegate in [decisioni.md](decisioni.md) (D26, D27).

1. **Home** (`/`), una pagina sola con le sezioni in quest'ordine. Il menu in alto a destra (☰ sul telefono) porta a ciascuna:
   - **Apertura**: "Scopri il nostro prossimo viaggio", una frase su di noi e un pulsante che scende al viaggio. Se il prossimo viaggio ha una foto, fa da sfondo.
   - **Prossimo viaggio** (`#prossimo-viaggio`): la scheda grande del viaggio con la partenza più vicina: date, prezzo, acconto, posti, coordinatore, e i pulsanti **Prenota il tuo posto** e **Vedi il programma**. Se ci sono altri viaggi in programma compaiono in piccolo sotto ("Più avanti"); se non ce n'è nessuno, un invito a contattarci.
   - **Cosa facciamo** (`#cosa-facciamo`): viaggi, weekend trip, day trip, retreat.
   - **Viaggi passati** (`#viaggi-passati`): le tessere dei viaggi già fatti; sul telefono scorrono di lato.
   - **Chi siamo** (`#chi-siamo`): testo in bozza, da scrivere.
   - **FAQ** (`#faq`): le domande frequenti, che si aprono toccandole.
   - **Contatti** (`#contatti`): WhatsApp, Instagram, email (da inserire in `apps/sito/lib/contatti.ts`).
   - In fondo, **al centro**, il pulsante "Scopri il prossimo viaggio".
2. **Pagina del viaggio** (`/viaggi/<slug>`), il "programma":
   - In alto: titolo, frase di presentazione, etichette (stile, fascia d'età).
   - Riquadro **"In breve"**: durata, prezzo da, fascia d'età, prossima partenza, impegno fisico.
   - **Il viaggio**, **Punti forti**, **Giorno per giorno**, **Cosa è incluso / non incluso**, **Info utili**.
   - **Partenze e prezzi**: per ogni data prezzo, acconto, posti rimasti, coordinatore e stato ("partenza garantita", "ultimi posti", "completo, lista d'attesa"), con il pulsante **Richiedi il posto**.
   - Sul telefono una **barra fissa in basso** con data, prezzo e "Prenota".
3. **Richiesta di iscrizione**: nome, cognome, email, telefono, data di nascita, note e consenso privacy. Dopo l'invio compare subito la conferma con il **codice della prenotazione** (es. `WTG-7KQ3PA`), l'importo dell'acconto e le istruzioni per il pagamento, da usare con il codice come causale. Se la partenza è piena, la persona entra in **lista d'attesa** e lo vede scritto.

I vecchi indirizzi `/viaggi` (catalogo) e `/come-funziona` portano alle sezioni "Prossimo viaggio" e "FAQ" della home.

### Regole del sito

- Si vedono solo i viaggi **pubblicati**, e solo le partenze **future e non annullate**.
- **"Viaggi passati"**: i viaggi pubblicati o chiusi con almeno una partenza già iniziata e non annullata (le bozze mai). Si mostra l'ultima volta che siamo partiti.
- **"Partenza garantita"**: le iscrizioni confermate hanno raggiunto il minimo di partecipanti, quindi il viaggio si fa di sicuro.
- **"Ultimi posti"**: ne restano 3 o meno.
- **"Completo"**: posti finiti. Si può ancora chiedere, ma si entra in lista d'attesa.

### Aspetto

- Colori: **verde petrolio** (fiducia, natura) come colore principale, **corallo** per i pulsanti, e un fondo **sabbia** chiaro che sa di viaggio.
- Testi caldi e diretti, dando del tu.
- Pensato prima per il telefono: è da lì che arriva la maggior parte delle persone.
- Foto: per ora ogni viaggio può avere l'indirizzo di un'immagine di copertina. Le foto caricate su Object Storage arriveranno dopo.

## Il gestionale

### Cosa c'è in questa versione

1. **Cruscotto** (la prima pagina):
   - le prossime partenze, con iscritti su posti, se è garantita e quanto manca da incassare;
   - **da fare**: richieste da confermare, persone in lista d'attesa e saldi da sollecitare (partenza entro 30 giorni e non ancora saldato).
2. **Viaggi**: il catalogo, con tutti i campi del sito (stili, fascia d'età, punti forti, incluso, non incluso, info utili, copertina, itinerario).
3. **Partenze**, dentro ogni viaggio: data, prezzo, acconto, posti, **minimo di partecipanti** e coordinatore. Una partenza si può **annullare**, e si può eliminare solo se non ha iscritti.
4. **Iscritti di una partenza**:
   - una tabella con stato e pagamenti di ognuno;
   - azioni per confermare, mettere in lista d'attesa o annullare;
   - **registrare un pagamento** (importo, data, metodo, nota). Quando arriva il primo pagamento, una richiesta diventa confermata da sola;
   - **aggiungere un iscritto a mano**, per chi prenota al telefono o su WhatsApp;
   - **esportare la lista** in CSV, per hotel, assicurazione e coordinatore;
   - le **spese della partenza** e il suo **margine** (ricavi attesi meno costi).
5. **Conti**:
   - **saldo di cassa** (tutto quello che è entrato meno tutto quello che abbiamo pagato), **da incassare**, **da pagare** e **saldo previsto**;
   - entrate e uscite **mese per mese**;
   - **margine di ogni partenza** dell'anno, con la percentuale sui ricavi;
   - **tutte le spese**: di una partenza o generali (pubblicità, dominio...), pagate o da pagare, con il pulsante per segnarle pagate.

### Due interfacce: computer e telefono

Il gestionale ha due interfacce sullo stesso indirizzo, con gli stessi dati:

| | Versione completa | Webapp per telefono |
|---|---|---|
| Indirizzo | `/` | `/webapp` |
| Per chi | chi lavora alla scrivania | chi è in giro, o il coordinatore durante il viaggio |
| Cosa fa | tutto: viaggi, partenze, iscritti, pagamenti, CSV | **Oggi** (le cose da fare), **Partenze**, iscritti di una partenza con i pulsanti per **chiamare, scrivere su WhatsApp o per email** e **registrare un pagamento** in due tocchi; **Conti**: saldo, spese da pagare (un tocco per segnarle pagate) e **registrare una spesa al volo**, per esempio la guida pagata in contanti durante il viaggio |
| Com'è fatta | menu in alto, tabelle | barra in basso a portata di pollice, schede, pulsanti grandi |
| Installabile | no | sì: si aggiunge alla schermata home e si apre a tutto schermo come un'app |

Sul telefono mancano apposta le cose lunghe o delicate (creare viaggi, correggere o eliminare pagamenti): si fanno dalla versione completa, dove si sbaglia meno. Dalla barra in basso, "Completa" porta alla versione completa; dalla versione completa, "App per telefono" porta alla webapp.

### Cosa verrà dopo (in ordine di utilità)

| Funzione | Perché serve |
|---|---|
| **Login e ruoli** (admin, organizzatore, coordinatore) | Indispensabile prima di mettere il gestionale online |
| **Email automatiche**: conferma richiesta, conferma pagamento, promemoria saldo | Oggi le istruzioni si vedono solo sulla pagina di conferma |
| **Lista d'attesa automatica**: quando qualcuno annulla, si avvisa il primo in attesa | Meno lavoro manuale |
| **Area coordinatore**: lista dei partecipanti, contatti, documenti | Il coordinatore ha tutto sul telefono |
| **Documenti dei partecipanti** (carta d'identità, passaporto) | Servono per voli e hotel. Attenzione al GDPR |
| **Comunicazioni al gruppo** (email a tutti gli iscritti di una partenza, link al gruppo WhatsApp) | Organizzare prima della partenza |
| **Codici sconto e promozioni** | Marketing |
| **Recensioni dopo il viaggio** | Fiducia per chi arriva sul sito |
| **Foto su Object Storage** | Caricare le foto invece di incollare un indirizzo |
| **Pagamenti online** (Stripe), se un giorno servirà | Vedi decisione D8 |

## Il flusso di una prenotazione

```
 Sito                        Gestionale
 ────                        ──────────
 Richiesta di iscrizione ──▶ Iscrizione "richiesta" (oppure "lista d'attesa" se è piena)
 Pagina di conferma con           │
 codice + dati bonifico           │  arriva il bonifico dell'acconto
                                  ▼
                            Registra pagamento ──▶ diventa "confermata"
                                  │
                                  │  a 30 giorni dalla partenza: promemoria del saldo
                                  ▼
                            Registra saldo ──▶ pagamento "saldato"
```

Il **posto viene tenuto** dal momento della richiesta: le richieste in attesa di pagamento contano come posti occupati. Se una persona non paga, l'organizzatore annulla la richiesta e il posto torna libero.
