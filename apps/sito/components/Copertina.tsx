// L'immagine di copertina di un viaggio. Se non c'è una foto, un riquadro colorato
// (il colore dipende dallo stile del viaggio) con il nome della destinazione.
import type { ViaggioPubblico } from "@waintogo/shared";

export function Copertina({ viaggio }: { viaggio: Pick<ViaggioPubblico, "immagineUrl" | "destinazione" | "stili"> }) {
  if (viaggio.immagineUrl) {
    // Un <img> semplice: le immagini arrivano da indirizzi esterni scelti dall'organizzatore.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={viaggio.immagineUrl} alt={`Foto: ${viaggio.destinazione}`} loading="lazy" />;
  }
  return (
    <div className={`copertina-segnaposto c-${viaggio.stili[0] ?? "generico"}`} aria-hidden="true">
      {viaggio.destinazione}
    </div>
  );
}
