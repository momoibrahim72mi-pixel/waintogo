// Cose usate da tutti i file di test: l'app collegata al database dei test e dati di esempio.
import { creaDb } from "@waintogo/db";
import { sql } from "drizzle-orm";
import { expect } from "vitest";
import { creaApp } from "../src/app.js";
import { URL_TEST } from "./preparazione.js";

export const { db, chiudi } = creaDb(URL_TEST);
// "Oggi" fisso: i test danno lo stesso risultato in qualunque giorno vengano eseguiti.
export const OGGI = "2026-11-09";
export const app = creaApp({ db, oggi: () => OGGI });

export async function svuota() {
  // CASCADE svuota anche le tabelle collegate: tappe, partenze, iscrizioni, pagamenti, spese.
  // "spese" va nominata da sola: le spese generali non sono collegate a nessuna partenza.
  await db.execute(sql`truncate viaggi, spese cascade`);
}

export const viaggioBozza = {
  titolo: "Islanda: fuoco & ghiaccio",
  destinazione: "Islanda",
  durataGiorni: 8,
};

export const viaggioCompleto = {
  ...viaggioBozza,
  sottotitolo: "Otto giorni on the road tra ghiacciai e cascate",
  descrizione: "Una settimana tra ghiacciai, cascate e sorgenti calde.",
  stili: ["on-the-road", "natura"],
  incluso: ["Alloggi in camera doppia", "Auto 4x4", "Coordinatore"],
  istruzioniPagamento: "Bonifico a IBAN IT00 X000 0000 0000 0000 0000 000",
  tappe: [
    { giorno: 1, titolo: "Arrivo a Reykjavik" },
    { giorno: 2, titolo: "Circolo d'oro", descrizione: "Geyser e cascate" },
  ],
};

export const partenzaAgosto = {
  dataInizio: "2027-08-01",
  prezzoCentesimi: 129000,
  accontoCentesimi: 30000,
  postiTotali: 14,
  minimoPartecipanti: 6,
  coordinatore: "Giulia",
};

export const persona = (n = 1) => ({
  nome: `Persona${n}`,
  cognome: "Rossi",
  email: `persona${n}@esempio.it`,
  telefono: "+39 333 1234567",
});

/** Fa una richiesta all'app e controlla il codice di risposta. */
export async function chiedi(metodo: "GET" | "POST" | "PUT" | "DELETE", url: string, corpo?: object, atteso = 200) {
  const r = await app.inject({ method: metodo, url, payload: corpo });
  expect(r.statusCode, r.body).toBe(atteso);
  return r.statusCode === 204 ? null : r.json();
}

/** Crea un viaggio pubblicato con una partenza. */
export async function viaggioPubblicatoConPartenza(partenza: object = partenzaAgosto) {
  const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
  await chiedi("POST", `/viaggi/${v.id}/pubblica`);
  const p = await chiedi("POST", `/viaggi/${v.id}/partenze`, partenza, 201);
  return { viaggio: v, partenza: p };
}
