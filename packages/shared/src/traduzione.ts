// TRADUZIONI dei testi di un viaggio (inglese e arabo) per il sito pubblico.
//
// Come funziona (vedi D31 in docs/decisioni.md):
//   1. nel gestionale si preme "Traduci": un servizio automatico propone una traduzione,
//      che viene salvata come BOZZA ("da rivedere");
//   2. l'organizzatore la rilegge, la corregge se serve e preme "Approva";
//   3. solo le traduzioni approvate vanno sul sito;
//   4. se poi cambia il testo italiano, la traduzione approvata torna "da rivedere"
//      (e il sito torna a mostrare l'italiano) finché qualcuno non la riapprova.
//
// Per accorgerci che l'italiano è cambiato salviamo un'"impronta" del testo italiano
// (vedi improntaOriginale): se l'impronta di oggi è diversa, la traduzione è superata.
import { z } from "zod";
import type { ViaggioInput } from "./viaggio.js";

/** Le lingue in cui si traducono i viaggi. L'italiano è l'originale. */
export const LINGUE_TRADUZIONE = ["en", "ar"] as const;
export type LinguaTraduzione = (typeof LINGUE_TRADUZIONE)[number];
export const NOMI_LINGUE_TRADUZIONE: Record<LinguaTraduzione, string> = { en: "Inglese", ar: "Arabo" };

/**
 * Lo stato di una traduzione, come lo vede il gestionale:
 *  - mancante:    non è mai stata fatta
 *  - da_rivedere: c'è una bozza da rileggere e approvare (non è sul sito)
 *  - approvata:   è sul sito
 *  - superata:    era approvata, ma poi è cambiato il testo italiano (non è più sul sito)
 * Nel database si salvano solo "da_rivedere" e "approvata": "mancante" e "superata" si calcolano.
 */
export const STATI_TRADUZIONE_SALVATI = ["da_rivedere", "approvata"] as const;
export type StatoTraduzione = "mancante" | "da_rivedere" | "approvata" | "superata";
export const ETICHETTE_STATI_TRADUZIONE: Record<StatoTraduzione, string> = {
  mancante: "Da fare",
  da_rivedere: "Da rivedere",
  approvata: "Approvata, sul sito",
  superata: "Da rivedere: l'italiano è cambiato",
};

const elenco = z.array(z.string().trim()).default([]).transform((r) => r.filter((x) => x.length > 0));

/** I testi tradotti di un viaggio. Le tappe sono legate all'originale dal numero del giorno. */
export const testiTradottiSchema = z.object({
  titolo: z.string().trim().min(1, "Scrivi il titolo").max(160),
  sottotitolo: z.string().trim().max(200).default(""),
  destinazione: z.string().trim().min(1, "Scrivi la destinazione").max(120),
  descrizione: z.string().trim().default(""),
  fasciaEta: z.string().trim().max(60).default(""),
  puntiForti: elenco,
  incluso: elenco,
  nonIncluso: elenco,
  infoUtili: z.string().trim().default(""),
  istruzioniPagamento: z.string().trim().default(""),
  tappe: z
    .array(
      z.object({
        giorno: z.int().min(1),
        titolo: z.string().trim().min(1, "Scrivi il titolo del giorno"),
        descrizione: z.string().trim().default(""),
      }),
    )
    .default([]),
});
export type TestiTradotti = z.infer<typeof testiTradottiSchema>;

/** I campi del viaggio che si traducono (gli altri, come prezzi o stili, non hanno testo libero). */
export type TestiDaTradurre = Pick<
  ViaggioInput,
  | "titolo"
  | "sottotitolo"
  | "destinazione"
  | "descrizione"
  | "fasciaEta"
  | "puntiForti"
  | "incluso"
  | "nonIncluso"
  | "infoUtili"
  | "istruzioniPagamento"
  | "tappe"
>;

