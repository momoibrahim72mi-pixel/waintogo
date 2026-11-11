// Le PARTENZE: le date in cui un viaggio parte, ognuna con prezzo, posti e coordinatore.
import { z } from "zod";

const data = z.iso.date({ error: "Data non valida" });

/** I dati che l'organizzatore inserisce per una partenza. */
export const partenzaInputSchema = z
  .object({
    dataInizio: data,
    prezzoCentesimi: z.int().min(1, "Indica il prezzo"),
    accontoCentesimi: z.int().min(0, "L'acconto non può essere negativo"),
    postiTotali: z.int("Indica i posti").min(1, "Serve almeno un posto").max(500),
    // Sotto questo numero di iscritti confermati il viaggio non è ancora "garantito".
    minimoPartecipanti: z.int("Indica il minimo").min(1, "Almeno 1"),
    coordinatore: z.string().trim().max(80).default(""),
  })
  .superRefine((p, ctx) => {
    if (p.accontoCentesimi > p.prezzoCentesimi) {
      ctx.addIssue({ code: "custom", path: ["accontoCentesimi"], message: "L'acconto supera il prezzo" });
    }
    if (p.minimoPartecipanti > p.postiTotali) {
      ctx.addIssue({ code: "custom", path: ["minimoPartecipanti"], message: "Il minimo supera i posti" });
    }
  });

export type PartenzaInput = z.infer<typeof partenzaInputSchema>;

/** Una partenza con i numeri calcolati dalle iscrizioni. */
export type Partenza = PartenzaInput & {
  id: string;
  viaggioId: string;
  /** Calcolata: dataInizio + durata del viaggio - 1. */
  dataFine: string;
  annullata: boolean;
  /** Richieste + confermate: i posti tenuti. */
  postiOccupati: number;
  postiLiberi: number;
  confermate: number;
  inAttesa: number;
  /** Le confermate hanno raggiunto il minimo: il viaggio si fa di sicuro. */
  garantita: boolean;
};

/** Quello che il sito pubblico mostra di una partenza (niente conteggi interni). */
export type PartenzaPubblica = Pick<
  Partenza,
  "id" | "dataInizio" | "dataFine" | "prezzoCentesimi" | "accontoCentesimi" | "postiLiberi" | "garantita" | "coordinatore"
>;

/** Etichetta da mostrare sul sito per una partenza. */
export function disponibilita(p: Pick<Partenza, "postiLiberi" | "garantita">): {
  testo: string;
  tipo: "completo" | "ultimi" | "garantita" | "disponibile";
} {
  if (p.postiLiberi <= 0) return { testo: "Completo · lista d'attesa", tipo: "completo" };
  if (p.postiLiberi <= 3) {
    return { testo: p.postiLiberi === 1 ? "Ultimo posto" : `Ultimi ${p.postiLiberi} posti`, tipo: "ultimi" };
  }
  if (p.garantita) return { testo: "Partenza garantita", tipo: "garantita" };
  return { testo: `${p.postiLiberi} posti disponibili`, tipo: "disponibile" };
}
