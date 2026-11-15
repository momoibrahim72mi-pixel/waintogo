// Formattazione di date e prezzi per le pagine del sito, nella lingua della pagina.
// Usiamo le funzioni Intl del browser/di Node: sanno già come si scrivono date e prezzi
// in italiano, inglese e arabo (nomi dei mesi, ordine giorno/mese, simbolo dell'euro).
import { LOCALE, type Lingua } from "./lingue";

// Le date nel database sono giorni ("2027-08-01") senza ora: le leggiamo come mezzanotte
// UTC e le stampiamo in UTC, così il giorno non "scivola" per colpa del fuso orario.
const utc = (data: string) => new Date(`${data}T00:00:00Z`);

/** "2027-08-01" → "1 ago" / "1 Aug" / "1 أغسطس" (con l'anno se richiesto) */
export function dataBreve(lingua: Lingua, data: string, conAnno = false) {
  return utc(data).toLocaleDateString(LOCALE[lingua], {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(conAnno ? { year: "numeric" } : {}),
  });
}

/**
 * Da una data all'altra: "1–8 ago 2027", "28 ago – 4 set 2027", "28 dic 2027 – 4 gen 2028".
 * (Intl ha anche formatRange, ma in italiano scrive "01–08 ago": lo componiamo noi.)
 */
export function intervallo(lingua: Lingua, da: string, a: string) {
  if (da.slice(0, 7) === a.slice(0, 7)) return `${Number(da.slice(8))}–${dataBreve(lingua, a, true)}`;
  const stessoAnno = da.slice(0, 4) === a.slice(0, 4);
  return `${dataBreve(lingua, da, !stessoAnno)} – ${dataBreve(lingua, a, true)}`;
}

/** "2027-08" → "Agosto 2027" / "August 2027" / "أغسطس 2027" */
export function nomeMese(lingua: Lingua, mese: string) {
  const testo = utc(`${mese}-01`).toLocaleDateString(LOCALE[lingua], { timeZone: "UTC", month: "long", year: "numeric" });
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}

/** Prezzo in euro, senza centesimi se tondo: 129000 → "1.290 €" / "€1,290" / "1,290 €" */
export function prezzo(lingua: Lingua, centesimi: number) {
  const tondo = centesimi % 100 === 0;
  return new Intl.NumberFormat(LOCALE[lingua], {
    style: "currency",
    currency: "EUR",
    // "always": in italiano i numeri di 4 cifre non avrebbero il punto (1290 €), vedi soldi.ts.
    useGrouping: "always",
    minimumFractionDigits: tondo ? 0 : 2,
    maximumFractionDigits: tondo ? 0 : 2,
  }).format(centesimi / 100);
}
