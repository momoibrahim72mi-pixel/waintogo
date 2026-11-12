# Modello dati

Le tabelle sono descritte in `packages/db/src/schema.ts`. Le migrazioni SQL generate da quel file sono in `packages/db/drizzle/`.

| Tabella | Stato |
|---|---|
| viaggi | ✅ creata (tappa 2), ampliata nella tappa 3 |
| tappe_itinerario | ✅ creata (tappa 2) |
| partenze | ✅ creata (tappa 3) |
| iscrizioni | ✅ creata (tappa 3) |
| pagamenti | ✅ creata (tappa 3) |
| utenti (organizzatori, con login) | in progetto (tappa 4) |
| spese | ✅ creata (tappa 6, anticipata) |
| immagini | in progetto (dopo l'MVP) |

## Come si collegano

```
viaggi ──< tappe_itinerario
   │
   └──< partenze ──< iscrizioni ──< pagamenti
            │
            └──< spese (facoltativo: una spesa senza partenza è una spesa generale)
```

`A ──< B` significa "un A ha molti B". Per esempio il viaggio "Marocco" ha 2 partenze (dicembre e gennaio), quella di dicembre ha 12 iscritti, e ognuno ha i suoi pagamenti.

**Perché viaggio e partenze sono separati** (decisione D14): lo stesso viaggio parte più volte all'anno con lo stesso itinerario ma date, prezzi e coordinatori diversi. Così la scheda si scrive una volta sola.

## Regole comuni

- Ogni tabella ha `id` (uuid, generato da Postgres), `creato_il` e `aggiornato_il` (data e ora con fuso orario, la seconda aggiornata da sola a ogni modifica).
- Gli **importi** si salvano in **centesimi** come numeri interi (`129000` = 1.290,00 €). I numeri con la virgola dei computer fanno errori di arrotondamento (0,1 + 0,2 = 0,30000000000000004), gli interi no.
- Le **date senza ora** (partenza, pagamento, nascita) sono di tipo `date`: `2027-08-01`.
- Nel database i nomi sono `snake_case` (`data_inizio`), nel codice TypeScript `camelCase` (`dataInizio`). Drizzle li traduce.
- Le **chiavi esterne** sono quasi tutte `on delete restrict`: il database rifiuta di cancellare un viaggio con partenze, una partenza con iscritti o un'iscrizione con pagamenti. Così nessun dato di soldi sparisce per sbaglio.

---

## viaggi ✅

La scheda del viaggio nel catalogo. Non ha date né prezzi: quelli sono nelle partenze.

| Colonna | Tipo | Note |
|---|---|---|
| slug | text, **unico** | Il pezzo di indirizzo sul sito, per esempio `islanda-on-the-road`. Viene generato dal titolo alla creazione e **non cambia più**, così i link già condivisi restano validi (D11). Se esiste già, si aggiunge `-2`, `-3`... |
| titolo, sottotitolo | text | il sottotitolo è la frase che appare sotto il titolo nelle schede |
| destinazione | text | |
| descrizione | text | può essere vuota in bozza |
| durata_giorni | integer | 1–60; la data di fine di ogni partenza si calcola da qui |
| stili | text[] | uno o più tra `avventura`, `natura`, `citta`, `mare`, `cultura`, `on-the-road`: servono ai filtri del sito |
| livello | enum `livello_viaggio` | `facile`, `medio`, `impegnativo` |
| fascia_eta | text | per esempio "25–40" |
| punti_forti, incluso, non_incluso | text[] | elenchi mostrati sulla pagina del viaggio |
| info_utili | text | documenti, clima, cosa portare |
| immagine_url | text | indirizzo https della copertina; vuoto = copertina colorata col nome |
| stato | enum `stato_viaggio` | `bozza` (default), `pubblicato`, `chiuso` |
| istruzioni_pagamento | text | IBAN, Revolut, causale: le vede chi si iscrive |

`text[]` è un **array** di Postgres: una sola colonna che contiene un elenco di testi. Lo usiamo per liste corte che si leggono e si scrivono sempre tutte insieme, senza bisogno di una tabella a parte.

**Ciclo di vita di un viaggio:**

```
            pubblica (solo se completo)
  bozza  ─────────────────────────────▶  pubblicato
    ▲  ◀─────────────────────────────      │
    │            ritira                    │ (più avanti: chiudi)
 elimina                                   ▼
 (solo bozze senza partenze)             chiuso
```

Un viaggio è **completo**, e quindi pubblicabile, quando ha una descrizione di almeno 20 caratteri, almeno uno stile, almeno un giorno di itinerario, almeno una voce in "incluso" e le istruzioni di pagamento. La regola è `problemiPerPubblicare()` in `packages/shared/src/viaggio.ts`. Sul sito si vedono solo i viaggi pubblicati, e di questi solo le partenze future e non annullate.

## tappe_itinerario ✅

| Colonna | Tipo | Note |
|---|---|---|
| viaggio_id | uuid → viaggi.id | se si elimina il viaggio, le tappe spariscono con lui (`on delete cascade`) |
| giorno | integer | da 1 alla durata del viaggio; **unico** per viaggio (vincolo `tappa_giorno_unico`) |
| titolo | text | |
| descrizione | text | |

## partenze ✅

Una data in cui il viaggio parte.

| Colonna | Tipo | Note |
|---|---|---|
| viaggio_id | uuid → viaggi.id | |
| data_inizio | date, con indice | l'indice rende veloce la ricerca per data, che il sito fa a ogni pagina |
| prezzo_centesimi | integer | prezzo a persona |
| acconto_centesimi | integer | non può superare il prezzo |
| posti_totali | integer | 1–500 |
| minimo_partecipanti | integer | quanti confermati servono perché la partenza sia **garantita**; non può superare i posti |
| coordinatore | text | il nome; vuoto = "da decidere" |
| annullata | boolean | una partenza annullata sparisce dal sito ma resta nel gestionale, con i suoi iscritti |

**Valori calcolati** (non salvati, li calcola l'API in `apps/api/src/partenze/calcoli.ts`):

| Valore | Come si calcola |
|---|---|
| data di fine | data di inizio + durata del viaggio − 1 |
| posti occupati | iscrizioni `richiesta` + `confermata` |
| posti liberi | posti totali − posti occupati |
| in attesa | iscrizioni in `lista_attesa` |
| garantita | confermate ≥ minimo partecipanti |

Sul sito ogni partenza ha un'etichetta: **completa** (0 posti liberi), **ultimi posti** (3 o meno), **garantita**, oppure nessuna (vedi `disponibilita()` in `packages/shared/src/partenza.ts`).

## iscrizioni ✅

Una persona iscritta a una partenza. Per ora ogni iscrizione è una persona sola: chi viaggia in due fa due richieste. Gli account per chi si iscrive non ci sono (vedi D17).

| Colonna | Tipo | Note |
|---|---|---|
| codice | text, **unico** | il codice di prenotazione, per esempio `WTG-7KQ3PA`, da usare come causale del bonifico. Usa solo lettere e cifre che non si confondono (niente 0/O, 1/I/L) |
| partenza_id | uuid → partenze.id, con indice | |
| stato | enum `stato_iscrizione` | vedi sotto |
| nome, cognome, email, telefono | text | |
| data_nascita | date, facoltativa | |
| note | text | quello che la persona ha scritto (allergie, compagno di stanza...) |

**Stati di un'iscrizione:**

```
 richiesta dal sito o a mano
            │
     posti liberi? ── no ──▶  lista_attesa ──(conferma, se si libera un posto)──┐
            │ sì                                                                 │
            ▼                                                                    ▼
        richiesta ──(primo pagamento registrato, oppure "Conferma")──▶  confermata
            │                                                                    │
            └────────────────────────────▶  annullata  ◀─────────────────────────┘
                                         (può essere ripristinata)
```

- `richiesta` e `confermata` **occupano un posto**: il posto è tenuto dal momento della richiesta, così nessuno paga per un posto che non c'è più (D15).
- `lista_attesa` e `annullata` non occupano posti.
- Il **primo pagamento** trasforma una richiesta in confermata da sola.
- Si può passare a uno stato che occupa un posto solo se c'è un posto libero: altrimenti l'API rifiuta con un messaggio.

Lo **stato del pagamento** (`da_pagare`, `acconto_versato`, `saldato`) **non è salvato**: si calcola sommando i pagamenti e confrontando con prezzo e acconto della partenza (`statoPagamento()` in `packages/shared/src/iscrizione.ts`). Così non può mai essere sbagliato.

## pagamenti ✅

I soldi ricevuti, inseriti a mano dall'organizzatore (D8).

| Colonna | Tipo | Note |
|---|---|---|
| iscrizione_id | uuid → iscrizioni.id | |
| importo_centesimi | integer | almeno 1 centesimo |
| data | date | quando sono arrivati i soldi |
| metodo | enum `metodo_pagamento` | `bonifico`, `revolut`, `contanti`, `altro` |
| nota | text | per esempio il riferimento del bonifico |

Non c'è un campo "acconto o saldo": basta la somma. Se ci si sbaglia, il pagamento si elimina e si registra di nuovo.

---

## spese ✅

I soldi che **escono**: costi di una partenza (voli, hotel, guide...) o spese generali dell'agenzia (pubblicità, dominio...). I soldi che **entrano** sono i pagamenti degli iscritti.

| Colonna | Tipo | Note |
|---|---|---|
| partenza_id | uuid → partenze.id, **facoltativo**, con indice | vuoto = spesa generale. Una partenza con delle spese non si può eliminare (`on delete restrict`): si annulla |
| descrizione | text | "Voli Milano–Marrakech A/R" |
| categoria | enum `categoria_spesa` | `volo`, `alloggio`, `trasporto`, `attivita`, `guida`, `coordinatore`, `assicurazione`, `pubblicita`, `software`, `rimborso`, `altro` |
| importo_centesimi | integer | almeno 1 centesimo |
| data | date, con indice | se è pagata: quando sono usciti i soldi; se non lo è: entro quando va pagata |
| pagata | boolean | una spesa "da pagare" conta nei costi della partenza ma non nel saldo di cassa |
| fornitore, nota | text | facoltativi |

**Rimborsi:** se un iscritto annulla e gli restituiamo dei soldi, il suo pagamento resta (i soldi sono entrati davvero) e il rimborso si registra come spesa di categoria `rimborso` sulla stessa partenza. Così entrate e uscite corrispondono a quello che è successo sul conto.

### I conti (calcolati, non salvati)

La pagina Conti non ha una tabella sua: tutto si calcola da `pagamenti` e `spese` (rotta `GET /conti`, file `apps/api/src/conti/rotte.ts`).

| Valore | Come si calcola |
|---|---|
| entrate | somma di tutti i pagamenti degli iscritti |
| uscite | somma delle spese **pagate** |
| saldo di cassa | entrate − uscite: i soldi che dovrebbero esserci sul conto |
| da pagare | somma delle spese non ancora pagate |
| da incassare | per le partenze future non annullate, quanto devono ancora pagare gli iscritti che occupano un posto |
| saldo previsto | saldo + da incassare − da pagare |
| ricavi attesi di una partenza | il prezzo per chi occupa un posto, più quanto hanno già versato gli altri (annullati, in attesa). `ricaviAttesi()` in `packages/shared/src/spesa.ts` |
| margine di una partenza | ricavi attesi − tutte le sue spese (pagate e da pagare) |

Il mese di un movimento è quello della sua data (data del pagamento o della spesa).

---

## In progetto

### utenti
Gli organizzatori che entrano nel gestionale, con un **ruolo** (`admin`, `organizzatore`, `coordinatore`) e la password salvata cifrata, mai in chiaro.

### immagini
Le foto del viaggio: il file sta su Object Storage, nel database c'è solo il percorso.

---

## Come si cambia una tabella

1. Modifica `packages/db/src/schema.ts`.
2. Genera la migrazione dandole un nome che dica cosa fa:
   ```bash
   pnpm --filter @waintogo/db genera-migrazione --name aggiunge-iscrizioni
   ```
   Nasce un nuovo file in `packages/db/drizzle/`. **Rileggilo**: è l'SQL che verrà eseguito sul database vero.
3. Riavvia l'API: applica da sola le migrazioni nuove.
4. **Non modificare mai una migrazione già unita in `main`**: potrebbe essere già stata applicata a un database. Se serve correggere, se ne crea una nuova.

### La migrazione `0001`

`0001_catalogo-partenze-iscrizioni.sql` è stata generata da drizzle-kit e poi **ritoccata a mano** (le righe con il commento `A MANO`): prima di togliere date, prezzo e posti dalla tabella `viaggi`, li copia in una nuova riga di `partenze`, e calcola `durata_giorni` dalle date. Così chi aveva già dei viaggi in bozza non perde niente. drizzle-kit da solo avrebbe cancellato le colonne e i loro dati.
