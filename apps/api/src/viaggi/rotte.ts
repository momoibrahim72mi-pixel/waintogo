// Le rotte HTTP dei viaggi (gestionale): ricevono la richiesta, controllano i dati,
// chiamano l'archivio e rispondono con il codice giusto.
//
//   GET    /viaggi                 elenco
//   GET    /viaggi/:id             dettaglio, con itinerario e partenze
//   POST   /viaggi                 crea (come bozza)
//   PUT    /viaggi/:id             modifica (si manda il viaggio intero, come nel modulo)
//   POST   /viaggi/:id/pubblica    bozza → pubblicato, solo se il viaggio è completo
//   POST   /viaggi/:id/ritira      pubblicato → bozza
//   DELETE /viaggi/:id             elimina, solo se è una bozza senza partenze
import type { Db } from "@waintogo/db";
import { problemiPerPubblicare, viaggioInputSchema } from "@waintogo/shared";
import type { FastifyInstance, FastifyReply } from "fastify";
import { conflitto, datiNonValidi, eUnId, nonTrovato } from "../http.js";
import * as archivio from "./archivio.js";

export async function rotteViaggi(app: FastifyInstance, { db }: { db: Db }) {
  app.get("/viaggi", async () => archivio.elencoViaggi(db));

  app.get<{ Params: { id: string } }>("/viaggi/:id", async (req, reply) => {
    return (await caricaOppure404(db, req.params.id, reply)) ?? reply;
  });

  app.post("/viaggi", async (req, reply) => {
    const dati = viaggioInputSchema.safeParse(req.body);
    if (!dati.success) return datiNonValidi(reply, dati.error);
    const id = await archivio.creaViaggio(db, dati.data);
    return reply.code(201).send(await archivio.trovaViaggio(db, id));
  });

  app.put<{ Params: { id: string } }>("/viaggi/:id", async (req, reply) => {
    const viaggio = await caricaOppure404(db, req.params.id, reply);
    if (!viaggio) return reply;
    const dati = viaggioInputSchema.safeParse(req.body);
    if (!dati.success) return datiNonValidi(reply, dati.error);
    // Un viaggio già pubblicato lo vedono i clienti: dopo la modifica deve restare completo.
    if (viaggio.stato === "pubblicato") {
      const problemi = problemiPerPubblicare(dati.data);
      if (problemi.length > 0) return conflitto(reply, "Il viaggio è pubblicato e resterebbe incompleto", problemi);
    }
    // La durata decide la data di ritorno delle partenze: le tappe devono starci dentro.
    await archivio.aggiornaViaggio(db, viaggio.id, dati.data);
    return archivio.trovaViaggio(db, viaggio.id);
  });

  app.post<{ Params: { id: string } }>("/viaggi/:id/pubblica", async (req, reply) => {
    const viaggio = await caricaOppure404(db, req.params.id, reply);
    if (!viaggio) return reply;
    if (viaggio.stato !== "bozza") return conflitto(reply, "Si può pubblicare solo una bozza");
    const problemi = problemiPerPubblicare(viaggio);
    if (problemi.length > 0) return conflitto(reply, "Il viaggio non è ancora completo", problemi);
    await archivio.cambiaStato(db, viaggio.id, "pubblicato");
    return archivio.trovaViaggio(db, viaggio.id);
  });

  app.post<{ Params: { id: string } }>("/viaggi/:id/ritira", async (req, reply) => {
    const viaggio = await caricaOppure404(db, req.params.id, reply);
    if (!viaggio) return reply;
    if (viaggio.stato !== "pubblicato") return conflitto(reply, "Il viaggio non è pubblicato");
    await archivio.cambiaStato(db, viaggio.id, "bozza");
    return archivio.trovaViaggio(db, viaggio.id);
  });

  app.delete<{ Params: { id: string } }>("/viaggi/:id", async (req, reply) => {
    const viaggio = await caricaOppure404(db, req.params.id, reply);
    if (!viaggio) return reply;
    if (viaggio.stato !== "bozza") return conflitto(reply, "Si può eliminare solo una bozza");
    if (viaggio.partenze.length > 0) return conflitto(reply, "Elimina prima le partenze del viaggio");
    await archivio.eliminaViaggio(db, viaggio.id);
    return reply.code(204).send();
  });
}

/** Carica il viaggio; se l'id non è valido o non esiste risponde 404 e restituisce null. */
async function caricaOppure404(db: Db, id: string, reply: FastifyReply) {
  const viaggio = eUnId(id) ? await archivio.trovaViaggio(db, id) : null;
  if (!viaggio) nonTrovato(reply, "Viaggio");
  return viaggio;
}
