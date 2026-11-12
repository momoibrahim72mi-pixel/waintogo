// "Conti" sul telefono: il saldo a colpo d'occhio, le spese da pagare (con un tocco si
// segnano pagate) e un modulo veloce per registrare una spesa fatta in giro,
// per esempio la guida pagata in contanti durante il viaggio.
// L'analisi completa (mese per mese, margini) è nella versione per computer.
import {
  CATEGORIE_SPESA,
  type CategoriaSpesa,
  ETICHETTE_CATEGORIE_SPESA,
  euroInCentesimi,
  type Spesa,
  spesaInputSchema,
} from "@waintogo/shared";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { api, datiSpesa } from "../api";
import { RiquadroAvviso, useAzioni } from "../componenti/azioni";
import { Importo } from "../componenti/Importo";
import { formattaData, formattaEuro, oggi } from "../formato";
import { Stato, Testata, useDati } from "./comuni";

export function Conti() {
  const carica = useCallback(async () => {
    const [conti, spese, cruscotto] = await Promise.all([api.conti(), api.spese(), api.cruscotto()]);
    return { conti, spese, partenze: cruscotto.prossimePartenze };
  }, []);
  const { dati, ricarica } = useDati(carica);
  const [nuova, setNuova] = useState(false);
  const azioni = useAzioni();

  const daPagare = dati ? dati.spese.filter((s) => !s.pagata).sort((a, b) => a.data.localeCompare(b.data)) : [];
  const ultime = dati ? dati.spese.filter((s) => s.pagata).slice(0, 5) : [];

  const segnaPagata = (s: Spesa) =>
    window.confirm(`Segnare come pagata "${s.descrizione}" (${formattaEuro(s.importoCentesimi)}) con la data di oggi?`) &&
    azioni.esegui(async () => {
      await api.aggiornaSpesa(s.id, { ...datiSpesa(s), pagata: true, data: oggi() });
      await ricarica();
    }, "Spesa segnata come pagata");

  return (
    <>
      <Testata titolo="Conti" sotto="Saldo e spese" aggiorna={ricarica} />
      <Stato dati={dati}>
        {dati && (
          <>
            <div className="wa-scheda wa-saldo">
              <span className="wa-occhiello">Saldo di cassa</span>
              <strong className="wa-cifra">
                <Importo valore={dati.conti.saldo.saldoCentesimi} />
              </strong>
              <span className="wa-piccolo">
                Entrate {formattaEuro(dati.conti.saldo.entrateCentesimi)} − uscite{" "}
                {formattaEuro(dati.conti.saldo.usciteCentesimi)}
              </span>
            </div>
            <div className="wa-due wa-riquadri">
              <div className="wa-scheda">
                <span className="wa-piccolo">Da incassare</span>
                <strong>{formattaEuro(dati.conti.saldo.daIncassareCentesimi)}</strong>
              </div>
              <div className="wa-scheda">
                <span className="wa-piccolo">Da pagare</span>
                <strong>{formattaEuro(dati.conti.saldo.daPagareCentesimi)}</strong>
              </div>
            </div>

            <div className="wa-avviso">
              <RiquadroAvviso avviso={azioni.avviso} />
            </div>

            <button
              type="button"
              className="wa-pulsante primario wa-largo"
              onClick={() => {
                azioni.setAvviso(null);
                setNuova(true);
              }}
            >
              + Registra una spesa
            </button>

            {daPagare.length > 0 && (
              <section className="wa-gruppo">
                <h2>
                  Da pagare <span className="wa-conteggio">{daPagare.length}</span>
                </h2>
                <p className="wa-piccolo">Tocca una spesa quando l'hai pagata.</p>
                <ul className="wa-elenco">
                  {daPagare.map((s) => (
                    <li key={s.id}>
                      <button type="button" className="wa-riga" disabled={azioni.occupato} onClick={() => segnaPagata(s)}>
                        <RigaSpesa s={s} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {ultime.length > 0 && (
              <section className="wa-gruppo">
                <h2>Ultime spese pagate</h2>
                <ul className="wa-elenco">
                  {ultime.map((s) => (
                    <li key={s.id} className="wa-riga">
                      <RigaSpesa s={s} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {nuova && (
              <FoglioSpesa
                partenze={dati.partenze.map((p) => ({ id: p.id, etichetta: `${p.viaggioTitolo} · ${formattaData(p.dataInizio)}` }))}
                occupato={azioni.occupato}
                errore={azioni.avviso?.tipo === "errore" ? azioni.avviso.testo : undefined}
                chiudi={() => setNuova(false)}
                salva={async (dati) => {
                  const ok = await azioni.esegui(async () => {
                    await api.creaSpesa(dati);
                    await ricarica();
                  }, "Spesa registrata");
                  if (ok) setNuova(false);
                }}
              />
            )}
          </>
        )}
      </Stato>
    </>
  );
}

function RigaSpesa({ s }: { s: Spesa }) {
  const scaduta = !s.pagata && s.data < oggi();
  return (
    <>
      <span className="wa-riga-testo">
        <strong>{s.descrizione}</strong>
        <span className="wa-piccolo">
          {s.pagata ? formattaData(s.data) : `${scaduta ? "Scaduta il" : "Entro il"} ${formattaData(s.data)}`}
          {" · "}
          {s.partenza ? s.partenza.viaggioTitolo : "generale"}
        </span>
      </span>
      <span className={`wa-importo ${scaduta ? "negativo" : ""}`}>{formattaEuro(s.importoCentesimi)}</span>
    </>
  );
}

/** Il foglio che sale dal basso per registrare una spesa al volo. */
function FoglioSpesa(props: {
  partenze: { id: string; etichetta: string }[];
  occupato: boolean;
  errore?: string;
  chiudi: () => void;
  salva: (dati: ReturnType<typeof spesaInputSchema.parse>) => Promise<void>;
}) {
  const [descrizione, setDescrizione] = useState("");
  const [categoria, setCategoria] = useState<CategoriaSpesa | "">("");
  const [importo, setImporto] = useState("");
  const [partenzaId, setPartenzaId] = useState("");
  const [pagata, setPagata] = useState(true);
  const [data, setData] = useState(oggi());
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    const tasto = (e: KeyboardEvent) => e.key === "Escape" && props.chiudi();
    window.addEventListener("keydown", tasto);
    return () => window.removeEventListener("keydown", tasto);
  }, [props]);

  async function invia(e: FormEvent) {
    e.preventDefault();
    const centesimi = euroInCentesimi(importo);
    if (centesimi === null) return setErrore("Scrivi un importo, per esempio 80 o 79,90");
    const r = spesaInputSchema.safeParse({
      descrizione,
      categoria: categoria || undefined,
      importoCentesimi: centesimi,
      data,
      pagata,
      partenzaId: partenzaId || null,
    });
    if (!r.success) return setErrore(r.error.issues[0]?.message ?? "Dati non validi");
    setErrore(null);
    await props.salva(r.data);
  }

  return (
    <div className="wa-sfondo-foglio" onClick={props.chiudi}>
      <form
        className="wa-foglio"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titolo-spesa"
        onSubmit={invia}
        onClick={(e) => e.stopPropagation()}
        noValidate
      >
        <h2 id="titolo-spesa">Nuova spesa</h2>
        <label className="wa-campo">
          <span>Cos'è</span>
          <input value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Guida a Marrakech" />
        </label>
        <div className="wa-due">
          <label className="wa-campo">
            <span>Importo (€)</span>
            <input value={importo} onChange={(e) => setImporto(e.target.value)} inputMode="decimal" />
          </label>
          <label className="wa-campo">
            <span>Categoria</span>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaSpesa | "")}>
              <option value="">Scegli…</option>
              {CATEGORIE_SPESA.map((c) => (
                <option key={c} value={c}>
                  {ETICHETTE_CATEGORIE_SPESA[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="wa-campo">
          <span>Partenza</span>
          <select value={partenzaId} onChange={(e) => setPartenzaId(e.target.value)}>
            <option value="">Spesa generale</option>
            {props.partenze.map((p) => (
              <option key={p.id} value={p.id}>
                {p.etichetta}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="wa-campo">
          <legend>Stato</legend>
          <div className="wa-segmenti wa-segmenti-2">
            <button type="button" aria-pressed={pagata} onClick={() => setPagata(true)}>
              Già pagata
            </button>
            <button type="button" aria-pressed={!pagata} onClick={() => setPagata(false)}>
              Da pagare
            </button>
          </div>
        </fieldset>
        <label className="wa-campo">
          <span>{pagata ? "Pagata il" : "Da pagare entro"}</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>

        {(errore || props.errore) && (
          <p className="wa-errore" role="alert">
            {errore ?? props.errore}
          </p>
        )}
        <div className="wa-azioni">
          <button type="submit" className="wa-pulsante primario largo" disabled={props.occupato}>
            Registra
          </button>
          <button type="button" className="wa-pulsante leggero" onClick={props.chiudi}>
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
