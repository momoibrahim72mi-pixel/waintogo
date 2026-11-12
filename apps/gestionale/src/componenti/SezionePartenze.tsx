// Le partenze di un viaggio: tabella con date, prezzo, iscritti, e un modulo per
// aggiungerne una nuova o modificarne una esistente.
import { euroInCentesimi, type Partenza, type PartenzaInput, partenzaInputSchema, type Viaggio } from "@waintogo/shared";
import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { api } from "../api";
import { euroPerCampo, formattaData, formattaEuro } from "../formato";
import { RiquadroAvviso, useAzioni } from "./azioni";
import { Campo } from "./Campo";
import { StatoPartenza } from "./Stato";

type ModuloPartenza = {
  dataInizio: string;
  prezzo: string;
  acconto: string;
  postiTotali: string;
  minimoPartecipanti: string;
  coordinatore: string;
};

const vuoto: ModuloPartenza = { dataInizio: "", prezzo: "", acconto: "", postiTotali: "14", minimoPartecipanti: "6", coordinatore: "" };

export function SezionePartenze({ viaggio, quandoCambia }: { viaggio: Viaggio; quandoCambia: () => unknown }) {
  // null = modulo chiuso; "nuova" = nuova partenza; altrimenti l'id della partenza in modifica.
  const [inModifica, setInModifica] = useState<string | null>(null);
  const [modulo, setModulo] = useState<ModuloPartenza>(vuoto);
  const { occupato, avviso, errori, setErrori, esegui } = useAzioni();

  const apri = (p?: Partenza) => {
    setErrori({});
    setInModifica(p ? p.id : "nuova");
    setModulo(
      p
        ? {
            dataInizio: p.dataInizio,
            prezzo: euroPerCampo(p.prezzoCentesimi),
            acconto: euroPerCampo(p.accontoCentesimi),
            postiTotali: String(p.postiTotali),
            minimoPartecipanti: String(p.minimoPartecipanti),
            coordinatore: p.coordinatore,
          }
        : vuoto,
    );
  };

  async function salva(e: FormEvent) {
    e.preventDefault();
    const { dati, errori: trovati } = daModulo(modulo);
    if (!dati) return setErrori(trovati);
    const ok = await esegui(async () => {
      if (inModifica === "nuova") await api.creaPartenza(viaggio.id, dati);
      else await api.aggiornaPartenza(inModifica!, dati);
      await quandoCambia();
    }, "Partenza salvata");
    if (ok) setInModifica(null);
  }

  const azione = (fn: () => Promise<unknown>, ok: string) =>
    esegui(async () => {
      await fn();
      await quandoCambia();
    }, ok);

  const cambia = (campo: keyof ModuloPartenza) => (e: { target: { value: string } }) =>
    setModulo((m) => ({ ...m, [campo]: e.target.value }));

  return (
    <section className="riquadro" style={{ marginTop: "1.5rem" }}>
      <div className="titolo-pagina">
        <h2>Partenze</h2>
        {inModifica === null && (
          <button type="button" className="pulsante primario" onClick={() => apri()}>
            Aggiungi partenza
          </button>
        )}
      </div>
      <RiquadroAvviso avviso={avviso} />

      {inModifica !== null && (
        <form className="sotto-modulo" onSubmit={salva} noValidate>
          <h3>{inModifica === "nuova" ? "Nuova partenza" : "Modifica partenza"}</h3>
          <div className="griglia griglia-3">
            <Campo etichetta="Data di partenza" errore={errori.dataInizio}>
              <input type="date" value={modulo.dataInizio} onChange={cambia("dataInizio")} />
            </Campo>
            <Campo etichetta="Prezzo a persona (€)" errore={errori.prezzoCentesimi}>
              <input value={modulo.prezzo} onChange={cambia("prezzo")} inputMode="decimal" placeholder="1.290" />
            </Campo>
            <Campo etichetta="Acconto (€)" errore={errori.accontoCentesimi}>
              <input value={modulo.acconto} onChange={cambia("acconto")} inputMode="decimal" placeholder="300" />
            </Campo>
            <Campo etichetta="Posti" errore={errori.postiTotali}>
              <input value={modulo.postiTotali} onChange={cambia("postiTotali")} inputMode="numeric" />
            </Campo>
            <Campo etichetta="Minimo per partire" aiuto="Confermati necessari per la partenza garantita." errore={errori.minimoPartecipanti}>
              <input value={modulo.minimoPartecipanti} onChange={cambia("minimoPartecipanti")} inputMode="numeric" />
            </Campo>
            <Campo etichetta="Coordinatore" errore={errori.coordinatore}>
              <input value={modulo.coordinatore} onChange={cambia("coordinatore")} />
            </Campo>
          </div>
          <div className="azioni">
            <button type="submit" className="pulsante primario" disabled={occupato}>
              Salva partenza
            </button>
            <button type="button" className="pulsante leggero" onClick={() => setInModifica(null)}>
              Annulla
            </button>
          </div>
        </form>
      )}

      {viaggio.partenze.length === 0 ? (
        <p className="vuoto">Nessuna partenza. Aggiungine una perché il viaggio abbia date e prezzi sul sito.</p>
      ) : (
        <div className="tabella-contenitore">
          <table className="tabella">
            <thead>
              <tr>
                <th>Date</th>
                <th className="numero">Prezzo</th>
                <th className="numero">Iscritti</th>
                <th>Stato</th>
                <th>Coordinatore</th>
                <th>
                  <span className="solo-lettori">Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {viaggio.partenze.map((p) => (
                <tr key={p.id} className={p.annullata ? "spenta" : undefined}>
                  <td>
                    <Link to={`/partenze/${p.id}`}>
                      {formattaData(p.dataInizio)} – {formattaData(p.dataFine)}
                    </Link>
                  </td>
                  <td className="numero">{formattaEuro(p.prezzoCentesimi)}</td>
                  <td className="numero">
                    {p.postiOccupati}/{p.postiTotali}
                    {p.inAttesa > 0 && <div className="sotto">+{p.inAttesa} in attesa</div>}
                  </td>
                  <td>
                    <StatoPartenza p={p} />
                  </td>
                  <td>{p.coordinatore || <span className="sotto">da decidere</span>}</td>
                  <td className="azioni-riga">
                    <Link className="pulsante piccolo" to={`/partenze/${p.id}`}>
                      Iscritti
                    </Link>
                    <button type="button" className="pulsante piccolo" onClick={() => apri(p)}>
                      Modifica
                    </button>
                    {p.annullata ? (
                      <button type="button" className="pulsante piccolo" disabled={occupato} onClick={() => azione(() => api.riattivaPartenza(p.id), "Partenza riattivata")}>
                        Riattiva
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="pulsante piccolo pericolo"
                        disabled={occupato}
                        onClick={() =>
                          window.confirm("Annullare questa partenza? Sparirà dal sito; gli iscritti vanno avvisati a mano.") &&
                          azione(() => api.annullaPartenza(p.id), "Partenza annullata")
                        }
                      >
                        Annulla
                      </button>
                    )}
                    {p.postiOccupati + p.inAttesa === 0 && (
                      <button
                        type="button"
                        className="pulsante piccolo leggero"
                        disabled={occupato}
                        onClick={() => window.confirm("Eliminare questa partenza?") && azione(() => api.eliminaPartenza(p.id), "Partenza eliminata")}
                      >
                        Elimina
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function daModulo(m: ModuloPartenza): { dati: PartenzaInput | null; errori: Record<string, string> } {
  const errori: Record<string, string> = {};
  const prezzo = euroInCentesimi(m.prezzo);
  const acconto = euroInCentesimi(m.acconto || "0");
  if (prezzo === null) errori.prezzoCentesimi = "Scrivi un importo, per esempio 1.290 o 1290,50";
  if (acconto === null) errori.accontoCentesimi = "Scrivi un importo, per esempio 300";
  const r = partenzaInputSchema.safeParse({
    dataInizio: m.dataInizio,
    prezzoCentesimi: prezzo ?? 0,
    accontoCentesimi: acconto ?? 0,
    postiTotali: Number(m.postiTotali),
    minimoPartecipanti: Number(m.minimoPartecipanti),
    coordinatore: m.coordinatore,
  });
  if (!r.success) for (const p of r.error.issues) errori[p.path.join(".")] ??= p.message;
  return Object.keys(errori).length === 0 && r.success ? { dati: r.data, errori } : { dati: null, errori };
}
