# Modello dati

> **Stato:** progetto. Le tabelle verranno create nella tappa 2 con Drizzle. Quando succede, questo documento verrà aggiornato con i campi definitivi.

## Le tabelle e come si collegano

```
utenti ──< iscrizioni >── viaggi ──< tappe_itinerario
              │              ├──< immagini
              ├──< partecipanti
              └──< pagamenti    └──< spese
```

`A ──< B` significa "un A ha molti B".

## Descrizione

### utenti
Chi ha un account. Ha un **ruolo**: `cliente` (si iscrive ai viaggi), `organizzatore` (gestisce i viaggi) oppure `admin`.
Campi principali: nome, cognome, email, telefono, ruolo, password (salvata cifrata, mai in chiaro).

### viaggi
Un viaggio pubblicato o in preparazione.
Campi principali: titolo, slug (il pezzo di indirizzo, per esempio `islanda-agosto-2027`), destinazione, descrizione, data di inizio e di fine, prezzo, acconto richiesto, posti totali, stato (`bozza`, `pubblicato`, `chiuso`), istruzioni di pagamento (IBAN e riferimento Revolut, mandati per email a chi si iscrive).

### tappe_itinerario
I giorni del viaggio: giorno, titolo, descrizione.

### immagini
Le foto del viaggio. Il file sta su Object Storage, nel database c'è solo il percorso.

### iscrizioni
Una persona che si iscrive a un viaggio, anche per più partecipanti.
Campi principali: utente, viaggio, stato (`in_attesa`, `confermata`, `annullata`), data, note.
Lo **stato del pagamento** (`da_pagare`, `acconto_versato`, `saldato`) non è salvato: si **calcola** sommando i pagamenti e confrontando il totale con il prezzo. Così non può mai essere sbagliato rispetto ai pagamenti registrati.

### partecipanti
Le persone dentro un'iscrizione: nome, cognome, data di nascita ed eventuale documento.

### pagamenti
I soldi ricevuti, inseriti a mano dall'organizzatore (vedi [decisioni.md](decisioni.md), D8).
Campi principali: iscrizione, importo, data, metodo (`bonifico`, `revolut`, `contanti`), tipo (`acconto` o `saldo`), nota (per esempio il riferimento del bonifico).

### spese
I costi del viaggio (voli, hotel, guide, trasporti): categoria, descrizione, importo, data, fornitore.
Servono a calcolare il **margine** del viaggio, cioè incassi meno spese.

## Regole

- Gli **importi** si salvano in **centesimi** come numeri interi (`12050` = 120,50 €). I numeri decimali dei computer possono dare errori di arrotondamento, gli interi no.
- Le **date** si salvano con il fuso orario (`timestamptz`).
- Ogni tabella ha `id`, `creato_il` e `aggiornato_il`.
