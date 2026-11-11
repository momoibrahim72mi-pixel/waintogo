// Tutte le chiamate del gestionale verso l'API passano da qui.
// Gli indirizzi sono relativi (/api/...): in sviluppo li gira Vite, nei container nginx.
import type {
  Cruscotto,
  IscrizioneInput,
  Iscrizione,
  PagamentoInput,
  Partenza,
  PartenzaInput,
  StatoIscrizione,
  Viaggio,
  ViaggioInput,
} from "@waintogo/shared";

/** Un errore restituito dall'API, con i dettagli per mostrarlo nella pagina. */
export class ErroreApi extends Error {
  constructor(
    public stato: number,
    messaggio: string,
    /** Campo → messaggio, per gli errori di validazione (400). */
    public campi: Record<string, string> = {},
    /** Cosa manca, per le operazioni rifiutate (409). */
    public problemi: string[] = [],
  ) {
    super(messaggio);
  }
}

async function chiama<T>(metodo: string, percorso: string, corpo?: unknown): Promise<T> {
  let risposta: Response;
  try {
    risposta = await fetch(`/api${percorso}`, {
      method: metodo,
      headers: corpo === undefined ? {} : { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroreApi(0, "Non riesco a contattare l'API. È avviata?");
  }
  if (risposta.status === 204) return undefined as T;
  const dati = await risposta.json().catch(() => ({}));
  if (!risposta.ok) {
    throw new ErroreApi(risposta.status, dati.errore ?? "Errore inatteso", dati.campi, dati.problemi);
  }
  return dati as T;
}

/** Una partenza con viaggio, iscritti e pagamenti: la pagina "Iscritti". */
export type DettaglioPartenza = Partenza & {
  viaggio: { id: string; titolo: string; durataGiorni: number; istruzioniPagamento: string };
  iscrizioni: Iscrizione[];
  incassatoCentesimi: number;
};

export const api = {
  cruscotto: () => chiama<Cruscotto>("GET", "/cruscotto"),

  elencoViaggi: () => chiama<Viaggio[]>("GET", "/viaggi"),
  viaggio: (id: string) => chiama<Viaggio>("GET", `/viaggi/${id}`),
  creaViaggio: (dati: ViaggioInput) => chiama<Viaggio>("POST", "/viaggi", dati),
  aggiornaViaggio: (id: string, dati: ViaggioInput) => chiama<Viaggio>("PUT", `/viaggi/${id}`, dati),
  pubblica: (id: string) => chiama<Viaggio>("POST", `/viaggi/${id}/pubblica`),
  ritira: (id: string) => chiama<Viaggio>("POST", `/viaggi/${id}/ritira`),
  eliminaViaggio: (id: string) => chiama<void>("DELETE", `/viaggi/${id}`),

  creaPartenza: (viaggioId: string, dati: PartenzaInput) =>
    chiama<DettaglioPartenza>("POST", `/viaggi/${viaggioId}/partenze`, dati),
  partenza: (id: string) => chiama<DettaglioPartenza>("GET", `/partenze/${id}`),
  aggiornaPartenza: (id: string, dati: PartenzaInput) => chiama<DettaglioPartenza>("PUT", `/partenze/${id}`, dati),
  annullaPartenza: (id: string) => chiama<DettaglioPartenza>("POST", `/partenze/${id}/annulla`),
  riattivaPartenza: (id: string) => chiama<DettaglioPartenza>("POST", `/partenze/${id}/riattiva`),
  eliminaPartenza: (id: string) => chiama<void>("DELETE", `/partenze/${id}`),

  aggiungiIscritto: (partenzaId: string, dati: IscrizioneInput) =>
    chiama<DettaglioPartenza>("POST", `/partenze/${partenzaId}/iscrizioni`, dati),
  cambiaStatoIscrizione: (id: string, stato: StatoIscrizione) =>
    chiama<DettaglioPartenza>("POST", `/iscrizioni/${id}/stato`, { stato }),
  registraPagamento: (iscrizioneId: string, dati: PagamentoInput) =>
    chiama<DettaglioPartenza>("POST", `/iscrizioni/${iscrizioneId}/pagamenti`, dati),
  eliminaPagamento: (id: string) => chiama<DettaglioPartenza>("DELETE", `/pagamenti/${id}`),
};
