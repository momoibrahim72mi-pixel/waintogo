// Modulo per creare o modificare un viaggio, con l'itinerario e le azioni
// (salva, pubblica, ritira, elimina).
//
// Il modulo lavora su testi (quello che la persona scrive) e li trasforma nel formato
// dell'API solo al salvataggio: per esempio "1.290" diventa 129000 centesimi.
import {
  euroInCentesimi,
  formattaEuro,
  problemiPerPubblicare,
  viaggioInputSchema,
  type Viaggio,
  type ViaggioInput,
} from "@waintogo/shared";
import { cloneElement, type FormEvent, type InputHTMLAttributes, type ReactElement, useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api, ErroreApi } from "../api";
import { Stato } from "../componenti/Stato";

type TappaModulo = { giorno: string; titolo: string; descrizione: string };
type Modulo = {
  titolo: string;
  destinazione: string;
  descrizione: string;
  dataInizio: string;
  dataFine: string;
  prezzo: string;
  acconto: string;
  postiTotali: string;
  istruzioniPagamento: string;
  tappe: TappaModulo[];
};

const moduloVuoto: Modulo = {
  titolo: "",
  destinazione: "",
  descrizione: "",
  dataInizio: "",
  dataFine: "",
  prezzo: "",
  acconto: "",
  postiTotali: "",
  istruzioniPagamento: "",
  tappe: [],
};

