// Elenco delle spese con il modulo per aggiungerne o modificarne una.
// Si usa in due posti:
//  - nella pagina Conti: tutte le spese, con la scelta della partenza (o "spesa generale");
//  - nella pagina di una partenza: solo le sue spese, e la partenza è già decisa.
import {
  CATEGORIE_SPESA,
  type CategoriaSpesa,
  ETICHETTE_CATEGORIE_SPESA,
  euroInCentesimi,
  type Spesa,
  type SpesaInput,
  spesaInputSchema,
} from "@waintogo/shared";
import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { api, datiSpesa } from "../api";
import { euroPerCampo, formattaData, formattaEuro, oggi } from "../formato";
import { RiquadroAvviso, useAzioni } from "./azioni";
import { Campo } from "./Campo";

/** Una partenza da proporre nel menu "A quale partenza appartiene". */
export type SceltaPartenza = { id: string; etichetta: string };

type Modulo = {
  descrizione: string;
  categoria: CategoriaSpesa | "";
  importo: string;
  data: string;
  pagata: boolean;
  partenzaId: string; // "" = spesa generale
  fornitore: string;
  nota: string;
};

const vuoto = (partenzaId: string): Modulo => ({
  descrizione: "",
  categoria: "",
  importo: "",
  data: oggi(),
  pagata: true,
  partenzaId,
  fornitore: "",
  nota: "",
});

type Props = {
  spese: Spesa[];
  quandoCambia: () => unknown;
  /** Se c'è, tutte le spese nuove vanno a questa partenza e la colonna "Partenza" non si mostra. */
  partenzaFissa?: string;
  /** Le partenze tra cui scegliere (solo senza partenzaFissa). */
  partenze?: SceltaPartenza[];
  titolo?: string;
};

