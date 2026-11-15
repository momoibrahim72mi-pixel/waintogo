// I testi dei viaggi (titolo, descrizione, itinerario...) arrivano dal database, non dai
// dizionari: li scrive l'organizzatore nel gestionale, in italiano. Le versioni inglese e
// araba esistono solo se qualcuno le ha tradotte E approvate (vedi D31 in docs/decisioni.md);
// l'API manda al sito solo quelle, nel campo "traduzioni" di ogni viaggio.
//
// Qui si sceglie la versione da mostrare:
//   - c'è la traduzione approvata nella lingua della pagina → si usa quella;
//   - non c'è → si mostra l'italiano.
// Quando si mostra l'italiano dentro una pagina inglese o araba, gli elementi con quei testi
// vanno marcati lang="it" dir="ltr" (attributiContenuto): così un titolo italiano dentro una
// pagina araba si legge da sinistra a destra, e i lettori di schermo lo pronunciano in italiano.
import type { LinguaTraduzione, TestiTradotti } from "@waintogo/shared";
import { direzione, type Lingua } from "./lingue";

type ConTraduzioni<T> = { traduzioni: Partial<Record<LinguaTraduzione, T>> };

/**
 * Il viaggio con i testi nella lingua della pagina, se tradotti, e la lingua in cui sono
 * scritti davvero. Funziona sia con il viaggio completo sia con le tessere dei viaggi passati.
 */
export function nellaLingua<V extends ConTraduzioni<Partial<TestiTradotti>>>(v: V, lingua: Lingua): V & { linguaTesti: Lingua } {
  const t = lingua === "it" ? undefined : v.traduzioni[lingua];
  if (!t) return { ...v, linguaTesti: "it" };
  // Si sovrappongono i testi tradotti a quelli italiani: i campi che non si traducono
  // (prezzi, date, stili...) restano quelli del viaggio.
  return { ...v, ...t, linguaTesti: lingua };
}

/** Attributi per gli elementi con testi del viaggio, se sono in una lingua diversa da quella della pagina. */
export function attributiContenuto(linguaPagina: Lingua, linguaTesti: Lingua) {
  return linguaTesti === linguaPagina ? {} : { lang: linguaTesti, dir: direzione(linguaTesti) };
}
