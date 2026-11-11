// "Archivio" dei viaggi: tutte le letture e scritture sul database passano da qui.
// Le rotte HTTP (rotte.ts) non scrivono SQL: chiamano queste funzioni.
// Così, se un giorno cambiamo il modo di salvare i dati, si tocca solo questo file.
import { type Db, iscrizioni, partenze, tappeItinerario, viaggi } from "@waintogo/db";
import type { StatoViaggio, Stile, Viaggio, ViaggioInput } from "@waintogo/shared";
import { asc, desc, eq, like, or } from "drizzle-orm";
import { calcolaPartenza } from "../partenze/calcoli.js";

// Cosa caricare insieme a un viaggio: tappe in ordine e partenze con lo stato delle iscrizioni.
const conDettagli = () => ({
  tappe: { orderBy: [asc(tappeItinerario.giorno)] },
  partenze: {
    orderBy: [asc(partenze.dataInizio)],
    with: { iscrizioni: { columns: { stato: true as const } } },
  },
});

/** Elenco dei viaggi, dall'ultimo modificato. */
export async function elencoViaggi(db: Db): Promise<Viaggio[]> {
  const righe = await db.query.viaggi.findMany({ orderBy: [desc(viaggi.aggiornatoIl)], with: conDettagli() });
  return righe.map(inViaggio);
}

/** Un viaggio con tappe e partenze, oppure null se non esiste. */
export async function trovaViaggio(db: Db, id: string): Promise<Viaggio | null> {
  const riga = await db.query.viaggi.findFirst({ where: eq(viaggi.id, id), with: conDettagli() });
  return riga ? inViaggio(riga) : null;
}

/** Crea un viaggio (sempre come bozza) e restituisce il suo id. */
export async function creaViaggio(db: Db, dati: ViaggioInput): Promise<string> {
  // Una "transazione": o va tutto a buon fine (viaggio + tappe), o non si salva niente.
  return db.transaction(async (tx) => {
    const slug = await slugLibero(tx, creaSlug(dati.titolo));
    const { tappe, ...campi } = dati;
    const [nuovo] = await tx.insert(viaggi).values({ ...campi, slug }).returning({ id: viaggi.id });
    await salvaTappe(tx, nuovo!.id, tappe);
    return nuovo!.id;
  });
}

/** Sostituisce i dati di un viaggio. Lo slug non cambia, così l'indirizzo sul sito resta valido. */
export async function aggiornaViaggio(db: Db, id: string, dati: ViaggioInput): Promise<void> {
  await db.transaction(async (tx) => {
    const { tappe, ...campi } = dati;
    await tx.update(viaggi).set(campi).where(eq(viaggi.id, id));
    // Per le tappe la cosa più semplice e sicura è cancellarle e reinserirle.
    await tx.delete(tappeItinerario).where(eq(tappeItinerario.viaggioId, id));
    await salvaTappe(tx, id, tappe);
  });
}

export async function cambiaStato(db: Db, id: string, stato: StatoViaggio): Promise<void> {
  await db.update(viaggi).set({ stato }).where(eq(viaggi.id, id));
}

export async function eliminaViaggio(db: Db, id: string): Promise<void> {
  // Le tappe si cancellano da sole grazie a "onDelete: cascade" nello schema.
  await db.delete(viaggi).where(eq(viaggi.id, id));
}

// ---------------------------------------------------------------------------

export type Transazione = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function salvaTappe(tx: Transazione, viaggioId: string, tappe: ViaggioInput["tappe"]) {
  if (tappe.length === 0) return;
  await tx.insert(tappeItinerario).values(tappe.map((t) => ({ ...t, viaggioId })));
}

/**
 * "Islanda: fuoco & ghiaccio" → "islanda-fuoco-ghiaccio".
 * Toglie accenti e simboli, così l'indirizzo è leggibile e sicuro.
 * (Le date non ci sono più: lo stesso viaggio ha tante partenze.)
 */
export function creaSlug(titolo: string): string {
  return titolo
    .normalize("NFD") // separa le lettere dagli accenti: "è" → "e" + "`"
    .replace(/[̀-ͯ]/g, "") // ...e toglie gli accenti
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
}

/** Se lo slug è già usato aggiunge -2, -3, ... finché non ne trova uno libero. */
async function slugLibero(tx: Transazione, slug: string): Promise<string> {
  const usati = await tx
    .select({ slug: viaggi.slug })
    .from(viaggi)
    .where(or(eq(viaggi.slug, slug), like(viaggi.slug, `${slug}-%`)));
  const insieme = new Set(usati.map((r) => r.slug));
  if (!insieme.has(slug)) return slug;
  let n = 2;
  while (insieme.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

type RigaConDettagli = typeof viaggi.$inferSelect & {
  tappe: (typeof tappeItinerario.$inferSelect)[];
  partenze: (typeof partenze.$inferSelect & { iscrizioni: Pick<typeof iscrizioni.$inferSelect, "stato">[] })[];
};

/** Trasforma una riga del database nel formato che l'API restituisce. */
export function inViaggio({ tappe, partenze: righePartenze, creatoIl, aggiornatoIl, ...v }: RigaConDettagli): Viaggio {
  return {
    ...v,
    stili: v.stili as Stile[],
    // Le date con l'ora viaggiano in formato ISO: "2026-11-09T16:25:15.988Z".
    creatoIl: creatoIl.toISOString(),
    aggiornatoIl: aggiornatoIl.toISOString(),
    tappe: tappe.map((t) => ({ giorno: t.giorno, titolo: t.titolo, descrizione: t.descrizione })),
    partenze: righePartenze.map(({ iscrizioni, ...p }) => calcolaPartenza(p, v.durataGiorni, iscrizioni)),
  };
}
