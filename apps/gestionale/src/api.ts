// Tutte le chiamate del gestionale verso l'API passano da qui.
// Gli indirizzi sono relativi (/api/...): in sviluppo li gira Vite, nei container nginx.
import type { Viaggio, ViaggioInput } from "@waintogo/shared";

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
  const risposta = await fetch(`/api${percorso}`, {
    method: metodo,
    headers: corpo === undefined ? {} : { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  if (risposta.status === 204) return undefined as T;
  const dati = await risposta.json().catch(() => ({}));
  if (!risposta.ok) {
    throw new ErroreApi(risposta.status, dati.errore ?? "Errore inatteso", dati.campi, dati.problemi);
  }
  return dati as T;
}

export const api = {
  elencoViaggi: () => chiama<Viaggio[]>("GET", "/viaggi"),
  viaggio: (id: string) => chiama<Viaggio>("GET", `/viaggi/${id}`),
  creaViaggio: (dati: ViaggioInput) => chiama<Viaggio>("POST", "/viaggi", dati),
  aggiornaViaggio: (id: string, dati: ViaggioInput) => chiama<Viaggio>("PUT", `/viaggi/${id}`, dati),
  pubblica: (id: string) => chiama<Viaggio>("POST", `/viaggi/${id}/pubblica`),
  ritira: (id: string) => chiama<Viaggio>("POST", `/viaggi/${id}/ritira`),
  elimina: (id: string) => chiama<void>("DELETE", `/viaggi/${id}`),
};
