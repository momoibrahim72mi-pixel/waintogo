// Modulo per creare o modificare un viaggio (la scheda del catalogo) e, sotto,
// le sue partenze. Azioni: salva, pubblica, riporta in bozza, elimina.
//
// Il modulo lavora su testi (quello che la persona scrive) e li trasforma nel formato
// dell'API solo al salvataggio: per esempio gli elenchi "una riga = un punto".
import {
  ETICHETTE_STILI,
  LIVELLI,
  type Livello,
  problemiPerPubblicare,
  STILI,
  type Stile,
  type Viaggio,
  type ViaggioInput,
  viaggioInputSchema,
} from "@waintogo/shared";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api } from "../api";
import { RiquadroAvviso, useAzioni } from "../componenti/azioni";
import { Campo } from "../componenti/Campo";
import { SezionePartenze } from "../componenti/SezionePartenze";
import { Stato } from "../componenti/Stato";

type TappaModulo = { giorno: string; titolo: string; descrizione: string };
type Modulo = {
  titolo: string;
  sottotitolo: string;
  destinazione: string;
  descrizione: string;
  durataGiorni: string;
  stili: Stile[];
  livello: Livello;
  fasciaEta: string;
  puntiForti: string;
  incluso: string;
  nonIncluso: string;
  infoUtili: string;
  immagineUrl: string;
  istruzioniPagamento: string;
  tappe: TappaModulo[];
};

const moduloVuoto: Modulo = {
  titolo: "",
  sottotitolo: "",
  destinazione: "",
  descrizione: "",
  durataGiorni: "",
  stili: [],
  livello: "medio",
  fasciaEta: "",
  puntiForti: "",
  incluso: "",
  nonIncluso: "",
  infoUtili: "",
  immagineUrl: "",
  istruzioniPagamento: "",
  tappe: [],
};

const ETICHETTE_LIVELLI: Record<Livello, string> = { facile: "Facile", medio: "Medio", impegnativo: "Impegnativo" };

