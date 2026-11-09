// Punto di ingresso dell'API.
// Per ora espone solo /health: Kubernetes lo chiamerà per sapere se il container è vivo.
import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ stato: "ok" }));

// In un container bisogna ascoltare su 0.0.0.0, non su localhost,
// altrimenti le richieste che arrivano da fuori dal container non vengono accettate.
const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: "0.0.0.0" });

// Quando Kubernetes ferma un pod manda SIGTERM: chiudiamo il server con calma.
for (const segnale of ["SIGTERM", "SIGINT"] as const) {
  process.on(segnale, async () => {
    await app.close();
    process.exit(0);
  });
}
