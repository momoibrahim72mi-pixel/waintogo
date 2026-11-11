// GET /cruscotto: i numeri della prima pagina del gestionale.
// Una sola richiesta al database (partenze future con viaggio, iscrizioni e pagamenti),
// poi i conti si fanno qui in TypeScript: con i volumi di un'agenzia piccola è più che sufficiente.
import { type Db, iscrizioni, partenze } from "@waintogo/db";
import {
  aggiungiGiorni,
  type Cruscotto,
  type DaFare,
  GIORNI_SALDO,
  type PartenzaCruscotto,
} from "@waintogo/shared";
import { asc, gte } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Oggi } from "../http.js";
import { inIscrizione } from "../partenze/archivio.js";
import { calcolaPartenza } from "../partenze/calcoli.js";

export async function rotteCruscotto(app: FastifyInstance, { db, oggi }: { db: Db; oggi: Oggi }) {
  app.get("/cruscotto", async (): Promise<Cruscotto> => {
    const oggiStr = oggi();
    const limiteSaldo = aggiungiGiorni(oggiStr, GIORNI_SALDO);
    const righe = await db.query.partenze.findMany({
      where: gte(partenze.dataInizio, oggiStr),
      orderBy: [asc(partenze.dataInizio)],
      with: {
        viaggio: { columns: { titolo: true, durataGiorni: true } },
        iscrizioni: { orderBy: [asc(iscrizioni.creatoIl)], with: { pagamenti: true } },
      },
    });

    const risultato: Cruscotto = { prossimePartenze: [], daConfermare: [], inAttesa: [], saldiDaSollecitare: [] };
    for (const { viaggio, iscrizioni: righeIscrizioni, ...p } of righe) {
      if (p.annullata) continue;
      const elenco = righeIscrizioni.map((i) => inIscrizione(i, p.prezzoCentesimi, p.accontoCentesimi));
      const attive = elenco.filter((i) => i.stato === "richiesta" || i.stato === "confermata");
      const incassato = attive.reduce((s, i) => s + i.pagatoCentesimi, 0);
      const partenza: PartenzaCruscotto = {
        ...calcolaPartenza(p, viaggio.durataGiorni, righeIscrizioni),
        viaggioTitolo: viaggio.titolo,
        incassatoCentesimi: incassato,
        daIncassareCentesimi: attive.length * p.prezzoCentesimi - incassato,
      };
      risultato.prossimePartenze.push(partenza);

      const conViaggio = (i: (typeof elenco)[number]): DaFare => ({
        ...i,
        viaggioTitolo: viaggio.titolo,
        dataInizio: p.dataInizio,
        prezzoCentesimi: p.prezzoCentesimi,
      });
      for (const i of elenco) {
        if (i.stato === "richiesta") risultato.daConfermare.push(conViaggio(i));
        if (i.stato === "lista_attesa") risultato.inAttesa.push(conViaggio(i));
        if (i.stato === "confermata" && i.statoPagamento !== "saldato" && p.dataInizio <= limiteSaldo) {
          risultato.saldiDaSollecitare.push(conViaggio(i));
        }
      }
    }
    return risultato;
  });
}
