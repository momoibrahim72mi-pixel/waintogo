// Archivio delle partenze e delle loro iscrizioni.
import { type Db, iscrizioni, pagamenti, partenze, spese, viaggi } from "@waintogo/db";
import { type Iscrizione, type Partenza, type PartenzaInput, type Spesa, statoPagamento } from "@waintogo/shared";
import { asc, desc, eq } from "drizzle-orm";
import { inSpesa } from "../spese/archivio.js";
import { calcolaPartenza } from "./calcoli.js";

/** Una partenza con il suo viaggio e i suoi iscritti (con i pagamenti): la pagina "Iscritti". */
export type DettaglioPartenza = Partenza & {
  viaggio: { id: string; titolo: string; durataGiorni: number; istruzioniPagamento: string };
  iscrizioni: Iscrizione[];
  incassatoCentesimi: number;
  /** Le spese di questa partenza (voli, hotel...) e il loro totale. */
  spese: Spesa[];
  costiCentesimi: number;
};

export async function trovaPartenza(db: Db, id: string): Promise<DettaglioPartenza | null> {
  const riga = await db.query.partenze.findFirst({
    where: eq(partenze.id, id),
    with: {
      viaggio: { columns: { id: true, titolo: true, durataGiorni: true, istruzioniPagamento: true } },
      iscrizioni: {
        orderBy: [asc(iscrizioni.creatoIl)],
        with: { pagamenti: { orderBy: [asc(pagamenti.data)] } },
      },
      spese: { orderBy: [desc(spese.data)] },
    },
  });
  if (!riga) return null;
  const { viaggio, iscrizioni: righeIscrizioni, spese: righeSpese, ...p } = riga;
  const elenco = righeIscrizioni.map((i) => inIscrizione(i, p.prezzoCentesimi, p.accontoCentesimi));
  return {
    ...calcolaPartenza(p, viaggio.durataGiorni, righeIscrizioni),
    viaggio,
    iscrizioni: elenco,
    incassatoCentesimi: elenco.reduce((somma, i) => somma + i.pagatoCentesimi, 0),
    spese: righeSpese.map((s) =>
      inSpesa({ ...s, partenza: { id: p.id, dataInizio: p.dataInizio, viaggio: { titolo: viaggio.titolo } } }),
    ),
    costiCentesimi: righeSpese.reduce((somma, s) => somma + s.importoCentesimi, 0),
  };
}

export async function viaggioEsiste(db: Db, viaggioId: string) {
  const v = await db.query.viaggi.findFirst({ where: eq(viaggi.id, viaggioId), columns: { id: true } });
  return v !== undefined;
}

export async function creaPartenza(db: Db, viaggioId: string, dati: PartenzaInput): Promise<string> {
  const [nuova] = await db.insert(partenze).values({ ...dati, viaggioId }).returning({ id: partenze.id });
  return nuova!.id;
}

export async function aggiornaPartenza(db: Db, id: string, dati: PartenzaInput) {
  await db.update(partenze).set(dati).where(eq(partenze.id, id));
}

export async function impostaAnnullata(db: Db, id: string, annullata: boolean) {
  await db.update(partenze).set({ annullata }).where(eq(partenze.id, id));
}

export async function eliminaPartenza(db: Db, id: string) {
  await db.delete(partenze).where(eq(partenze.id, id));
}

type RigaIscrizione = typeof iscrizioni.$inferSelect & { pagamenti: (typeof pagamenti.$inferSelect)[] };

/** Da riga del database a iscrizione per il gestionale, con totale pagato e stato del pagamento. */
export function inIscrizione(i: RigaIscrizione, prezzo: number, acconto: number): Iscrizione {
  const pagato = i.pagamenti.reduce((somma, p) => somma + p.importoCentesimi, 0);
  return {
    id: i.id,
    codice: i.codice,
    partenzaId: i.partenzaId,
    stato: i.stato,
    nome: i.nome,
    cognome: i.cognome,
    email: i.email,
    telefono: i.telefono,
    dataNascita: i.dataNascita ?? "",
    note: i.note,
    creatoIl: i.creatoIl.toISOString(),
    pagamenti: i.pagamenti.map((p) => ({
      id: p.id,
      importoCentesimi: p.importoCentesimi,
      data: p.data,
      metodo: p.metodo,
      nota: p.nota,
    })),
    pagatoCentesimi: pagato,
    statoPagamento: statoPagamento(pagato, prezzo, acconto),
  };
}
