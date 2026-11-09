import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  // "standalone" crea una cartella con solo i file necessari per avviare il sito:
  // l'immagine Docker finale resta piccola (niente node_modules completo).
  output: "standalone",
  // In un monorepo Next deve sapere dov'è la radice, per copiare le dipendenze giuste.
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
};

export default config;
