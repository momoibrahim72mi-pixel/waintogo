# Modello dati

Le tabelle sono descritte in `packages/db/src/schema.ts`. Le migrazioni SQL generate da quel file sono in `packages/db/drizzle/`.

| Tabella | Stato |
|---|---|
| viaggi | ✅ creata (tappa 2) |
| tappe_itinerario | ✅ creata (tappa 2) |
| utenti, iscrizioni, partecipanti | in progetto (tappa 4) |
| pagamenti | in progetto (tappa 5) |
| spese | in progetto (tappa 6) |
| immagini | in progetto (dopo l'MVP) |

## Come si collegano

```
utenti ──< iscrizioni >── viaggi ──< tappe_itinerario
              │              ├──< immagini
              ├──< partecipanti
              └──< pagamenti    └──< spese
```

`A ──< B` significa "un A ha molti B".

## Regole comuni

- Ogni tabella ha `id` (uuid, generato da Postgres), `creato_il` e `aggiornato_il` (data e ora con fuso orario, la seconda aggiornata da sola a ogni modifica).
- Gli **importi** si salvano in **centesimi** come numeri interi (`129000` = 1.290,00 €). I numeri con la virgola dei computer fanno errori di arrotondamento (0,1 + 0,2 = 0,30000000000000004), gli interi no.
- Le **date senza ora** (partenza, ritorno) sono di tipo `date`: `2027-08-01`.
- Nel database i nomi sono `snake_case` (`data_inizio`), nel codice TypeScript `camelCase` (`dataInizio`). Drizzle li traduce.

---

## viaggi ✅

| Colonna | Tipo | Note |
|---|---|---|
| slug | text, **unico** | Il pezzo di indirizzo sul sito, per esempio `islanda-fuoco-ghiaccio-agosto-2027`. Viene generato dal titolo e dal mese di partenza alla creazione e **non cambia più**, così i link già condivisi restano validi. Se esiste già, si aggiunge `-2`, `-3`... |
| titolo | text | 3–120 caratteri |
| destinazione | text | |
| descrizione | text | può essere vuota in bozza |
| data_inizio, data_fine | date | la fine non può venire prima dell'inizio |
| prezzo_centesimi | integer | prezzo a persona |
| acconto_centesimi | integer | non può superare il prezzo |
| posti_totali | integer | 1–500 |
| stato | enum `stato_viaggio` | `bozza` (default), `pubblicato`, `chiuso` |
| istruzioni_pagamento | text | IBAN, Revolut, causale: le riceverà per email chi si iscrive |

**Ciclo di vita di un viaggio:**

```
            pubblica (solo se completo)
  bozza  ─────────────────────────────▶  pubblicato
    ▲  ◀─────────────────────────────      │
    │            ritira                    │ (tappa 6: chiudi)
 elimina                                   ▼
 (solo bozze)                            chiuso
```

Un viaggio è **completo**, e quindi pubblicabile, quando ha una descrizione di almeno 20 caratteri, almeno un giorno di itinerario, un prezzo, le istruzioni di pagamento e una partenza nel futuro. La regola è `problemiPerPubblicare()` in `packages/shared/src/viaggio.ts`. Un viaggio pubblicato si può modificare, ma deve restare completo.

## tappe_itinerario ✅

| Colonna | Tipo | Note |
|---|---|---|
| viaggio_id | uuid → viaggi.id | se si elimina il viaggio, le tappe spariscono con lui (`on delete cascade`) |
| giorno | integer | da 1 alla durata del viaggio; **unico** per viaggio (vincolo `tappa_giorno_unico`) |
| titolo | text | |
| descrizione | text | |

---

## In progetto

### utenti
Chi ha un account, con un **ruolo**: `cliente`, `organizzatore` o `admin`. Campi: nome, cognome, email, telefono, ruolo, password (salvata cifrata, mai in chiaro).

### iscrizioni
Una persona che si iscrive a un viaggio, anche per più partecipanti. Campi: utente, viaggio, stato (`in_attesa`, `confermata`, `annullata`), data, note.
Lo **stato del pagamento** (`da_pagare`, `acconto_versato`, `saldato`) non è salvato: si **calcola** dai pagamenti, così non può mai essere sbagliato.

### partecipanti
Le persone dentro un'iscrizione: nome, cognome, data di nascita ed eventuale documento.

### pagamenti
I soldi ricevuti, inseriti a mano dall'organizzatore (vedi [decisioni.md](decisioni.md), D8). Campi: iscrizione, importo, data, metodo (`bonifico`, `revolut`, `contanti`), tipo (`acconto` o `saldo`), nota.

### spese
I costi del viaggio, per calcolare il margine: categoria, descrizione, importo, data, fornitore.

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
