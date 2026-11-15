// Test delle traduzioni dei viaggi: bozza, approvazione, "superata" quando cambia l'italiano,
// e cosa arriva al sito pubblico (solo le traduzioni approvate e aggiornate).
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app, chiedi, chiudi, svuota, viaggioCompleto, viaggioPubblicatoConPartenza } from "./aiuti.js";

beforeEach(svuota);
afterAll(async () => {
  await app.close();
  await chiudi();
});

const inglese = {
  titolo: "Iceland: fire & ice",
  sottotitolo: "Eight days on the road among glaciers and waterfalls",
  destinazione: "Iceland",
  descrizione: "A week among glaciers, waterfalls and hot springs.",
  incluso: ["Double rooms", "4x4 car", "Coordinator"],
  istruzioniPagamento: "Bank transfer to IBAN IT00 X000 0000 0000 0000 0000 000",
  tappe: [
    { giorno: 1, titolo: "Arrival in Reykjavik" },
    { giorno: 2, titolo: "Golden Circle", descrizione: "Geysers and waterfalls" },
  ],
};

const stato = (r: { traduzioni: { lingua: string; stato: string }[] }, lingua: string) =>
  r.traduzioni.find((t) => t.lingua === lingua)!.stato;

describe("traduzioni nel gestionale", () => {
  it("parte da 'mancante' per inglese e arabo, e dice se c'è il traduttore automatico", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    const r = await chiedi("GET", `/viaggi/${v.id}/traduzioni`);
    expect(r.automatica).toBe("Finto");
    expect(r.traduzioni.map((t: { lingua: string; stato: string }) => [t.lingua, t.stato])).toEqual([
      ["en", "mancante"],
      ["ar", "mancante"],
    ]);
  });

  it("salva una traduzione incollata come bozza, poi la approva", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    const bozza = await chiedi("PUT", `/viaggi/${v.id}/traduzioni/en`, inglese);
    expect(stato(bozza, "en")).toBe("da_rivedere");
    const approvata = await chiedi("POST", `/viaggi/${v.id}/traduzioni/en/approva`);
    expect(stato(approvata, "en")).toBe("approvata");
    expect(approvata.traduzioni[0].approvataIl).not.toBeNull();
  });

  it("rifiuta una traduzione con giorni diversi dall'itinerario", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    const r = await chiedi("PUT", `/viaggi/${v.id}/traduzioni/en`, { ...inglese, tappe: [inglese.tappe[0]] }, 409);
    expect(r.errore).toContain("giorni");
  });

  it("rifiuta testi non validi e lingue non previste", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    await chiedi("PUT", `/viaggi/${v.id}/traduzioni/en`, { ...inglese, titolo: "" }, 400);
    await chiedi("PUT", `/viaggi/${v.id}/traduzioni/fr`, inglese, 404);
    await chiedi("POST", `/viaggi/${v.id}/traduzioni/ar/approva`, undefined, 409);
  });

  it("la traduzione automatica traduce ogni campo e lascia vuoti quelli vuoti", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    const r = await chiedi("POST", `/viaggi/${v.id}/traduzioni/ar/automatica`);
    const t = r.traduzioni.find((x: { lingua: string }) => x.lingua === "ar");
    expect(t.stato).toBe("da_rivedere");
    expect(t.testi.titolo).toBe("[ar] Islanda: fuoco & ghiaccio");
    expect(t.testi.incluso).toEqual(["[ar] Alloggi in camera doppia", "[ar] Auto 4x4", "[ar] Coordinatore"]);
    expect(t.testi.tappe[1]).toEqual({ giorno: 2, titolo: "[ar] Circolo d'oro", descrizione: "[ar] Geyser e cascate" });
    expect(t.testi.tappe[0].descrizione).toBe("");
    expect(t.testi.infoUtili).toBe("");
  });

  it("se cambia l'italiano la traduzione approvata diventa 'superata', e si può riapprovare", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    await chiedi("PUT", `/viaggi/${v.id}/traduzioni/en`, inglese);
    await chiedi("POST", `/viaggi/${v.id}/traduzioni/en/approva`);
    await chiedi("PUT", `/viaggi/${v.id}`, { ...viaggioCompleto, descrizione: "Una settimana tra ghiacciai e vulcani." });
    const dopo = await chiedi("GET", `/viaggi/${v.id}/traduzioni`);
    expect(stato(dopo, "en")).toBe("superata");
    const di_nuovo = await chiedi("POST", `/viaggi/${v.id}/traduzioni/en/approva`);
    expect(stato(di_nuovo, "en")).toBe("approvata");
  });
});

describe("traduzioni sul sito pubblico", () => {
  it("il sito riceve solo le traduzioni approvate e aggiornate", async () => {
    const { viaggio: v } = await viaggioPubblicatoConPartenza();
    await chiedi("PUT", `/viaggi/${v.id}/traduzioni/en`, inglese);
    await chiedi("POST", `/viaggi/${v.id}/traduzioni/ar/automatica`);

    // Bozze: il sito non vede niente.
    let pagina = await chiedi("GET", `/pubblico/viaggi/${v.slug}`);
    expect(pagina.traduzioni).toEqual({});

    // Approvata l'inglese: arriva solo quella.
    await chiedi("POST", `/viaggi/${v.id}/traduzioni/en/approva`);
    pagina = await chiedi("GET", `/pubblico/viaggi/${v.slug}`);
    expect(Object.keys(pagina.traduzioni)).toEqual(["en"]);
    expect(pagina.traduzioni.en.titolo).toBe("Iceland: fire & ice");
    const [nelCatalogo] = await chiedi("GET", "/pubblico/viaggi");
    expect(nelCatalogo.traduzioni.en.destinazione).toBe("Iceland");

    // Cambia l'italiano: la traduzione sparisce dal sito finché non si riapprova.
    await chiedi("PUT", `/viaggi/${v.id}`, { ...viaggioCompleto, sottotitolo: "Nuovo sottotitolo" });
    pagina = await chiedi("GET", `/pubblico/viaggi/${v.slug}`);
    expect(pagina.traduzioni).toEqual({});
  });
});
