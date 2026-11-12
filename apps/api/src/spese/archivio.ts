// Archivio delle spese: leggere, creare, modificare, cancellare.
import { type Db, partenze, spese } from "@waintogo/db";
import type { Spesa, SpesaInput } from "@waintogo/shared";
import { desc, eq, isNull } from "drizzle-orm";

type RigaSpesa = typeof spese.$inferSelect & {
  partenza: { id: string; dataInizio: string; viaggio: { titolo: string } } | null;
};

// Con ogni spesa carichiamo la sua partenza e il titolo del viaggio, per mostrarli negli elenchi.
const conPartenza = {
  partenza: { columns: { id: true, dataInizio: true }, with: { viaggio: { columns: { titolo: true } } } },
} as const;

export function inSpesa(r: RigaSpesa): Spesa {
  return {
    id: r.id,
    descrizione: r.descrizione,
    categoria: r.categoria,
    importoCentesimi: r.importoCentesimi,
    data: r.data,
    pagata: r.pagata,
    partenzaId: r.partenzaId,
    fornitore: r.fornitore,
    nota: r.nota,
    partenza: r.partenza
      ? { id: r.partenza.id, dataInizio: r.partenza.dataInizio, viaggioTitolo: r.partenza.viaggio.titolo }
      : null,
  };
}

/**
 * Le spese, dalla più recente.
 * filtro: undefined = tutte; "generali" = senza partenza; un id = solo quelle di quella partenza.
 */
export async function elencoSpese(db: Db, filtro?: string): Promise<Spesa[]> {
  const righe = await db.query.spese.findMany({
    where:
      filtro === undefined ? undefined : filtro === "generali" ? isNull(spese.partenzaId) : eq(spese.partenzaId, filtro),
    orderBy: [desc(spese.data), desc(spese.creatoIl)],
    with: conPartenza,
  });
  return righe.map(inSpesa);
}

export async function trovaSpesa(db: Db, id: string): Promise<Spesa | null> {
  const riga = await db.query.spese.findFirst({ where: eq(spese.id, id), with: conPartenza });
  return riga ? inSpesa(riga) : null;
}

export async function partenzaEsiste(db: Db, id: string) {
  const p = await db.query.partenze.findFirst({ where: eq(partenze.id, id), columns: { id: true } });
  return p !== undefined;
}

export async function creaSpesa(db: Db, dati: SpesaInput): Promise<string> {
  const [nuova] = await db.insert(spese).values(dati).returning({ id: spese.id });
  return nuova!.id;
}

export async function aggiornaSpesa(db: Db, id: string, dati: SpesaInput) {
  await db.update(spese).set(dati).where(eq(spese.id, id));
}

export async function eliminaSpesa(db: Db, id: string) {
  await db.delete(spese).where(eq(spese.id, id));
}
