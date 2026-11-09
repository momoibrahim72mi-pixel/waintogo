// Regole di validità di un viaggio, condivise tra API e gestionale.
//
// Usiamo Zod: si descrive com'è fatto un dato valido e Zod ci dà
//  - una funzione che controlla i dati (safeParse) con messaggi d'errore leggibili;
//  - il tipo TypeScript corrispondente (z.infer), senza doverlo riscrivere a mano.
import { z } from "zod";

/** Gli stati possibili di un viaggio. */
export const STATI_VIAGGIO = ["bozza", "pubblicato", "chiuso"] as const;
export type StatoViaggio = (typeof STATI_VIAGGIO)[number];

// Una data nel formato AAAA-MM-GG (quello dei campi <input type="date">).
const data = z.iso.date({ error: "Data non valida" });

/** Un giorno dell'itinerario. */
export const tappaSchema = z.object({
  giorno: z.int().min(1, "Il giorno parte da 1"),
  titolo: z.string().trim().min(1, "Scrivi un titolo per il giorno"),
  descrizione: z.string().trim().default(""),
});

/**
 * I dati che l'organizzatore inserisce nel modulo.
 * Gli importi sono in CENTESIMI (129000 = 1.290,00 €): i numeri interi non hanno
 * errori di arrotondamento, quelli con la virgola sì (0.1 + 0.2 = 0.30000000000000004).
 */
export const viaggioInputSchema = z
  .object({
    titolo: z.string().trim().min(3, "Il titolo deve avere almeno 3 caratteri").max(120),
    destinazione: z.string().trim().min(2, "Indica la destinazione").max(120),
    descrizione: z.string().trim().default(""),
    dataInizio: data,
    dataFine: data,
    prezzoCentesimi: z.int().min(0, "Il prezzo non può essere negativo"),
    accontoCentesimi: z.int().min(0, "L'acconto non può essere negativo"),
    postiTotali: z.int().min(1, "Serve almeno un posto").max(500),
    istruzioniPagamento: z.string().trim().default(""),
    tappe: z.array(tappaSchema).default([]),
  })
  // Regole che coinvolgono più campi insieme: si controllano dopo i singoli campi.
  .superRefine((v, ctx) => {
    if (v.dataFine < v.dataInizio) {
      ctx.addIssue({ code: "custom", path: ["dataFine"], message: "La fine deve venire dopo l'inizio" });
    }
    if (v.accontoCentesimi > v.prezzoCentesimi) {
      ctx.addIssue({ code: "custom", path: ["accontoCentesimi"], message: "L'acconto supera il prezzo" });
    }
    const durata = giorniTra(v.dataInizio, v.dataFine) + 1;
    const visti = new Set<number>();
    v.tappe.forEach((t, i) => {
      if (visti.has(t.giorno)) {
        ctx.addIssue({ code: "custom", path: ["tappe", i, "giorno"], message: `Il giorno ${t.giorno} è ripetuto` });
      }
      visti.add(t.giorno);
      if (t.giorno > durata) {
        ctx.addIssue({ code: "custom", path: ["tappe", i, "giorno"], message: `Il viaggio dura ${durata} giorni` });
      }
    });
  });

export type ViaggioInput = z.infer<typeof viaggioInputSchema>;
export type Tappa = z.infer<typeof tappaSchema>;

/** Un viaggio come lo restituisce l'API: i dati del modulo più i campi gestiti dal sistema. */
export type Viaggio = ViaggioInput & {
  id: string;
  slug: string;
  stato: StatoViaggio;
  creatoIl: string;
  aggiornatoIl: string;
};

/**
 * Cosa manca a un viaggio per poter essere pubblicato.
 * Una bozza può essere incompleta; un viaggio pubblicato no, perché lo vedono i clienti.
 * Restituisce la lista dei problemi: vuota = si può pubblicare.
 */
export function problemiPerPubblicare(v: ViaggioInput, oggi: string): string[] {
  const problemi: string[] = [];
  if (v.descrizione.length < 20) problemi.push("Scrivi una descrizione (almeno 20 caratteri)");
  if (v.tappe.length === 0) problemi.push("Aggiungi almeno un giorno di itinerario");
  if (v.prezzoCentesimi === 0) problemi.push("Indica il prezzo");
  if (v.istruzioniPagamento.length === 0) problemi.push("Scrivi le istruzioni per il pagamento (IBAN o Revolut)");
  if (v.dataInizio <= oggi) problemi.push("La data di inizio deve essere nel futuro");
  return problemi;
}

/** Giorni di differenza tra due date AAAA-MM-GG. */
export function giorniTra(da: string, a: string): number {
  return Math.round((Date.parse(a) - Date.parse(da)) / 86_400_000);
}
