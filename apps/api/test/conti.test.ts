// Test di spese e conti: registrare spese, saldo, mesi e margine delle partenze.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app, chiedi, chiudi, persona, svuota, viaggioPubblicatoConPartenza } from "./aiuti.js";

beforeEach(svuota);
afterAll(async () => {
  await app.close();
  await chiudi();
});

const spesa = (altro: object) => ({ descrizione: "Voli A/R", categoria: "volo", importoCentesimi: 100000, data: "2026-11-01", pagata: true, ...altro });

describe("spese", () => {
  it("rifiuta dati sbagliati e partenze inesistenti", async () => {
    const r = await chiedi("POST", "/spese", { descrizione: "x", importoCentesimi: 0 }, 400);
    expect(Object.keys(r.campi)).toEqual(expect.arrayContaining(["descrizione", "categoria", "importoCentesimi", "data"]));
    const r2 = await chiedi("POST", "/spese", spesa({ partenzaId: "00000000-0000-4000-8000-000000000000" }), 400);
    expect(r2.campi.partenzaId).toBe("Partenza non trovata");
  });

  it("crea, filtra, segna pagata ed elimina", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza();
    const diPartenza = await chiedi("POST", "/spese", spesa({ partenzaId: partenza.id, pagata: false }), 201);
    expect(diPartenza.partenza).toMatchObject({ id: partenza.id, viaggioTitolo: "Islanda: fuoco & ghiaccio" });
    const generale = await chiedi("POST", "/spese", spesa({ descrizione: "Pubblicità", categoria: "pubblicita" }), 201);
    expect(generale.partenza).toBeNull();

    expect(await chiedi("GET", "/spese")).toHaveLength(2);
    expect((await chiedi("GET", "/spese?partenza=generali")).map((s: { id: string }) => s.id)).toEqual([generale.id]);
    expect((await chiedi("GET", `/spese?partenza=${partenza.id}`)).map((s: { id: string }) => s.id)).toEqual([diPartenza.id]);

    const { id, partenza: _p, ...dati } = diPartenza;
    expect((await chiedi("PUT", `/spese/${id}`, { ...dati, pagata: true })).pagata).toBe(true);

    // La pagina della partenza mostra le sue spese e il totale dei costi.
    const dettaglio = await chiedi("GET", `/partenze/${partenza.id}`);
    expect(dettaglio.spese).toHaveLength(1);
    expect(dettaglio.costiCentesimi).toBe(100000);
    // Con delle spese, la partenza non si può eliminare.
    await chiedi("DELETE", `/partenze/${partenza.id}`, undefined, 409);

    await chiedi("DELETE", `/spese/${id}`, undefined, 204);
    expect(await chiedi("GET", "/spese")).toHaveLength(1);
  });
});

describe("conti", () => {
  it("calcola saldo, mesi e margine delle partenze", async () => {
    // Partenza ad agosto 2027: 1.290 € a persona, acconto 300 €.
    const { partenza } = await viaggioPubblicatoConPartenza();
    const iscrivi = async (n: number) => {
      const p = await chiedi("POST", `/partenze/${partenza.id}/iscrizioni`, persona(n), 201);
      return p.iscrizioni.at(-1).id as string;
    };
    const paga = (id: string, importoCentesimi: number, data: string) =>
      chiedi("POST", `/iscrizioni/${id}/pagamenti`, { importoCentesimi, data, metodo: "bonifico" }, 201);

    const anna = await iscrivi(1);
    const bruno = await iscrivi(2);
    const carla = await iscrivi(3);
    await paga(anna, 30000, "2026-11-05");
    await paga(bruno, 129000, "2026-11-07");
    await paga(carla, 30000, "2026-10-01");
    // Carla annulla e le restituiamo l'acconto: il rimborso è una spesa della partenza.
    await chiedi("POST", `/iscrizioni/${carla}/stato`, { stato: "annullata" });
    await chiedi("POST", "/spese", spesa({ descrizione: "Rimborso Carla", categoria: "rimborso", importoCentesimi: 30000, data: "2026-10-15", partenzaId: partenza.id }), 201);
    // Costi della partenza: voli pagati, hotel ancora da pagare.
    await chiedi("POST", "/spese", spesa({ importoCentesimi: 400000, partenzaId: partenza.id }), 201);
    await chiedi("POST", "/spese", spesa({ descrizione: "Hotel", categoria: "alloggio", importoCentesimi: 200000, data: "2027-07-01", pagata: false, partenzaId: partenza.id }), 201);
    // Una spesa generale.
    await chiedi("POST", "/spese", spesa({ descrizione: "Pubblicità", categoria: "pubblicita", importoCentesimi: 15000, data: "2026-11-02" }), 201);

    const c2026 = await chiedi("GET", "/conti");
    expect(c2026.anno).toBe(2026);
    expect(c2026.saldo).toEqual({
      entrateCentesimi: 189000, // 300 + 1.290 + 300
      usciteCentesimi: 445000, // rimborso 300 + voli 4.000 + pubblicità 150
      saldoCentesimi: -256000,
      daPagareCentesimi: 200000, // l'hotel
      daIncassareCentesimi: 99000, // Anna deve ancora 990 €, Bruno ha saldato
    });
    expect(c2026.mesi).toHaveLength(12);
    expect(c2026.mesi[9]).toEqual({ mese: "2026-10", entrateCentesimi: 30000, usciteCentesimi: 30000 });
    expect(c2026.mesi[10]).toEqual({ mese: "2026-11", entrateCentesimi: 159000, usciteCentesimi: 415000 });
    expect(c2026.partenze).toEqual([]); // la partenza è nel 2027

    const c2027 = await chiedi("GET", "/conti?anno=2027");
    expect(c2027.partenze).toEqual([
      {
        id: partenza.id,
        viaggioTitolo: "Islanda: fuoco & ghiaccio",
        dataInizio: "2027-08-01",
        annullata: false,
        ricaviAttesiCentesimi: 288000, // 2 × 1.290 + l'acconto trattenuto di Carla
        incassatoCentesimi: 189000,
        costiCentesimi: 630000,
        costiPagatiCentesimi: 430000,
        margineCentesimi: -342000,
      },
    ]);

    await chiedi("GET", "/conti?anno=abc", undefined, 400);
  });
});
