// Regole di validità di un viaggio, condivise tra API, gestionale e sito.
//
// Un VIAGGIO è la "scheda" del catalogo (Islanda on the road, 8 giorni).
// Le date, i prezzi e i posti stanno nelle PARTENZE (vedi partenza.ts):
// lo stesso viaggio può partire più volte nell'anno.
//
// Usiamo Zod: si descrive com'è fatto un dato valido e Zod ci dà
//  - una funzione che controlla i dati (safeParse) con messaggi d'errore leggibili;
//  - il tipo TypeScript corrispondente (z.infer), senza doverlo riscrivere a mano.
import { z } from "zod";
import type { PartenzaPubblica, Partenza } from "./partenza.js";

/** Gli stati possibili di un viaggio. */
export const STATI_VIAGGIO = ["bozza", "pubblicato", "chiuso"] as const;
export type StatoViaggio = (typeof STATI_VIAGGIO)[number];

/** Gli stili di viaggio: servono per i filtri del catalogo e le etichette. */
export const STILI = ["avventura", "natura", "citta", "mare", "cultura", "on-the-road"] as const;
export type Stile = (typeof STILI)[number];
export const ETICHETTE_STILI: Record<Stile, string> = {
  avventura: "Avventura",
  natura: "Natura",
  citta: "Città",
  mare: "Mare",
  cultura: "Cultura",
  "on-the-road": "On the road",
};

/** Quanto è faticoso il viaggio. */
export const LIVELLI = ["facile", "medio", "impegnativo"] as const;
export type Livello = (typeof LIVELLI)[number];

/** Un giorno dell'itinerario. */
export const tappaSchema = z.object({
  giorno: z.int().min(1, "Il giorno parte da 1"),
  titolo: z.string().trim().min(1, "Scrivi un titolo per il giorno"),
  descrizione: z.string().trim().default(""),
});

// Un elenco di frasi brevi (punti forti, cosa è incluso...): le righe vuote si scartano.
const elenco = z.array(z.string().trim()).default([]).transform((righe) => righe.filter((r) => r.length > 0));

/** I dati che l'organizzatore inserisce nel modulo del viaggio. */
export const viaggioInputSchema = z
  .object({
    titolo: z.string().trim().min(3, "Il titolo deve avere almeno 3 caratteri").max(120),
    sottotitolo: z.string().trim().max(160, "Al massimo 160 caratteri").default(""),
    destinazione: z.string().trim().min(2, "Indica la destinazione").max(120),
    descrizione: z.string().trim().default(""),
    durataGiorni: z.int("Indica quanti giorni dura").min(1, "Almeno 1 giorno").max(60),
    stili: z.array(z.enum(STILI)).default([]),
    livello: z.enum(LIVELLI).default("medio"),
    fasciaEta: z.string().trim().max(40).default(""),
    puntiForti: elenco,
    incluso: elenco,
    nonIncluso: elenco,
    infoUtili: z.string().trim().default(""),
    // Per ora un indirizzo web di un'immagine; più avanti caricheremo le foto su Object Storage.
    immagineUrl: z.union([z.url({ protocol: /^https$/, error: "Serve un indirizzo https://" }), z.literal("")]).default(""),
    istruzioniPagamento: z.string().trim().default(""),
    tappe: z.array(tappaSchema).default([]),
  })
  // Regole che coinvolgono più campi insieme: si controllano dopo i singoli campi.
  .superRefine((v, ctx) => {
    const visti = new Set<number>();
    v.tappe.forEach((t, i) => {
      if (visti.has(t.giorno)) {
        ctx.addIssue({ code: "custom", path: ["tappe", i, "giorno"], message: `Il giorno ${t.giorno} è ripetuto` });
      }
      visti.add(t.giorno);
      if (t.giorno > v.durataGiorni) {
        ctx.addIssue({ code: "custom", path: ["tappe", i, "giorno"], message: `Il viaggio dura ${v.durataGiorni} giorni` });
      }
    });
  });

export type ViaggioInput = z.infer<typeof viaggioInputSchema>;
export type Tappa = z.infer<typeof tappaSchema>;

/** Un viaggio come lo restituisce l'API al gestionale. */
export type Viaggio = ViaggioInput & {
  id: string;
  slug: string;
  stato: StatoViaggio;
  creatoIl: string;
  aggiornatoIl: string;
  partenze: Partenza[];
};

/** Un viaggio come lo vede il sito pubblico: niente dati interni, solo partenze future. */
export type ViaggioPubblico = Omit<Viaggio, "stato" | "creatoIl" | "aggiornatoIl" | "partenze"> & {
  partenze: PartenzaPubblica[];
  /** Il prezzo più basso tra le partenze future, in centesimi (null se non ci sono date). */
  prezzoDaCentesimi: number | null;
};

/**
 * Cosa manca a un viaggio per poter essere pubblicato.
 * Una bozza può essere incompleta; un viaggio pubblicato no, perché lo vedono i clienti.
 * Restituisce la lista dei problemi: vuota = si può pubblicare.
 */
export function problemiPerPubblicare(v: ViaggioInput): string[] {
  const problemi: string[] = [];
  if (v.descrizione.length < 20) problemi.push("Scrivi una descrizione (almeno 20 caratteri)");
  if (v.stili.length === 0) problemi.push("Scegli almeno uno stile di viaggio");
  if (v.tappe.length === 0) problemi.push("Aggiungi almeno un giorno di itinerario");
  if (v.incluso.length === 0) problemi.push("Scrivi cosa è incluso nel prezzo");
  if (v.istruzioniPagamento.length === 0) problemi.push("Scrivi le istruzioni per il pagamento (IBAN o Revolut)");
  return problemi;
}

/** Giorni di differenza tra due date AAAA-MM-GG. */
export function giorniTra(da: string, a: string): number {
  return Math.round((Date.parse(a) - Date.parse(da)) / 86_400_000);
}

/** Aggiunge giorni a una data AAAA-MM-GG. */
export function aggiungiGiorni(data: string, giorni: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}
