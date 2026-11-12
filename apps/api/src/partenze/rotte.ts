// Rotte del gestionale per partenze, iscrizioni e pagamenti.
//
//   POST   /viaggi/:id/partenze          aggiunge una partenza al viaggio
//   GET    /partenze/:id                 partenza con iscritti e pagamenti
//   PUT    /partenze/:id                 modifica date, prezzo, posti...
//   POST   /partenze/:id/annulla         annulla (resta visibile nel gestionale, sparisce dal sito)
//   POST   /partenze/:id/riattiva        toglie l'annullamento
//   DELETE /partenze/:id                 elimina, solo se non ha iscritti né spese
//   POST   /partenze/:id/iscrizioni      aggiunge un iscritto a mano (chi prenota al telefono)
//   POST   /iscrizioni/:id/stato         { stato }: conferma, lista d'attesa, annulla...
//   POST   /iscrizioni/:id/pagamenti     registra un pagamento ricevuto
//   DELETE /pagamenti/:id                cancella un pagamento inserito per sbaglio
//
// Le operazioni su iscrizioni e pagamenti rispondono con la partenza aggiornata:
// il gestionale ridisegna la pagina con i numeri nuovi senza fare un'altra richiesta.
import type { Db } from "@waintogo/db";
import { iscrizioneInputSchema, pagamentoInputSchema, partenzaInputSchema, STATI_ISCRIZIONE } from "@waintogo/shared";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { conflitto, datiNonValidi, eUnId, nonTrovato, Rifiutato } from "../http.js";
import * as iscrizioni from "../iscrizioni/archivio.js";
import * as archivio from "./archivio.js";

type ConId = { Params: { id: string } };

export async function rottePartenze(app: FastifyInstance, { db }: { db: Db }) {
  app.post<ConId>("/viaggi/:id/partenze", async (req, reply) => {
    if (!eUnId(req.params.id) || !(await archivio.viaggioEsiste(db, req.params.id))) {
      return nonTrovato(reply, "Viaggio");
    }
    const dati = partenzaInputSchema.safeParse(req.body);
    if (!dati.success) return datiNonValidi(reply, dati.error);
    const id = await archivio.creaPartenza(db, req.params.id, dati.data);
    return reply.code(201).send(await archivio.trovaPartenza(db, id));
  });

  app.get<ConId>("/partenze/:id", async (req, reply) => (await carica(db, req.params.id, reply)) ?? reply);

  app.put<ConId>("/partenze/:id", async (req, reply) => {
    const partenza = await carica(db, req.params.id, reply);
    if (!partenza) return reply;
    const dati = partenzaInputSchema.safeParse(req.body);
    if (!dati.success) return datiNonValidi(reply, dati.error);
    if (dati.data.postiTotali < partenza.postiOccupati) {
      return conflitto(reply, `Ci sono già ${partenza.postiOccupati} posti occupati: non puoi scendere sotto`);
    }
    await archivio.aggiornaPartenza(db, partenza.id, dati.data);
    return archivio.trovaPartenza(db, partenza.id);
  });

  for (const [azione, annullata] of [["annulla", true], ["riattiva", false]] as const) {
    app.post<ConId>(`/partenze/:id/${azione}`, async (req, reply) => {
      const partenza = await carica(db, req.params.id, reply);
      if (!partenza) return reply;
      await archivio.impostaAnnullata(db, partenza.id, annullata);
      return archivio.trovaPartenza(db, partenza.id);
    });
  }

  app.delete<ConId>("/partenze/:id", async (req, reply) => {
    const partenza = await carica(db, req.params.id, reply);
    if (!partenza) return reply;
    if (partenza.iscrizioni.length > 0) {
      return conflitto(reply, "La partenza ha degli iscritti: annullala invece di eliminarla");
    }
    if (partenza.spese.length > 0) {
      return conflitto(reply, "La partenza ha delle spese registrate: annullala invece di eliminarla");
    }
    await archivio.eliminaPartenza(db, partenza.id);
    return reply.code(204).send();
  });

  app.post<ConId>("/partenze/:id/iscrizioni", async (req, reply) => {
    const partenza = await carica(db, req.params.id, reply);
    if (!partenza) return reply;
    const dati = iscrizioneInputSchema.safeParse(req.body);
    if (!dati.success) return datiNonValidi(reply, dati.error);
    return conRifiuti(reply, async () => {
      await iscrizioni.creaIscrizione(db, partenza.id, dati.data);
      return reply.code(201).send(await archivio.trovaPartenza(db, partenza.id));
    });
  });

  const statoSchema = z.object({ stato: z.enum(STATI_ISCRIZIONE) });
  app.post<ConId>("/iscrizioni/:id/stato", async (req, reply) => {
    const partenzaId = eUnId(req.params.id) ? await iscrizioni.partenzaDiIscrizione(db, req.params.id) : null;
    if (!partenzaId) return nonTrovato(reply, "Iscrizione");
    const dati = statoSchema.safeParse(req.body);
    if (!dati.success) return datiNonValidi(reply, dati.error);
    return conRifiuti(reply, async () => {
      await iscrizioni.cambiaStatoIscrizione(db, req.params.id, dati.data.stato);
      return archivio.trovaPartenza(db, partenzaId);
    });
  });

  app.post<ConId>("/iscrizioni/:id/pagamenti", async (req, reply) => {
    const partenzaId = eUnId(req.params.id) ? await iscrizioni.partenzaDiIscrizione(db, req.params.id) : null;
    if (!partenzaId) return nonTrovato(reply, "Iscrizione");
    const dati = pagamentoInputSchema.safeParse(req.body);
    if (!dati.success) return datiNonValidi(reply, dati.error);
    return conRifiuti(reply, async () => {
      await iscrizioni.registraPagamento(db, req.params.id, dati.data);
      return reply.code(201).send(await archivio.trovaPartenza(db, partenzaId));
    });
  });

  app.delete<ConId>("/pagamenti/:id", async (req, reply) => {
    const partenzaId = eUnId(req.params.id) ? await iscrizioni.partenzaDiPagamento(db, req.params.id) : null;
    if (!partenzaId) return nonTrovato(reply, "Pagamento");
    await iscrizioni.eliminaPagamento(db, req.params.id);
    return archivio.trovaPartenza(db, partenzaId);
  });
}

async function carica(db: Db, id: string, reply: FastifyReply) {
  const partenza = eUnId(id) ? await archivio.trovaPartenza(db, id) : null;
  if (!partenza) nonTrovato(reply, "Partenza");
  return partenza;
}

/** Esegue l'operazione; se viene "rifiutata" (posti finiti, partenza annullata...) risponde 409. */
export async function conRifiuti<T>(reply: FastifyReply, operazione: () => Promise<T>) {
  try {
    return await operazione();
  } catch (e) {
    if (e instanceof Rifiutato) return conflitto(reply, e.message);
    throw e;
  }
}
