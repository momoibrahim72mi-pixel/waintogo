// Service worker della webapp (spiegazione in src/webapp/installazione.ts).
//
// Regole:
//  - /api/...      MAI in memoria: i dati si chiedono sempre al server.
//  - /assets/...   i file JS e CSS compilati da Vite. Hanno un "hash" nel nome
//                  (index-3f9a1c.js) che cambia a ogni versione, quindi si possono
//                  tenere in memoria per sempre: una versione nuova ha nomi nuovi.
//  - le pagine     prima si prova la rete (così si vede sempre l'ultima versione);
//                  se non c'è rete si usa l'ultima copia salvata.

const MEMORIA = "waintogo-webapp-v1";

// All'installazione salviamo subito la pagina e i file JS/CSS che usa (li leggiamo
// dentro l'HTML), così l'app si apre anche se la prima visita è stata l'unica con la rete.
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    (async () => {
      const memoria = await caches.open(MEMORIA);
      const risposta = await fetch("/webapp", { cache: "no-cache" });
      const html = await risposta.clone().text();
      await memoria.put("/webapp", risposta);
      const file = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
      await memoria.addAll([...new Set(file)]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (evento) => {
  // Cancella le memorie delle versioni precedenti di questo file.
  evento.waitUntil(
    caches
      .keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== MEMORIA).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const richiesta = evento.request;
  const url = new URL(richiesta.url);
  if (richiesta.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icone/")) {
    evento.respondWith(
      // ignoreVary: i file JS hanno "crossorigin" e il server risponde con "Vary: Origin";
      // senza questa opzione la copia salvata non verrebbe riconosciuta.
      caches.match(richiesta, { ignoreVary: true }).then(
        (salvata) =>
          salvata ||
          fetch(richiesta).then((risposta) => {
            if (risposta.ok) {
              const copia = risposta.clone();
              caches.open(MEMORIA).then((m) => m.put(richiesta, copia));
            }
            return risposta;
          }),
      ),
    );
    return;
  }

  if (richiesta.mode === "navigate") {
    evento.respondWith(
      fetch(richiesta)
        .then((risposta) => {
          // Tutte le pagine dell'app sono lo stesso index.html: ne salviamo una sola copia.
          const copia = risposta.clone();
          caches.open(MEMORIA).then((m) => m.put("/webapp", copia));
          return risposta;
        })
        .catch(() => caches.match("/webapp")),
    );
  }
});
