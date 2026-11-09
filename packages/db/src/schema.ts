// Le tabelle del database, descritte in TypeScript con Drizzle.
//
// Da questo file:
//  - `pnpm --filter @waintogo/db genera-migrazione` crea i file SQL in drizzle/ (le migrazioni);
//  - l'API ottiene i tipi delle righe, così TypeScript segnala un campo scritto male.
//
// Convenzione: in TypeScript i nomi sono camelCase (dataInizio),
// nel database snake_case (data_inizio), come si usa in SQL.
import { STATI_VIAGGIO } from "@waintogo/shared";
import { relations } from "drizzle-orm";
import { date, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

// Un "enum" in Postgres: il database stesso rifiuta valori diversi da questi.
export const statoViaggio = pgEnum("stato_viaggio", STATI_VIAGGIO);

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

export const viaggi = pgTable("viaggi", {
  ...colonneComuni,
  // Lo slug finisce nell'indirizzo del sito (/viaggi/islanda-agosto-2027): deve essere unico.
  slug: text("slug").notNull().unique(),
  titolo: text("titolo").notNull(),
  destinazione: text("destinazione").notNull(),
  descrizione: text("descrizione").notNull().default(""),
  // mode "string": le date arrivano come "2027-08-01", senza ore né fusi orari.
  dataInizio: date("data_inizio", { mode: "string" }).notNull(),
  dataFine: date("data_fine", { mode: "string" }).notNull(),
  prezzoCentesimi: integer("prezzo_centesimi").notNull(),
  accontoCentesimi: integer("acconto_centesimi").notNull(),
  postiTotali: integer("posti_totali").notNull(),
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

// Le relazioni non creano niente nel database: servono a Drizzle per caricare
// un viaggio insieme alle sue tappe con una sola richiesta.
export const viaggiRelazioni = relations(viaggi, ({ many }) => ({ tappe: many(tappeItinerario) }));
export const tappeRelazioni = relations(tappeItinerario, ({ one }) => ({
  viaggio: one(viaggi, { fields: [tappeItinerario.viaggioId], references: [viaggi.id] }),
}));
