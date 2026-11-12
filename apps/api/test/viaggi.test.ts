// Test delle API dei viaggi (gestionale) su un Postgres vero.
// app.inject() simula una richiesta HTTP senza aprire porte: veloce e affidabile.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { creaSlug } from "../src/viaggi/archivio.js";
import { app, chiedi, chiudi, partenzaAgosto, svuota, viaggioBozza, viaggioCompleto } from "./aiuti.js";

beforeEach(svuota);
afterAll(async () => {
  await app.close();
  await chiudi();
});

describe("creazione e lettura", () => {
  it("crea un viaggio come bozza, con slug e tappe ordinate", async () => {
    const v = await chiedi("POST", "/viaggi", { ...viaggioCompleto, tappe: [...viaggioCompleto.tappe].reverse() }, 201);
    expect(v.stato).toBe("bozza");
    expect(v.slug).toBe("islanda-fuoco-ghiaccio");
    expect(v.creatoIl).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(v.tappe.map((t: { giorno: number }) => t.giorno)).toEqual([1, 2]);
    expect(v.partenze).toEqual([]);
    expect(await chiedi("GET", "/viaggi")).toHaveLength(1);
  });

  it("rende unico lo slug se il titolo si ripete", async () => {
    await chiedi("POST", "/viaggi", viaggioBozza, 201);
    const secondo = await chiedi("POST", "/viaggi", viaggioBozza, 201);
    expect(secondo.slug).toBe("islanda-fuoco-ghiaccio-2");
  });

  it("rifiuta dati non validi indicando i campi", async () => {
    const r = await chiedi("POST", "/viaggi", { ...viaggioBozza, titolo: "", durataGiorni: 0 }, 400);
    expect(Object.keys(r.campi)).toEqual(["titolo", "durataGiorni"]);
  });

  it("risponde 404 per un viaggio che non esiste o un id sbagliato", async () => {
    await chiedi("GET", "/viaggi/non-un-id", undefined, 404);
    await chiedi("GET", `/viaggi/${crypto.randomUUID()}`, undefined, 404);
  });
});

describe("modifica", () => {
  it("sostituisce dati e tappe ma non lo slug", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    const r = await chiedi("PUT", `/viaggi/${v.id}`, {
      ...viaggioCompleto,
      titolo: "Islanda d'estate",
      tappe: [{ giorno: 3, titolo: "Laguna glaciale" }],
    });
    expect(r.titolo).toBe("Islanda d'estate");
    expect(r.slug).toBe(v.slug);
    expect(r.tappe).toEqual([{ giorno: 3, titolo: "Laguna glaciale", descrizione: "" }]);
  });

  it("non lascia un viaggio pubblicato diventare incompleto", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    await chiedi("POST", `/viaggi/${v.id}/pubblica`);
    const r = await chiedi("PUT", `/viaggi/${v.id}`, { ...viaggioCompleto, tappe: [] }, 409);
    expect(r.problemi).toEqual(["Aggiungi almeno un giorno di itinerario"]);
  });
});

describe("pubblicazione ed eliminazione", () => {
  it("rifiuta una bozza incompleta spiegando cosa manca", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioBozza, 201);
    const r = await chiedi("POST", `/viaggi/${v.id}/pubblica`, undefined, 409);
    expect(r.problemi).toHaveLength(5);
  });

  it("pubblica, ritira ed elimina solo le bozze senza partenze", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    expect((await chiedi("POST", `/viaggi/${v.id}/pubblica`)).stato).toBe("pubblicato");
    await chiedi("DELETE", `/viaggi/${v.id}`, undefined, 409);
    expect((await chiedi("POST", `/viaggi/${v.id}/ritira`)).stato).toBe("bozza");

    const p = await chiedi("POST", `/viaggi/${v.id}/partenze`, partenzaAgosto, 201);
    await chiedi("DELETE", `/viaggi/${v.id}`, undefined, 409);
    await chiedi("DELETE", `/partenze/${p.id}`, undefined, 204);
    await chiedi("DELETE", `/viaggi/${v.id}`, undefined, 204);
    await chiedi("GET", `/viaggi/${v.id}`, undefined, 404);
  });
});

describe("slug", () => {
  it("toglie accenti e simboli", () => {
    expect(creaSlug("Perù e Machu Picchù!")).toBe("peru-e-machu-picchu");
  });
});
