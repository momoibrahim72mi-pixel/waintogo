// Test del percorso di una prenotazione: partenze, richiesta dal sito, posti,
// lista d'attesa, pagamenti e cruscotto.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  app,
  chiedi,
  chiudi,
  partenzaAgosto,
  persona,
  svuota,
  viaggioCompleto,
  viaggioPubblicatoConPartenza,
} from "./aiuti.js";

beforeEach(svuota);
afterAll(async () => {
  await app.close();
  await chiudi();
});

const richiesta = (partenzaId: string, n = 1) => ({ ...persona(n), partenzaId, privacy: true });

describe("partenze", () => {
  it("calcola la data di ritorno dalla durata del viaggio", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza();
    expect(partenza.dataFine).toBe("2027-08-08");
    expect(partenza.postiLiberi).toBe(14);
    expect(partenza.garantita).toBe(false);
  });

  it("rifiuta un minimo più alto dei posti", async () => {
    const v = await chiedi("POST", "/viaggi", viaggioCompleto, 201);
    const r = await chiedi("POST", `/viaggi/${v.id}/partenze`, { ...partenzaAgosto, minimoPartecipanti: 20 }, 400);
    expect(r.campi).toHaveProperty("minimoPartecipanti");
  });

  it("non lascia scendere i posti sotto quelli occupati", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza();
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id, 1), 201);
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id, 2), 201);
    await chiedi("PUT", `/partenze/${partenza.id}`, { ...partenzaAgosto, postiTotali: 1, minimoPartecipanti: 1 }, 409);
  });
});

describe("sito pubblico", () => {
  it("mostra solo viaggi pubblicati e partenze future non annullate", async () => {
    const { viaggio } = await viaggioPubblicatoConPartenza();
    await chiedi("POST", `/viaggi/${viaggio.id}/partenze`, { ...partenzaAgosto, dataInizio: "2026-10-01" }, 201);
    const annullata = await chiedi(
      "POST",
      `/viaggi/${viaggio.id}/partenze`,
      { ...partenzaAgosto, dataInizio: "2027-09-01", prezzoCentesimi: 99000 },
      201,
    );
    await chiedi("POST", `/partenze/${annullata.id}/annulla`);
    await chiedi("POST", "/viaggi", { ...viaggioCompleto, titolo: "Bozza nascosta" }, 201);

    const catalogo = await chiedi("GET", "/pubblico/viaggi");
    expect(catalogo).toHaveLength(1);
    expect(catalogo[0].partenze).toHaveLength(1);
    expect(catalogo[0].prezzoDaCentesimi).toBe(129000);
    expect(catalogo[0]).not.toHaveProperty("stato");

    const pagina = await chiedi("GET", `/pubblico/viaggi/${viaggio.slug}`);
    expect(pagina.titolo).toBe(viaggioCompleto.titolo);
    await chiedi("GET", "/pubblico/viaggi/bozza-nascosta", undefined, 404);
  });

  it("una richiesta tiene il posto e restituisce codice e istruzioni", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza();
    const ricevuta = await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id), 201);
    expect(ricevuta.codice).toMatch(/^WTG-[2-9A-HJKMNP-Z]{6}$/);
    expect(ricevuta.stato).toBe("richiesta");
    expect(ricevuta.accontoCentesimi).toBe(30000);
    expect(ricevuta.istruzioniPagamento).toContain("IBAN");
    expect((await chiedi("GET", `/partenze/${partenza.id}`)).postiLiberi).toBe(13);
  });

  it("senza consenso privacy la richiesta è rifiutata", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza();
    const r = await chiedi("POST", "/pubblico/iscrizioni", { ...richiesta(partenza.id), privacy: false }, 400);
    expect(r.campi).toHaveProperty("privacy");
  });

  it("non accetta richieste su partenze annullate", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza();
    await chiedi("POST", `/partenze/${partenza.id}/annulla`);
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id), 409);
  });

  it("quando i posti finiscono si entra in lista d'attesa, anche con richieste simultanee", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza({ ...partenzaAgosto, postiTotali: 1, minimoPartecipanti: 1 });
    // Due richieste nello stesso istante per l'ultimo posto.
    const [a, b] = await Promise.all([
      chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id, 1), 201),
      chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id, 2), 201),
    ]);
    expect([a.stato, b.stato].sort()).toEqual(["lista_attesa", "richiesta"]);

    const dettaglio = await chiedi("GET", `/partenze/${partenza.id}`);
    expect(dettaglio.postiLiberi).toBe(0);
    expect(dettaglio.inAttesa).toBe(1);
  });
});

