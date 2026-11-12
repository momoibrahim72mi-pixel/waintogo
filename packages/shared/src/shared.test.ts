import { describe, expect, it } from "vitest";
import {
  aggiungiGiorni,
  disponibilita,
  euroInCentesimi,
  formattaEuro,
  iscrizionePubblicaSchema,
  partenzaInputSchema,
  problemiPerPubblicare,
  statoPagamento,
  viaggioInputSchema,
} from "./index.js";

const base = { titolo: "Islanda on the road", destinazione: "Islanda", durataGiorni: 8 };

describe("euro e centesimi", () => {
  it("legge gli importi scritti all'italiana", () => {
    expect(euroInCentesimi("1290")).toBe(129000);
    expect(euroInCentesimi("1.290,5")).toBe(129050);
    expect(euroInCentesimi("12,05 €")).toBe(1205);
    expect(euroInCentesimi("abc")).toBeNull();
    expect(euroInCentesimi("1,234")).toBeNull();
  });

  it("formatta in euro", () => {
    expect(formattaEuro(129050).replace(/\s/g, " ")).toBe("1.290,50 €");
  });
});

describe("viaggio", () => {
  it("accetta un viaggio valido, mette i valori predefiniti e scarta le righe vuote", () => {
    const r = viaggioInputSchema.parse({ ...base, incluso: ["Alloggi", " ", ""] });
    expect(r.tappe).toEqual([]);
    expect(r.livello).toBe("medio");
    expect(r.incluso).toEqual(["Alloggi"]);
  });

  it("rifiuta giorni ripetuti o oltre la durata", () => {
    const r = viaggioInputSchema.safeParse({
      ...base,
      tappe: [
        { giorno: 1, titolo: "Arrivo" },
        { giorno: 1, titolo: "Ancora arrivo" },
        { giorno: 9, titolo: "Troppo tardi" },
      ],
    });
    expect(r.error!.issues.map((i) => i.message)).toEqual(["Il giorno 1 è ripetuto", "Il viaggio dura 8 giorni"]);
  });

  it("accetta solo immagini https", () => {
    expect(viaggioInputSchema.safeParse({ ...base, immagineUrl: "http://x.it/a.jpg" }).success).toBe(false);
    expect(viaggioInputSchema.safeParse({ ...base, immagineUrl: "https://x.it/a.jpg" }).success).toBe(true);
  });

  it("dice cosa manca per pubblicare", () => {
    expect(problemiPerPubblicare(viaggioInputSchema.parse(base))).toHaveLength(5);
    const completo = viaggioInputSchema.parse({
      ...base,
      descrizione: "Una settimana tra ghiacciai e cascate.",
      stili: ["on-the-road"],
      incluso: ["Alloggi"],
      istruzioniPagamento: "IBAN IT00 X000",
      tappe: [{ giorno: 1, titolo: "Arrivo a Reykjavik" }],
    });
    expect(problemiPerPubblicare(completo)).toEqual([]);
  });

  it("calcola le date", () => {
    expect(aggiungiGiorni("2027-02-27", 7)).toBe("2027-03-06");
  });
});

describe("partenza", () => {
  it("rifiuta acconto più alto del prezzo e minimo più alto dei posti", () => {
    const r = partenzaInputSchema.safeParse({
      dataInizio: "2027-08-01",
      prezzoCentesimi: 1000,
      accontoCentesimi: 2000,
      postiTotali: 10,
      minimoPartecipanti: 11,
    });
    expect(r.error!.issues.map((i) => i.path.join("."))).toEqual(["accontoCentesimi", "minimoPartecipanti"]);
  });

  it("sceglie l'etichetta giusta per il sito", () => {
    expect(disponibilita({ postiLiberi: 0, garantita: true }).tipo).toBe("completo");
    expect(disponibilita({ postiLiberi: 1, garantita: false }).testo).toBe("Ultimo posto");
    expect(disponibilita({ postiLiberi: 3, garantita: false }).testo).toBe("Ultimi 3 posti");
    expect(disponibilita({ postiLiberi: 8, garantita: true }).tipo).toBe("garantita");
    expect(disponibilita({ postiLiberi: 8, garantita: false }).testo).toBe("8 posti disponibili");
  });
});

describe("iscrizione e pagamenti", () => {
  it("vuole il consenso privacy e un'email valida", () => {
    const r = iscrizionePubblicaSchema.safeParse({
      partenzaId: crypto.randomUUID(),
      nome: "Anna",
      cognome: "Rossi",
      email: "non-una-email",
      telefono: "+39 333 1234567",
      privacy: false,
    });
    expect(r.error!.issues.map((i) => i.path.join("."))).toEqual(["email", "privacy"]);
  });

  it("calcola lo stato del pagamento", () => {
    expect(statoPagamento(0, 129000, 30000)).toBe("da_pagare");
    expect(statoPagamento(20000, 129000, 30000)).toBe("da_pagare");
    expect(statoPagamento(30000, 129000, 30000)).toBe("acconto_versato");
    expect(statoPagamento(129000, 129000, 30000)).toBe("saldato");
  });
});
