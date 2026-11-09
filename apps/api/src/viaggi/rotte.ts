// Le rotte HTTP dei viaggi: ricevono la richiesta, controllano i dati,
// chiamano l'archivio e rispondono con il codice giusto.
//
//   GET    /viaggi                 elenco
//   GET    /viaggi/:id             dettaglio
//   POST   /viaggi                 crea (come bozza)
//   PUT    /viaggi/:id             modifica (si manda il viaggio intero, come nel modulo)
//   POST   /viaggi/:id/pubblica    bozza → pubblicato, solo se il viaggio è completo
//   POST   /viaggi/:id/ritira      pubblicato → bozza
//   DELETE /viaggi/:id             elimina, solo se è una bozza
//
// I codici HTTP usati: 200 ok, 201 creato, 204 fatto (senza contenuto),
// 400 dati non validi, 404 non trovato, 409 l'operazione non è permessa in questo stato.
import type { Db } from "@waintogo/db";
import { problemiPerPubblicare, viaggioInputSchema } from "@waintogo/shared";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import * as archivio from "./archivio.js";

type Opzioni = { db: Db; oggi: () => string };

export async function rotteViaggi(app: FastifyInstance, { db, oggi }: Opzioni) {
  app.get("/viaggi", async () => archivio.elencoViaggi(db));

  app.get<{ Params: { id: string } }>("/viaggi/:id", async (req, reply) => {
    const viaggio = await caricaOppure404(db, req.params.id, reply);
    return viaggio ?? reply;
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
      const problemi = problemiPerPubblicare(dati.data, oggi());
      if (problemi.length > 0) return conflitto(reply, "Il viaggio è pubblicato e resterebbe incompleto", problemi);
    }
    await archivio.aggiornaViaggio(db, viaggio.id, dati.data);
    return archivio.trovaViaggio(db, viaggio.id);
  });

  app.post<{ Params: { id: string } }>("/viaggi/:id/pubblica", async (req, reply) => {
    const viaggio = await caricaOppure404(db, req.params.id, reply);
    if (!viaggio) return reply;
    if (viaggio.stato !== "bozza") return conflitto(reply, "Si può pubblicare solo una bozza");
    const problemi = problemiPerPubblicare(viaggio, oggi());
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
    await archivio.eliminaViaggio(db, viaggio.id);
    return reply.code(204).send();
  });
}

// ---------------------------------------------------------------------------

const uuid = z.uuid();

/** Carica il viaggio; se l'id non è valido o non esiste risponde 404 e restituisce null. */
async function caricaOppure404(db: Db, id: string, reply: FastifyReply) {
  const viaggio = uuid.safeParse(id).success ? await archivio.trovaViaggio(db, id) : null;
  if (!viaggio) reply.code(404).send({ errore: "Viaggio non trovato" });
  return viaggio;
}

/** Risposta 400 con un messaggio per ogni campo sbagliato: il gestionale li mostra accanto ai campi. */
function datiNonValidi(reply: FastifyReply, errore: z.ZodError) {
  const campi: Record<string, string> = {};
  for (const problema of errore.issues) {
    const campo = problema.path.join(".");
    campi[campo] ??= problema.message;
  }
  return reply.code(400).send({ errore: "Dati non validi", campi });
}

function conflitto(reply: FastifyReply, errore: string, problemi: string[] = []) {
  return reply.code(409).send({ errore, problemi });
}