export function ModuloViaggio() {
  const { id } = useParams();
  const naviga = useNavigate();
  const [viaggio, setViaggio] = useState<Viaggio | null>(null);
  const [modulo, setModulo] = useState<Modulo>(moduloVuoto);
  const { occupato, avviso, setAvviso, errori, setErrori, esegui } = useAzioni();

  // Se stiamo modificando un viaggio esistente, lo carichiamo e riempiamo il modulo.
  const ricarica = () =>
    id
      ? api.viaggio(id).then(
          (v) => {
            setViaggio(v);
            setModulo(inModulo(v));
          },
          () => setAvviso({ tipo: "errore", testo: "Viaggio non trovato" }),
        )
      : undefined;
  useEffect(() => {
    ricarica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cambia = (campo: keyof Modulo) => (e: { target: { value: string } }) =>
    setModulo((m) => ({ ...m, [campo]: e.target.value }));

  const cambiaStile = (s: Stile) =>
    setModulo((m) => ({ ...m, stili: m.stili.includes(s) ? m.stili.filter((x) => x !== s) : [...m.stili, s] }));

  const cambiaTappa = (i: number, campo: keyof TappaModulo, valore: string) =>
    setModulo((m) => ({ ...m, tappe: m.tappe.map((t, j) => (j === i ? { ...t, [campo]: valore } : t)) }));

  const aggiungiTappa = () =>
    setModulo((m) => {
      const ultimo = Math.max(0, ...m.tappe.map((t) => Number(t.giorno) || 0));
      return { ...m, tappe: [...m.tappe, { giorno: String(ultimo + 1), titolo: "", descrizione: "" }] };
    });

  const togliTappa = (i: number) => setModulo((m) => ({ ...m, tappe: m.tappe.filter((_, j) => j !== i) }));

  async function salva(e: FormEvent) {
    e.preventDefault();
    // Controlliamo i dati qui, con le stesse regole dell'API: la persona vede subito gli errori.
    const { dati, errori: trovati } = daModulo(modulo);
    if (!dati) {
      setErrori(trovati);
      setAvviso({ tipo: "errore", testo: "Controlla i campi evidenziati" });
      return;
    }
    await esegui(async () => {
      if (viaggio) {
        const aggiornato = await api.aggiornaViaggio(viaggio.id, dati);
        setViaggio(aggiornato);
        setModulo(inModulo(aggiornato));
      } else {
        const nuovo = await api.creaViaggio(dati);
        // Passiamo all'indirizzo del viaggio appena creato: da qui si aggiungono le partenze.
        naviga(`/viaggi/${nuovo.id}`, { replace: true });
      }
    }, viaggio ? "Modifiche salvate" : undefined);
  }

  const cambiaStato = (azione: "pubblica" | "ritira") =>
    esegui(
      async () => setViaggio(await api[azione](viaggio!.id)),
      azione === "pubblica" ? "Viaggio pubblicato: ora è sul sito" : "Viaggio riportato in bozza: non è più sul sito",
    );

  const elimina = () => {
    if (!window.confirm(`Eliminare "${viaggio!.titolo}"? Non si può annullare.`)) return;
    esegui(async () => {
      await api.eliminaViaggio(viaggio!.id);
      naviga("/viaggi");
    });
  };

  // Cosa manca per pubblicare, calcolato dai dati salvati (sono quelli che conta l'API).
  const mancano = viaggio ? problemiPerPubblicare(viaggio) : [];

  if (id && !viaggio) return <p>{avviso?.testo ?? "Caricamento…"}</p>;

  return (
    <>
      <form onSubmit={salva} noValidate>
        <p className="briciole">
          <Link to="/viaggi">Viaggi</Link> / {viaggio ? viaggio.titolo : "Nuovo viaggio"}
        </p>
        <div className="titolo-pagina">
          <h1>{viaggio ? viaggio.titolo : "Nuovo viaggio"}</h1>
          {viaggio && <Stato stato={viaggio.stato} />}
        </div>

        <RiquadroAvviso avviso={avviso} />

        <section className="riquadro">
          <h2>La scheda del viaggio</h2>
          <div className="griglia">
            <Campo etichetta="Titolo" errore={errori.titolo} largo>
              <input value={modulo.titolo} onChange={cambia("titolo")} placeholder="Islanda on the road" />
            </Campo>
            <Campo etichetta="Sottotitolo" aiuto="Una frase che invoglia, sotto il titolo." errore={errori.sottotitolo} largo>
              <input value={modulo.sottotitolo} onChange={cambia("sottotitolo")} />
            </Campo>
            <Campo etichetta="Destinazione" errore={errori.destinazione}>
              <input value={modulo.destinazione} onChange={cambia("destinazione")} placeholder="Islanda" />
            </Campo>
            <Campo etichetta="Durata (giorni)" errore={errori.durataGiorni}>
              <input value={modulo.durataGiorni} onChange={cambia("durataGiorni")} inputMode="numeric" />
            </Campo>
            <Campo etichetta="Fascia d'età" aiuto="Per esempio: 25–40 anni" errore={errori.fasciaEta}>
              <input value={modulo.fasciaEta} onChange={cambia("fasciaEta")} />
            </Campo>
            <Campo etichetta="Impegno fisico" errore={errori.livello}>
              <select value={modulo.livello} onChange={cambia("livello")}>
                {LIVELLI.map((l) => (
                  <option key={l} value={l}>
                    {ETICHETTE_LIVELLI[l]}
                  </option>
                ))}
              </select>
            </Campo>
            <fieldset className="campo largo scelte">
              <legend className="etichetta">Stili di viaggio</legend>
              <div className="scelte-righe">
                {STILI.map((s) => (
                  <label key={s} className="scelta">
                    <input type="checkbox" checked={modulo.stili.includes(s)} onChange={() => cambiaStile(s)} />
                    {ETICHETTE_STILI[s]}
                  </label>
                ))}
              </div>
            </fieldset>
            <Campo etichetta="Descrizione" errore={errori.descrizione} largo>
              <textarea value={modulo.descrizione} onChange={cambia("descrizione")} rows={5} />
            </Campo>
            <Campo etichetta="Punti forti" aiuto="Uno per riga." errore={errori.puntiForti} largo>
              <textarea value={modulo.puntiForti} onChange={cambia("puntiForti")} rows={3} />
            </Campo>
            <Campo etichetta="Cosa è incluso" aiuto="Uno per riga." errore={errori.incluso}>
              <textarea value={modulo.incluso} onChange={cambia("incluso")} rows={5} />
            </Campo>
            <Campo etichetta="Cosa non è incluso" aiuto="Uno per riga." errore={errori.nonIncluso}>
              <textarea value={modulo.nonIncluso} onChange={cambia("nonIncluso")} rows={5} />
            </Campo>
            <Campo etichetta="Info utili" aiuto="Documenti, cosa portare, clima." errore={errori.infoUtili} largo>
              <textarea value={modulo.infoUtili} onChange={cambia("infoUtili")} rows={3} />
            </Campo>
            <Campo
              etichetta="Immagine di copertina"
              aiuto="Indirizzo https:// di una foto. Più avanti si potranno caricare le foto."
              errore={errori.immagineUrl}
              largo
            >
              <input value={modulo.immagineUrl} onChange={cambia("immagineUrl")} placeholder="https://…" />
            </Campo>
            <Campo
              etichetta="Istruzioni per il pagamento"
              aiuto="Le vede chi richiede il posto: IBAN, intestatario, link Revolut. La causale è il codice di prenotazione."
              errore={errori.istruzioniPagamento}
              largo
            >
              <textarea value={modulo.istruzioniPagamento} onChange={cambia("istruzioniPagamento")} rows={4} />
            </Campo>
          </div>
        </section>

        <section className="riquadro">
          <h2>Giorno per giorno</h2>
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
              Pubblica sul sito
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

      {viaggio ? (
        <SezionePartenze viaggio={viaggio} quandoCambia={ricarica} />
      ) : (
        <p className="sotto">Le partenze (date, prezzi, posti) si aggiungono dopo aver creato la bozza.</p>
      )}
    </>
  );
}

const righe = (testo: string) => testo.split("\n");

/** Dal viaggio dell'API ai testi del modulo. */
function inModulo(v: Viaggio): Modulo {
  return {
    titolo: v.titolo,
    sottotitolo: v.sottotitolo,
    destinazione: v.destinazione,
    descrizione: v.descrizione,
    durataGiorni: String(v.durataGiorni),
    stili: v.stili,
    livello: v.livello,
    fasciaEta: v.fasciaEta,
    puntiForti: v.puntiForti.join("\n"),
    incluso: v.incluso.join("\n"),
    nonIncluso: v.nonIncluso.join("\n"),
    infoUtili: v.infoUtili,
    immagineUrl: v.immagineUrl,
    istruzioniPagamento: v.istruzioniPagamento,
    tappe: v.tappe.map((t) => ({ giorno: String(t.giorno), titolo: t.titolo, descrizione: t.descrizione })),
  };
}

/** Dai testi del modulo ai dati per l'API, controllati con le regole condivise. */
function daModulo(m: Modulo): { dati: ViaggioInput | null; errori: Record<string, string> } {
  const risultato = viaggioInputSchema.safeParse({
    ...m,
    durataGiorni: m.durataGiorni === "" ? NaN : Number(m.durataGiorni),
    puntiForti: righe(m.puntiForti),
    incluso: righe(m.incluso),
    nonIncluso: righe(m.nonIncluso),
    tappe: m.tappe.map((t) => ({ ...t, giorno: Number(t.giorno) })),
  });
  if (risultato.success) return { dati: risultato.data, errori: {} };
  const errori: Record<string, string> = {};
  for (const p of risultato.error.issues) errori[p.path.join(".")] ??= p.message;
  return { dati: null, errori };
}
