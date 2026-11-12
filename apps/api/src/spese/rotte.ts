// Rotte del gestionale per le spese.
//
//   GET    /spese                    tutte le spese, dalla più recente
//   GET    /spese?partenza=<id>      solo quelle di una partenza
//   GET    /spese?partenza=generali  solo le spese generali (senza partenza)
//   POST   /spese                    registra una spesa
//   PUT    /spese/:id                modifica una spesa (anche per segnarla come pagata)
//   DELETE /spese/:id                cancella una spesa inserita per sbaglio
import type { Db } from "@waintogo/db";
import { spesaInputSchema } from "@waintogo/shared";
import type { FastifyInstance, FastifyReply } from "fastify";
import { datiNonValidi, eUnId, nonTrovato } from "../http.js";
import * as archivio from "./archivio.js";

type ConId = { Params: { id: string } };

export async function rotteSpese(app: FastifyInstance, { db }: { db: Db }) {
  app.get<{ Querystring: { partenza?: string } }>("/spese", async (req, reply) => {
    const filtro = req.query.partenza;
    if (filtro !== undefined && filtro !== "generali" && !eUnId(filtro)) return nonTrovato(reply, "Partenza");
    return archivio.elencoSpese(db, filtro);
  });

  app.post("/spese", async (req, reply) => {
    const dati = await valida(db, req.body, reply);
    if (!dati) return reply;
    const id = await archivio.creaSpesa(db, dati);
    return reply.code(201).send(await archivio.trovaSpesa(db, id));
  });

  app.put<ConId>("/spese/:id", async (req, reply) => {
    if (!eUnId(req.params.id) || !(await archivio.trovaSpesa(db, req.params.id))) return nonTrovato(reply, "Spesa");
    const dati = await valida(db, req.body, reply);
    if (!dati) return reply;
    await archivio.aggiornaSpesa(db, req.params.id, dati);
    return archivio.trovaSpesa(db, req.params.id);
  });

  app.delete<ConId>("/spese/:id", async (req, reply) => {
    if (!eUnId(req.params.id) || !(await archivio.trovaSpesa(db, req.params.id))) return nonTrovato(reply, "Spesa");
    await archivio.eliminaSpesa(db, req.params.id);
    return reply.code(204).send();
  });
}

/** Controlla i dati e che l'eventuale partenza esista; se qualcosa non va risponde 400 e restituisce null. */
async function valida(db: Db, corpo: unknown, reply: FastifyReply) {
  const dati = spesaInputSchema.safeParse(corpo);
  if (!dati.success) {
    datiNonValidi(reply, dati.error);
    return null;
  }
  if (dati.data.partenzaId && !(await archivio.partenzaEsiste(db, dati.data.partenzaId))) {
    reply.code(400).send({ errore: "Dati non validi", campi: { partenzaId: "Partenza non trovata" } });
    return null;
  }
  return dati.data;
}
