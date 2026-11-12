// SPESE: i soldi che escono (voli, hotel, guide, pubblicità...) e i CONTI dell'agenzia.
// Le entrate sono i pagamenti degli iscritti (iscrizione.ts); qui c'è l'altra metà.
import { z } from "zod";

/** Le categorie servono a capire dove vanno i soldi. "rimborso" = soldi restituiti a un iscritto. */
export const CATEGORIE_SPESA = [
  "volo",
  "alloggio",
  "trasporto",
  "attivita",
  "guida",
  "coordinatore",
  "assicurazione",
  "pubblicita",
  "software",
  "rimborso",
  "altro",
] as const;
export type CategoriaSpesa = (typeof CATEGORIE_SPESA)[number];
export const ETICHETTE_CATEGORIE_SPESA: Record<CategoriaSpesa, string> = {
  volo: "Voli",
  alloggio: "Alloggi",
  trasporto: "Trasporti",
  attivita: "Attività ed escursioni",
  guida: "Guide locali",
  coordinatore: "Coordinatore",
  assicurazione: "Assicurazione",
  pubblicita: "Pubblicità",
  software: "Software e dominio",
  rimborso: "Rimborso a un iscritto",
  altro: "Altro",
};

/**
 * Una spesa. Se ha una partenza, è un costo di quel viaggio (entra nel suo margine);
 * se non ce l'ha è una spesa generale dell'agenzia (pubblicità, dominio...).
 * "data" è quando è stata pagata, oppure quando va pagata se non è ancora pagata.
 */
export const spesaInputSchema = z.object({
  descrizione: z.string().trim().min(2, "Scrivi cos'è").max(200),
  categoria: z.enum(CATEGORIE_SPESA, { error: "Scegli una categoria" }),
  importoCentesimi: z.int().min(1, "Indica l'importo"),
  data: z.iso.date({ error: "Data non valida" }),
  pagata: z.boolean(),
  partenzaId: z.union([z.uuid({ error: "Partenza non valida" }), z.null()]).default(null),
  fornitore: z.string().trim().max(120).default(""),
  nota: z.string().trim().max(500).default(""),
});
export type SpesaInput = z.infer<typeof spesaInputSchema>;

export type Spesa = SpesaInput & {
  id: string;
  /** La partenza a cui appartiene, con il nome del viaggio, per mostrarla negli elenchi. */
  partenza: { id: string; viaggioTitolo: string; dataInizio: string } | null;
};

/** Entrate e uscite di un mese. "mese" è "2026-11". */
export type MeseConti = { mese: string; entrateCentesimi: number; usciteCentesimi: number };

/** I conti di una partenza: quanto ci aspettiamo di incassare, quanto costa, quanto resta. */
export type ContiPartenza = {
  id: string;
  viaggioTitolo: string;
  dataInizio: string;
  annullata: boolean;
  /** Prezzo × chi occupa un posto (richieste e confermati). */
  ricaviAttesiCentesimi: number;
  /** Pagamenti ricevuti dagli iscritti di questa partenza. */
  incassatoCentesimi: number;
  /** Tutte le spese della partenza, pagate e da pagare. */
  costiCentesimi: number;
  costiPagatiCentesimi: number;
  /** Ricavi attesi − costi: quanto guadagniamo se tutti pagano. */
  margineCentesimi: number;
};

export type Conti = {
  anno: number;
  /** Totali di sempre: quanto è entrato, quanto è uscito, e la differenza (la "cassa"). */
  saldo: {
    entrateCentesimi: number;
    usciteCentesimi: number;
    saldoCentesimi: number;
    /** Spese registrate ma non ancora pagate. */
    daPagareCentesimi: number;
    /** Quanto devono ancora pagare gli iscritti delle partenze future. */
    daIncassareCentesimi: number;
  };
  /** I 12 mesi dell'anno scelto. */
  mesi: MeseConti[];
  /** Le partenze dell'anno scelto, dalla prima. */
  partenze: ContiPartenza[];
};

/** Margine in percentuale sui ricavi, arrotondato; null se non ci sono ricavi. */
export function percentualeMargine(margine: number, ricavi: number) {
  return ricavi > 0 ? Math.round((margine / ricavi) * 100) : null;
}

/**
 * Quanto ci aspettiamo di incassare da una partenza.
 * Chi occupa un posto (richiesta o confermata) pagherà il prezzo intero; chi ha annullato
 * o è in lista d'attesa conta per quello che ha già versato: quei soldi sono entrati,
 * e se li restituiamo il rimborso si registra come spesa.
 * Se la partenza è annullata conta solo quanto è già stato versato.
 */
export function ricaviAttesi(
  iscrizioni: { stato: string; pagatoCentesimi: number }[],
  prezzoCentesimi: number,
  partenzaAnnullata: boolean,
) {
  return iscrizioni.reduce((somma, i) => {
    const occupaPosto = !partenzaAnnullata && (i.stato === "richiesta" || i.stato === "confermata");
    return somma + (occupaPosto ? Math.max(prezzoCentesimi, i.pagatoCentesimi) : i.pagatoCentesimi);
  }, 0);
}
