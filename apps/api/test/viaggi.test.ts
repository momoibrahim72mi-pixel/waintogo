// Test delle API dei viaggi su un Postgres vero.
// app.inject() simula una richiesta HTTP senza aprire porte: veloce e affidabile.
import { creaDb } from "@waintogo/db";
import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { creaApp } from "../src/app.js";
import { creaSlug } from "../src/viaggi/archivio.js";
import { URL_TEST } from "./preparazione.js";

const { db, chiudi } = creaDb(URL_TEST);
// "Oggi" fisso: i test danno lo stesso risultato in qualunque giorno vengano eseguiti.
const app = creaApp({ db, oggi: () => "2026-11-09" });

beforeEach(async () => {
  await db.execute(sql`truncate viaggi cascade`);
});

afterAll(async () => {
  await app.close();
  await chiudi();
});

const bozza = {
  titolo: "Islanda: fuoco & ghiaccio",
  destinazione: "Islanda",
  dataInizio: "2027-08-01",
  dataFine: "2027-08-08",
  prezzoCentesimi: 129000,
  accontoCentesimi: 30000,
  postiTotali: 14,
};

const completo = {
  ...bozza,
  descrizione: "Una settimana tra ghiacciai, cascate e sorgenti calde.",
  istruzioniPagamento: "Bonifico a IBAN IT00 X000 0000 0000 0000 0000 000",
  tappe: [
    { giorno: 1, titolo: "Arrivo a Reykjavik" },
    { giorno: 2, titolo: "Circolo d'oro", descrizione: "Geyser e cascate" },
  ],
};

async function crea(dati: object) {
  const r = await app.inject({ method: "POST", url: "/viaggi", payload: dati });
  expect(r.statusCode).toBe(201);
  return r.json();
}

describe("creazione e lettura", () => {
  it("crea un viaggio come bozza, con slug e tappe ordinate", async () => {
    const v = await crea({ ...completo, tappe: [...completo.tappe].reverse() });
    expect(v.stato).toBe("bozza");
    expect(v.slug).toBe("islanda-fuoco-ghiaccio-agosto-2027");
    expect(v.creatoIl).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(v.tappe.map((t: { giorno: number }) => t.giorno)).toEqual([1, 2]);

    const elenco = await app.inject({ method: "GET", url: "/viaggi" });
    expect(elenco.json()).toHaveLength(1);
  });

  it("rende unico lo slug se il titolo si ripete", async () => {
    await crea(bozza);
    const secondo = await crea(bozza);
    expect(secondo.slug).toBe("islanda-fuoco-ghiaccio-agosto-2027-2");
  });

  it("rifiuta dati non validi indicando i campi", async () => {
    const r = await app.inject({ method: "POST", url: "/viaggi", payload: { ...bozza, titolo: "", postiTotali: 0 } });
    expect(r.statusCode).toBe(400);
    expect(Object.keys(r.json().campi)).toEqual(["titolo", "postiTotali"]);
  });

  it("risponde 404 per un viaggio che non esiste o un id sbagliato", async () => {
    expect((await app.inject({ method: "GET", url: "/viaggi/non-un-id" })).statusCode).toBe(404);
    expect((await app.inject({ method: "GET", url: `/viaggi/${crypto.randomUUID()}` })).statusCode).toBe(404);
  });
});

describe("modifica", () => {
  it("sostituisce dati e tappe ma non lo slug", async () => {
    const v = await crea(completo);
    const r = await app.inject({
      method: "PUT",
      url: `/viaggi/${v.id}`,
      payload: { ...completo, titolo: "Islanda d'estate", tappe: [{ giorno: 3, titolo: "Laguna glaciale" }] },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().titolo).toBe("Islanda d'estate");
    expect(r.json().slug).toBe(v.slug);
    expect(r.json().tappe).toEqual([{ giorno: 3, titolo: "Laguna glaciale", descrizione: "" }]);
  });

  it("non lascia un viaggio pubblicato diventare incompleto", async () => {
    const v = await crea(completo);
    await app.inject({ method: "POST", url: `/viaggi/${v.id}/pubblica` });
    const r = await app.inject({ method: "PUT", url: `/viaggi/${v.id}`, payload: { ...completo, tappe: [] } });
    expect(r.statusCode).toBe(409);
    expect(r.json().problemi).toEqual(["Aggiungi almeno un giorno di itinerario"]);
  });
});

describe("pubblicazione", () => {
  it("rifiuta una bozza incompleta spiegando cosa manca", async () => {
    const v = await crea(bozza);
    const r = await app.inject({ method: "POST", url: `/viaggi/${v.id}/pubblica` });
    expect(r.statusCode).toBe(409);
    expect(r.json().problemi).toHaveLength(3);
  });

  it("pubblica, ritira e permette di eliminare solo le bozze", async () => {
    const v = await crea(completo);
    const pubblicato = await app.inject({ method: "POST", url: `/viaggi/${v.id}/pubblica` });
    expect(pubblicato.json().stato).toBe("pubblicato");

    expect((await app.inject({ method: "DELETE", url: `/viaggi/${v.id}` })).statusCode).toBe(409);

    const ritirato = await app.inject({ method: "POST", url: `/viaggi/${v.id}/ritira` });
    expect(ritirato.json().stato).toBe("bozza");

    expect((await app.inject({ method: "DELETE", url: `/viaggi/${v.id}` })).statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: `/viaggi/${v.id}` })).statusCode).toBe(404);
  });
});

describe("slug", () => {
  it("toglie accenti e simboli", () => {
    expect(creaSlug("Perù e Machu Picchù!", "2027-03-10")).toBe("peru-e-machu-picchu-marzo-2027");
  });
});
