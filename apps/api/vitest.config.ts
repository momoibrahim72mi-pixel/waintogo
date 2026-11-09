import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Prepara il database dei test una volta sola, prima di tutti i test.
    globalSetup: ["./test/preparazione.ts"],
    // I test usano lo stesso database: li facciamo girare uno dopo l'altro.
    fileParallelism: false,
  },
});
