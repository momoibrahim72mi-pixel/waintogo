// Connessione al database e applicazione delle migrazioni.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import * as schema from "./schema.js";

export * from "./schema.js";
export { schema };

/** Crea la connessione. `url` è DATABASE_URL, per esempio postgres://utente:password@localhost:5432/waintogo */
export function creaDb(url: string) {
  // max 5: al massimo 5 connessioni aperte insieme, più che sufficienti e leggere per Postgres.
  const client = postgres(url, { max: 5, onnotice: () => {} });
  const db = drizzle(client, { schema });
  return { db, chiudi: () => client.end() };
}

export type Db = ReturnType<typeof creaDb>["db"];

/**
 * Applica al database le migrazioni che non sono ancora state applicate.
 * Drizzle tiene nota di quelle già fatte in una tabella sua, quindi si può chiamare
 * a ogni avvio: se non c'è niente di nuovo, non fa nulla.
 */
export async function applicaMigrazioni(db: Db) {
  const cartella = fileURLToPath(new URL("../drizzle", import.meta.url));
  await migrate(db, { migrationsFolder: cartella });
}
