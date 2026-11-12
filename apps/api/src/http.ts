// Piccoli aiuti per rispondere sempre allo stesso modo in tutte le rotte.
//
// I codici HTTP usati: 200 ok, 201 creato, 204 fatto (senza contenuto),
// 400 dati non validi, 404 non trovato, 409 l'operazione non è permessa in questo stato.
import type { FastifyReply } from "fastify";
import { z } from "zod";

/** Risposta 400 con un messaggio per ogni campo sbagliato: il gestionale li mostra accanto ai campi. */
export function datiNonValidi(reply: FastifyReply, errore: z.ZodError) {
  const campi: Record<string, string> = {};
  for (const problema of errore.issues) {
    campi[problema.path.join(".")] ??= problema.message;
  }
  return reply.code(400).send({ errore: "Dati non validi", campi });
}

export function conflitto(reply: FastifyReply, errore: string, problemi: string[] = []) {
  return reply.code(409).send({ errore, problemi });
}

export function nonTrovato(reply: FastifyReply, cosa: string) {
  return reply.code(404).send({ errore: `${cosa} non trovato` });
}

const uuid = z.uuid();
/** Gli id sono uuid: se non lo è, inutile chiedere al database (e Postgres darebbe errore). */
export const eUnId = (id: string) => uuid.safeParse(id).success;

/** La data di oggi (AAAA-MM-GG). Le rotte la ricevono come funzione, così i test possono fissarla. */
export type Oggi = () => string;
export const oggiVero: Oggi = () => new Date().toISOString().slice(0, 10);

/**
 * Un errore "previsto" lanciato dentro un'operazione (per esempio "non ci sono più posti").
 * Lanciarlo dentro una transazione la annulla; la rotta lo trasforma in una risposta 409.
 */
export class Rifiutato extends Error {}
