// Costruisce l'applicazione Fastify con tutte le sue rotte, senza avviarla.
// Tenerla separata da server.ts permette ai test di creare l'app e mandarle
// richieste finte (app.inject) senza aprire una porta di rete.
import type { Db } from "@waintogo/db";
import Fastify from "fastify";
import { rotteViaggi } from "./viaggi/rotte.js";

type Opzioni = {
  db: Db;
  /** La data di oggi (AAAA-MM-GG). Si può cambiare nei test per avere risultati sempre uguali. */
  oggi?: () => string;
  log?: boolean;
};

export function creaApp({ db, oggi = () => new Date().toISOString().slice(0, 10), log = false }: Opzioni) {
  const app = Fastify({ logger: log });

  app.get("/health", async () => ({ stato: "ok" }));
  app.register(rotteViaggi, { db, oggi });

  return app;
}
