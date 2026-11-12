// Chiamate dal server del sito all'API. Girano SOLO sul server (nei Server Component e
// nelle Server Action): il browser del visitatore non parla mai direttamente con l'API.
// "server-only" fa fallire la build se per sbaglio questo file finisce nel browser.
import "server-only";
import type { RicevutaIscrizione, ViaggioPassato, ViaggioPubblico } from "@waintogo/shared";

// In docker compose e in Kubernetes l'API si chiama "api"; in sviluppo è su localhost.
const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function leggi<T>(percorso: string): Promise<T | null> {
  // cache "no-store": ogni visita legge i dati aggiornati (posti liberi, nuove partenze).
  const r = await fetch(`${API_URL}${percorso}`, { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`API ${percorso}: ${r.status}`);
  return r.json() as Promise<T>;
}

export const catalogo = async () => (await leggi<ViaggioPubblico[]>("/pubblico/viaggi")) ?? [];
export const viaggiPassati = async () => (await leggi<ViaggioPassato[]>("/pubblico/viaggi-passati")) ?? [];
export const viaggio = (slug: string) => leggi<ViaggioPubblico>(`/pubblico/viaggi/${encodeURIComponent(slug)}`);

export type EsitoIscrizione =
  | { ok: true; ricevuta: RicevutaIscrizione }
  | { ok: false; errore: string; campi: Record<string, string> };

export async function inviaIscrizione(dati: object): Promise<EsitoIscrizione> {
  const r = await fetch(`${API_URL}/pubblico/iscrizioni`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dati),
    cache: "no-store",
  });
  const corpo = await r.json().catch(() => ({}));
  if (r.ok) return { ok: true, ricevuta: corpo };
  return { ok: false, errore: corpo.errore ?? "Qualcosa è andato storto, riprova", campi: corpo.campi ?? {} };
}
