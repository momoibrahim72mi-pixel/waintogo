// Punto di ingresso dell'API: legge la configurazione, prepara il database e avvia il server.
import { applicaMigrazioni, creaDb } from "@waintogo/db";
import { creaApp } from "./app.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Manca DATABASE_URL: copia .env.example in .env (vedi docs/sviluppo.md)");
  process.exit(1);
}

const { db, chiudi } = creaDb(url);

// A ogni avvio l'API porta il database all'ultima versione delle tabelle.
// Con una sola copia dell'API è il modo più semplice; se un giorno ne avremo più
// di una, sposteremo questo passo in un Job di Kubernetes che gira prima del deploy.
await applicaMigrazioni(db);

const app = creaApp({ db, log: true });

// In un container bisogna ascoltare su 0.0.0.0, non su localhost,
// altrimenti le richieste che arrivano da fuori dal container non vengono accettate.
const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: "0.0.0.0" });

// Quando Kubernetes ferma un pod manda SIGTERM: chiudiamo server e database con calma.
for (const segnale of ["SIGTERM", "SIGINT"] as const) {
  process.on(segnale, async () => {
    await app.close();
    await chiudi();
    process.exit(0);
  });
}
