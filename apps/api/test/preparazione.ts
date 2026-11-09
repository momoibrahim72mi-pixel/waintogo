// Preparazione dei test: usano un database a parte (waintogo_test), così non toccano
// mai i dati che usi in sviluppo. Se non esiste, lo creiamo.
import { applicaMigrazioni, creaDb } from "@waintogo/db";
import postgres from "postgres";

export const URL_TEST =
  process.env.DATABASE_URL_TEST ?? "postgres://waintogo:cambiami@localhost:5432/waintogo_test";

export async function setup() {
  const indirizzo = new URL(URL_TEST);
  const nome = indirizzo.pathname.slice(1);
  // Ci colleghiamo al database "postgres" (esiste sempre) per poter creare quello dei test.
  indirizzo.pathname = "/postgres";
  const admin = postgres(indirizzo.toString(), { max: 1, onnotice: () => {} });
  const esiste = await admin`select 1 from pg_database where datname = ${nome}`;
  if (esiste.length === 0) await admin.unsafe(`create database "${nome}"`);
  await admin.end();

  const { db, chiudi } = creaDb(URL_TEST);
  await applicaMigrazioni(db);
  await chiudi();
}
