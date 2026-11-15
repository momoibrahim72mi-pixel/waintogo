// Le lingue del sito e le regole sugli indirizzi. Questo file lo usano tutti: il proxy
// (che decide la lingua di ogni richiesta), le pagine sul server e i componenti nel browser.
//
// Come sono fatti gli indirizzi (vedi D28 in docs/decisioni.md):
//   italiano  /viaggi/islanda       senza prefisso: gli indirizzi di prima restano validi
//   inglese   /en/viaggi/islanda
//   arabo     /ar/viaggi/islanda
// Dentro l'app la lingua è sempre la prima parte del percorso (app/[lingua]/...): per
// l'italiano ce la mette il proxy, di nascosto, con una "rewrite" (vedi proxy.ts).

export const LINGUE = ["it", "en", "ar"] as const;
export type Lingua = (typeof LINGUE)[number];

/** La lingua di chi non ha scelto: quella degli indirizzi senza prefisso. */
export const LINGUA_PREDEFINITA: Lingua = "it";

/** Il cookie che ricorda la lingua scelta con il selettore (vale un anno). */
export const COOKIE_LINGUA = "lingua";

export function eLingua(valore: string | undefined): valore is Lingua {
  return LINGUE.includes(valore as Lingua);
}

/** Il nome di ogni lingua scritto nella lingua stessa: così ognuno riconosce la sua. */
export const NOMI_LINGUE: Record<Lingua, { breve: string; esteso: string }> = {
  it: { breve: "IT", esteso: "Italiano" },
  en: { breve: "EN", esteso: "English" },
  ar: { breve: "عربي", esteso: "العربية" },
};

/** L'arabo si scrive da destra a sinistra (rtl = right to left), le altre da sinistra (ltr). */
export function direzione(lingua: Lingua): "ltr" | "rtl" {
  return lingua === "ar" ? "rtl" : "ltr";
}

/**
 * Il "locale" per le funzioni Intl (date, prezzi, plurali).
 * Per l'arabo chiediamo le cifre occidentali (1, 2, 3: "-u-nu-latn") invece di quelle
 * arabo-indiane (١، ٢، ٣): sono le stesse del codice di prenotazione e dei numeri di
 * telefono, e si leggono in tutto il mondo arabo. Per cambiarle basta togliere "-u-nu-latn".
 */
export const LOCALE: Record<Lingua, string> = {
  it: "it-IT",
  en: "en-GB",
  ar: "ar-u-nu-latn",
};

/** Aggiunge il prefisso della lingua a un percorso del sito: ("en", "/viaggi/x") → "/en/viaggi/x". */
export function percorso(lingua: Lingua, p: string) {
  if (lingua === LINGUA_PREDEFINITA) return p;
  // "/" diventa "/en"; "/#faq" diventa "/en#faq"; "/viaggi/x" diventa "/en/viaggi/x".
  return p === "/" || p.startsWith("/#") ? `/${lingua}${p.slice(1)}` : `/${lingua}${p}`;
}

/** Il contrario di percorso(): toglie il prefisso. "/en/viaggi/x" → "/viaggi/x". */
export function senzaLingua(p: string) {
  const [, primo, ...resto] = p.split("/");
  if (eLingua(primo)) return `/${resto.join("/")}`;
  return p || "/";
}

/** La lingua dai parametri di una pagina (app/[lingua]/...). Se non è valida, l'italiano. */
export async function linguaDa(params: Promise<{ lingua: string }>): Promise<Lingua> {
  const { lingua } = await params;
  return eLingua(lingua) ? lingua : LINGUA_PREDEFINITA;
}

/**
 * Gli indirizzi della stessa pagina in tutte le lingue, per i metadati "alternates":
 * dicono a Google che /viaggi/x, /en/viaggi/x e /ar/viaggi/x sono la stessa pagina
 * tradotta (nell'HTML diventano <link rel="alternate" hreflang="...">).
 * "x-default" è la versione da mostrare a chi parla una lingua che non abbiamo.
 */
export function alternative(lingua: Lingua, p: string) {
  return {
    canonical: percorso(lingua, p),
    languages: {
      ...Object.fromEntries(LINGUE.map((l) => [l, percorso(l, p)])),
      "x-default": percorso(LINGUA_PREDEFINITA, p),
    },
  };
}