export function SezioneSpese({ spese, quandoCambia, partenzaFissa, partenze = [], titolo = "Spese" }: Props) {
  // null = modulo chiuso; "nuova" = spesa nuova; altrimenti l'id della spesa in modifica.
  const [inModifica, setInModifica] = useState<string | null>(null);
  const [modulo, setModulo] = useState<Modulo>(vuoto(partenzaFissa ?? ""));
  const [soloDaPagare, setSoloDaPagare] = useState(false);
  const { occupato, avviso, errori, setErrori, esegui } = useAzioni();

  const apri = (s?: Spesa) => {
    setErrori({});
    setInModifica(s ? s.id : "nuova");
    setModulo(
      s
        ? {
            descrizione: s.descrizione,
            categoria: s.categoria,
            importo: euroPerCampo(s.importoCentesimi),
            data: s.data,
            pagata: s.pagata,
            partenzaId: s.partenzaId ?? "",
            fornitore: s.fornitore,
            nota: s.nota,
          }
        : vuoto(partenzaFissa ?? ""),
    );
  };

  async function salva(e: FormEvent) {
    e.preventDefault();
    const { dati, errori: trovati } = daModulo(modulo);
    if (!dati) return setErrori(trovati);
    const ok = await esegui(async () => {
      if (inModifica === "nuova") await api.creaSpesa(dati);
      else await api.aggiornaSpesa(inModifica!, dati);
      await quandoCambia();
    }, "Spesa salvata");
    if (ok) setInModifica(null);
  }

  const azione = (fn: () => Promise<unknown>, ok: string) =>
    esegui(async () => {
      await fn();
      await quandoCambia();
    }, ok);

  const cambia = (campo: keyof Modulo) => (e: { target: { value: string } }) =>
    setModulo((m) => ({ ...m, [campo]: e.target.value }));

  const visibili = soloDaPagare ? spese.filter((s) => !s.pagata) : spese;
  const totale = visibili.reduce((somma, s) => somma + s.importoCentesimi, 0);

  return (
    <section className="riquadro">
      <div className="titolo-pagina">
        <h2>{titolo}</h2>
        <div className="azioni">
          <label className="scelta">
            <input type="checkbox" checked={soloDaPagare} onChange={(e) => setSoloDaPagare(e.target.checked)} />
            Solo da pagare
          </label>
          {inModifica === null && (
            <button type="button" className="pulsante primario" onClick={() => apri()}>
              Aggiungi spesa
            </button>
          )}
        </div>
      </div>
      <RiquadroAvviso avviso={avviso} />

      {inModifica !== null && (
        <form className="sotto-modulo" onSubmit={salva} noValidate>
          <h3>{inModifica === "nuova" ? "Nuova spesa" : "Modifica spesa"}</h3>
          <div className="griglia griglia-3">
            <Campo etichetta="Descrizione" errore={errori.descrizione}>
              <input value={modulo.descrizione} onChange={cambia("descrizione")} placeholder="Voli Milano–Reykjavik" />
            </Campo>
            <Campo etichetta="Categoria" errore={errori.categoria}>
              <select value={modulo.categoria} onChange={cambia("categoria")}>
                <option value="">Scegli…</option>
                {CATEGORIE_SPESA.map((c) => (
                  <option key={c} value={c}>
                    {ETICHETTE_CATEGORIE_SPESA[c]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etichetta="Importo (€)" errore={errori.importoCentesimi}>
              <input value={modulo.importo} onChange={cambia("importo")} inputMode="decimal" placeholder="1.250" />
            </Campo>
            <Campo etichetta="Fornitore" aiuto="Facoltativo: compagnia aerea, hotel, agenzia…" errore={errori.fornitore}>
              <input value={modulo.fornitore} onChange={cambia("fornitore")} />
            </Campo>
            <Campo
              etichetta={modulo.pagata ? "Data del pagamento" : "Da pagare entro"}
              errore={errori.data}
            >
              <input type="date" value={modulo.data} onChange={cambia("data")} />
            </Campo>
            <Campo etichetta="Stato" errore={errori.pagata}>
              <select
                value={modulo.pagata ? "si" : "no"}
                onChange={(e) => setModulo((m) => ({ ...m, pagata: e.target.value === "si" }))}
              >
                <option value="si">Già pagata</option>
                <option value="no">Da pagare</option>
              </select>
            </Campo>
            {!partenzaFissa && (
              <Campo
                etichetta="Partenza"
                aiuto="Se è un costo di un viaggio, entra nel suo margine."
                errore={errori.partenzaId}
              >
                <select value={modulo.partenzaId} onChange={cambia("partenzaId")}>
                  <option value="">Spesa generale (nessuna partenza)</option>
                  {partenze.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.etichetta}
                    </option>
                  ))}
                </select>
              </Campo>
            )}
            <Campo etichetta="Nota" errore={errori.nota}>
              <input value={modulo.nota} onChange={cambia("nota")} />
            </Campo>
          </div>
          <div className="azioni">
            <button type="submit" className="pulsante primario" disabled={occupato}>
              Salva spesa
            </button>
            <button type="button" className="pulsante leggero" onClick={() => setInModifica(null)}>
              Annulla
            </button>
          </div>
        </form>
      )}

      {visibili.length === 0 ? (
        <p className="vuoto">{soloDaPagare ? "Nessuna spesa da pagare." : "Nessuna spesa registrata."}</p>
      ) : (
        <div className="tabella-contenitore">
          <table className="tabella">
            <thead>
              <tr>
                <th>Data</th>
                <th>Spesa</th>
                {!partenzaFissa && <th>Partenza</th>}
                <th className="numero">Importo</th>
                <th>Stato</th>
                <th>
                  <span className="solo-lettori">Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibili.map((s) => (
                <tr key={s.id}>
                  <td>{formattaData(s.data)}</td>
                  <td className="persona">
                    {s.descrizione}
                    <div className="sotto">
                      {ETICHETTE_CATEGORIE_SPESA[s.categoria]}
                      {s.fornitore && ` · ${s.fornitore}`}
                    </div>
                  </td>
                  {!partenzaFissa && (
                    <td className="a-capo">
                      {s.partenza ? (
                        <Link to={`/partenze/${s.partenza.id}`}>
                          {s.partenza.viaggioTitolo}
                          <div className="sotto">{formattaData(s.partenza.dataInizio)}</div>
                        </Link>
                      ) : (
                        <span className="sotto">generale</span>
                      )}
                    </td>
                  )}
                  <td className="numero">{formattaEuro(s.importoCentesimi)}</td>
                  <td>
                    {s.pagata ? (
                      <span className="stato pag-saldato">Pagata</span>
                    ) : (
                      <span className={`stato ${s.data < oggi() ? "pag-da_pagare" : "pag-acconto_versato"}`}>
                        {s.data < oggi() ? "Scaduta" : "Da pagare"}
                      </span>
                    )}
                  </td>
                  <td className="azioni-riga">
                    {!s.pagata && (
                      <button
                        type="button"
                        className="pulsante piccolo"
                        disabled={occupato}
                        // Segnarla pagata mette come data oggi: è il giorno in cui sono usciti i soldi.
                        onClick={() =>
                          azione(
                            () => api.aggiornaSpesa(s.id, { ...datiSpesa(s), pagata: true, data: oggi() }),
                            "Spesa segnata come pagata",
                          )
                        }
                      >
                        Pagata
                      </button>
                    )}
                    <button type="button" className="pulsante piccolo" onClick={() => apri(s)}>
                      Modifica
                    </button>
                    <button
                      type="button"
                      className="pulsante piccolo leggero"
                      disabled={occupato}
                      onClick={() =>
                        window.confirm(`Eliminare la spesa "${s.descrizione}"?`) &&
                        azione(() => api.eliminaSpesa(s.id), "Spesa eliminata")
                      }
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={partenzaFissa ? 2 : 3}>
                  <strong>Totale</strong>
                </td>
                <td className="numero">
                  <strong>{formattaEuro(totale)}</strong>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

function daModulo(m: Modulo): { dati: SpesaInput | null; errori: Record<string, string> } {
  const errori: Record<string, string> = {};
  const importo = euroInCentesimi(m.importo);
  if (importo === null) errori.importoCentesimi = "Scrivi un importo, per esempio 1.250 o 99,90";
  const r = spesaInputSchema.safeParse({
    descrizione: m.descrizione,
    categoria: m.categoria || undefined,
    importoCentesimi: importo ?? 0,
    data: m.data,
    pagata: m.pagata,
    partenzaId: m.partenzaId || null,
    fornitore: m.fornitore,
    nota: m.nota,
  });
  if (!r.success) for (const p of r.error.issues) errori[p.path.join(".")] ??= p.message;
  return Object.keys(errori).length === 0 && r.success ? { dati: r.data, errori } : { dati: null, errori };
}
