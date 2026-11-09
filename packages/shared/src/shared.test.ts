import { describe, expect, it } from "vitest";
import { euroInCentesimi, formattaEuro, problemiPerPubblicare, viaggioInputSchema } from "./index.js";

const base = {
  titolo: "Islanda in agosto",
  destinazione: "Islanda",
  dataInizio: "2027-08-01",
  dataFine: "2027-08-08",
  prezzoCentesimi: 129000,
  accontoCentesimi: 30000,
  postiTotali: 14,
};

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

describe("validità di un viaggio", () => {
  it("accetta un viaggio valido e mette i valori predefiniti", () => {
    const r = viaggioInputSchema.parse(base);
    expect(r.tappe).toEqual([]);
    expect(r.descrizione).toBe("");
  });

  it("rifiuta la fine prima dell'inizio e l'acconto più alto del prezzo", () => {
    const r = viaggioInputSchema.safeParse({ ...base, dataFine: "2027-07-01", accontoCentesimi: 999999 });
    expect(r.success).toBe(false);
    const campi = r.error!.issues.map((i) => i.path.join("."));
    expect(campi).toContain("dataFine");
    expect(campi).toContain("accontoCentesimi");
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
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.message)).toEqual(["Il giorno 1 è ripetuto", "Il viaggio dura 8 giorni"]);
  });

  it("dice cosa manca per pubblicare", () => {
    const v = viaggioInputSchema.parse(base);
    expect(problemiPerPubblicare(v, "2026-11-09")).toHaveLength(3);
    const completo = viaggioInputSchema.parse({
      ...base,
      descrizione: "Una settimana tra ghiacciai e cascate.",
      istruzioniPagamento: "IBAN IT00 X000 0000 0000 0000 0000 000",
      tappe: [{ giorno: 1, titolo: "Arrivo a Reykjavik" }],
    });
    expect(problemiPerPubblicare(completo, "2026-11-09")).toEqual([]);
  });
});
