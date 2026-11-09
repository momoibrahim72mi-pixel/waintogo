// Configurazione di drizzle-kit, lo strumento che genera le migrazioni confrontando
// lo schema in src/schema.ts con le migrazioni già esistenti in drizzle/.
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./dist/schema.js",
  out: "./drizzle",
});
