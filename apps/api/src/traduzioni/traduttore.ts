// Il servizio di TRADUZIONE AUTOMATICA (facoltativo).
//
// Il modo normale di tradurre un viaggio è: Claude prepara la traduzione in chat e la si
// incolla nel gestionale ("Incolla traduzione"), poi la si approva (vedi D31).
// In più il gestionale ha un pulsante "Traduci automaticamente", che funziona solo se qui
// è configurato un servizio. Si sceglie con le variabili d'ambiente dell'API:
//
//   DEEPL_API_KEY=...            DeepL (il piano "API Free" è gratis fino a 500.000 caratteri al mese)
//   LIBRETRANSLATE_URL=http://...  LibreTranslate, un traduttore che si può ospitare da sé
//
// Senza nessuna delle due il pulsante resta spento: il resto funziona lo stesso.
// Il traduttore riceve un elenco di frasi e restituisce le frasi tradotte nello stesso ordine
// (appiattisci() in packages/shared/src/traduzione.ts trasforma i campi in elenco e ritorno).
import type { LinguaTraduzione } from "@waintogo/shared";

export type Traduttore = {
  /** Il nome del servizio, da mostrare nel gestionale ("DeepL"). */
  nome: string;
  traduci: (frasi: string[], lingua: LinguaTraduzione) => Promise<string[]>;
};

/** Sceglie il traduttore in base alle variabili d'ambiente; null se non ce n'è nessuno. */
export function traduttoreDaAmbiente(env: NodeJS.ProcessEnv = process.env): Traduttore | null {
  if (env.DEEPL_API_KEY) return deepl(env.DEEPL_API_KEY);
  if (env.LIBRETRANSLATE_URL) return libreTranslate(env.LIBRETRANSLATE_URL, env.LIBRETRANSLATE_API_KEY);
  return null;
}

/**
 * DeepL. Documentazione: https://developers.deepl.com/docs/api-reference/translate
 * Le chiavi del piano gratuito finiscono con ":fx" e usano un indirizzo diverso.
 * DeepL accetta al massimo 50 testi per richiesta: li mandiamo a gruppi.
 */
function deepl(chiave: string): Traduttore {
  const base = chiave.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  // "EN-GB": inglese britannico, il più vicino a chi viaggia dall'Europa.
  const lingue: Record<LinguaTraduzione, string> = { en: "EN-GB", ar: "AR" };
  return {
    nome: "DeepL",
    async traduci(frasi, lingua) {
      const risultato: string[] = [];
      for (let i = 0; i < frasi.length; i += 50) {
        const r = await fetch(`${base}/v2/translate`, {
          method: "POST",
          headers: { Authorization: `DeepL-Auth-Key ${chiave}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text: frasi.slice(i, i + 50), source_lang: "IT", target_lang: lingue[lingua] }),
        });
        if (!r.ok) throw new Error(`DeepL ha risposto ${r.status}${r.status === 456 ? " (quota del mese finita)" : ""}`);
        const dati = (await r.json()) as { translations: { text: string }[] };
        risultato.push(...dati.translations.map((t) => t.text));
      }
      return risultato;
    },
  };
}

/** LibreTranslate. Documentazione: https://docs.libretranslate.com (rotta POST /translate). */
function libreTranslate(url: string, chiave?: string): Traduttore {
  return {
    nome: "LibreTranslate",
    async traduci(frasi, lingua) {
      if (frasi.length === 0) return [];
      const r = await fetch(`${url.replace(/\/$/, "")}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: frasi, source: "it", target: lingua, format: "text", ...(chiave ? { api_key: chiave } : {}) }),
      });
      if (!r.ok) throw new Error(`LibreTranslate ha risposto ${r.status}`);
      const dati = (await r.json()) as { translatedText: string[] };
      return dati.translatedText;
    },
  };
}

/** Un traduttore finto per i test: mette "[en] " davanti a ogni frase. */
export const traduttoreFinto: Traduttore = {
  nome: "Finto",
  traduci: async (frasi, lingua) => frasi.map((f) => `[${lingua}] ${f}`),
};
