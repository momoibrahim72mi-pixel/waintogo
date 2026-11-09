// Conversioni tra centesimi (come salviamo i soldi) e testo in euro (come li vede una persona).

// useGrouping "always": in italiano, per regola, i numeri di 4 cifre non avrebbero il punto
// (1290 € invece di 1.290 €). Lo forziamo per avere sempre lo stesso aspetto.
const formato = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", useGrouping: "always" });

/** 129000 → "1.290,00 €" */
export function formattaEuro(centesimi: number): string {
  return formato.format(centesimi / 100);
}

/**
 * Legge un importo scritto da una persona e lo trasforma in centesimi.
 * Accetta "1290", "1.290", "1290,50", "1.290,50". Restituisce null se non è un importo.
 */
export function euroInCentesimi(testo: string): number | null {
  const pulito = testo.trim().replace(/\s|€/g, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(pulito)) return null;
  const [interi, decimali = ""] = pulito.replace(/\./g, "").split(",");
  return Number(interi) * 100 + Number(decimali.padEnd(2, "0"));
}
