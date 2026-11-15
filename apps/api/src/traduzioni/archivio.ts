// Letture e scritture delle traduzioni dei viaggi (tabella traduzioni_viaggi).
import { type Db, traduzioniViaggi } from "@waintogo/db";
import {
  improntaOriginale,
  LINGUE_TRADUZIONE,
  type LinguaTraduzione,
  type TestiDaTradurre,
  type TestiTradotti,
  type Traduzione,
} from "@waintogo/shared";
import { and, eq, inArray } from "drizzle-orm";

type Riga = typeof traduzioniViaggi.$inferSelect;

/** Le traduzioni di un viaggio, una per lingua, con lo stato calcolato. */
export async function traduzioniDi(db: Db, viaggio: TestiDaTradurre & { id: string }): Promise<Traduzione[]> {
  const righe = await db.select().from(traduzioniViaggi).where(eq(traduzioniViaggi.viaggioId, viaggio.id));
  const impronta = improntaOriginale(viaggio);
  return LINGUE_TRADUZIONE.map((lingua) => inTraduzione(lingua, righe.find((r) => r.lingua === lingua), impronta));
}

function inTraduzione(lingua: LinguaTraduzione, riga: Riga | undefined, impronta: string): Traduzione {
  if (!riga) return { lingua, stato: "mancante", testi: null, aggiornataIl: null, approvataIl: null };
  // Se l'italiano è cambiato dopo la traduzione, conta come "superata", qualunque sia lo stato salvato.
  const stato = riga.improntaOriginale !== impronta ? "superata" : riga.stato;
  return {
    lingua,
    stato,
    testi: riga.testi,
    aggiornataIl: riga.aggiornatoIl.toISOString(),
    approvataIl: riga.approvataIl?.toISOString() ?? null,
  };
}

/**
 * Salva (o sostituisce) la traduzione di una lingua come BOZZA da rivedere.
 * L'impronta è quella dell'italiano di adesso: chi salva dice "è la traduzione di questo testo".
 */
export async function salvaBozza(db: Db, viaggio: TestiDaTradurre & { id: string }, lingua: LinguaTraduzione, testi: TestiTradotti) {
  const valori = { testi, stato: "da_rivedere" as const, improntaOriginale: improntaOriginale(viaggio), approvataIl: null };
  // "upsert": inserisce la riga, o la aggiorna se esiste già (vincolo viaggio + lingua).
  await db
    .insert(traduzioniViaggi)
    .values({ viaggioId: viaggio.id, lingua, ...valori })
    .onConflictDoUpdate({ target: [traduzioniViaggi.viaggioId, traduzioniViaggi.lingua], set: valori });
}

/** Approva: da questo momento la traduzione va sul sito (finché l'italiano non cambia). */
export async function approva(db: Db, viaggio: TestiDaTradurre & { id: string }, lingua: LinguaTraduzione) {
  await db
    .update(traduzioniViaggi)
    .set({ stato: "approvata", improntaOriginale: improntaOriginale(viaggio), approvataIl: new Date() })
    .where(and(eq(traduzioniViaggi.viaggioId, viaggio.id), eq(traduzioniViaggi.lingua, lingua)));
}

/**
 * Per il sito: le traduzioni approvate e ancora valide di più viaggi insieme,
 * come mappa viaggioId → { en?: testi, ar?: testi }.
 */
export async function traduzioniPubbliche(
  db: Db,
  viaggi: (TestiDaTradurre & { id: string })[],
): Promise<Map<string, Partial<Record<LinguaTraduzione, TestiTradotti>>>> {
  const mappa = new Map<string, Partial<Record<LinguaTraduzione, TestiTradotti>>>();
  if (viaggi.length === 0) return mappa;
  const righe = await db
    .select()
    .from(traduzioniViaggi)
    .where(
      and(
        inArray(
          traduzioniViaggi.viaggioId,
          viaggi.map((v) => v.id),
        ),
        eq(traduzioniViaggi.stato, "approvata"),
      ),
    );
  for (const v of viaggi) {
    const impronta = improntaOriginale(v);
    const sue: Partial<Record<LinguaTraduzione, TestiTradotti>> = {};
    for (const r of righe) if (r.viaggioId === v.id && r.improntaOriginale === impronta) sue[r.lingua] = r.testi;
    mappa.set(v.id, sue);
  }
  return mappa;
}
