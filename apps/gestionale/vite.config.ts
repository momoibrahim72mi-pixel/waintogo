import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // In sviluppo le chiamate a /api vengono girate all'API locale:
    // così il gestionale usa sempre indirizzi relativi, sia in locale sia in produzione.
    proxy: {
      "/api": { target: "http://localhost:3001", rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
});