/** Una traduzione come la restituisce l'API al gestionale. */
export type Traduzione = {
  lingua: LinguaTraduzione;
  stato: StatoTraduzione;
  /** null se la traduzione è "mancante". */
  testi: TestiTradotti | null;
  /** Quando è stata salvata l'ultima volta (ISO), null se mancante. */
  aggiornataIl: string | null;
  approvataIl: string | null;
};

/** Prende da un viaggio solo i testi da tradurre, sempre nello stesso ordine. */
export function testiDaTradurre(v: TestiDaTradurre): TestiTradotti {
  return {
    titolo: v.titolo,
    sottotitolo: v.sottotitolo,
    destinazione: v.destinazione,
    descrizione: v.descrizione,
    fasciaEta: v.fasciaEta,
    puntiForti: [...v.puntiForti],
    incluso: [...v.incluso],
    nonIncluso: [...v.nonIncluso],
    infoUtili: v.infoUtili,
    istruzioniPagamento: v.istruzioniPagamento,
    tappe: [...v.tappe]
      .sort((a, b) => a.giorno - b.giorno)
      .map((t) => ({ giorno: t.giorno, titolo: t.titolo, descrizione: t.descrizione ?? "" })),
  };
}

/**
 * L'"impronta" del testo italiano: una stringa che cambia se cambia anche una sola parola.
 * È semplicemente il testo stesso in JSON. Non serve un hash: la colonna è un testo
 * qualunque e confrontarla costa pochissimo, e così è anche leggibile se serve controllare.
 */
export function improntaOriginale(v: TestiDaTradurre): string {
  return JSON.stringify(testiDaTradurre(v));
}

/**
 * Trasforma i testi in un elenco piatto di frasi, nell'ordine fisso dei campi, e dà la
 * funzione per ricomporli. Serve ai servizi di traduzione, che vogliono un elenco di testi.
 * I testi vuoti non si mandano (si risparmiano caratteri della quota gratuita).
 */
export function appiattisci(t: TestiTradotti): { frasi: string[]; ricomponi: (tradotte: string[]) => TestiTradotti } {
  const frasi: string[] = [];
  // Ogni "segnaposto" ricorda dove rimettere la frase tradotta: -1 = era vuota.
  const metti = (s: string) => (s.trim() === "" ? -1 : frasi.push(s) - 1);
  const pos = {
    titolo: metti(t.titolo),
    sottotitolo: metti(t.sottotitolo),
    destinazione: metti(t.destinazione),
    descrizione: metti(t.descrizione),
    fasciaEta: metti(t.fasciaEta),
    puntiForti: t.puntiForti.map(metti),
    incluso: t.incluso.map(metti),
    nonIncluso: t.nonIncluso.map(metti),
    infoUtili: metti(t.infoUtili),
    istruzioniPagamento: metti(t.istruzioniPagamento),
    tappe: t.tappe.map((x) => ({ giorno: x.giorno, titolo: metti(x.titolo), descrizione: metti(x.descrizione) })),
  };
  const ricomponi = (tr: string[]): TestiTradotti => {
    const prendi = (i: number) => (i < 0 ? "" : (tr[i] ?? ""));
    return {
      titolo: prendi(pos.titolo),
      sottotitolo: prendi(pos.sottotitolo),
      destinazione: prendi(pos.destinazione),
      descrizione: prendi(pos.descrizione),
      fasciaEta: prendi(pos.fasciaEta),
      puntiForti: pos.puntiForti.map(prendi),
      incluso: pos.incluso.map(prendi),
      nonIncluso: pos.nonIncluso.map(prendi),
      infoUtili: prendi(pos.infoUtili),
      istruzioniPagamento: prendi(pos.istruzioniPagamento),
      tappe: pos.tappe.map((x) => ({ giorno: x.giorno, titolo: prendi(x.titolo), descrizione: prendi(x.descrizione) })),
    };
  };
  return { frasi, ricomponi };
}
