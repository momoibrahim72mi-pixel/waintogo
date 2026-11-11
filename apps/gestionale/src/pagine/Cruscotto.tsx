// La prima pagina del gestionale: le prossime partenze e le cose da fare oggi
// (richieste da confermare, persone in lista d'attesa, saldi da sollecitare).
import { type Cruscotto as DatiCruscotto, type DaFare, GIORNI_SALDO } from "@waintogo/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../api";
import { StatoPagato, StatoPartenza } from "../componenti/Stato";
import { formattaData, formattaEuro } from "../formato";

export function Cruscotto() {
  // undefined = caricamento; null = API non raggiungibile.
  const [dati, setDati] = useState<DatiCruscotto | null>();

  useEffect(() => {
    api.cruscotto().then(setDati, () => setDati(null));
  }, []);

  if (dati === undefined) return <p>Caricamento…</p>;
  if (dati === null) return <p className="avviso errore">Non riesco a contattare l'API. È avviata?</p>;

  return (
    <>
      <h1>Cruscotto</h1>

      <div className="griglia-da-fare">
        <ElencoDaFare
          titolo="Richieste da confermare"
          spiegazione="Hanno chiesto il posto e aspettiamo l'acconto. Il posto è già tenuto."
          voci={dati.daConfermare}
        />
        <ElencoDaFare
          titolo={`Saldi da sollecitare`}
          spiegazione={`Partono entro ${GIORNI_SALDO} giorni e non hanno ancora saldato.`}
          voci={dati.saldiDaSollecitare}
          conPagato
        />
        <ElencoDaFare
          titolo="In lista d'attesa"
          spiegazione="Se si libera un posto, contattali in quest'ordine."
          voci={dati.inAttesa}
        />
      </div>

      <section className="riquadro">
        <h2>Prossime partenze</h2>
        {dati.prossimePartenze.length === 0 ? (
          <p className="vuoto">
            Nessuna partenza in programma. <Link to="/viaggi">Vai ai viaggi</Link> per aggiungerne una.
          </p>
        ) : (
          <div className="tabella-contenitore">
            <table className="tabella">
              <thead>
                <tr>
                  <th>Viaggio</th>
                  <th>Partenza</th>
                  <th className="numero">Iscritti</th>
                  <th>Stato</th>
                  <th className="numero">Incassato</th>
                  <th className="numero">Da incassare</th>
                </tr>
              </thead>
              <tbody>
                {dati.prossimePartenze.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/partenze/${p.id}`}>{p.viaggioTitolo}</Link>
                    </td>
                    <td>{formattaData(p.dataInizio)}</td>
                    <td className="numero">
                      {p.postiOccupati}/{p.postiTotali}
                      {p.inAttesa > 0 && <div className="sotto">+{p.inAttesa} in attesa</div>}
                    </td>
                    <td>
                      <StatoPartenza p={p} />
                    </td>
                    <td className="numero">{formattaEuro(p.incassatoCentesimi)}</td>
                    <td className="numero">{formattaEuro(p.daIncassareCentesimi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function ElencoDaFare(props: { titolo: string; spiegazione: string; voci: DaFare[]; conPagato?: boolean }) {
  return (
    <section className="riquadro da-fare">
      <h2>
        {props.titolo} <span className="conteggio">{props.voci.length}</span>
      </h2>
      <p className="sotto">{props.spiegazione}</p>
      {props.voci.length === 0 ? (
        <p className="vuoto">Niente da fare qui.</p>
      ) : (
        <ul>
          {props.voci.map((v) => (
            <li key={v.id}>
              <Link to={`/partenze/${v.partenzaId}`}>
                {v.nome} {v.cognome}
              </Link>
              <div className="sotto">
                {v.viaggioTitolo} · {formattaData(v.dataInizio)}
              </div>
              {props.conPagato && (
                <div className="sotto">
                  <StatoPagato stato={v.statoPagamento} /> mancano {formattaEuro(Math.max(v.prezzoCentesimi - v.pagatoCentesimi, 0))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
