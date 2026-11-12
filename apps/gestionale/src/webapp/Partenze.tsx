// "Partenze": le prossime partenze, dalla più vicina, con posti e soldi a colpo d'occhio.
import { api } from "../api";
import { StatoPartenza } from "../componenti/Stato";
import { formattaData, formattaEuro } from "../formato";
import { Link } from "react-router";
import { Barra, Stato, Testata, useDati } from "./comuni";

export function Partenze() {
  const { dati, ricarica } = useDati(api.cruscotto);

  return (
    <>
      <Testata titolo="Partenze" sotto="Le prossime, dalla più vicina" aggiorna={ricarica} />
      <Stato dati={dati}>
        {dati?.prossimePartenze.length === 0 && <p className="wa-vuoto">Nessuna partenza in programma.</p>}
        <ul className="wa-elenco-schede">
          {dati?.prossimePartenze.map((p) => (
            <li key={p.id}>
              <Link to={`/webapp/partenze/${p.id}`} className="wa-scheda">
                <span className="wa-occhiello">
                  {formattaData(p.dataInizio)} – {formattaData(p.dataFine)}
                </span>
                <strong>{p.viaggioTitolo}</strong>
                <Barra valore={p.postiOccupati} totale={p.postiTotali} etichetta="Posti occupati" />
                <span className="wa-riga-info">
                  <span className="wa-piccolo">
                    {p.postiOccupati}/{p.postiTotali} posti
                    {p.inAttesa > 0 && ` · ${p.inAttesa} in attesa`}
                  </span>
                  <StatoPartenza p={p} />
                </span>
                <span className="wa-piccolo">
                  Incassati {formattaEuro(p.incassatoCentesimi)} · mancano {formattaEuro(p.daIncassareCentesimi)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Stato>
    </>
  );
}
