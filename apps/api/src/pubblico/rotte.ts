// Rotte per il SITO PUBBLICO. Mostrano solo ciò che un visitatore può vedere:
// viaggi pubblicati, partenze future e non annullate, nessun dato degli iscritti.
//
//   GET  /pubblico/viaggi          catalogo (viaggi con partenze future: il "prossimo viaggio")
//   GET  /pubblico/viaggi-passati  i viaggi già fatti, dal più recente
//   GET  /pubblico/viaggi/:slug    pagina del viaggio
//   POST /pubblico/iscrizioni      richiesta di iscrizione → ricevuta con codice e istruzioni
//
// Il sito chiama queste rotte DAL SUO SERVER (non dal browser), dentro il cluster:
// l'API non deve essere raggiungibile da internet.
import { type Db, partenze, viaggi } from "@waintogo/db";
import {
  aggiungiGiorni,
  iscrizionePubblicaSchema,
  type Partenza,
  type PartenzaPubblica,
  type RicevutaIscrizione,
  type Viaggio,
  type ViaggioPassato,
  type ViaggioPubblico,
} from "@waintogo/shared";
import { and, eq, gt } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { conflitto, datiNonValidi, nonTrovato, type Oggi } from "../http.js";
import * as iscrizioni from "../iscrizioni/archivio.js";
import { conRifiuti } from "../partenze/rotte.js";
import { elencoViaggi, inViaggio } from "../viaggi/archivio.js";

export async function rottePubbliche(app: FastifyInstance, { db, oggi }: { db: Db; oggi: Oggi }) {
  app.get("/pubblico/viaggi", async () => {
    const tutti = await elencoViaggi(db);
    return tutti.filter((v) => v.stato === "pubblicato").map((v) => inPubblico(v, oggi()));
  });

  // I viaggi passati: quelli con almeno una partenza già iniziata e non annullata.
  // Valgono i viaggi pubblicati e quelli chiusi (un viaggio chiuso è finito, ma è stato vero);
  // le bozze no. Se un viaggio è partito più volte conta l'ultima partenza.
  app.get("/pubblico/viaggi-passati", async () => {
    const tutti = await elencoViaggi(db);
    const passati: ViaggioPassato[] = [];
    for (const v of tutti) {
      if (v.stato === "bozza") continue;
      const ultima = v.partenze
        .filter((p) => !p.annullata && p.dataInizio <= oggi())
        .sort((a, b) => b.dataInizio.localeCompare(a.dataInizio))[0];
      if (!ultima) continue;
      passati.push({
        slug: v.slug,
        titolo: v.titolo,
        destinazione: v.destinazione,
        immagineUrl: v.immagineUrl,
        stili: v.stili,
        durataGiorni: v.durataGiorni,
        dataInizio: ultima.dataInizio,
        dataFine: ultima.dataFine,
      });
    }
    return passati.sort((a, b) => b.dataInizio.localeCompare(a.dataInizio));
  });

  app.get<{ Params: { slug: string } }>("/pubblico/viaggi/:slug", async (req, reply) => {
    const riga = await db.query.viaggi.findFirst({
      where: and(eq(viaggi.slug, req.params.slug), eq(viaggi.stato, "pubblicato")),
      with: {
        tappe: true,
        partenze: { with: { iscrizioni: { columns: { stato: true } } } },
      },
    });
    if (!riga) return nonTrovato(reply, "Viaggio");
    const v = inViaggio(riga);
    v.tappe.sort((a, b) => a.giorno - b.giorno);
    return inPubblico(v, oggi());
  });

  app.post("/pubblico/iscrizioni", async (req, reply) => {
    const dati = iscrizionePubblicaSchema.safeParse(req.body);
    if (!dati.success) return datiNonValidi(reply, dati.error);
    const { partenzaId, privacy: _privacy, ...persona } = dati.data;

    // La partenza deve essere visibile sul sito: viaggio pubblicato, data futura, non annullata.
    const partenza = await db.query.partenze.findFirst({
      where: and(eq(partenze.id, partenzaId), eq(partenze.annullata, false), gt(partenze.dataInizio, oggi())),
      with: { viaggio: true },
    });
    if (!partenza || partenza.viaggio.stato !== "pubblicato") {
      return conflitto(reply, "Questa partenza non è più disponibile");
    }

    return conRifiuti(reply, async () => {
      const nuova = await iscrizioni.creaIscrizione(db, partenzaId, persona);
      const ricevuta: RicevutaIscrizione = {
        codice: nuova.codice,
        stato: nuova.stato === "lista_attesa" ? "lista_attesa" : "richiesta",
        viaggio: partenza.viaggio.titolo,
        dataInizio: partenza.dataInizio,
        dataFine: aggiungiGiorni(partenza.dataInizio, partenza.viaggio.durataGiorni - 1),
        prezzoCentesimi: partenza.prezzoCentesimi,
        accontoCentesimi: partenza.accontoCentesimi,
        istruzioniPagamento: partenza.viaggio.istruzioniPagamento,
      };
      return reply.code(201).send(ricevuta);
    });
  });
}

/** Toglie i dati interni e tiene solo le partenze future e non annullate, dalla più vicina. */
function inPubblico(v: Viaggio, oggi: string): ViaggioPubblico {
  const { stato: _s, creatoIl: _c, aggiornatoIl: _a, partenze: tutte, ...resto } = v;
  const future = tutte
    .filter((p) => !p.annullata && p.dataInizio > oggi)
    .sort((a, b) => a.dataInizio.localeCompare(b.dataInizio))
    .map(partenzaPubblica);
  return {
    ...resto,
    partenze: future,
    prezzoDaCentesimi: future.length > 0 ? Math.min(...future.map((p) => p.prezzoCentesimi)) : null,
  };
}

function partenzaPubblica(p: Partenza): PartenzaPubblica {
  return {
    id: p.id,
    dataInizio: p.dataInizio,
    dataFine: p.dataFine,
    prezzoCentesimi: p.prezzoCentesimi,
    accontoCentesimi: p.accontoCentesimi,
    postiLiberi: p.postiLiberi,
    garantita: p.garantita,
    coordinatore: p.coordinatore,
  };
}
