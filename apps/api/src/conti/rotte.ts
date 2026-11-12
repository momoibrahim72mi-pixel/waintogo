// GET /conti?anno=2026: i conti dell'agenzia.
//
//  - saldo:    di sempre. Entrate = pagamenti ricevuti dagli iscritti; uscite = spese PAGATE.
//              Il saldo è la differenza: i soldi che dovrebbero esserci sul conto
//              (se tutti i movimenti sono stati registrati).
//  - mesi:     entrate e uscite mese per mese dell'anno scelto, in base alla data del movimento.
//  - partenze: per ogni partenza dell'anno, ricavi attesi, incassato, costi e margine.
//
// Come il cruscotto, legge le righe e fa i conti in TypeScript: con i numeri di un'agenzia
// piccola sono poche migliaia di righe al massimo.
import { type Db, pagamenti, partenze, spese } from "@waintogo/db";
import { type Conti, type ContiPartenza, type MeseConti, ricaviAttesi } from "@waintogo/shared";
import { asc, gte } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Oggi } from "../http.js";
import { OCCUPANO_POSTO } from "../partenze/calcoli.js";

export async function rotteConti(app: FastifyInstance, { db, oggi }: { db: Db; oggi: Oggi }) {
  app.get<{ Querystring: { anno?: string } }>("/conti", async (req, reply): Promise<Conti> => {
    const oggiStr = oggi();
    const anno = req.query.anno === undefined ? Number(oggiStr.slice(0, 4)) : Number(req.query.anno);
    if (!Number.isInteger(anno) || anno < 2000 || anno > 2100) {
      return reply.code(400).send({ errore: "Anno non valido", campi: { anno: "Anno non valido" } });
    }

    const [tuttiPagamenti, tutteSpese, righePartenze] = await Promise.all([
      db.select({ importo: pagamenti.importoCentesimi, data: pagamenti.data }).from(pagamenti),
      db.select({ importo: spese.importoCentesimi, data: spese.data, pagata: spese.pagata }).from(spese),
      // Servono le partenze dell'anno (per i margini) e quelle future (per il "da incassare").
      db.query.partenze.findMany({
        where: gte(partenze.dataInizio, minimo(`${anno}-01-01`, oggiStr)),
        orderBy: [asc(partenze.dataInizio)],
        with: {
          viaggio: { columns: { titolo: true } },
          iscrizioni: { columns: { stato: true }, with: { pagamenti: { columns: { importoCentesimi: true } } } },
          spese: { columns: { importoCentesimi: true, pagata: true } },
        },
      }),
    ]);

    // --- Saldo di sempre ---
    const somma = (righe: { importo: number }[]) => righe.reduce((s, r) => s + r.importo, 0);
    const entrate = somma(tuttiPagamenti);
    const uscite = somma(tutteSpese.filter((s) => s.pagata));
    const daPagare = somma(tutteSpese.filter((s) => !s.pagata));

    // --- Mese per mese ---
    const mesi: MeseConti[] = Array.from({ length: 12 }, (_, i) => ({
      mese: `${anno}-${String(i + 1).padStart(2, "0")}`,
      entrateCentesimi: 0,
      usciteCentesimi: 0,
    }));
    const nelMese = (data: string) => (data.startsWith(`${anno}-`) ? mesi[Number(data.slice(5, 7)) - 1] : undefined);
    for (const p of tuttiPagamenti) {
      const m = nelMese(p.data);
      if (m) m.entrateCentesimi += p.importo;
    }
    for (const s of tutteSpese) {
      const m = s.pagata ? nelMese(s.data) : undefined;
      if (m) m.usciteCentesimi += s.importo;
    }

    // --- Partenze ---
    let daIncassare = 0;
    const contiPartenze: ContiPartenza[] = [];
    for (const p of righePartenze) {
      const iscritti = p.iscrizioni.map((i) => ({
        stato: i.stato,
        pagatoCentesimi: i.pagamenti.reduce((s, pg) => s + pg.importoCentesimi, 0),
      }));
      const incassato = iscritti.reduce((s, i) => s + i.pagatoCentesimi, 0);
      // Quanto devono ancora pagare gli iscritti delle partenze future che occupano un posto.
      if (!p.annullata && p.dataInizio >= oggiStr) {
        for (const i of iscritti) {
          if (OCCUPANO_POSTO.includes(i.stato)) daIncassare += Math.max(p.prezzoCentesimi - i.pagatoCentesimi, 0);
        }
      }
      if (!p.dataInizio.startsWith(`${anno}-`)) continue;
      const costi = p.spese.reduce((s, x) => s + x.importoCentesimi, 0);
      const ricavi = ricaviAttesi(iscritti, p.prezzoCentesimi, p.annullata);
      contiPartenze.push({
        id: p.id,
        viaggioTitolo: p.viaggio.titolo,
        dataInizio: p.dataInizio,
        annullata: p.annullata,
        ricaviAttesiCentesimi: ricavi,
        incassatoCentesimi: incassato,
        costiCentesimi: costi,
        costiPagatiCentesimi: p.spese.filter((x) => x.pagata).reduce((s, x) => s + x.importoCentesimi, 0),
        margineCentesimi: ricavi - costi,
      });
    }

    return {
      anno,
      saldo: {
        entrateCentesimi: entrate,
        usciteCentesimi: uscite,
        saldoCentesimi: entrate - uscite,
        daPagareCentesimi: daPagare,
        daIncassareCentesimi: daIncassare,
      },
      mesi,
      partenze: contiPartenze,
    };
  });
}

const minimo = (a: string, b: string) => (a < b ? a : b);
