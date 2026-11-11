// Cosa mostra la prima pagina del gestionale.
import type { Iscrizione } from "./iscrizione.js";
import type { Partenza } from "./partenza.js";

export type PartenzaCruscotto = Partenza & {
  viaggioTitolo: string;
  /** Quanto devono ancora pagare gli iscritti confermati o in richiesta. */
  daIncassareCentesimi: number;
  incassatoCentesimi: number;
};

export type DaFare = Iscrizione & {
  viaggioTitolo: string;
  dataInizio: string;
  prezzoCentesimi: number;
};

export type Cruscotto = {
  prossimePartenze: PartenzaCruscotto[];
  /** Richieste che aspettano l'acconto. */
  daConfermare: DaFare[];
  /** In lista d'attesa su partenze future. */
  inAttesa: DaFare[];
  /** Partenza entro 30 giorni e non ancora saldato. */
  saldiDaSollecitare: DaFare[];
};

/** Quanti giorni prima della partenza va pagato il saldo. */
export const GIORNI_SALDO = 30;
