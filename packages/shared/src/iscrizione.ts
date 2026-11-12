// ISCRIZIONI (una persona su una partenza) e PAGAMENTI registrati a mano.
import { z } from "zod";

/**
 * Stati di un'iscrizione:
 *  - richiesta:     ha chiesto il posto, il posto è tenuto, aspettiamo l'acconto
 *  - confermata:    ha pagato almeno qualcosa, o l'organizzatore l'ha confermata
 *  - lista_attesa:  la partenza era piena; non occupa un posto
 *  - annullata:     non partecipa più; non occupa un posto
 */
export const STATI_ISCRIZIONE = ["richiesta", "confermata", "lista_attesa", "annullata"] as const;
export type StatoIscrizione = (typeof STATI_ISCRIZIONE)[number];
export const ETICHETTE_STATI_ISCRIZIONE: Record<StatoIscrizione, string> = {
  richiesta: "Da confermare",
  confermata: "Confermata",
  lista_attesa: "Lista d'attesa",
  annullata: "Annullata",
};

export const METODI_PAGAMENTO = ["bonifico", "revolut", "contanti", "altro"] as const;
export type MetodoPagamento = (typeof METODI_PAGAMENTO)[number];

/** Lo stato del pagamento non si salva: si calcola dai pagamenti (vedi statoPagamento). */
export const STATI_PAGAMENTO = ["da_pagare", "acconto_versato", "saldato"] as const;
export type StatoPagamento = (typeof STATI_PAGAMENTO)[number];
export const ETICHETTE_STATI_PAGAMENTO: Record<StatoPagamento, string> = {
  da_pagare: "Da pagare",
  acconto_versato: "Acconto versato",
  saldato: "Saldato",
};

/** I dati di una persona che si iscrive (dal sito o inserita a mano nel gestionale). */
export const iscrizioneInputSchema = z.object({
  nome: z.string().trim().min(1, "Scrivi il nome").max(80),
  cognome: z.string().trim().min(1, "Scrivi il cognome").max(80),
  email: z.email({ error: "Email non valida" }),
  telefono: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{6,20}$/, "Telefono non valido"),
  dataNascita: z.union([z.iso.date({ error: "Data non valida" }), z.literal("")]).default(""),
  note: z.string().trim().max(1000).default(""),
});
export type IscrizioneInput = z.infer<typeof iscrizioneInputSchema>;

/** Dal sito serve anche la partenza scelta e il consenso al trattamento dei dati. */
export const iscrizionePubblicaSchema = iscrizioneInputSchema.extend({
  partenzaId: z.uuid({ error: "Scegli una partenza" }),
  privacy: z.literal(true, { error: "Serve il consenso per gestire la tua richiesta" }),
});
export type IscrizionePubblicaInput = z.infer<typeof iscrizionePubblicaSchema>;

export const pagamentoInputSchema = z.object({
  importoCentesimi: z.int().min(1, "Indica l'importo"),
  data: z.iso.date({ error: "Data non valida" }),
  metodo: z.enum(METODI_PAGAMENTO),
  nota: z.string().trim().max(200).default(""),
});
export type PagamentoInput = z.infer<typeof pagamentoInputSchema>;

export type Pagamento = PagamentoInput & { id: string };

/** Un'iscrizione come la vede il gestionale. */
export type Iscrizione = Omit<IscrizioneInput, never> & {
  id: string;
  codice: string;
  partenzaId: string;
  stato: StatoIscrizione;
  creatoIl: string;
  pagamenti: Pagamento[];
  pagatoCentesimi: number;
  statoPagamento: StatoPagamento;
};

/** Cosa riceve il sito dopo una richiesta di iscrizione: tutto ciò che serve alla pagina di conferma. */
export type RicevutaIscrizione = {
  codice: string;
  stato: Extract<StatoIscrizione, "richiesta" | "lista_attesa">;
  viaggio: string;
  dataInizio: string;
  dataFine: string;
  prezzoCentesimi: number;
  accontoCentesimi: number;
  istruzioniPagamento: string;
};

/** Da quanto è stato pagato ricava lo stato del pagamento. */
export function statoPagamento(pagato: number, prezzo: number, acconto: number): StatoPagamento {
  if (pagato >= prezzo) return "saldato";
  if (pagato > 0 && pagato >= acconto) return "acconto_versato";
  return "da_pagare";
}
