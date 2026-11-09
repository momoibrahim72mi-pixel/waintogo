// Pagina iniziale: tabella con tutti i viaggi.
import { formattaEuro, type Viaggio } from "@waintogo/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../api";
import { Stato } from "../componenti/Stato";

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
                <th>Date</th>
                <th className="numero">Prezzo</th>
                <th className="numero">Posti</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {viaggi.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link to={`/viaggi/${v.id}`}>{v.titolo}</Link>
                    <div className="sotto">{v.destinazione}</div>
                  </td>
                  <td>
                    {formattaData(v.dataInizio)} – {formattaData(v.dataFine)}
                  </td>
                  <td className="numero">{formattaEuro(v.prezzoCentesimi)}</td>
                  <td className="numero">{v.postiTotali}</td>
                  <td>
                    <Stato stato={v.stato} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** "2027-08-01" → "1 ago 2027" */
export function formattaData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}
