// Formattazione di date e importi nel gestionale.
import { formattaEuro } from "@waintogo/shared";

/** "2027-08-01" → "1 ago 2027" */
export function formattaData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

/** Importo per un campo di testo: 129000 → "1.290", 129050 → "1.290,50" */
export function euroPerCampo(centesimi: number) {
  return formattaEuro(centesimi).replace(/\s?€/, "").replace(/,00$/, "");
}

export { formattaEuro };

export const oggi = () => new Date().toISOString().slice(0, 10);
