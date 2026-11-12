// I conti dell'agenzia: quanti soldi abbiamo (saldo), quanti ne devono arrivare e quanti
// ne dobbiamo pagare; entrate e uscite mese per mese; quanto guadagniamo su ogni partenza;
// e l'elenco di tutte le spese.
import { type Conti as DatiConti, percentualeMargine, type Spesa } from "@waintogo/shared";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../api";
import { Importo } from "../componenti/Importo";
import { type SceltaPartenza, SezioneSpese } from "../componenti/SezioneSpese";
import { formattaData, formattaEuro } from "../formato";

export function Conti() {
  const [anno, setAnno] = useState(new Date().getFullYear());
  // undefined = caricamento; null = API non raggiungibile.
  const [conti, setConti] = useState<DatiConti | null>();
  const [spese, setSpese] = useState<Spesa[]>([]);
  const [partenze, setPartenze] = useState<SceltaPartenza[]>([]);

  const ricarica = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([api.conti(anno), api.spese()]);
      setConti(c);
      setSpese(s);
    } catch {
      setConti(null);
    }
  }, [anno]);

  useEffect(() => {
    ricarica();
  }, [ricarica]);

  // Le partenze tra cui scegliere quando si registra una spesa: tutte, in ordine di data.
  useEffect(() => {
    api.elencoViaggi().then(
      (viaggi) =>
        setPartenze(
          viaggi
            .flatMap((v) => v.partenze.map((p) => ({ p, titolo: v.titolo })))
            .sort((a, b) => a.p.dataInizio.localeCompare(b.p.dataInizio))
            .map(({ p, titolo }) => ({
              id: p.id,
              etichetta: `${titolo} · ${formattaData(p.dataInizio)}${p.annullata ? " (annullata)" : ""}`,
            })),
        ),
      () => setPartenze([]),
    );
  }, []);

  if (conti === undefined) return <p>Caricamento…</p>;
  if (conti === null) return <p className="avviso errore">Non riesco a contattare l'API. È avviata?</p>;

  const { saldo } = conti;
  // Il saldo previsto: quello che avremo quando tutti avranno pagato e noi avremo pagato tutto.
  const previsto = saldo.saldoCentesimi + saldo.daIncassareCentesimi - saldo.daPagareCentesimi;
  const totaleAnno = conti.mesi.reduce(
    (t, m) => ({ entrate: t.entrate + m.entrateCentesimi, uscite: t.uscite + m.usciteCentesimi }),
    { entrate: 0, uscite: 0 },
  );

  return (
    <>
      <div className="titolo-pagina">
        <h1>Conti</h1>
      </div>

      <div className="numeri">
        <Numero
          etichetta="Saldo di cassa"
          valore={saldo.saldoCentesimi}
          sotto={`entrate ${formattaEuro(saldo.entrateCentesimi)} − uscite ${formattaEuro(saldo.usciteCentesimi)}`}
          colora
        />
        <Numero etichetta="Da incassare" valore={saldo.daIncassareCentesimi} sotto="dagli iscritti alle partenze future" />
        <Numero etichetta="Da pagare" valore={saldo.daPagareCentesimi} sotto="spese registrate non ancora pagate" />
        <Numero etichetta="Saldo previsto" valore={previsto} sotto="quando tutto sarà pagato e incassato" colora />
      </div>
      <p className="sotto">
        Il saldo è giusto se tutti i movimenti sono registrati: i pagamenti degli iscritti come entrate, tutto il resto
        come spese.
      </p>

      <div className="titolo-pagina" style={{ marginTop: "1.5rem" }}>
        <h2>Anno {anno}</h2>
        <div className="azioni">
          <button type="button" className="pulsante piccolo" onClick={() => setAnno(anno - 1)}>
            ← {anno - 1}
          </button>
          <button type="button" className="pulsante piccolo" onClick={() => setAnno(anno + 1)}>
            {anno + 1} →
          </button>
        </div>
      </div>

      <div>
        <section className="riquadro">
          <h2>Margine per partenza</h2>
          <p className="sotto">
            Ricavi attesi (se tutti gli iscritti pagano) meno i costi registrati per la partenza, pagati e da pagare.
          </p>
          {conti.partenze.length === 0 ? (
            <p className="vuoto">Nessuna partenza nel {anno}.</p>
          ) : (
            <div className="tabella-contenitore">
              <table className="tabella">
                <thead>
                  <tr>
                    <th>Partenza</th>
                    <th className="numero">Ricavi attesi</th>
                    <th className="numero">Costi</th>
                    <th className="numero">Margine</th>
                  </tr>
                </thead>
                <tbody>
                  {conti.partenze.map((p) => {
                    const percentuale = percentualeMargine(p.margineCentesimi, p.ricaviAttesiCentesimi);
                    return (
                      <tr key={p.id} className={p.annullata ? "spenta" : undefined}>
                        <td className="persona">
                          <Link to={`/partenze/${p.id}`}>{p.viaggioTitolo}</Link>
                          <div className="sotto">
                            {formattaData(p.dataInizio)}
                            {p.annullata && " · annullata"}
                          </div>
                        </td>
                        <td className="numero">
                          {formattaEuro(p.ricaviAttesiCentesimi)}
                          <div className="sotto">incassati {formattaEuro(p.incassatoCentesimi)}</div>
                        </td>
                        <td className="numero">
                          {formattaEuro(p.costiCentesimi)}
                          <div className="sotto">pagati {formattaEuro(p.costiPagatiCentesimi)}</div>
                        </td>
                        <td className="numero">
                          <strong>
                            <Importo valore={p.margineCentesimi} />
                          </strong>
                          {percentuale !== null && <div className="sotto">{percentuale}% dei ricavi</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="riquadro">
          <h2>Mese per mese</h2>
          <div className="tabella-contenitore">
            <table className="tabella">
              <thead>
                <tr>
                  <th>Mese</th>
                  <th className="numero">Entrate</th>
                  <th className="numero">Uscite</th>
                  <th className="numero">Differenza</th>
                </tr>
              </thead>
              <tbody>
                {conti.mesi.map((m) => {
                  const vuoto = m.entrateCentesimi === 0 && m.usciteCentesimi === 0;
                  return (
                    <tr key={m.mese} className={vuoto ? "spenta" : undefined}>
                      <td>{nomeMese(m.mese)}</td>
                      <td className="numero">{formattaEuro(m.entrateCentesimi)}</td>
                      <td className="numero">{formattaEuro(m.usciteCentesimi)}</td>
                      <td className="numero">
                        <Importo valore={m.entrateCentesimi - m.usciteCentesimi} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <strong>Totale {anno}</strong>
                  </td>
                  <td className="numero">
                    <strong>{formattaEuro(totaleAnno.entrate)}</strong>
                  </td>
                  <td className="numero">
                    <strong>{formattaEuro(totaleAnno.uscite)}</strong>
                  </td>
                  <td className="numero">
                    <strong>
                      <Importo valore={totaleAnno.entrate - totaleAnno.uscite} />
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

      </div>

      <SezioneSpese titolo="Tutte le spese" spese={spese} partenze={partenze} quandoCambia={ricarica} />
    </>
  );
}

function Numero(props: { etichetta: string; valore: number; sotto: string; colora?: boolean }) {
  return (
    <div className="numero-grande">
      <span className="sotto">{props.etichetta}</span>
      <strong>{props.colora ? <Importo valore={props.valore} /> : formattaEuro(props.valore)}</strong>
      <span className="sotto">{props.sotto}</span>
    </div>
  );
}

/** "2026-11" → "Novembre" */
function nomeMese(mese: string) {
  const nome = new Date(`${mese}-15T12:00:00`).toLocaleDateString("it-IT", { month: "long" });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}
