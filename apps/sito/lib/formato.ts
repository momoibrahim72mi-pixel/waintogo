// Formattazione di date e prezzi per le pagine del sito.
import { formattaEuro } from "@waintogo/shared";

const opzioni = { timeZone: "UTC" } as const;

/** "2027-08-01" → "1 ago" (con l'anno se diverso dall'anno della seconda data) */
export function dataBreve(data: string, conAnno = false) {
  return new Date(`${data}T00:00:00Z`).toLocaleDateString("it-IT", {
    ...opzioni,
    day: "numeric",
    month: "short",
    ...(conAnno ? { year: "numeric" } : {}),
  });
}

/** "1 – 8 ago 2027" oppure "28 ago – 4 set 2027" */
export function intervallo(da: string, a: string) {
  const stessoMese = da.slice(0, 7) === a.slice(0, 7);
  const inizio = stessoMese ? String(Number(da.slice(8))) : dataBreve(da);
  return `${inizio} – ${dataBreve(a, true)}`;
}

/** "2027-08" → "Agosto 2027" */
export function nomeMese(mese: string) {
  const testo = new Date(`${mese}-01T00:00:00Z`).toLocaleDateString("it-IT", { ...opzioni, month: "long", year: "numeric" });
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}

/** Prezzo senza centesimi se tondo: 129000 → "1.290 €" */
export function prezzo(centesimi: number) {
  return formattaEuro(centesimi).replace(",00", "");
}
