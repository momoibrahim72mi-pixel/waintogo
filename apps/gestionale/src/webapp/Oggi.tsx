// "Oggi": la prima schermata della webapp. Le cose da fare, una sotto l'altra,
// con la persona da contattare e quanto deve ancora pagare.
import { type DaFare, GIORNI_SALDO } from "@waintogo/shared";
import { Link } from "react-router";
import { api } from "../api";
import { formattaData, formattaEuro } from "../formato";
import { Barra, Stato, Testata, useDati } from "./comuni";

export function Oggi() {
  const { dati, ricarica } = useDati(api.cruscotto);
  const prossima = dati?.prossimePartenze[0];
  const totale = dati ? dati.daConfermare.length + dati.saldiDaSollecitare.length + dati.inAttesa.length : 0;

  return (
    <>
      <Testata
        titolo="Oggi"
        sotto={new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
        aggiorna={ricarica}
      />
      <Stato dati={dati}>
        {prossima && (
          <Link to={`/webapp/partenze/${prossima.id}`} className="wa-scheda wa-prossima">
            <span className="wa-occhiello">Prossima partenza · {formattaData(prossima.dataInizio)}</span>
            <strong>{prossima.viaggioTitolo}</strong>
            <Barra valore={prossima.postiOccupati} totale={prossima.postiTotali} etichetta="Posti occupati" />
            <span className="wa-piccolo">
              {prossima.postiOccupati}/{prossima.postiTotali} posti · incassati {formattaEuro(prossima.incassatoCentesimi)}
            </span>
          </Link>
        )}

        {totale === 0 && <p className="wa-vuoto">Niente da fare per oggi. 🎉</p>}

        <Gruppo
          titolo="Da confermare"
          spiegazione="Aspettano l'acconto: il posto è tenuto."
          voci={dati?.daConfermare ?? []}
        />
        <Gruppo
          titolo="Saldi da sollecitare"
          spiegazione={`Partono entro ${GIORNI_SALDO} giorni.`}
          voci={dati?.saldiDaSollecitare ?? []}
          mostraMancante
        />
        <Gruppo titolo="Lista d'attesa" spiegazione="Da contattare se si libera un posto." voci={dati?.inAttesa ?? []} />
      </Stato>
    </>
  );
}

function Gruppo(props: { titolo: string; spiegazione: string; voci: DaFare[]; mostraMancante?: boolean }) {
  if (props.voci.length === 0) return null;
  return (
    <section className="wa-gruppo">
      <h2>
        {props.titolo} <span className="wa-conteggio">{props.voci.length}</span>
      </h2>
      <p className="wa-piccolo">{props.spiegazione}</p>
      <ul className="wa-elenco">
        {props.voci.map((v) => (
          <li key={v.id}>
            {/* ?iscritto=... apre la partenza con la scheda di questa persona già aperta. */}
            <Link to={`/webapp/partenze/${v.partenzaId}?iscritto=${v.id}`} className="wa-riga">
              <span className="wa-riga-testo">
                <strong>
                  {v.nome} {v.cognome}
                </strong>
                <span className="wa-piccolo">
                  {v.viaggioTitolo} · {formattaData(v.dataInizio)}
                </span>
              </span>
              {props.mostraMancante && (
                <span className="wa-importo">{formattaEuro(Math.max(v.prezzoCentesimi - v.pagatoCentesimi, 0))}</span>
              )}
              <span className="wa-freccia" aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
