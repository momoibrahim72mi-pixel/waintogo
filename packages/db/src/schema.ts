// Le tabelle del database, descritte in TypeScript con Drizzle.
//
// Da questo file:
//  - `pnpm --filter @waintogo/db genera-migrazione` crea i file SQL in drizzle/ (le migrazioni);
//  - l'API ottiene i tipi delle righe, così TypeScript segnala un campo scritto male.
//
// Convenzione: in TypeScript i nomi sono camelCase (dataInizio),
// nel database snake_case (data_inizio), come si usa in SQL.
import { LIVELLI, METODI_PAGAMENTO, STATI_ISCRIZIONE, STATI_VIAGGIO } from "@waintogo/shared";
import { relations } from "drizzle-orm";
import { boolean, date, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

// Gli "enum" di Postgres: il database stesso rifiuta valori diversi da questi.
export const statoViaggio = pgEnum("stato_viaggio", STATI_VIAGGIO);
export const livelloViaggio = pgEnum("livello_viaggio", LIVELLI);
export const statoIscrizione = pgEnum("stato_iscrizione", STATI_ISCRIZIONE);
export const metodoPagamento = pgEnum("metodo_pagamento", METODI_PAGAMENTO);

// Colonne che hanno tutte le tabelle.
const colonneComuni = {
  id: uuid("id").primaryKey().defaultRandom(),
  creatoIl: timestamp("creato_il", { withTimezone: true }).notNull().defaultNow(),
  // $onUpdate: Drizzle aggiorna da solo questa data a ogni modifica della riga.
  aggiornatoIl: timestamp("aggiornato_il", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** La scheda del viaggio nel catalogo. Date, prezzi e posti stanno nelle partenze. */
export const viaggi = pgTable("viaggi", {
  ...colonneComuni,
  // Lo slug finisce nell'indirizzo del sito (/viaggi/islanda-on-the-road): deve essere unico.
  slug: text("slug").notNull().unique(),
  titolo: text("titolo").notNull(),
  sottotitolo: text("sottotitolo").notNull().default(""),
  destinazione: text("destinazione").notNull(),
  descrizione: text("descrizione").notNull().default(""),
  durataGiorni: integer("durata_giorni").notNull(),
  // text[] è un "array" di Postgres: una colonna che contiene un elenco di testi.
  stili: text("stili").array().notNull().default([]),
  livello: livelloViaggio("livello").notNull().default("medio"),
  fasciaEta: text("fascia_eta").notNull().default(""),
  puntiForti: text("punti_forti").array().notNull().default([]),
  incluso: text("incluso").array().notNull().default([]),
  nonIncluso: text("non_incluso").array().notNull().default([]),
  infoUtili: text("info_utili").notNull().default(""),
  immagineUrl: text("immagine_url").notNull().default(""),
  stato: statoViaggio("stato").notNull().default("bozza"),
  istruzioniPagamento: text("istruzioni_pagamento").notNull().default(""),
});

export const tappeItinerario = pgTable(
  "tappe_itinerario",
  {
    ...colonneComuni,
    // "references" crea una chiave esterna: ogni tappa appartiene a un viaggio esistente.
    // onDelete cascade: se si cancella il viaggio, si cancellano anche le sue tappe.
    viaggioId: uuid("viaggio_id")
      .notNull()
      .references(() => viaggi.id, { onDelete: "cascade" }),
    giorno: integer("giorno").notNull(),
    titolo: text("titolo").notNull(),
    descrizione: text("descrizione").notNull().default(""),
  },
  // Lo stesso viaggio non può avere due volte il "giorno 3".
  (t) => [unique("tappa_giorno_unico").on(t.viaggioId, t.giorno)],
);

/** Una data in cui il viaggio parte, con il suo prezzo, i suoi posti e il suo coordinatore. */
export const partenze = pgTable(
  "partenze",
  {
    ...colonneComuni,
    // onDelete restrict: non si può cancellare un viaggio che ha delle partenze.
    viaggioId: uuid("viaggio_id")
      .notNull()
      .references(() => viaggi.id, { onDelete: "restrict" }),
    dataInizio: date("data_inizio", { mode: "string" }).notNull(),
    prezzoCentesimi: integer("prezzo_centesimi").notNull(),
    accontoCentesimi: integer("acconto_centesimi").notNull(),
    postiTotali: integer("posti_totali").notNull(),
    minimoPartecipanti: integer("minimo_partecipanti").notNull().default(1),
    coordinatore: text("coordinatore").notNull().default(""),
    annullata: boolean("annullata").notNull().default(false),
  },
  // Un indice rende veloce cercare le partenze per data (il sito lo fa a ogni pagina).
  (t) => [index("partenze_data_inizio_idx").on(t.dataInizio)],
);

/** Una persona iscritta a una partenza. */
export const iscrizioni = pgTable(
  "iscrizioni",
  {
    ...colonneComuni,
    // Il codice da usare come causale del bonifico, per esempio WTG-7KQ3PA.
    codice: text("codice").notNull().unique(),
    partenzaId: uuid("partenza_id")
      .notNull()
      .references(() => partenze.id, { onDelete: "restrict" }),
    stato: statoIscrizione("stato").notNull().default("richiesta"),
    nome: text("nome").notNull(),
    cognome: text("cognome").notNull(),
    email: text("email").notNull(),
    telefono: text("telefono").notNull(),
    dataNascita: date("data_nascita", { mode: "string" }),
    note: text("note").notNull().default(""),
  },
  (t) => [index("iscrizioni_partenza_idx").on(t.partenzaId)],
);

/** Un pagamento ricevuto, registrato a mano dall'organizzatore. */
export const pagamenti = pgTable("pagamenti", {
  ...colonneComuni,
  iscrizioneId: uuid("iscrizione_id")
    .notNull()
    .references(() => iscrizioni.id, { onDelete: "restrict" }),
  importoCentesimi: integer("importo_centesimi").notNull(),
  data: date("data", { mode: "string" }).notNull(),
  metodo: metodoPagamento("metodo").notNull(),
  nota: text("nota").notNull().default(""),
});

// Le relazioni non creano niente nel database: servono a Drizzle per caricare
// dati collegati (un viaggio con le sue tappe e partenze) con una sola richiesta.
export const viaggiRelazioni = relations(viaggi, ({ many }) => ({
  tappe: many(tappeItinerario),
  partenze: many(partenze),
}));
export const tappeRelazioni = relations(tappeItinerario, ({ one }) => ({
  viaggio: one(viaggi, { fields: [tappeItinerario.viaggioId], references: [viaggi.id] }),
}));
export const partenzeRelazioni = relations(partenze, ({ one, many }) => ({
  viaggio: one(viaggi, { fields: [partenze.viaggioId], references: [viaggi.id] }),
  iscrizioni: many(iscrizioni),
}));
export const iscrizioniRelazioni = relations(iscrizioni, ({ one, many }) => ({
  partenza: one(partenze, { fields: [iscrizioni.partenzaId], references: [partenze.id] }),
  pagamenti: many(pagamenti),
}));
export const pagamentiRelazioni = relations(pagamenti, ({ one }) => ({
  iscrizione: one(iscrizioni, { fields: [pagamenti.iscrizioneId], references: [iscrizioni.id] }),
}));
