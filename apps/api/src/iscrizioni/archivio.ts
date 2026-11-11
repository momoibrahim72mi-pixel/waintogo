// Archivio delle iscrizioni e dei pagamenti.
//
// Il punto delicato è l'ULTIMO POSTO: se due persone chiedono l'ultimo posto nello stesso
// istante, solo una deve averlo. Per questo, prima di contare i posti, "blocchiamo" la riga
// della partenza (SELECT ... FOR UPDATE): la seconda richiesta aspetta che la prima finisca,
// e quando conta i posti vede già l'iscrizione della prima.
import { iscrizioni, pagamenti, partenze, type Db } from "@waintogo/db";
import type { IscrizioneInput, PagamentoInput, StatoIscrizione } from "@waintogo/shared";
import { and, count, eq, inArray } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { Rifiutato } from "../http.js";
import { OCCUPANO_POSTO } from "../partenze/calcoli.js";
import type { Transazione } from "../viaggi/archivio.js";

/** Blocca la partenza fino alla fine della transazione e dice quanti posti restano. */
async function bloccaEContaPosti(tx: Transazione, partenzaId: string) {
  const [partenza] = await tx.select().from(partenze).where(eq(partenze.id, partenzaId)).for("update");
  if (!partenza) throw new Rifiutato("Partenza non trovata");
  const [{ occupati }] = (await tx
    .select({ occupati: count() })
    .from(iscrizioni)
    .where(and(eq(iscrizioni.partenzaId, partenzaId), inArray(iscrizioni.stato, OCCUPANO_POSTO)))) as [
    { occupati: number },
  ];
  return { partenza, liberi: partenza.postiTotali - occupati };
}

/**
 * Crea un'iscrizione. Se ci sono posti è una "richiesta" (il posto è tenuto),
 * altrimenti finisce in "lista_attesa".
 */
export async function creaIscrizione(db: Db, partenzaId: string, dati: IscrizioneInput) {
  return db.transaction(async (tx) => {
    const { partenza, liberi } = await bloccaEContaPosti(tx, partenzaId);
    if (partenza.annullata) throw new Rifiutato("Questa partenza è stata annullata");
    const stato: StatoIscrizione = liberi > 0 ? "richiesta" : "lista_attesa";
    const [nuova] = await tx
      .insert(iscrizioni)
      .values({
        ...dati,
        email: dati.email.toLowerCase(),
        dataNascita: dati.dataNascita || null,
        partenzaId,
        stato,
        codice: nuovoCodice(),
      })
      .returning();
    return nuova!;
  });
}

/** Cambia lo stato di un'iscrizione; per occupare un posto controlla che ce ne sia uno libero. */
export async function cambiaStatoIscrizione(db: Db, id: string, stato: StatoIscrizione) {
  await db.transaction(async (tx) => {
    const attuale = await tx.query.iscrizioni.findFirst({ where: eq(iscrizioni.id, id) });
    if (!attuale) throw new Rifiutato("Iscrizione non trovata");
    const occupavaGia = OCCUPANO_POSTO.includes(attuale.stato);
    if (OCCUPANO_POSTO.includes(stato) && !occupavaGia) {
      const { liberi } = await bloccaEContaPosti(tx, attuale.partenzaId);
      if (liberi <= 0) throw new Rifiutato("Non ci sono posti liberi: aumenta i posti o annulla un'altra iscrizione");
    }
    await tx.update(iscrizioni).set({ stato }).where(eq(iscrizioni.id, id));
  });
}

/**
 * Registra un pagamento. Se l'iscrizione era una "richiesta", diventa "confermata":
 * chi ha pagato l'acconto ha confermato davvero il suo posto.
 */
export async function registraPagamento(db: Db, iscrizioneId: string, dati: PagamentoInput) {
  await db.transaction(async (tx) => {
    const isc = await tx.query.iscrizioni.findFirst({ where: eq(iscrizioni.id, iscrizioneId) });
    if (!isc) throw new Rifiutato("Iscrizione non trovata");
    if (isc.stato === "annullata" || isc.stato === "lista_attesa") {
      throw new Rifiutato("Prima conferma l'iscrizione: ora non occupa un posto");
    }
    await tx.insert(pagamenti).values({ ...dati, iscrizioneId });
    if (isc.stato === "richiesta") {
      await tx.update(iscrizioni).set({ stato: "confermata" }).where(eq(iscrizioni.id, iscrizioneId));
    }
  });
}

export async function eliminaPagamento(db: Db, id: string) {
  const eliminati = await db.delete(pagamenti).where(eq(pagamenti.id, id)).returning({ id: pagamenti.id });
  return eliminati.length > 0;
}

export async function partenzaDiIscrizione(db: Db, id: string) {
  const i = await db.query.iscrizioni.findFirst({ where: eq(iscrizioni.id, id), columns: { partenzaId: true } });
  return i?.partenzaId ?? null;
}

export async function partenzaDiPagamento(db: Db, id: string) {
  const p = await db.query.pagamenti.findFirst({
    where: eq(pagamenti.id, id),
    with: { iscrizione: { columns: { partenzaId: true } } },
  });
  return p?.iscrizione.partenzaId ?? null;
}

// Niente 0/O e 1/I/L: il codice si detta al telefono e si scrive nella causale senza confondersi.
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Un codice come WTG-7KQ3PA. Con 31^6 ≈ 900 milioni di combinazioni, due uguali sono improbabili
 *  (e se capitasse, il vincolo "unique" del database lo impedirebbe). */
export function nuovoCodice() {
  let codice = "WTG-";
  for (let i = 0; i < 6; i++) codice += ALFABETO[randomInt(ALFABETO.length)];
  return codice;
}
