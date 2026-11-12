// Calcoli sulle partenze a partire dalle iscrizioni. Sono "funzioni pure":
// ricevono dati e restituiscono risultati, senza toccare il database. Facili da testare.
import type { partenze } from "@waintogo/db";
import { aggiungiGiorni, type Partenza, type StatoIscrizione } from "@waintogo/shared";

type RigaPartenza = typeof partenze.$inferSelect;

/** Gli stati che tengono occupato un posto. */
export const OCCUPANO_POSTO: StatoIscrizione[] = ["richiesta", "confermata"];

export function calcolaPartenza(
  p: RigaPartenza,
  durataGiorni: number,
  iscrizioni: { stato: StatoIscrizione }[],
): Partenza {
  const conta = (stati: StatoIscrizione[]) => iscrizioni.filter((i) => stati.includes(i.stato)).length;
  const postiOccupati = conta(OCCUPANO_POSTO);
  const confermate = conta(["confermata"]);
  return {
    id: p.id,
    viaggioId: p.viaggioId,
    dataInizio: p.dataInizio,
    dataFine: aggiungiGiorni(p.dataInizio, durataGiorni - 1),
    prezzoCentesimi: p.prezzoCentesimi,
    accontoCentesimi: p.accontoCentesimi,
    postiTotali: p.postiTotali,
    minimoPartecipanti: p.minimoPartecipanti,
    coordinatore: p.coordinatore,
    annullata: p.annullata,
    postiOccupati,
    postiLiberi: Math.max(0, p.postiTotali - postiOccupati),
    confermate,
    inAttesa: conta(["lista_attesa"]),
    garantita: confermate >= p.minimoPartecipanti,
  };
}
