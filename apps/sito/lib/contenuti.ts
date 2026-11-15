// I testi dei viaggi (titolo, descrizione, itinerario...) arrivano dal database, non dai
// dizionari: li scrive l'organizzatore nel gestionale, e per ora solo in italiano.
//
// Quando una pagina è in inglese o in arabo, questi testi restano in italiano. Per non
// confondere il browser (e i lettori di schermo) li segnamo con lang="it" e dir="ltr":
// così un titolo italiano dentro una pagina araba si legge da sinistra a destra, con la
// punteggiatura al posto giusto.
//
// Tutto passa da qui apposta: quando i viaggi avranno le loro traduzioni (vedi D30 in
// docs/decisioni.md) basterà cambiare questo file per scegliere la versione giusta.
import { direzione, type Lingua } from "./lingue";

/** In che lingua sono scritti i testi dei viaggi. Per ora sempre italiano. */
export function linguaContenuti(_linguaPagina: Lingua): Lingua {
  return "it";
}

/** Attributi da mettere sugli elementi con testi del viaggio, se la lingua è diversa da quella della pagina. */
export function attributiContenuto(linguaPagina: Lingua) {
  const lingua = linguaContenuti(linguaPagina);
  return lingua === linguaPagina ? {} : { lang: lingua, dir: direzione(lingua) };
}