describe("gestionale: iscritti e pagamenti", () => {
  it("il primo pagamento conferma l'iscrizione e il saldo la chiude", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza({ ...partenzaAgosto, minimoPartecipanti: 1 });
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id), 201);
    let p = await chiedi("GET", `/partenze/${partenza.id}`);
    const id = p.iscrizioni[0].id;
    expect(p.iscrizioni[0].statoPagamento).toBe("da_pagare");

    const pagamento = { importoCentesimi: 30000, data: "2026-11-10", metodo: "bonifico", nota: "CRO 123" };
    p = await chiedi("POST", `/iscrizioni/${id}/pagamenti`, pagamento, 201);
    expect(p.iscrizioni[0].stato).toBe("confermata");
    expect(p.iscrizioni[0].statoPagamento).toBe("acconto_versato");
    expect(p.garantita).toBe(true);

    p = await chiedi("POST", `/iscrizioni/${id}/pagamenti`, { ...pagamento, importoCentesimi: 99000, metodo: "revolut" }, 201);
    expect(p.iscrizioni[0].statoPagamento).toBe("saldato");
    expect(p.incassatoCentesimi).toBe(129000);

    // Un pagamento inserito per sbaglio si può togliere.
    p = await chiedi("DELETE", `/pagamenti/${p.iscrizioni[0].pagamenti[1].id}`);
    expect(p.iscrizioni[0].statoPagamento).toBe("acconto_versato");
  });

  it("non conferma dalla lista d'attesa se non ci sono posti, sì dopo un annullamento", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza({ ...partenzaAgosto, postiTotali: 1, minimoPartecipanti: 1 });
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id, 1), 201);
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id, 2), 201);
    const [primo, secondo] = (await chiedi("GET", `/partenze/${partenza.id}`)).iscrizioni;
    expect(secondo.stato).toBe("lista_attesa");

    await chiedi("POST", `/iscrizioni/${secondo.id}/stato`, { stato: "confermata" }, 409);
    await chiedi("POST", `/iscrizioni/${secondo.id}/pagamenti`, { importoCentesimi: 100, data: "2026-11-10", metodo: "bonifico" }, 409);
    await chiedi("POST", `/iscrizioni/${primo.id}/stato`, { stato: "annullata" });
    const p = await chiedi("POST", `/iscrizioni/${secondo.id}/stato`, { stato: "confermata" });
    expect(p.iscrizioni.map((i: { stato: string }) => i.stato)).toEqual(["annullata", "confermata"]);
  });

  it("aggiunge un iscritto a mano", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza();
    const p = await chiedi("POST", `/partenze/${partenza.id}/iscrizioni`, { ...persona(), note: "Prenotato al telefono" }, 201);
    expect(p.iscrizioni[0].note).toBe("Prenotato al telefono");
  });

  it("non elimina una partenza con iscritti", async () => {
    const { partenza } = await viaggioPubblicatoConPartenza();
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id), 201);
    await chiedi("DELETE", `/partenze/${partenza.id}`, undefined, 409);
  });
});

describe("cruscotto", () => {
  it("elenca prossime partenze e cose da fare", async () => {
    // Partenza tra 20 giorni: i saldi vanno sollecitati (oggi nei test è il 2026-11-09).
    const { partenza } = await viaggioPubblicatoConPartenza({ ...partenzaAgosto, dataInizio: "2026-11-29", postiTotali: 2, minimoPartecipanti: 1 });
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id, 1), 201);
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id, 2), 201);
    await chiedi("POST", "/pubblico/iscrizioni", richiesta(partenza.id, 3), 201);
    const [primo] = (await chiedi("GET", `/partenze/${partenza.id}`)).iscrizioni;
    await chiedi("POST", `/iscrizioni/${primo.id}/pagamenti`, { importoCentesimi: 30000, data: "2026-11-09", metodo: "bonifico" }, 201);

    const c = await chiedi("GET", "/cruscotto");
    expect(c.prossimePartenze).toHaveLength(1);
    expect(c.prossimePartenze[0].viaggioTitolo).toBe(viaggioCompleto.titolo);
    expect(c.prossimePartenze[0].incassatoCentesimi).toBe(30000);
    expect(c.prossimePartenze[0].daIncassareCentesimi).toBe(2 * 129000 - 30000);
    expect(c.daConfermare).toHaveLength(1);
    expect(c.inAttesa).toHaveLength(1);
    expect(c.saldiDaSollecitare.map((i: { nome: string }) => i.nome)).toEqual(["Persona1"]);
  });
});
