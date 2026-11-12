// La scheda di un viaggio nel catalogo e nella home.
import { disponibilita, type ViaggioPubblico } from "@waintogo/shared";
import Link from "next/link";
import { dataBreve, prezzo } from "../lib/formato";
import { Copertina } from "./Copertina";

export function SchedaViaggio({ viaggio }: { viaggio: ViaggioPubblico }) {
  const prossima = viaggio.partenze[0];
  const stato = prossima ? disponibilita(prossima) : null;
  const altre = viaggio.partenze.length - 1;
  return (
    <Link href={`/viaggi/${viaggio.slug}`} className="scheda">
      <div className="copertina">
        <Copertina viaggio={viaggio} />
        {stato && stato.tipo !== "disponibile" && <span className={`etichetta e-${stato.tipo}`}>{stato.testo}</span>}
      </div>
      <div className="scheda-corpo">
        <h3>{viaggio.titolo}</h3>
        <p className="scheda-meta">
          {viaggio.destinazione} · {viaggio.durataGiorni} giorni{viaggio.fasciaEta && ` · ${viaggio.fasciaEta}`}
        </p>
        <p className="scheda-meta">
          {prossima
            ? `Prossima partenza ${dataBreve(prossima.dataInizio, true)}${altre > 0 ? ` (+${altre} date)` : ""}`
            : "Nuove date in arrivo"}
        </p>
        <div className="scheda-piede">
          {viaggio.prezzoDaCentesimi !== null ? (
            <span className="prezzo-da">
              da <strong>{prezzo(viaggio.prezzoDaCentesimi)}</strong>
            </span>
          ) : (
            <span className="prezzo-da">Prezzo in arrivo</span>
          )}
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}
