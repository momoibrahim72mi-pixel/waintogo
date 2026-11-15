// Le rotte delle TRADUZIONI dei viaggi (gestionale).
//
//   GET  /viaggi/:id/traduzioni                       le due lingue con il loro stato
//   PUT  /viaggi/:id/traduzioni/:lingua               salva una traduzione (incollata o corretta) come bozza
//   POST /viaggi/:id/traduzioni/:lingua/automatica    fa una bozza con il traduttore automatico (se configurato)
//   POST /viaggi/:id/traduzioni/:lingua/approva       approva: da ora va sul sito
//
// Tutte rispondono con lo stesso oggetto di GET, così il gestionale si aggiorna in un colpo.
import type { Db } from "@waintogo/db";
import {
  appiattisci,
  LINGUE_TRADUZIONE,
  type LinguaTraduzione,
  type TestiTradotti,
  testiDaTradurre,
  testiTradottiSchema,
  type Viaggio,
} from "@waintogo/shared";
import type { FastifyInstance, FastifyReply } from "fastify";
import { conflitto, datiNonValidi, eUnId, nonTrovato } from "../http.js";
import { trovaViaggio } from "../viaggi/archivio.js";
import * as archivio from "./archivio.js";
import type { Traduttore } from "./traduttore.js";

type Parametri = { Params: { id: string; lingua: string } };

export async function rotteTraduzioni(app: FastifyInstance, { db, traduttore }: { db: Db; traduttore: Traduttore | null }) {
  const risposta = async (v: Viaggio) => ({
    // Il gestionale mostra il pulsante "Traduci automaticamente" solo se c'è un servizio.
    automatica: traduttore?.nome ?? null,
    traduzioni: await archivio.traduzioniDi(db, v),
  });

  app.get<Parametri>("/viaggi/:id/traduzioni", async (req, reply) => {
    const v = await viaggioOppure404(db, req.params.id, reply);
    return v ? risposta(v) : reply;
  });

  app.put<Parametri>("/viaggi/:id/traduzioni/:lingua", async (req, reply) => {
    const v = await viaggioOppure404(db, req.params.id, reply);
    const lingua = linguaOppure404(req.params.lingua, reply);
    if (!v || !lingua) return reply;
    const dati = testiTradottiSchema.safeParse(req.body);
    if (!dati.success) return datiNonValidi(reply, dati.error);
    const problemi = giorniDiversi(v, dati.data);
    if (problemi) return conflitto(reply, problemi);
    await archivio.salvaBozza(db, v, lingua, dati.data);
    return risposta(v);
  });

  app.post<Parametri>("/viaggi/:id/traduzioni/:lingua/automatica", async (req, reply) => {
    const v = await viaggioOppure404(db, req.params.id, reply);
    const lingua = linguaOppure404(req.params.lingua, reply);
    if (!v || !lingua) return reply;
    if (!traduttore) return reply.code(503).send({ errore: "La traduzione automatica non è configurata (vedi docs/lingue.md)" });
    const { frasi, ricomponi } = appiattisci(testiDaTradurre(v));
    let tradotte: string[];
    try {
      tradotte = await traduttore.traduci(frasi, lingua);
    } catch (e) {
      req.log.error(e);
      return reply.code(502).send({ errore: `Il servizio di traduzione non risponde: ${(e as Error).message}` });
    }
    if (tradotte.length !== frasi.length) {
      return reply.code(502).send({ errore: "Il servizio di traduzione ha restituito un numero sbagliato di frasi" });
    }
    await archivio.salvaBozza(db, v, lingua, ricomponi(tradotte));
    return risposta(v);
  });

  app.post<Parametri>("/viaggi/:id/traduzioni/:lingua/approva", async (req, reply) => {
    const v = await viaggioOppure404(db, req.params.id, reply);
    const lingua = linguaOppure404(req.params.lingua, reply);
    if (!v || !lingua) return reply;
    const attuale = (await archivio.traduzioniDi(db, v)).find((t) => t.lingua === lingua)!;
    if (!attuale.testi) return conflitto(reply, "Non c'è ancora una traduzione da approvare");
    const problemi = giorniDiversi(v, attuale.testi);
    if (problemi) return conflitto(reply, `${problemi}: incolla di nuovo la traduzione aggiornata`);
    await archivio.approva(db, v, lingua);
    return risposta(v);
  });
}

/**
 * Le tappe tradotte devono essere gli stessi giorni dell'itinerario italiano,
 * altrimenti sul sito un giorno resterebbe senza traduzione (o ne comparirebbe uno in più).
 */
function giorniDiversi(v: Viaggio, t: TestiTradotti): string | null {
  const italiano = v.tappe.map((x) => x.giorno).sort((a, b) => a - b).join(",");
  const tradotto = t.tappe.map((x) => x.giorno).sort((a, b) => a - b).join(",");
  return italiano === tradotto ? null : `I giorni dell'itinerario non corrispondono (italiano: ${italiano || "nessuno"}; traduzione: ${tradotto || "nessuno"})`;
}

async function viaggioOppure404(db: Db, id: string, reply: FastifyReply) {
  const v = eUnId(id) ? await trovaViaggio(db, id) : null;
  if (!v) nonTrovato(reply, "Viaggio");
  return v;
}

function linguaOppure404(lingua: string, reply: FastifyReply): LinguaTraduzione | null {
  if ((LINGUE_TRADUZIONE as readonly string[]).includes(lingua)) return lingua as LinguaTraduzione;
  reply.code(404).send({ errore: "Lingua non prevista: si traduce in en e ar" });
  return null;
}
