import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  // "standalone" crea una cartella con solo i file necessari per avviare il sito:
  // l'immagine Docker finale resta piccola (niente node_modules completo).
  output: "standalone",
  // In un monorepo Next deve sapere dov'è la radice, per copiare le dipendenze giuste.
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  // Pagine che non esistono più (vedi D26 in docs/decisioni.md): chi ha un vecchio link
  // finisce nella sezione giusta della home invece che su "pagina non trovata".
  // permanent: false (codice 307) perché in futuro un catalogo potrebbe tornare.
  async redirects() {
    return [
      { source: "/viaggi", destination: "/#prossimo-viaggio", permanent: false },
      { source: "/come-funziona", destination: "/#faq", permanent: false },
    ];
  },
};

export default config;
