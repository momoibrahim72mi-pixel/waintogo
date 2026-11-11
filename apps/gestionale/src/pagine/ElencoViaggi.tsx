// Elenco di tutti i viaggi del catalogo, con quante partenze hanno e quanti iscritti.
import type { Viaggio } from "@waintogo/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../api";
import { Stato } from "../componenti/Stato";
import { formattaData, oggi } from "../formato";

export function ElencoViaggi() {
  // undefined = sto ancora caricando; null = errore; array = i viaggi.
  const [viaggi, setViaggi] = useState<Viaggio[] | null>();

  useEffect(() => {
    api.elencoViaggi().then(setViaggi, () => setViaggi(null));
  }, []);

  return (
    <>
      <div className="titolo-pagina">
        <h1>Viaggi</h1>
        <Link to="/viaggi/nuovo" className="pulsante primario">
          Nuovo viaggio
        </Link>
      </div>

      {viaggi === undefined && <p>Caricamento…</p>}
      {viaggi === null && <p className="avviso errore">Non riesco a contattare l'API. È avviata?</p>}
      {viaggi?.length === 0 && <p className="vuoto">Non ci sono ancora viaggi. Crea il primo!</p>}

      {viaggi && viaggi.length > 0 && (
        <div className="tabella-contenitore">
          <table className="tabella">
            <thead>
              <tr>
                <th>Viaggio</th>
                <th className="numero">Durata</th>
                <th>Prossima partenza</th>
                <th className="numero">Iscritti</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {viaggi.map((v) => {
                const future = v.partenze.filter((p) => !p.annullata && p.dataInizio >= oggi());
                const iscritti = future.reduce((s, p) => s + p.postiOccupati, 0);
                const posti = future.reduce((s, p) => s + p.postiTotali, 0);
                return (
                  <tr key={v.id}>
                    <td>
                      <Link to={`/viaggi/${v.id}`}>{v.titolo}</Link>
                      <div className="sotto">{v.destinazione}</div>
                    </td>
                    <td className="numero">{v.durataGiorni} gg</td>
                    <td>
                      {future[0] ? formattaData(future[0].dataInizio) : <span className="sotto">nessuna</span>}
                      {future.length > 1 && <span className="sotto"> +{future.length - 1}</span>}
                    </td>
                    <td className="numero">{posti > 0 ? `${iscritti}/${posti}` : "–"}</td>
                    <td>
                      <Stato stato={v.stato} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