export function ModuloViaggio() {
  const { id } = useParams();
  const naviga = useNavigate();
  const [viaggio, setViaggio] = useState<Viaggio | null>(null);
  const [modulo, setModulo] = useState<Modulo>(moduloVuoto);
  const [errori, setErrori] = useState<Record<string, string>>({});
  const [avviso, setAvviso] = useState<{ tipo: "ok" | "errore"; testo: string; problemi?: string[] } | null>(null);
  const [occupato, setOccupato] = useState(false);

  // Se stiamo modificando un viaggio esistente, lo carichiamo e riempiamo il modulo.
  useEffect(() => {
    if (!id) return;
    api.viaggio(id).then(
      (v) => {
        setViaggio(v);
        setModulo(inModulo(v));
      },
      () => setAvviso({ tipo: "errore", testo: "Viaggio non trovato" }),
    );
  }, [id]);

  const cambia = (campo: keyof Modulo) => (e: { target: { value: string } }) =>
    setModulo((m) => ({ ...m, [campo]: e.target.value }));

  const cambiaTappa = (i: number, campo: keyof TappaModulo, valore: string) =>
    setModulo((m) => ({ ...m, tappe: m.tappe.map((t, j) => (j === i ? { ...t, [campo]: valore } : t)) }));

  const aggiungiTappa = () =>
    setModulo((m) => {
      const ultimo = Math.max(0, ...m.tappe.map((t) => Number(t.giorno) || 0));
      return { ...m, tappe: [...m.tappe, { giorno: String(ultimo + 1), titolo: "", descrizione: "" }] };
    });

  const togliTappa = (i: number) => setModulo((m) => ({ ...m, tappe: m.tappe.filter((_, j) => j !== i) }));

  /** Esegue un'azione verso l'API e mostra il risultato o l'errore. */
  async function esegui(azione: () => Promise<void>) {
    setOccupato(true);
    setAvviso(null);
    try {
      await azione();
    } catch (e) {
      if (e instanceof ErroreApi) {
        setErrori(e.campi);
        setAvviso({ tipo: "errore", testo: e.message, problemi: e.problemi });
      } else {
        setAvviso({ tipo: "errore", testo: "Non riesco a contattare l'API" });
      }
    } finally {
      setOccupato(false);
    }
  }

  async function salva(e: FormEvent) {
    e.preventDefault();
    // Controlliamo i dati qui, con le stesse regole dell'API: la persona vede subito gli errori.
    const { dati, errori: trovati } = daModulo(modulo);
    setErrori(trovati);
    if (!dati) {
      setAvviso({ tipo: "errore", testo: "Controlla i campi evidenziati" });
      return;
    }
    await esegui(async () => {
      if (viaggio) {
        const aggiornato = await api.aggiornaViaggio(viaggio.id, dati);
        setViaggio(aggiornato);
        setModulo(inModulo(aggiornato));
        setAvviso({ tipo: "ok", testo: "Modifiche salvate" });
      } else {
        const nuovo = await api.creaViaggio(dati);
        // Passiamo all'indirizzo del viaggio appena creato: da qui si può pubblicare.
        naviga(`/viaggi/${nuovo.id}`, { replace: true });
      }
    });
  }

  const cambiaStato = (azione: "pubblica" | "ritira") =>
    esegui(async () => {
      const aggiornato = await api[azione](viaggio!.id);
      setViaggio(aggiornato);
      setAvviso({ tipo: "ok", testo: azione === "pubblica" ? "Viaggio pubblicato" : "Viaggio riportato in bozza" });
    });

  const elimina = () => {
    if (!window.confirm(`Eliminare "${viaggio!.titolo}"? Non si può annullare.`)) return;
    esegui(async () => {
      await api.elimina(viaggio!.id);
      naviga("/");
    });
  };

  // Cosa manca per pubblicare, calcolato dai dati salvati (sono quelli che conta l'API).
  const mancano = viaggio ? problemiPerPubblicare(viaggio, new Date().toISOString().slice(0, 10)) : [];

  if (id && !viaggio) return <p>{avviso?.testo ?? "Caricamento…"}</p>;

  return (
    <form onSubmit={salva} noValidate>
      <p className="briciole">
        <Link to="/">Viaggi</Link> / {viaggio ? viaggio.titolo : "Nuovo viaggio"}
      </p>
      <div className="titolo-pagina">
        <h1>{viaggio ? viaggio.titolo : "Nuovo viaggio"}</h1>
        {viaggio && <Stato stato={viaggio.stato} />}
      </div>

      {avviso && (
        <div className={`avviso ${avviso.tipo}`} role="status">
          {avviso.testo}
          {avviso.problemi && avviso.problemi.length > 0 && (
            <ul>
              {avviso.problemi.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <section className="riquadro">
        <h2>Informazioni</h2>
        <div className="griglia">
          <Campo etichetta="Titolo" errore={errori.titolo} largo>
            <input value={modulo.titolo} onChange={cambia("titolo")} placeholder="Islanda: fuoco e ghiaccio" />
          </Campo>
          <Campo etichetta="Destinazione" errore={errori.destinazione}>
            <input value={modulo.destinazione} onChange={cambia("destinazione")} placeholder="Islanda" />
          </Campo>
          <Campo etichetta="Posti" errore={errori.postiTotali}>
            <input value={modulo.postiTotali} onChange={cambia("postiTotali")} inputMode="numeric" />
          </Campo>
          <Campo etichetta="Partenza" errore={errori.dataInizio}>
            <input type="date" value={modulo.dataInizio} onChange={cambia("dataInizio")} />
          </Campo>
          <Campo etichetta="Ritorno" errore={errori.dataFine}>
            <input type="date" value={modulo.dataFine} onChange={cambia("dataFine")} />
          </Campo>
          <Campo etichetta="Prezzo a persona (€)" errore={errori.prezzoCentesimi}>
            <input value={modulo.prezzo} onChange={cambia("prezzo")} inputMode="decimal" placeholder="1.290" />
          </Campo>
          <Campo etichetta="Acconto (€)" errore={errori.accontoCentesimi}>
            <input value={modulo.acconto} onChange={cambia("acconto")} inputMode="decimal" placeholder="300" />
          </Campo>
          <Campo etichetta="Descrizione" errore={errori.descrizione} largo>
            <textarea value={modulo.descrizione} onChange={cambia("descrizione")} rows={5} />
          </Campo>
          <Campo
            etichetta="Istruzioni per il pagamento"
            aiuto="Le riceve per email chi si iscrive: IBAN, intestatario, causale, link Revolut."
            errore={errori.istruzioniPagamento}
            largo
          >
            <textarea value={modulo.istruzioniPagamento} onChange={cambia("istruzioniPagamento")} rows={3} />
          </Campo>
        </div>
      </section>

      <section className="riquadro">
        <h2>Itinerario</h2>
        {modulo.tappe.length === 0 && <p className="vuoto">Nessun giorno ancora.</p>}
        {modulo.tappe.map((t, i) => (
          <div className="tappa" key={i}>
            <Campo etichetta="Giorno" errore={errori[`tappe.${i}.giorno`]}>
              <input value={t.giorno} onChange={(e) => cambiaTappa(i, "giorno", e.target.value)} inputMode="numeric" />
            </Campo>
            <div className="tappa-testi">
              <Campo etichetta="Titolo del giorno" errore={errori[`tappe.${i}.titolo`]}>
                <input value={t.titolo} onChange={(e) => cambiaTappa(i, "titolo", e.target.value)} />
              </Campo>
              <Campo etichetta="Cosa si fa">
                <textarea value={t.descrizione} onChange={(e) => cambiaTappa(i, "descrizione", e.target.value)} rows={2} />
              </Campo>
            </div>
            <button type="button" className="pulsante leggero" onClick={() => togliTappa(i)}>
              Togli
            </button>
          </div>
        ))}
        <button type="button" className="pulsante" onClick={aggiungiTappa}>
          Aggiungi giorno
        </button>
      </section>

      <div className="azioni">
        <button type="submit" className="pulsante primario" disabled={occupato}>
          {viaggio ? "Salva modifiche" : "Crea bozza"}
        </button>
        {viaggio?.stato === "bozza" && (
          <button
            type="button"
            className="pulsante"
            disabled={occupato || mancano.length > 0}
            title={mancano.length > 0 ? `Mancano: ${mancano.join("; ")}` : undefined}
            onClick={() => cambiaStato("pubblica")}
          >
            Pubblica
          </button>
        )}
        {viaggio?.stato === "pubblicato" && (
          <button type="button" className="pulsante" disabled={occupato} onClick={() => cambiaStato("ritira")}>
            Riporta in bozza
          </button>
        )}
        {viaggio?.stato === "bozza" && (
          <button type="button" className="pulsante pericolo" disabled={occupato} onClick={elimina}>
            Elimina
          </button>
        )}
      </div>
      {viaggio?.stato === "bozza" && mancano.length > 0 && (
        <p className="sotto">Per pubblicare manca: {mancano.join("; ").toLowerCase()}.</p>
      )}
    </form>
  );
}

/**
 * Un'etichetta, il suo campo e l'eventuale aiuto o messaggio d'errore.
 * Collega etichetta, aiuto ed errore al campo (id, aria-describedby): così chi usa
 * un lettore di schermo sente il nome del campo e, se c'è, l'errore.
 */
function Campo(props: { etichetta: string; errore?: string; aiuto?: string; largo?: boolean; children: ReactElement<InputHTMLAttributes<HTMLInputElement>> }) {
  const id = useId();
  const descrizioni = [props.aiuto && `${id}-aiuto`, props.errore && `${id}-errore`].filter(Boolean).join(" ");
  return (
    <div className={`campo ${props.largo ? "largo" : ""} ${props.errore ? "con-errore" : ""}`}>
      <label className="etichetta" htmlFor={id}>
        {props.etichetta}
      </label>
      {cloneElement(props.children, {
        id,
        "aria-invalid": props.errore ? true : undefined,
        "aria-describedby": descrizioni || undefined,
      })}
      {props.aiuto && (
        <span className="aiuto" id={`${id}-aiuto`}>
          {props.aiuto}
        </span>
      )}
      {props.errore && (
        <span className="messaggio-errore" id={`${id}-errore`}>
          {props.errore}
        </span>
      )}
    </div>
  );
}

/** Dal viaggio dell'API ai testi del modulo. */
function inModulo(v: Viaggio): Modulo {
  const euro = (c: number) => formattaEuro(c).replace(/\s?€/, "").replace(/,00$/, "");
  return {
    titolo: v.titolo,
    destinazione: v.destinazione,
    descrizione: v.descrizione,
    dataInizio: v.dataInizio,
    dataFine: v.dataFine,
    prezzo: euro(v.prezzoCentesimi),
    acconto: euro(v.accontoCentesimi),
    postiTotali: String(v.postiTotali),
    istruzioniPagamento: v.istruzioniPagamento,
    tappe: v.tappe.map((t) => ({ giorno: String(t.giorno), titolo: t.titolo, descrizione: t.descrizione })),
  };
}

/** Dai testi del modulo ai dati per l'API, controllati con le regole condivise. */
function daModulo(m: Modulo): { dati: ViaggioInput | null; errori: Record<string, string> } {
  const errori: Record<string, string> = {};
  const prezzo = euroInCentesimi(m.prezzo);
  const acconto = euroInCentesimi(m.acconto || "0");
  if (prezzo === null) errori.prezzoCentesimi = "Scrivi un importo, per esempio 1.290 o 1290,50";
  if (acconto === null) errori.accontoCentesimi = "Scrivi un importo, per esempio 300";

  const risultato = viaggioInputSchema.safeParse({
    titolo: m.titolo,
    destinazione: m.destinazione,
    descrizione: m.descrizione,
    dataInizio: m.dataInizio,
    dataFine: m.dataFine,
    prezzoCentesimi: prezzo ?? 0,
    accontoCentesimi: acconto ?? 0,
    postiTotali: Number(m.postiTotali),
    istruzioniPagamento: m.istruzioniPagamento,
    tappe: m.tappe.map((t) => ({ ...t, giorno: Number(t.giorno) })),
  });
  if (!risultato.success) {
    for (const p of risultato.error.issues) errori[p.path.join(".")] ??= p.message;
  }
  const ok = risultato.success && Object.keys(errori).length === 0;
  return { dati: ok ? risultato.data : null, errori };
}
