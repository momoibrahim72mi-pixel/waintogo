// Costruisce l'applicazione Fastify con tutte le sue rotte, senza avviarla.
// Tenerla separata da server.ts permette ai test di creare l'app e mandarle
// richieste finte (app.inject) senza aprire una porta di rete.
import type { Db } from "@waintogo/db";
import Fastify from "fastify";
import { rotteConti } from "./conti/rotte.js";
import { rotteCruscotto } from "./cruscotto/rotte.js";
import { type Oggi, oggiVero } from "./http.js";
import { rottePartenze } from "./partenze/rotte.js";
import { rottePubbliche } from "./pubblico/rotte.js";
import { rotteSpese } from "./spese/rotte.js";
import { rotteViaggi } from "./viaggi/rotte.js";

type Opzioni = {
  db: Db;
  /** La data di oggi (AAAA-MM-GG). Si può cambiare nei test per avere risultati sempre uguali. */
  oggi?: Oggi;
  log?: boolean;
};

export function creaApp({ db, oggi = oggiVero, log = false }: Opzioni) {
  const app = Fastify({ logger: log });

  app.get("/health", async () => ({ stato: "ok" }));

  // Rotte del gestionale (più avanti protette dal login).
  app.register(rotteViaggi, { db });
  app.register(rottePartenze, { db });
  app.register(rotteCruscotto, { db, oggi });
  app.register(rotteSpese, { db });
  app.register(rotteConti, { db, oggi });

  // Rotte per il sito pubblico.
  app.register(rottePubbliche, { db, oggi });

  return app;
}
